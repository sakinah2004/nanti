import React, { useEffect, useMemo, useState } from 'react';
import './memories.css';
import MemoryCalendar from './MemoryCalendar';
import {DriveConnect,MemoryPhotoAlbum,useDriveConnection} from './MemoryPhotos';
import { ArrowLeft, CalendarDays, ExternalLink, Heart, ImagePlus, Pencil, Plus, Trash2, X } from 'lucide-react';

export const MEMORY_MOODS = [
  { value: 'Romantic', emoji: '🥰' }, { value: 'Happy', emoji: '😊' },
  { value: 'Cozy', emoji: '😌' }, { value: 'Exciting', emoji: '🤩' },
  { value: 'Peaceful', emoji: '🌿' }, { value: 'Unexpected', emoji: '😅' }
];

function MemoryForm({ initial, places, onSave, onClose }) {
  const [title, setTitle] = useState(initial?.title || '');
  const [memoryDate, setMemoryDate] = useState(initial?.memory_date || new Date().toLocaleDateString('en-CA'));
  const [mood, setMood] = useState(initial?.mood || 'Happy');
  const [story, setStory] = useState(initial?.story || '');
  const [placeId, setPlaceId] = useState(initial?.place_id || '');
  const [links, setLinks] = useState((initial?.drive_links || []).join('\n'));
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const onKey = event => { if (event.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  async function submit(event) {
    event.preventDefault();
    setError('');
    const urls = links.split(/\r?\n/).map(x => x.trim()).filter(Boolean);
    if (urls.length > 5) return setError('Maksimal lima link foto per kenangan.');
    try {
      for (const link of urls) {
        const url = new URL(link);
        if (url.protocol !== 'https:' || url.hostname !== 'drive.google.com' || link.length > 1000) {
          throw new Error('Gunakan link berbagi Google Drive (https://drive.google.com/...).');
        }
      }
      if (!title.trim() || title.trim().length > 120) throw new Error('Judul harus 1–120 karakter.');
      if (story.length > 4000) throw new Error('Cerita maksimal 4.000 karakter.');
      setBusy(true);
      await onSave({
        title: title.trim(), memory_date: memoryDate, mood, story: story.trim(),
        place_id: placeId || null, drive_links: urls
      }, initial);
      onClose();
    } catch (e) {
      setError(e.message || 'Kenangan belum berhasil disimpan.');
    } finally { setBusy(false); }
  }

  return <div className="modal-backdrop" onMouseDown={e => e.target === e.currentTarget && onClose()}>
    <div className="modal memory-modal" role="dialog" aria-modal="true" aria-labelledby="memory-title">
      <div className="modal-top">
        <div><span className="eyebrow text-pink">OUR LITTLE DAYS</span><h2 id="memory-title">{initial?.id ? 'Edit memory' : 'A new memory'} ♡</h2></div>
        <button className="icon-button" onClick={onClose} aria-label="Close"><X size={20}/></button>
      </div>
      <form className="place-form" onSubmit={submit}>
        <label>Judul kenangan <span className="required">*</span>
          <input required maxLength={120} value={title} onChange={e => setTitle(e.target.value)} placeholder="A slow Sunday together"/>
        </label>
        <label>Tanggal <span className="required">*</span>
          <input type="date" required value={memoryDate} onChange={e => setMemoryDate(e.target.value)} />
        </label>
        <div className="memory-label">How was our date? <span className="sub-label">Pilih satu mood</span></div>
        <div className="mood-grid" role="group" aria-label="Date mood">
          {MEMORY_MOODS.map(option => <button type="button" aria-pressed={mood === option.value} key={option.value}
            onClick={() => setMood(option.value)} className={'mood-choice ' + (mood === option.value ? 'selected' : '')}>
            <span aria-hidden="true">{option.emoji}</span><small>{option.value}</small>
          </button>)}
        </div>
        <label>Tempat dari wishlist (opsional)
          <select value={placeId} onChange={e => setPlaceId(e.target.value)}>
            <option value="">Kenangan spontan, tanpa tempat</option>
            {places.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
          </select>
        </label>
        <label>Our little story
          <textarea rows={4} maxLength={4000} value={story} onChange={e => setStory(e.target.value)}
            placeholder="What made this day special?"/>
        </label>
        <label>Link foto Google Drive lama <span className="sub-label">(opsional, satu link per baris)</span>
          <textarea rows={3} value={links} onChange={e => setLinks(e.target.value)}
            placeholder={'https://drive.google.com/file/d/.../view\nhttps://drive.google.com/file/d/.../view'}/>
        </label>
        <p className="drive-hint"><ImagePlus size={16}/> Simpan memory terlebih dahulu, lalu tambahkan foto langsung di kartunya melalui tombol Add photos. File akan dikirim ke Google Drive, tidak ke Supabase Storage.</p>
        {error && <div className="alert alert--error">{error}</div>}
        <div className="modal-actions"><button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button type="submit" disabled={busy} className="btn btn-primary">{busy ? 'Saving...' : 'Save memory'} <Heart size={16}/></button></div>
      </form>
    </div>
  </div>;
}

export default function Memories({ memories, places, photos = [], onPhotosChange, onDriveConnected, user, members = [], onSave, onDelete, onBack, isDemo = false }) {
  const [editing, setEditing] = useState(null);
  const [error, setError] = useState('');
  const [moodFilter, setMoodFilter] = useState('All');
  const [tab, setTab] = useState('gallery');
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
    {tab==='calendar' && <MemoryCalendar memories={memories} places={places} onSelect={mem=>{setTab('gallery');setMoodFilter('All');document.getElementById('memory-'+mem.id)?.scrollIntoView({behavior:'smooth'});}}/>}
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
    {editing && <MemoryForm initial={editing} places={places} onSave={onSave} onClose={() => setEditing(null)}/>}
  </main>;
}
