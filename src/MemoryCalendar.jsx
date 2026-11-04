import React,{useMemo,useState} from 'react';
import { ChevronLeft,ChevronRight,CalendarDays } from 'lucide-react';

const MOODS={Romantic:'🥰',Happy:'😊',Cozy:'😌',Exciting:'🤩',Peaceful:'🌿',Unexpected:'😅'};
const DAYS=['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
const key=(y,m,d)=>[y,String(m+1).padStart(2,'0'),String(d).padStart(2,'0')].join('-');

export default function MemoryCalendar({memories,places,onSelect}) {
  const [month,setMonth]=useState(()=>{
    const date=new Date();return new Date(date.getFullYear(),date.getMonth(),1);
  });
  const [chosen,setChosen]=useState(null);
  const y=month.getFullYear(),m=month.getMonth();
  const n=new Date(y,m+1,0).getDate();
  const start=new Date(y,m,1).getDay();
  const grouped=useMemo(()=>{
    const groups={};
    for(const entry of memories) (groups[entry.memory_date] ||= []).push(entry);
    return groups;
  },[memories]);
  const today=new Date().toLocaleDateString('en-CA');
  const days=Array.from({length:Math.ceil((start+n)/7)*7},(_,i)=>{
    const d=i-start+1;return d>=1&&d<=n?d:null;
  });
  const selected=chosen?grouped[chosen]||[]:[];
  function move(offset){setMonth(new Date(y,m+offset,1));setChosen(null);}
  return <div className="calendar-layout">
    <section className="memory-calendar">
      <div className="calendar-top"><button aria-label="Previous month" onClick={()=>move(-1)}><ChevronLeft size={19}/></button>
        <div><div className="eyebrow text-pink">THE DAYS WE KEEP</div><h2>{month.toLocaleDateString('en-US',{month:'long',year:'numeric'})} ♡</h2></div>
        <button aria-label="Next month" onClick={()=>move(1)}><ChevronRight size={19}/></button></div>
      <div className="calendar-cells">
        {DAYS.map(day=><div className="calendar-week" key={day}>{day}</div>)}
        {days.map((day,i)=>day?<button key={'day-'+i} className={'calendar-day'+(key(y,m,day)===chosen?' chosen':'')+(key(y,m,day)===today?' today':'')} onClick={()=>setChosen(key(y,m,day))} aria-label={day+' '+(grouped[key(y,m,day)]?.length||0)+' memories'}>
          <span>{day}</span><span className="calendar-dots">{(grouped[key(y,m,day)]||[]).slice(0,3).map(e=><span key={e.id} title={e.title}>{MOODS[e.mood]||'♡'}</span>)}</span>
          {(grouped[key(y,m,day)]||[]).length>3 && <small>+{grouped[key(y,m,day)].length-3}</small>}
        </button>:<div key={'empty-'+i} className="calendar-blank"/>)}
      </div>
    </section>
    <aside className="calendar-details">
      <div className="eyebrow text-pink">LITTLE MOMENTS</div>
      <h3>{chosen?new Date(chosen+'T12:00:00').toLocaleDateString('id-ID',{weekday:'long',day:'numeric',month:'long'}):'Pick a day ♡'}</h3>
      {!chosen?<p>Tap tanggal dengan emoji untuk membuka cerita yang pernah kalian buat.</p>:
       selected.length?selected.map(mem=><button key={mem.id} className="calendar-memory-link" onClick={()=>onSelect?.(mem)}>
         <span>{MOODS[mem.mood]||'♡'}</span><div><b>{mem.title}</b><small>{places.find(p=>p.id===mem.place_id)?.title||mem.mood}</small></div>
       </button>):<p>Belum ada kenangan untuk tanggal ini. Semoga segera ada! ♡</p>}
      <div className="calendar-note"><CalendarDays size={17}/> One day, a thousand little stories.</div>
    </aside>
  </div>;
}