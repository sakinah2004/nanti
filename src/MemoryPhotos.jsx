import React,{useEffect,useState} from 'react';
import { ImagePlus } from 'lucide-react';
import {supabase} from './lib';
import {connectDrive,driveConfigured,driveConnected,preloadDriveLogin,uploadDrivePhoto,downloadDrivePhoto} from './googleDrive';

function GooglePhoto({photo,connected,revision}) {
  const [blob,setBlob]=useState(null),[error,setError]=useState('');
  useEffect(()=>{
    if(!connected)return;
    let active=true,objectUrl=null;
    downloadDrivePhoto(photo.drive_file_id).then(url=>{objectUrl=url;if(active)setBlob(url);else URL.revokeObjectURL(url)})
      .catch(e=>{if(active)setError(e.message)});
    return ()=>{active=false;if(objectUrl)URL.revokeObjectURL(objectUrl)};
  },[photo.drive_file_id,connected,revision]);
  return <div className="memory-photo-tile">
    {blob?<img src={blob} alt={photo.file_name} loading="lazy"/>:<div className="memory-photo-placeholder">{error?'Photo unavailable':connected?'Loading photo…':'Connect Drive to view photo'}</div>}
    <a target="_blank" rel="noopener noreferrer" href={'https://drive.google.com/file/d/'+encodeURIComponent(photo.drive_file_id)+'/view'}>View in Drive ↗</a>
  </div>;
}

export function useDriveConnection(onProfileChange){
  const [connected,setConnected]=useState(driveConnected());
  const [account,setAccount]=useState('');
  const [revision,setRevision]=useState(0);
  useEffect(()=>{preloadDriveLogin();},[]);
  const [error,setError]=useState('');
  async function connect(){
    try{setError('');const email=await connectDrive();setAccount(email);setConnected(true);setRevision(v=>v+1);await onProfileChange?.();}
    catch(e){setError(e.message);}
  }
  return {connected,account,error,connect,revision};
}

export function DriveConnect({drive}) {
  if(!driveConfigured())return <div className="drive-panel-minimal">📷 Foto akan tersedia setelah Google Drive diaktifkan. Gallery dan Calendar tetap bisa digunakan.</div>;
  if(drive.connected)return <div className="drive-panel-minimal">♡ Google Drive terhubung. Foto siap disimpan.</div>;
  return <div className="drive-panel-minimal"><span>📷 Hubungkan Google Drive untuk menyimpan foto.</span>
    <button className="btn btn-ghost" onClick={drive.connect}>Connect Drive</button>
    {drive.error&&<small className="drive-error">{drive.error}</small>}
  </div>;
}

export async function savePhotosToMemory(memory,files,partnerEmail) {
  if (!memory?.id || !memory?.pair_id) throw new Error('Memory belum tersimpan.');
  if (!partnerEmail) throw new Error('Akun Google pasangan perlu dihubungkan satu kali agar foto tetap privat.');
  const {data:{user},error:authErr}=await supabase.auth.getUser();
  if(authErr||!user)throw new Error('Silakan login ke NANTI terlebih dahulu.');
  for(const file of files){
    const uploaded=await uploadDrivePhoto(file,partnerEmail);
    const {error:insertErr}=await supabase.from('memory_photos').insert({
      ...uploaded,memory_id:memory.id,pair_id:memory.pair_id,uploaded_by:user.id
    });
    if(insertErr)throw new Error('Foto sudah diunggah, tetapi belum muncul di album. '+insertErr.message);
  }
}

export function MemoryPhotoAlbum({memory,photos,drive,partner,onUploaded}) {
  const [busy,setBusy]=useState(false),[error,setError]=useState('');
  const filtered=photos.filter(p=>p.memory_id===memory.id);
  async function upload(event){
    const files=Array.from(event.target.files||[]);
    event.target.value='';
    if(!files.length)return;
    if(filtered.length+files.length>5){setError('Maksimal lima foto per memory.');return;}
    if(!drive.connected){setError('Connect Google Drive terlebih dahulu.');return;}
    if(!partner?.google_drive_email){setError('Pasangan perlu connect Google Drive juga sebelum upload agar foto bisa dilihat berdua.');return;}
    setBusy(true);setError('');
    try {
      await savePhotosToMemory(memory,files,partner.google_drive_email);
      await onUploaded?.();
    }catch(e){setError(e.message||'Gagal mengunggah foto.');}
    finally{setBusy(false);}
  }
  return <section className="memory-photo-album">
    {filtered.length>0&&<div className="memory-photo-grid">{filtered.map(photo=><GooglePhoto key={photo.id} photo={photo} connected={drive.connected} revision={drive.revision}/>)}</div>}
    <label className={'memory-upload '+(busy?'disabled':'')}>
      <ImagePlus size={16}/>{busy?'Uploading to Drive…':'Add photos ('+filtered.length+'/5)'}
      <input type="file" accept="image/*" multiple disabled={!drive.connected||busy||filtered.length>=5} onChange={upload} />
    </label>
    {error&&<p className="drive-error">{error}</p>}
  </section>;
}
