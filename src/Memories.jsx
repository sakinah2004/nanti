import React, { useEffect, useMemo, useState } from 'react';
import './memories.css';
import MemoryCalendar from './MemoryCalendar';
import {DriveConnect,MemoryPhotoAlbum,useDriveConnection,savePhotosToMemory} from './MemoryPhotos';
import {driveConfigured} from './googleDrive';
import {todayLocalISO} from './location';
import { ArrowLeft, CalendarDays, ExternalLink, Heart, ImagePlus, Pencil, Plus, Trash2, X } from 'lucide-react';

export const MEMORY_MOODS = [
  { value: 'Romantic', emoji: '🥰' }, { value: 'Happy', emoji: '😊' },
  { value: 'Cozy', emoji: '😌' }, { value: 'Exciting', emoji: '🤩' },
  { value: 'Peaceful', emoji: '🌿' }, { value: 'Unexpected', emoji: '😅' }
];

export function MemoryForm({ initial, places, onSave, onClose, onPhotosChange, onDriveConnected, members = [], user, isDemo = false, onPartialError }) {
  const [title, setTitle] = useState(initial?.title || '');
  const [memoryDate, setMemoryDate] = useState(initial?.memory_date || todayLocalISO());
  const [mood, setMood] = useState(initial?.mood || 'Happy');
  const [story, setStory] = useState(initial?.story || '');
  const [placeId, setPlaceId] = useState(initial?.place_id || '');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [files,setFiles] = useState([]);
  const drive=useDriveConnection(onDriveConnected);
  const partner=members.find(m=>m.id!==user?.id);
  const [showMore,setShowMore]=useState(Boolean(initial?.id));

  useEffect(() => {
    const onKey = event => { if (event.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  async function submit(event) {
    event.preventDefault();
    setError('');
    if(files.length && !driveConfigured() && !isDemo) return setError('Upload foto belum diaktifkan. Hapus pilihan foto untuk menyimpan kenangan tanpa foto.');
    if(files.length && !isDemo && !drive.connected) return setError('Hubungkan Google Drive satu kali untuk menyimpan foto.');
    if(files.length && !isDemo && !partner?.google_drive_email) return setError('Pasangan perlu menghubungkan akun Google Drive satu kali sebelum foto dapat dibagikan secara privat.');
    try {
      if (!title.trim() || title.trim().length > 120) throw new Error('Judul harus 1–120 karakter.');
      if (story.length > 4000) throw new Error('Cerita maksimal 4.000 karakter.');
      setBusy(true);
      const saved=await onSave({
        title:title.trim(),memory_date:memoryDate,mood,story:story.trim(),place_id:placeId||null
      },initial);
      if(files.length && !isDemo) {
        try {
          await savePhotosToMemory(saved,files,partner.google_drive_email);
          await onPhotosChange?.();
        } catch(photoError) {
          await onPhotosChange?.().catch(()=>{});
          onPartialError?.('Kenangan sudah tersimpan, tetapi ada foto yang gagal diunggah. Tambahkan lagi dari Gallery. '+photoError.message);
        }
      }
      onClose();
    } catch(e) {
      setError(e.message || 'Kenangan belum berhasil disimpan.');
    } finally { setBusy(false); }
  }

  return <div className="modal-backdrop" onMouseDown={e => e.target === e.currentTarget && onClose()}>
    <div className="modal memory-modal" role="dialog" aria-modal="true" aria-labelledby="memory-title">
      <div className="modal-top">
        <div><span className="eyebrow text-pink">OUR LITTLE DAYS</span><h2 id="memory-title">{initial?.id ? 'Edit memory' : 'A new memory'} ♡</h2></div>
        <button className="icon-button" onClick={onClose} aria-label="Close"><X size={20}/></button>
      </div>
      <form className="place-form memory-quick-form" onSubmit={submit}>
        {initial?.place_id && <div className="memory-place-summary">📍 {places.find(p=>p.id===initial.place_id)?.title || 'Our date'} <small>· {new Date(memoryDate+'T12:00:00').toLocaleDateString('id-ID',{day:'numeric',month:'short',year:'numeric'})}</small></div>}
        <div className="memory-label">How was our date? <span className="sub-label">Pilih mood ♡</span></div>
        <div className="mood-grid" role="group" aria-label="Date mood">
          {MEMORY_MOODS.map(option => <button type="button" aria-pressed={mood === option.value} key={option.value}
            onClick={() => setMood(option.value)} className={'mood-choice '+(mood===option.value?'selected':'')}>
            <span aria-hidden="true">{option.emoji}</span><small>{option.value}</small>
          </button>)}
        </div>
        {!isDemo && driveConfigured() && !drive.connected && <div className="memory-drive-setup"><span>📷 Hubungkan Google Drive satu kali untuk menyimpan foto pribadi.</span><button type="button" className="btn btn-ghost" onClick={drive.connect}>Connect Drive</button>{drive.error&&<small className="drive-error">{drive.error}</small>}</div>}
        {isDemo ? <p className="memory-photo-info">Mode demo: upload foto belum tersedia.</p>:
          driveConfigured() ? <label className="memory-file-picker">📸 Pilih foto dari galeri
            <input type="file" accept="image/*" multiple onChange={e=>setFiles(Array.from(e.target.files||[]).slice(0,5))}/>
            <small>{files.length?files.map(f=>f.name).join(', '):'Maksimal 5 foto · langsung ke Google Drive'}</small>
          </label> : <p className="memory-photo-info">📸 Foto akan tersedia setelah Google Drive diaktifkan. Kenangan bisa disimpan sekarang.</p>}
        <button type="button" className="memory-more-toggle" aria-expanded={showMore} onClick={()=>setShowMore(v=>!v)}>{showMore?'− Tutup detail':'+ Tambah cerita / ubah tanggal (opsional)'}</button>
        {showMore && <div className="memory-extra-fields">
          <label>Judul kenangan
            <input required maxLength={120} value={title} onChange={e=>setTitle(e.target.value)} placeholder="A slow Sunday together"/>
          </label>
          <label>Tanggal
            <input type="date" required value={memoryDate} onChange={e=>setMemoryDate(e.target.value)}/>
          </label>
          <label>Tempat
            <select value={placeId} onChange={e=>setPlaceId(e.target.value)}>
              <option value="">Kenangan spontan, tanpa tempat</option>
              {places.map(p=><option key={p.id} value={p.id}>{p.title}</option>)}
            </select>
          </label>
          <label>Our little story
            <textarea rows={3} maxLength={4000} value={story} onChange={e=>setStory(e.target.value)} placeholder="Tulis sesuatu kalau kamu mau…"/>
          </label>
        </div>}
        {error && <div className="alert alert--error">{error}</div>}
        <div className="modal-actions"><button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button type="submit" disabled={busy} className="btn btn-primary">{busy?'Saving…':'Save Memory ♡'} <Heart size={16}/></button></div>
      </form>
    </div>
  </div>;
}

export default function Memories({ memories, places, photos = [], onPhotosChange, onDriveConnected, user, members = [], onSave, onDelete, onBack, isDemo = false }) {
  const [editing, setEditing] = useState(null);
  const [error, setError] = useState('');
  const [moodFilter, setMoodFilter] = useState('All');
  const [tab, setTab] = useState('gallery');
  const [focusMemory,setFocusMemory]=useState(null);
  useEffect(()=>{if(tab==='gallery'&&focusMemory){document.getElementById('memory-'+focusMemory)?.scrollIntoView({behavior:'smooth',block:'start'});setFocusMemory(null);}},[tab,focusMemory]);
  const drive = useDriveConnection(onDriveConnected);
  const partner = members.find(m=>m.id!==user?.id);
  const sorted = useMemo(() => memories.filter(m => moodFilter === 'All' || m.mood === moodFilter)
    .slice().sort((a, b) => b.memory_date.localeCompare(a.memory_date)), [memories, moodFilter]);
  const dateLabel = value => value ? new Date(value + 'T12:00:00').toLocaleDateString('id-ID',
    { day:'numeric', month:'long', year:'numeric' }) : '';

  async function remove(memory) {
    if (!window.confirm('Hapus kenangan ini dari NANTI? Foto di Google Drive tidak ikut terhapus.')) return;
    try { setError(''); await onDelete(memory); } catch (e) { setError(e.message); }
  }

  return <main className="main-container memories-page">
    <section className="memories-intro">
      <div><button onClick={onBack} className="memory-back"><ArrowLeft size={16}/> Our places</button>
        <span className="eyebrow text-pink">THE DAYS WE KEEP</span>
        <h1>Our Memories <span>♡</span></h1>
        <p>Places become stories. This is where we keep ours.</p>
      </div>
      <button className="btn btn-primary" onClick={() => setEditing({})}><Plus size={17}/> Add a memory</button>
    </section>
    {isDemo && <div className="alert alert--error">Mode preview: kenangan tidak tersimpan online.</div>}
    {error && <div className="alert alert--error">{error}</div>}
    {!isDemo && <DriveConnect drive={drive}/>}
    <div className="memories-tabs"><button className={tab==='gallery'?'selected':''} onClick={()=>setTab('gallery')}>♡ Gallery</button><button className={tab==='calendar'?'selected':''} onClick={()=>setTab('calendar')}>▦ Calendar</button></div>
    {tab==='calendar' && <MemoryCalendar memories={memories} places={places} onSelect={mem=>{setMoodFilter('All');setFocusMemory(mem.id);setTab('gallery');}}/>}
    {tab==='gallery' && <><div className="memory-filters">
      <button className={moodFilter === 'All' ? 'selected' : ''} onClick={() => setMoodFilter('All')}>All moods</button>
      {MEMORY_MOODS.map(m => <button key={m.value} className={moodFilter === m.value ? 'selected' : ''} onClick={() => setMoodFilter(m.value)}>{m.emoji} {m.value}</button>)}
    </div>
    {sorted.length ? <div className="memories-grid">{sorted.map(memory => {
      const mood = MEMORY_MOODS.find(m => m.value === memory.mood) || MEMORY_MOODS[1];
      const place = places.find(p => p.id === memory.place_id);
      return <article id={'memory-'+memory.id} className="memory-card" key={memory.id}>
        <div className="memory-art"><div className="memory-stamp">♡ our little days</div><span className="memory-emoji">{mood.emoji}</span></div>
        <div className="memory-body">
          <span className="memory-date"><CalendarDays size={14}/> {dateLabel(memory.memory_date)}</span>
          <h3>{memory.title}</h3>
          <div className="memory-mood">{mood.emoji} {mood.value}</div>
          {place && <div className="memory-place">{place.title}</div>}
          {memory.story && <p>{memory.story}</p>}
          {!!memory.drive_links?.length && <div className="memory-photo-links">
            {memory.drive_links.map((url, i) => <a key={i} href={url} target="_blank" rel="noopener noreferrer">
              <ImagePlus size={14}/> Photo {i + 1} <ExternalLink size={12}/></a>)}
          </div>}
          {!isDemo && <MemoryPhotoAlbum memory={memory} photos={photos} drive={drive} partner={partner} onUploaded={onPhotosChange}/>}
          <div className="memory-actions"><button onClick={() => setEditing(memory)}><Pencil size={15}/> Edit</button>
            <button onClick={() => remove(memory)}><Trash2 size={15}/> Delete</button></div>
        </div>
      </article>;
    })}</div> : <div className="empty-state"><div className="empty-icon">♡</div>
      <h3>{memories.length ? 'No memories in this mood.' : 'The best days are yet to come.'}</h3>
      <p>{memories.length ? 'Pilih mood lain untuk melihat kenangan.' : 'Mulai album kenangan pertama kalian di sini.'}</p>
      <button className="btn btn-primary" onClick={() => setEditing({})}><Plus size={16}/> Add our first memory</button></div>}</>}
    {editing && <MemoryForm initial={editing} places={places} onSave={onSave} onClose={() => setEditing(null)} onPhotosChange={onPhotosChange} onDriveConnected={onDriveConnected} members={members} user={user} isDemo={isDemo} onPartialError={setError}/>}
  </main>;
}
