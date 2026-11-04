import React,{useEffect,useMemo,useRef,useState} from 'react';
import { MapPin,ExternalLink } from 'lucide-react';

let leafletLoading=null;
function loadLeaflet(){
  if(window.L) return Promise.resolve(window.L);
  if(leafletLoading)return leafletLoading;
  leafletLoading=new Promise((resolve,reject)=>{
    if(!document.querySelector('#nanti-leaflet-style')){
      const css=document.createElement('link');css.rel='stylesheet';css.id='nanti-leaflet-style';
      css.href='https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';document.head.appendChild(css);
    }
    const script=document.createElement('script');script.src='https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';script.async=true;
    script.onload=()=>window.L?resolve(window.L):reject(new Error('Leaflet unavailable'));
    script.onerror=()=>reject(new Error('Map service unavailable'));
    document.head.appendChild(script);
  }).catch(err=>{leafletLoading=null;throw err});
  return leafletLoading;
}
export default function OurMap({places,memories,onBack,onEdit}) {
  const container=useRef(null),mapInstance=useRef(null),markers=useRef(null);
  const [filter,setFilter]=useState('visited');
  const [selected,setSelected]=useState(null),[failed,setFailed]=useState(false),[ready,setReady]=useState(false);
  const located=useMemo(()=>places.filter(p=>Number.isFinite(p.latitude)&&Number.isFinite(p.longitude)
    && (filter==='all'||(filter==='visited'?p.status==='visited':p.status==='want'))),[places,filter]);
  useEffect(()=>{
    let live=true;
    loadLeaflet().then(L=>{
      if(!live||!container.current||mapInstance.current)return;
      const map=L.map(container.current,{scrollWheelZoom:false}).setView([-2.5,118],5);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{
        attribution:'&copy; OpenStreetMap contributors',maxZoom:18
      }).addTo(map);
      mapInstance.current=map;markers.current=L.layerGroup().addTo(map);setReady(true);
      setTimeout(()=>map.invalidateSize(),100);
    }).catch(()=>setFailed(true));
    return ()=>{live=false;if(mapInstance.current){mapInstance.current.remove();mapInstance.current=null;markers.current=null;}};
  },[]);
  useEffect(()=>{
    const map=mapInstance.current,layer=markers.current,L=window.L;if(!map||!layer||!L)return;
    layer.clearLayers();
    const bounds=[];
    located.forEach(place=>{
      const latlng=[place.latitude,place.longitude];
      const marker=L.marker(latlng).addTo(layer);
      marker.bindTooltip(place.title);
      marker.on('click',()=>setSelected(place));
      bounds.push(latlng);
    });
    if(bounds.length===1)map.setView(bounds[0],13);
    else if(bounds.length>1)map.fitBounds(bounds,{padding:[35,35],maxZoom:13});
  },[located,failed,ready]);
  const relevant=selected?memories.filter(m=>m.place_id===selected.id):[];
  return <main className="main-container map-page">
    <section className="map-intro"><button className="memory-back" onClick={onBack}>← Our places</button>
      <span className="eyebrow text-pink">EVERYWHERE WITH YOU</span><h1>Our Little World ♡</h1>
      <p>A map of little adventures and places yet to discover.</p></section>
    <div className="map-switches">{[['visited','❤️ Visited'],['want','📍 Wishlist'],['all','✨ All places']].map(([v,label])=>
      <button key={v} className={filter===v?'selected':''} onClick={()=>{setFilter(v);setSelected(null)}}>{label}</button>)}</div>
    <div className="map-body"><div ref={container} className="nanti-map" role="region" aria-label="Map of saved places">
      {failed && <p>Peta belum bisa dimuat. Coba cek koneksi internet.</p>}</div>
      <aside className="map-side"><h3>{selected?selected.title:'Places on our map ♡'}</h3>
        {selected?<><p>{selected.city||'No city specified'} · {selected.status==='visited'?'Visited':'Want to go'}</p>
          <p>{relevant.length} memories at this place</p>
          {relevant.slice(0,4).map(memory=><div className="map-memory" key={memory.id}>♡ {memory.title} <small>{memory.memory_date}</small></div>)}
          <a href={'https://www.openstreetmap.org/?mlat='+selected.latitude+'&mlon='+selected.longitude+'#map=16/'+selected.latitude+'/'+selected.longitude} target="_blank" rel="noopener noreferrer">Open full map <ExternalLink size={14}/></a>
          <button className="map-text-button" onClick={()=>onEdit(selected)}>Edit place</button></>:
        located.length?<div className="map-location-list">{located.map(p=><button key={p.id} onClick={()=>{setSelected(p);mapInstance.current?.setView([p.latitude,p.longitude],13)}}><MapPin size={16}/>{p.title}</button>)}</div>:
        <div className="map-empty"><MapPin size={26}/><p>Belum ada pin. Tambahkan koordinat pada place melalui Edit place, lalu tandai Visited.</p></div>}
        <small className="map-attribution">Lokasi disimpan manual. Tidak melacak posisi perangkat secara langsung.</small>
      </aside>
    </div>
  </main>;
}