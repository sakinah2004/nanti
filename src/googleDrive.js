// Google Identity Services: browser-only OAuth with the least-privilege drive.file scope.
// No Google client secret or refresh token is stored in NANTI/Supabase/GitHub.
import { supabase } from './lib';

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
const DRIVE_SCOPE = 'https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/userinfo.email';
let tokenCache = null, expiryTime = 0, pendingScript = null;

export function driveConfigured() { return Boolean(CLIENT_ID); }
export function driveConnected() { return Boolean(tokenCache && Date.now() < expiryTime - 60000); }

function loadGIS() {
  if (window.google?.accounts?.oauth2) return Promise.resolve();
  if (pendingScript) return pendingScript;
  pendingScript = new Promise((resolve,reject) => {
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.onload = () => window.google?.accounts?.oauth2 ? resolve() : reject(new Error('Google Sign-In tidak tersedia.'));
    script.onerror = () => reject(new Error('Gagal memuat login Google.'));
    document.head.appendChild(script);
  }).catch(err => { pendingScript = null; throw err; });
  return pendingScript;
}

export async function connectDrive() {
  if (!CLIENT_ID) throw new Error('VITE_GOOGLE_CLIENT_ID belum dikonfigurasi di Cloudflare Pages.');
  await loadGIS();
  const auth = await new Promise((resolve,reject) => {
    const client = window.google.accounts.oauth2.initTokenClient({
      client_id: CLIENT_ID, scope: DRIVE_SCOPE, prompt: 'select_account',
      callback: response => response.error ? reject(new Error(response.error)) : resolve(response),
      error_callback: () => reject(new Error('Login Google dibatalkan atau gagal.'))
    });
    client.requestAccessToken();
  });
  tokenCache = auth.access_token;
  expiryTime = Date.now() + (Number(auth.expires_in || 3500) * 1000);
  const response = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {headers:{Authorization:'Bearer '+tokenCache}});
  if(!response.ok) throw new Error('Gagal membaca akun Google.');
  const userinfo = await response.json();
  if (!userinfo.email || userinfo.email_verified === false) throw new Error('Email Google harus terverifikasi.');
  const { data:userResult,error:userError } = await supabase.auth.getUser();
  if (userError || !userResult.user) throw new Error('Silakan login ke NANTI terlebih dahulu.');
  const { error } = await supabase.from('profiles').update({google_drive_email:userinfo.email}).eq('id',userResult.user.id);
  if (error) throw error;
  return userinfo.email;
}

async function driveRequest(path,options={}) {
  if (!driveConnected()) throw new Error('Hubungkan Google Drive kembali untuk melihat atau mengunggah foto.');
  const headers = new Headers(options.headers || {});
  headers.set('Authorization','Bearer '+tokenCache);
  const response = await fetch('https://www.googleapis.com/drive/v3/'+path,{...options,headers});
  if (!response.ok) {
    let details = '';
    try {details=(await response.json())?.error?.message || '';}catch{}
    throw new Error('Google Drive: '+(details || 'HTTP '+response.status));
  }
  return response;
}

async function getFolder() {
  const response=await driveRequest("files?q="+encodeURIComponent("name = 'NANTI Memories' and mimeType = 'application/vnd.google-apps.folder' and trashed = false")+"&fields=files(id,name)&page_size=30");
  const data=await response.json();
  if(data.files?.[0]?.id) return data.files[0].id;
  const created=await driveRequest('files?fields=id',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name:'NANTI Memories',mimeType:'application/vnd.google-apps.folder'})});
  return (await created.json()).id;
}

async function resizePhoto(file) {
  if (!file.type.startsWith('image/')) throw new Error('Pilih file foto, bukan video.');
  if(file.size > 25 * 1024 * 1024) throw new Error('Foto maksimal 25 MB.');
  // HEIC may not decode consistently on every browser; keep the original as a fallback.
  try {
    const bitmap = await createImageBitmap(file);
    const max = 1920, scale = Math.min(1,max/Math.max(bitmap.width,bitmap.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(bitmap.width*scale);
    canvas.height = Math.round(bitmap.height*scale);
    canvas.getContext('2d').drawImage(bitmap,0,0,canvas.width,canvas.height);
    bitmap.close();
    const blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/jpeg',.83));
    return blob || file;
  } catch { return file; }
}

export async function uploadDrivePhoto(file, partnerEmail) {
  if (!partnerEmail) throw new Error('Minta pasangan menghubungkan akun Google Drive lebih dahulu agar foto tetap privat dan bisa dilihat berdua.');
  const folderId=await getFolder();
  const photo=await resizePhoto(file);
  const mime=photo.type||file.type||'image/jpeg';
  const name=photo===file ? file.name : file.name.replace(/\.[^.]+$/, '')+'.jpg';
  const boundary='nanti_'+crypto.randomUUID().replaceAll('-','');
  const body=new Blob([
    '--'+boundary+'\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n',
    JSON.stringify({name,parents:[folderId],description:'Private NANTI memory photo'}),
    '\r\n--'+boundary+'\r\nContent-Type: '+mime+'\r\n\r\n',
    photo,
    '\r\n--'+boundary+'--'
  ],{type:'multipart/related; boundary='+boundary});
  const headers={Authorization:'Bearer '+tokenCache,'Content-Type':'multipart/related; boundary='+boundary};
  if (!driveConnected()) throw new Error('Hubungkan Google Drive kembali.');
  const response=await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,mimeType',{method:'POST',headers,body});
  if(!response.ok) throw new Error('Upload foto ke Google Drive gagal (HTTP '+response.status+').');
  const uploaded=await response.json();
  try {
    await driveRequest('files/'+encodeURIComponent(uploaded.id)+'/permissions?sendNotificationEmail=false',{
      method:'POST',headers:{'Content-Type':'application/json'},
      body:JSON.stringify({type:'user',role:'reader',emailAddress:partnerEmail})
    });
  } catch(e) {
    // Do not leave a mistakenly unshared file in the app.
    await driveRequest('files/'+encodeURIComponent(uploaded.id),{method:'DELETE'}).catch(()=>{});
    throw new Error('Gagal membagikan foto ke pasangan: '+e.message);
  }
  return {drive_file_id:uploaded.id,file_name:uploaded.name,mime_type:uploaded.mimeType};
}

export async function downloadDrivePhoto(id) {
  if(!/^[A-Za-z0-9_-]{10,255}$/.test(id)) throw new Error('ID foto tidak valid.');
  const response=await driveRequest('files/'+encodeURIComponent(id)+'?alt=media');
  return URL.createObjectURL(await response.blob());
}

export function disconnectDrive() { tokenCache=null; expiryTime=0; }
