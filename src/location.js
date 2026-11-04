// Extract only explicit coordinates from supported map links.
// Never guess venue coordinates based only on a social video or a city name.
function validPair(lat, lon) {
  const a=Number(lat),b=Number(lon);
  if(!Number.isFinite(a)||!Number.isFinite(b)||Math.abs(a)>90||Math.abs(b)>180)return null;
  return {latitude:a,longitude:b};
}

export function coordinatesFromLink(input) {
  try {
    const url=new URL(input);
    const host=url.hostname.toLowerCase();
    if(!/^(?:www\.)?(?:google\.[a-z.]+|maps\.google\.[a-z.]+|openstreetmap\.org)$/.test(host))return null;
    const safeDecode=decodeURIComponent(input);
    // Google Maps URLs usually contain @latitude,longitude or !3dLAT!4dLON.
    const at=safeDecode.match(/@(-?\d{1,2}(?:\.\d+)?),(-?\d{1,3}(?:\.\d+)?)(?:,|\/?)/);
    if(at)return validPair(at[1],at[2]);
    const tags=safeDecode.match(/!3d(-?\d{1,2}(?:\.\d+)?)!4d(-?\d{1,3}(?:\.\d+)?)/);
    if(tags)return validPair(tags[1],tags[2]);
    const q=url.searchParams.get('query')||url.searchParams.get('q')||url.searchParams.get('ll')||'';
    const comma=q.match(/^\s*(-?\d+(?:\.\d+)?),\s*(-?\d+(?:\.\d+)?)\s*$/);
    if(comma)return validPair(comma[1],comma[2]);
    if(host.endsWith('openstreetmap.org')) {
      const lat=url.searchParams.get('mlat'),lon=url.searchParams.get('mlon');
      if(lat&&lon)return validPair(lat,lon);
      const hash=url.hash.match(/#map=\d+\/(-?\d+(?:\.\d+)?)\/(-?\d+(?:\.\d+)?)/);
      if(hash)return validPair(hash[1],hash[2]);
    }
  } catch { /* Non-map links simply have no coordinates. */ }
  return null;
}

export function guessMapTitle(input) {
  try {
    const u=new URL(input);
    if(!/google\.|openstreetmap\.org/.test(u.hostname))return '';
    const parts=u.pathname.match(/\/maps\/place\/([^/]+)/);
    if(parts)return decodeURIComponent(parts[1]).replaceAll('+',' ').trim().slice(0,160);
    const q=u.searchParams.get('query')||u.searchParams.get('q');
    if(q && !/^-?\d+(?:\.\d+)?,\s*-?\d+(?:\.\d+)?$/.test(q))return q.slice(0,160);
  }catch{}
  return '';
}

export function todayLocalISO(d=new Date()){
  const y=d.getFullYear(),m=String(d.getMonth()+1).padStart(2,'0'),day=String(d.getDate()).padStart(2,'0');
  return y+'-'+m+'-'+day;
}

export function getCurrentCoordinates() {
  if(!navigator.geolocation)return Promise.reject(new Error('Lokasi perangkat tidak tersedia.'));
  return new Promise((resolve,reject)=>{
    navigator.geolocation.getCurrentPosition(
      position=>resolve(validPair(position.coords.latitude,position.coords.longitude)),
      ()=>reject(new Error('Izin lokasi belum diberikan. Coba aktifkan izin lokasi untuk NANTI.')),
      {enableHighAccuracy:true,timeout:12000,maximumAge:0}
    );
  });
}
