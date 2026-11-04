import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowDownRight, ArrowLeft, ArrowRight, Bookmark, Check, CheckCheck, ChevronDown,
  Coffee, Compass, Copy, ExternalLink, Heart, HeartHandshake, Link as LinkIcon,
  LockKeyhole, LogOut, MapPin, Menu, MoreHorizontal, Pencil, Plus, Search, Send,
  ShieldCheck, Shuffle, Sparkles, Trash2, UsersRound, WandSparkles, X
} from 'lucide-react';
import { supabase, isConfigured, CATEGORIES, normalizeUrl, getSource, placeholderTitle, localDate } from './lib';
import Memories,{MemoryForm} from './Memories';
import {coordinatesFromLink,guessMapTitle,todayLocalISO,getCurrentCoordinates} from './location';
import OurMap from './OurMap';
import './extraFeatures.css';

const defaultDemoPlaces = [
  { id: 'd1', title: 'Little coffee corner', category: 'Cafe', city: 'Jakarta Selatan', status: 'want', is_favorite: true, notes: 'Cozy banget, coba weekend!', saved_by: 'demo-you', source_url: 'https://www.instagram.com/', created_at: '2026-10-29T10:00:00Z' },
  { id: 'd2', title: 'Pottery date idea', category: 'Activity', city: 'Jakarta', status: 'want', is_favorite: false, notes: 'Bikin mug berdua ♡', saved_by: 'demo-him', source_url: 'https://www.threads.com/', created_at: '2026-10-28T10:00:00Z' },
  { id: 'd3', title: 'An evening to remember', category: 'Restaurant', city: 'Bandung', status: 'want', is_favorite: false, notes: 'Dinner anniversary?', saved_by: 'demo-him', source_url: 'https://www.tiktok.com/', created_at: '2026-10-27T10:00:00Z' },
  { id: 'd4', title: 'Botanical garden walk', category: 'Nature', city: 'Bogor', status: 'visited', is_favorite: true, notes: 'Such a lovely afternoon.', saved_by: 'demo-you', source_url: 'https://maps.google.com/', visited_at: '2026-10-20T10:00:00Z', created_at: '2026-10-20T10:00:00Z' }
];

function Brand({ light = false }) {
  return <div className={`brand ${light ? 'brand--light' : ''}`}>
    <div className="brand-mark"><Heart size={19} strokeWidth={2.7} fill="currentColor" /></div>
    <div className="brand-name">nanti<span>.</span></div>
  </div>;
}

function Loader({ label = 'Just a little moment...' }) {
  return <div className="screen-loader"><div className="spinner" /><span>{label}</span></div>;
}

function Toast({ message, close }) {
  useEffect(() => {
    if (!message) return;
    const t = setTimeout(close, 3800);
    return () => clearTimeout(t);
  }, [message, close]);
  return message ? <div className="toast" role="status"><Check size={17} />{message}<button aria-label="Dismiss" onClick={close}><X size={16}/></button></div> : null;
}

function AuthScreen({ pendingUrl }) {
  const [mode, setMode] = useState('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const onSubmit = async (e) => {
    e.preventDefault(); setBusy(true); setError(''); setMessage('');
    try {
      if (mode === 'signup') {
        if (!name.trim()) throw new Error('Isi nama panggilanmu dulu, ya.');
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(), password,
          options: { data: { display_name: name.trim().slice(0, 40) } }
        });
        if (error) throw error;
        if (!data.session) setMessage('Akun dibuat. Cek email untuk konfirmasi, lalu login di sini.');
        else setMessage('Yay! Akun berhasil dibuat.');
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
        if (error) throw error;
      }
    } catch(err) { setError(err.message || 'Gagal masuk. Coba lagi.'); }
    finally { setBusy(false); }
  };
  return <div className="auth-page">
    <div className="auth-visual">
      <div className="auth-visual-top"><Brand light/><span>♡ our little corner</span></div>
      <div className="auth-art">
        <div className="art-sun"></div><div className="art-orbit art-orbit--1"></div><div className="art-orbit art-orbit--2"></div>
        <div className="art-ticket art-ticket--1"><span>☕</span><small>coffee & conversations</small></div>
        <div className="art-ticket art-ticket--2"><span>🎨</span><small>something new together</small></div>
        <div className="art-center"><Heart size={58} fill="currentColor" strokeWidth={1.4}/></div>
        <div className="art-sparkle art-sparkle--1">✳</div><div className="art-sparkle art-sparkle--2">✦</div>
      </div>
      <div className="auth-visual-copy"><span className="eyebrow">YOUR STORY, ONE PLACE AT A TIME</span><h1>For all the places<br/>we haven't been <em>yet.</em></h1><p>A little wishlist for two people and a whole lot of future memories.</p></div>
      <div className="auth-visual-foot">made for little adventures, together ♡</div>
    </div>
    <div className="auth-panel">
      <div className="auth-mobile-brand"><Brand/></div>
      <div className="auth-content">
        <span className="eyebrow text-pink">WELCOME TO <span style={{textTransform:'none',letterSpacing:0,fontSize:'1.3em'}}>nanti.</span> ♡</span>
        <h2>{mode === 'signup' ? 'Start your little story.' : 'Love seeing you here.'}</h2>
        <p className="muted auth-sub">{mode === 'signup' ? 'Buat akun pribadi untuk wishlist yang akan kalian isi berdua.' : 'Login dulu, lalu lanjut menabung ide dating.'}</p>
        {pendingUrl && <div className="share-notice"><LinkIcon size={16}/>Link yang kamu share siap disimpan setelah login.</div>}
        <form onSubmit={onSubmit} className="auth-form">
          {mode === 'signup' && <label>Nama panggilan<input autoComplete="nickname" value={name} onChange={e => setName(e.target.value)} required maxLength={40} placeholder="Kamu mau dipanggil apa?" /></label>}
          <label>Email<input type="email" autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="you@example.com" /></label>
          <label>Password<input type="password" autoComplete={mode === 'signup' ? 'new-password' : 'current-password'} value={password} onChange={e => setPassword(e.target.value)} required minLength={6} placeholder="Minimal 6 karakter" /></label>
          {error && <div className="alert alert--error">{error}</div>}
          {message && <div className="alert alert--success">{message}</div>}
          <button disabled={busy} className="btn btn-primary btn-wide" type="submit">{busy ? 'Memproses...' : mode === 'signup' ? 'Create an account' : 'Sign in'} <ArrowRight size={18}/></button>
        </form>
        <div className="auth-switch">{mode === 'signin' ? 'Belum punya akun?' : 'Sudah punya akun?'} <button className="text-button" onClick={() => { setMode(mode === 'signin' ? 'signup' : 'signin'); setError(''); setMessage(''); }}>{mode === 'signin' ? 'Sign up' : 'Sign in'}</button></div>
        <div className="auth-privacy"><LockKeyhole size={14}/> Private by default. Just the two of you.</div>
      </div>
    </div>
  </div>;
}

function PairSetup({ onCreated, busy, error }) {
  const params = new URLSearchParams(window.location.search);
  const [mode, setMode] = useState(params.get('join') ? 'join' : 'create');
  const [code, setCode] = useState(params.get('join') || '');
  const submit = async () => { await onCreated(mode, code); };
  return <div className="setup-page">
    <div className="setup-head"><Brand/><button className="tiny-link" onClick={() => supabase.auth.signOut()}><LogOut size={15}/> Logout</button></div>
    <div className="setup-card">
      <div className="setup-illustration"><div className="setup-heart setup-heart--left"><Heart fill="currentColor" /></div><div className="setup-heart setup-heart--right"><Heart fill="currentColor" /></div><span>♡</span></div>
      <span className="eyebrow text-pink">A LITTLE SPACE FOR TWO</span>
      <h1>Better when we're<br/><em>together.</em></h1>
      <p className="muted">Kalian punya akun masing-masing, tapi semua tempat tersimpan dalam satu wishlist yang sama.</p>
      <div className="setup-toggle"><button className={mode === 'create' ? 'active' : ''} onClick={() => setMode('create')}>Buat wishlist</button><button className={mode === 'join' ? 'active' : ''} onClick={() => setMode('join')}>Gabung pasangan</button></div>
      {mode === 'join' ? <div className="setup-input"><label>Kode undangan dari pasangan</label><input placeholder="Contoh: 1234ABCD..." value={code} onChange={e => setCode(e.target.value.toUpperCase())} maxLength={32} /></div> : <div className="setup-instructions"><UsersRound size={20}/><span>Buat wishlist, lalu kirim kode undangan ke pasanganmu. Hanya dua akun yang bisa bergabung.</span></div>}
      {error && <div className="alert alert--error">{error}</div>}
      <button disabled={busy || (mode === 'join' && !code.trim())} onClick={submit} className="btn btn-primary btn-wide">{busy ? 'Memproses...' : mode === 'create' ? 'Create our space' : 'Join our space'} <ArrowRight size={18}/></button>
      <small className="setup-foot">private space, shared dreams ♡</small>
    </div>
  </div>;
}

function FormModal({ initial, onClose, onSave, busy }) {
  const editing = !!initial?.id;
  const [url, setUrl] = useState(initial?.source_url || '');
  const [title, setTitle] = useState(initial?.title || '');
  const [category, setCategory] = useState(initial?.category || 'Other');
  const [city, setCity] = useState(initial?.city || '');
  const [notes, setNotes] = useState(initial?.notes || '');
  const [status, setStatus] = useState(initial?.status || 'want');
  const [cover,setCover] = useState(initial?.cover_url || '');
  const [latitude,setLatitude] = useState(initial?.latitude ?? '');
  const [longitude,setLongitude] = useState(initial?.longitude ?? '');
  const [previewStatus,setPreviewStatus] = useState('');
  const [advanced,setAdvanced]=useState(editing);
  const [locating,setLocating]=useState(false);
  const pasteLink=async()=>{try{const text=await navigator.clipboard.readText();const match=text.match(/https?:\/\/[^\s]+/);setUrl((match?.[0]||text).trim());setError('');}catch{setError('Tempel link secara manual di kolom atas.');}};
  const useLocation=async()=>{setLocating(true);setError('');try{const point=await getCurrentCoordinates();setLatitude(point.latitude);setLongitude(point.longitude);setPreviewStatus('Lokasi saat ini siap disimpan ♡');}catch(e){setError(e.message);}finally{setLocating(false);}};
  const tryCover = async () => {
    if (cover || !url.startsWith('https://') || !supabase) return;
    setPreviewStatus('Looking for a cover…');
    try {
      const {data,error} = await supabase.functions.invoke('place-preview',{body:{url}});
      if(error) throw error;
      if(data?.cover_url) {setCover(data.cover_url);setPreviewStatus('Cover video ditemukan ♡');}
      if(data?.title && !title && !editing) setTitle(data.title.slice(0,160));
      else setPreviewStatus('No automatic cover available. You can paste a cover URL below.');
    } catch{setPreviewStatus('Preview unavailable. You can paste a cover URL manually.');}
  };
  const [error, setError] = useState('');
  useEffect(() => { const key = (e) => { if (e.key === 'Escape') onClose(); }; window.addEventListener('keydown', key); return () => window.removeEventListener('keydown', key); }, [onClose]);
  const submit = async e => {
    e.preventDefault(); setError('');
    try {
      if (!editing) normalizeUrl(url);
      if(cover && (!/^https:\/\//i.test(cover)||cover.length>1800))throw new Error('Cover image harus link HTTPS yang valid.');
      const fromLink=editing?null:coordinatesFromLink(url);
      const lat=latitude===''?(fromLink?.latitude??null):Number(latitude),lon=longitude===''?(fromLink?.longitude??null):Number(longitude);
      if((lat===null)!==(lon===null) || (lat!==null&&(!Number.isFinite(lat)||Math.abs(lat)>90))||(lon!==null&&(!Number.isFinite(lon)||Math.abs(lon)>180)))throw new Error('Isi latitude dan longitude yang valid, atau kosongkan keduanya.');
      await onSave({ url, title: title.trim() || guessMapTitle(url), category, city: city.trim(), notes: notes.trim(), status, cover_url:cover||null,latitude:lat,longitude:lon }, initial);
      onClose();
    } catch(err) { setError(err.message || 'Gagal menyimpan.'); }
  };
  return <div className="modal-backdrop" onMouseDown={e => e.target === e.currentTarget && onClose()}>
    <div className="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title">
      <div className="modal-top"><div><span className="eyebrow text-pink">LITTLE ADVENTURES</span><h2 id="modal-title">{editing ? 'Edit this place' : 'Save a new place'} <span>♡</span></h2></div><button aria-label="Close" className="icon-button" onClick={onClose}><X size={20}/></button></div>
      <form className="place-form quick-place-form" onSubmit={submit}>
        <label>Link TikTok, Instagram, atau Google Maps <span className="required">*</span>
          <div className="input-icon"><LinkIcon size={17}/><input type="url" autoFocus placeholder="Tempel link tempat di sini…" required disabled={editing} value={url} onChange={e=>setUrl(e.target.value)} onBlur={tryCover}/></div>
        </label>
        {!editing && <button type="button" className="quick-paste" onClick={pasteLink}>📋 Paste link from clipboard</button>}
        {!editing && <p className="quick-place-hint">Cukup tempel link dan simpan. Cover akan dicari otomatis jika tersedia.</p>}
        <button type="button" className="memory-more-toggle" aria-expanded={advanced} onClick={()=>setAdvanced(v=>!v)}>{advanced?'− Tutup detail':'+ Tambahkan nama / lokasi (opsional)'}</button>
        {advanced && <div className="quick-place-extras">
          <label>Nama tempat<input maxLength={160} placeholder="Misalnya: hidden café di Bandung" value={title} onChange={e=>setTitle(e.target.value)}/></label>
          <label>Kategori
            <div className="category-choices">{CATEGORIES.map(c=><button className={category===c.value?'selected':''} type="button" key={c.value} onClick={()=>setCategory(c.value)}><span>{c.emoji}</span>{c.label}</button>)}</div>
          </label>
          <label>Kota / area<input maxLength={100} placeholder="Misalnya: Jakarta Selatan" value={city} onChange={e=>setCity(e.target.value)}/></label>
          <label>Cover (jika tidak muncul otomatis)<input type="url" maxLength={1800} placeholder="https://...gambar.jpg" value={cover} onChange={e=>setCover(e.target.value)}/>{cover&&<img className="form-cover-preview" src={cover} alt="Cover tempat" referrerPolicy="no-referrer" onError={e=>{e.currentTarget.style.display='none'}}/>}</label>
          <div className="quick-location"><button type="button" className="btn btn-ghost" disabled={locating} onClick={useLocation}>📍 {locating?'Mengambil lokasi…':'Gunakan lokasi saya saat ini'}</button><small>Hanya jika kamu sedang berada di tempat ini. Tidak melacak lokasi terus-menerus.</small></div>
          <div className="place-coordinate-row"><label>Latitude<input type="number" step="any" min="-90" max="90" value={latitude} onChange={e=>setLatitude(e.target.value)}/></label><label>Longitude<input type="number" step="any" min="-180" max="180" value={longitude} onChange={e=>setLongitude(e.target.value)}/></label></div>
          <label>Catatan pribadi<textarea rows={2} maxLength={2000} value={notes} onChange={e=>setNotes(e.target.value)} placeholder="Kenapa ingin ke sini?"/></label>
          {editing && <label>Status<select value={status} onChange={e=>setStatus(e.target.value)}><option value="want">♡ Want to go</option><option value="visited">✓ Visited</option></select></label>}
          {previewStatus && <p className="muted">{previewStatus}</p>}
        </div>}
        {error && <div className="alert alert--error">{error}</div>}
        <div className="modal-actions"><button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button><button disabled={busy} className="btn btn-primary" type="submit">{busy ? 'Saving...' : editing?'Save changes':'Save to NANTI ♡'} <Heart size={16}/></button></div>
      </form>
    </div>
  </div>;
}

function PlaceCard({ place, memberName, onEdit, onToggleFavorite, onToggleVisited, onDelete, busy }) {
  const meta = CATEGORIES.find(x => x.value === place.category) || CATEGORIES.at(-1);
  return <article className="place-card">
    <div className={`place-art place-art--${meta.gradient}`}>
      {place.cover_url && <img className="place-cover" src={place.cover_url} alt={'Cover '+place.title} loading="lazy" referrerPolicy="no-referrer" onError={e=>{e.currentTarget.style.display='none'}}/>}
      <div className="place-art-pattern">✳</div><div className="place-emoji">{meta.emoji}</div>
      <button className={`heart-button ${place.is_favorite ? 'is-favorite' : ''}`} title={place.is_favorite ? 'Remove favorite' : 'Add favorite'} aria-label="Toggle favorite" disabled={busy} onClick={() => onToggleFavorite(place)}><Heart size={19} fill={place.is_favorite ? 'currentColor' : 'none'}/></button>
      <div className="place-category">{meta.label}</div>
    </div>
    <div className="place-card-body">
      <div className="place-source"><span className="source-dot"></span>{getSource(place.source_url)} <span className="source-spacer">·</span> saved by {memberName}</div>
      <h3 title={place.title}>{place.title}</h3>
      <div className="place-area"><MapPin size={14}/>{place.city || 'Location not added yet'}</div>
      {place.notes && <p className="place-note">{place.notes}</p>}
      <div className="place-bottom"><span className={`status-pill ${place.status === 'visited' ? 'status-pill--visited' : ''}`}>{place.status === 'visited' ? '✓ Visited' : '♡ Want to go'}</span><span className="place-date">{localDate(place.created_at)}</span></div>
      <button className="place-visit-cta" disabled={busy} onClick={()=>onToggleVisited(place)}>{place.status==='want'?'♡ We’ve Been Here':'📸 Add a Memory ♡'}</button>
      <div className="place-actions"><a href={place.source_url} target="_blank" rel="noopener noreferrer" className="source-link">View post <ExternalLink size={14}/></a><div className="card-icon-actions"><button title="Edit" aria-label="Edit place" disabled={busy} onClick={() => onEdit(place)}><Pencil size={16}/></button><button title="Delete" aria-label="Delete place" disabled={busy} onClick={() => onDelete(place)}><Trash2 size={16}/></button></div></div>
    </div>
  </article>;
}

function Dashboard({ user, profile, pair, members, places, memories, photos = [], onPhotosChange, onDriveConnected, onAdd, onEdit, onRemove, onSaveMemory, onDeleteMemory, onSignOut, onRefresh, isDemo = false, notice = '' }) {
  const [view, setView] = useState('want');
  const [section, setSection] = useState('places');
  const [cat, setCat] = useState('All');
  const [query, setQuery] = useState('');
  const [modal, setModal] = useState(null);
  const [quickMemory,setQuickMemory]=useState(null);
  const [showInvite, setShowInvite] = useState(false);
  const [toast, setToast] = useState(notice);
  const [busy, setBusy] = useState(false);
  const [mobileMenu, setMobileMenu] = useState(false);
  const stats = useMemo(() => ({
    want: places.filter(p => p.status === 'want').length,
    visited: places.filter(p => p.status === 'visited').length,
    favorite: places.filter(p => p.is_favorite).length
  }), [places]);
  const filtered = useMemo(() => places.filter(p => (view === 'favorite' ? p.is_favorite : p.status === view) && (cat === 'All' || p.category === cat) && (!query.trim() || `${p.title} ${p.city} ${p.notes} ${getSource(p.source_url)}`.toLowerCase().includes(query.toLowerCase()))), [places, view, cat, query]);
  const memberName = id => members.find(m => m.id === id)?.display_name || (id === user.id ? 'you' : 'partner');
  const doSave = async (fields, existing) => { setBusy(true); try { await (existing?.id ? onEdit(existing, fields) : onAdd(fields)); setToast(existing?.id ? 'Place updated ♡' : 'Added to our places ♡'); } finally { setBusy(false); } };
  const doFavorite = async (place) => { setBusy(true); try { await onEdit(place, { is_favorite: !place.is_favorite }); } catch(e) { setToast(e.message); } finally { setBusy(false); } };
  const doVisited = async place => {
    setBusy(true);
    try {
      if(place.status !== 'visited') await onEdit(place,{status:'visited',visited_at:new Date().toISOString()});
      setView('visited');setCat('All');setQuery('');
      setQuickMemory({place_id:place.id,title:('Our date at '+place.title).slice(0,120),memory_date:todayLocalISO(),mood:'Happy',story:''});
      setToast('Date added ♡ Choose a mood to keep this memory.');
    } catch(e) {setToast(e.message);} finally {setBusy(false);}
  };
  const doRemove = async place => { if (!window.confirm(`Hapus "${place.title}" dari wishlist kalian?`)) return; setBusy(true); try { await onRemove(place); setToast('Place removed'); } catch(e) { setToast(e.message); } finally { setBusy(false); } };
  const pickRandom = () => { const options = places.filter(p => p.status === 'want'); if (!options.length) return setToast('Tambahkan tempat dulu, ya!'); const random = options[Math.floor(Math.random() * options.length)]; setView('want'); setCat('All'); setQuery(random.title); setToast(`Your next date: ${random.title} ♡`); };
  const inviteUrl = pair?.invite_code ? `${window.location.origin}/?join=${encodeURIComponent(pair.invite_code)}` : '';
  const exportCsv = () => {
    const columns = ['title','category','city','notes','status','is_favorite','source_url','saved_by','created_at','visited_at'];
    const escape = (value) => `"${String(value ?? '').replaceAll('"','""')}"`;
    const lines = [columns.map(escape).join(','), ...places.map(place => columns.map(key => escape(place[key])).join(','))].join('\r\n');
    const blob = new Blob(['\ufeff', lines], { type:'text/csv;charset=utf-8;' });
    const blobUrl = URL.createObjectURL(blob);
    const anchor = document.createElement('a'); anchor.href = blobUrl;
    anchor.download = `nanti-backup-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(anchor); anchor.click(); anchor.remove(); URL.revokeObjectURL(blobUrl);
    setToast('Backup CSV downloaded ♡');
  };
  const copy = async value => { try { await navigator.clipboard.writeText(value); setToast('Copied to clipboard ♡'); } catch { setToast('Gagal menyalin. Salin teks secara manual.'); } };
  if (section === 'map') return <div className="app-shell app-transition"><OurMap places={places} memories={memories} onBack={()=>setSection('places')} onEdit={place=>{setSection('places');setModal(place)}}/></div>;
  if (section === 'memories') return <div className="app-shell app-transition"><header className="site-header"><div className="header-inner"><Brand/><nav className="desktop-nav"><button className="nav-link" onClick={() => setSection('places')}>Our places</button><button className="nav-link active">Our memories ♡</button></nav><button className="header-new-btn" onClick={() => setSection('places')}>Our places</button></div></header><Memories memories={memories} places={places} photos={photos} user={user} members={members} onPhotosChange={onPhotosChange} onDriveConnected={onDriveConnected} onSave={onSaveMemory} onDelete={onDeleteMemory} onBack={() => setSection('places')} isDemo={isDemo}/></div>;
  return <div className="app-shell">
    {isDemo && <div className="demo-banner">✦ MODE PREVIEW — Data ini contoh dan tidak tersimpan online. Hubungkan Supabase untuk versi sungguhan. <a href="#setup-notes">Cara setup</a></div>}
    <header className="site-header"><div className="header-inner"><Brand/><nav className="desktop-nav"><button className="nav-link active">Our places <span>♡</span></button><button className="nav-link" onClick={() => setSection('memories')}>Our memories</button><button className="nav-link" onClick={() => setSection('map')}>Our map</button><button className="nav-link" onClick={() => setShowInvite(true)}>Our space</button></nav><div className="header-actions"><div className="members-avatars" title="Just the two of you">{members.map((m,i) => <div key={m.id} className={`avatar avatar--${i}`}>{(m.display_name || '♡').charAt(0).toUpperCase()}</div>)}{members.length === 1 && <div className="avatar avatar--empty">+</div>}</div><button className="header-new-btn" onClick={() => setModal({})}><Plus size={17}/>Add a place</button><button onClick={() => setMobileMenu(!mobileMenu)} className="icon-button menu-btn" aria-label="Menu"><Menu size={22}/></button></div></div></header>
    {mobileMenu && <div className="mobile-popover"><button onClick={() => { setShowInvite(true); setMobileMenu(false); }}><UsersRound size={17}/> Our space</button><button onClick={() => { setSection('memories'); setMobileMenu(false); }}><Heart size={17}/> Our memories</button><button onClick={() => { setSection('map'); setMobileMenu(false); }}><MapPin size={17}/> Our map</button><button onClick={onSignOut}><LogOut size={17}/> Sign out</button></div>}
    <main className="main-container">
      <section className="hero">
        <div className="hero-copy"><div className="hero-kicker"><span className="kicker-line"></span> OUR LITTLE CORNER OF THE INTERNET <span>✳</span></div><h1>Places to go.<br/><em>Memories to make.</em></h1><p>Every cute café, hidden gem, and spontaneous adventure — all in one place, just for us.</p><div className="hero-buttons"><button className="btn btn-dark" onClick={() => setModal({})}><Plus size={18}/> Save a new place</button><button className="btn btn-hero-outline" onClick={pickRandom}><Shuffle size={17}/> Pick our next date</button><button className="btn btn-hero-outline" onClick={() => setSection('memories')}><Heart size={17}/> Our Memories</button><button className="btn btn-hero-outline" onClick={() => setSection('map')}><MapPin size={17}/> Our Map</button></div></div>
        <div className="hero-graphic"><div className="hero-orbit hero-orbit--one"></div><div className="hero-orbit hero-orbit--two"></div><span className="graphic-sparkle gs-one">✦</span><span className="graphic-sparkle gs-two">✳</span><div className="hero-polaroid hero-polaroid--back"><span>🌿</span><small>an outdoor adventure</small></div><div className="hero-polaroid hero-polaroid--front"><span>☕</span><small>coffee with you ♡</small></div><div className="hero-ribbon">you + me + everywhere</div></div>
      </section>
      <section className="stats-grid" aria-label="Wishlist statistics"><button className={`stat ${view === 'want' ? 'stat--active' : ''}`} onClick={() => { setView('want'); setCat('All'); setQuery(''); }}><div className="stat-icon stat-icon--rose"><Bookmark size={20}/></div><div><div className="stat-number">{stats.want.toString().padStart(2,'0')}</div><div className="stat-label">Want to go</div></div><ArrowDownRight size={16} className="stat-arrow"/></button><button className={`stat ${view === 'visited' ? 'stat--active' : ''}`} onClick={() => { setView('visited'); setCat('All'); setQuery(''); }}><div className="stat-icon stat-icon--sage"><Check size={20}/></div><div><div className="stat-number">{stats.visited.toString().padStart(2,'0')}</div><div className="stat-label">We've been</div></div><ArrowDownRight size={16} className="stat-arrow"/></button><button className={`stat ${view === 'favorite' ? 'stat--active' : ''}`} onClick={() => { setView('favorite'); setCat('All'); setQuery(''); }}><div className="stat-icon stat-icon--peach"><Heart size={20}/></div><div><div className="stat-number">{stats.favorite.toString().padStart(2,'0')}</div><div className="stat-label">Our favorites</div></div><ArrowDownRight size={16} className="stat-arrow"/></button></section>
      {members.length === 1 && <section className="invite-strip"><div className="invite-strip-icon"><HeartHandshake size={24}/></div><div><b>Better together, right?</b><p>Invite your person to start saving places in the same wishlist.</p></div><button onClick={() => setShowInvite(true)}>Invite partner <ArrowRight size={16}/></button></section>}
      <section className="collection-section"><div className="collection-heading"><div><div className="eyebrow text-pink">THE LITTLE THINGS WE LOOK FORWARD TO</div><h2>{view === 'want' ? 'Our date wishlist' : view === 'visited' ? 'The places we’ve been' : 'Our favorite spots'} <span>♡</span></h2><p>Saved by both of you. Collected with love.</p></div><div className="search-box"><Search size={18}/><input value={query} onChange={e => setQuery(e.target.value)} placeholder="Find a place..." aria-label="Search saved places"/>{query && <button aria-label="Clear search" onClick={() => setQuery('')}><X size={16}/></button>}</div></div>
      <div className="filter-line"><div className="filter-pills"><button className={cat === 'All' ? 'active' : ''} onClick={() => setCat('All')}>All places</button>{CATEGORIES.map(c => <button key={c.value} className={cat === c.value ? 'active' : ''} onClick={() => setCat(c.value)}>{c.emoji} {c.label}</button>)}</div><div className="result-count">{filtered.length} {filtered.length === 1 ? 'place' : 'places'}</div></div>
      {filtered.length ? <div className="places-grid">{filtered.map(place => <PlaceCard key={place.id} place={place} memberName={memberName(place.saved_by)} onEdit={setModal} onToggleFavorite={doFavorite} onToggleVisited={doVisited} onDelete={doRemove} busy={busy}/>)}</div> : <div className="empty-state"><div className="empty-icon">♡</div><h3>{places.length ? 'Nothing here yet.' : 'A whole world to discover.'}</h3><p>{places.length ? 'Coba kategori lain atau tambahkan tempat baru.' : 'Save the first cute place you want to visit together.'}</p><button className="btn btn-primary" onClick={() => setModal({})}><Plus size={17}/> Add your first place</button></div>}
      </section>
      <section className="footer-note"><div><span>✳</span> Every little date counts.</div><p>Made with ♡ for the places we'll go together.</p></section>
    </main>
    <footer className="site-footer"><Brand/><span>our next adventure is just around the corner ♡</span><button onClick={onSignOut}><LogOut size={15}/> Sign out</button></footer>
    {modal && <FormModal initial={modal} onClose={() => setModal(null)} onSave={doSave} busy={busy}/>} 
    {quickMemory && <MemoryForm initial={quickMemory} places={places} user={user} members={members} isDemo={isDemo} onDriveConnected={onDriveConnected} onPhotosChange={onPhotosChange} onSave={async(fields,existing)=>{const result=await onSaveMemory(fields,existing);setToast('Our memory saved ♡');return result;}} onPartialError={setToast} onClose={()=>setQuickMemory(null)}/>} 
    {showInvite && <div className="modal-backdrop" onMouseDown={e => e.target === e.currentTarget && setShowInvite(false)}><div className="modal invite-modal" role="dialog" aria-modal="true"><div className="modal-top"><div><span className="eyebrow text-pink">JUST US TWO</span><h2>Our little space ♡</h2></div><button className="icon-button" onClick={() => setShowInvite(false)} aria-label="Close"><X size={20}/></button></div><div className="invite-heart">💕</div><p className="muted">Kalian punya satu wishlist bersama. Undang pasangan menggunakan link ini, dan minta dia mendaftar dengan akunnya sendiri.</p><div className="invite-members">{members.map(m => <div key={m.id}><div className="avatar">{m.display_name.charAt(0).toUpperCase()}</div><span>{m.display_name}</span><Check size={14}/></div>)}</div><button className="btn btn-ghost btn-wide" onClick={exportCsv} style={{marginBottom: 16}}><Bookmark size={16}/> Download wishlist backup (CSV)</button>{members.length < 2 ? <><label className="invite-code-label">Invite code</label><div className="copy-field"><code>{pair?.invite_code || 'DEMO-CODE'}</code><button onClick={() => copy(pair?.invite_code || 'DEMO-CODE')}><Copy size={18}/></button></div><button className="btn btn-primary btn-wide" onClick={() => copy(inviteUrl || 'Demo: hubungkan Supabase dahulu')}><Copy size={17}/> Copy invitation link</button><small className="muted">Jaga kerahasiaan kode ini. Undangan berlaku untuk 1 pasangan tambahan.</small></> : <div className="alert alert--success">Wishlist sudah lengkap! Just the two of you ♡</div>}</div></div>}
    <Toast message={toast} close={() => setToast('')}/>
  </div>;
}

function DemoApp() {
  const [places, setPlaces] = useState(defaultDemoPlaces);
  const [memories, setMemories] = useState([]);
  const [toast, setToast] = useState('');
  const add = async fields => {
    const canonical_url = normalizeUrl(fields.url);
    if (places.some(p => normalizeUrl(p.source_url) === canonical_url)) throw new Error('Link ini sudah ada di wishlist.');
    setPlaces(s => [{ id: crypto.randomUUID(), source_url: fields.url, saved_by: 'demo-you', title: fields.title || placeholderTitle(fields.url), category: fields.category, city: fields.city, notes: fields.notes, status: fields.status, is_favorite: false, created_at: new Date().toISOString(), visited_at: fields.status === 'visited' ? new Date().toISOString() : null }, ...s]);
  };
  const edit = async (place, patch) => setPlaces(s => s.map(p => p.id === place.id ? { ...p, ...patch, title: patch.title || p.title } : p));
  const remove = async place => setPlaces(s => s.filter(p => p.id !== place.id));
  const saveMemory = async (fields, existing) => setMemories(current => existing?.id ? current.map(m => m.id === existing.id ? { ...m, ...fields } : m) : [{ ...fields, id: crypto.randomUUID(), created_by: 'demo-you' }, ...current]);
  const deleteMemory = async memory => setMemories(current => current.filter(m => m.id !== memory.id));
  return <><Dashboard user={{ id: 'demo-you' }} profile={{ display_name:'You' }} pair={{ invite_code: 'DEMO-CODE' }} members={[{ id:'demo-you', display_name:'You' },{ id:'demo-him', display_name:'Him' }]} places={places} memories={memories} onSaveMemory={saveMemory} onDeleteMemory={deleteMemory} onAdd={add} onEdit={edit} onRemove={remove} onSignOut={() => setToast('Mode preview: tidak ada akun untuk logout.')} isDemo/><div className="demo-instructions" id="setup-notes"><b>Mode preview</b> — Untuk menyimpan data online bersama pasangan, ikuti langkah di README.md dan isi variabel Supabase.</div><Toast message={toast} close={() => setToast('')}/></>;
}

export default function App() {
  const [session, setSession] = useState(null);
  const [authReady, setAuthReady] = useState(false);
  const [profile, setProfile] = useState(null);
  const [pair, setPair] = useState(null);
  const [members, setMembers] = useState([]);
  const [places, setPlaces] = useState([]);
  const [memories, setMemories] = useState([]);
  const [photos,setPhotos]=useState([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [scopeLoading, setScopeLoading] = useState(false);
  const [pendingUrl, setPendingUrl] = useState(new URLSearchParams(window.location.search).get('save'));
  const savedFromShareRef = useRef(false);
  const uid = session?.user?.id;

  useEffect(() => {
    if (!supabase) return;
    let live = true;
    supabase.auth.getSession().then(({ data }) => { if (live) { setSession(data.session); setAuthReady(true); } }).catch(() => { if(live) setAuthReady(true); });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, next) => {
      if(!live) return;
      if(event === 'SIGNED_OUT') { setProfile(null); setPair(null); setMembers([]); setPlaces([]); setMemories([]); setPhotos([]); }
      setSession(next); setAuthReady(true);
    });
    return () => { live = false; subscription.unsubscribe(); };
  }, []);

  const refreshScope = useCallback(async () => {
    if (!supabase || !uid) return;
    setScopeLoading(true);
    try {
      const { data: p, error: profileErr } = await supabase.from('profiles').select('id, display_name, pair_id, google_drive_email').eq('id', uid).single();
      if (profileErr) throw profileErr;
      setProfile(p);
      if (p.pair_id) {
        const [{ data: pa, error: pairErr }, { data: mem, error: memErr }] = await Promise.all([
          supabase.from('pairs').select('id, invite_code, created_at').eq('id', p.pair_id).single(),
          supabase.from('profiles').select('id, display_name, google_drive_email').eq('pair_id', p.pair_id)
        ]);
        if (pairErr) throw pairErr; if (memErr) throw memErr;
        setPair(pa); setMembers(mem || []);
      } else { setPair(null); setMembers([]); setPlaces([]); setMemories([]); setPhotos([]); }
      setError('');
    } catch (e) { setError(e.message || 'Gagal memuat profil.'); }
    finally { setScopeLoading(false); }
  }, [uid]);
  useEffect(() => { if(uid) refreshScope(); else { setProfile(null); setPair(null); } }, [uid,refreshScope]);

  const loadPlaces = useCallback(async () => {
    if (!pair?.id) return;
    const { data, error } = await supabase.from('places').select('*').eq('pair_id',pair.id).order('created_at',{ ascending: false });
    if (!error) setPlaces(data || []);
    else setNotice('Gagal menyinkronkan wishlist: ' + error.message);
  }, [pair?.id]);
  useEffect(() => {
    if (!pair?.id) return;
    loadPlaces();
    const channel = supabase.channel(`places-${pair.id}`)
      .on('postgres_changes', { event:'*', schema:'public', table:'places', filter:`pair_id=eq.${pair.id}` }, () => loadPlaces())
      .subscribe();
    const t = setInterval(() => { if (document.visibilityState === 'visible') loadPlaces(); }, 45000);
    const onFocus = () => { loadPlaces(); refreshScope(); };
    window.addEventListener('focus', onFocus);
    return () => { clearInterval(t); window.removeEventListener('focus', onFocus); supabase.removeChannel(channel); };
  }, [pair?.id, loadPlaces, refreshScope]);

  const loadMemories = useCallback(async () => {
    if (!pair?.id) return;
    const { data, error } = await supabase.from('memories').select('*').eq('pair_id', pair.id).order('memory_date', {ascending:false});
    if (error) setNotice('Gagal memuat memories. Jalankan migration SQL Date Memories terlebih dahulu: ' + error.message);
    else setMemories(data || []);
  }, [pair?.id]);
  useEffect(() => {
    if (!pair?.id) return;
    loadMemories();
    const ch = supabase.channel('memories-' + pair.id).on('postgres_changes', {event:'*',schema:'public',table:'memories',filter:'pair_id=eq.' + pair.id}, () => loadMemories()).subscribe();
    const onFocus = () => loadMemories();
    window.addEventListener('focus', onFocus);
    return () => {window.removeEventListener('focus', onFocus); supabase.removeChannel(ch);};
  }, [pair?.id, loadMemories]);

  const saveMemory = async (fields, existing) => {
    if (!pair?.id || !uid) throw new Error('Login terlebih dahulu.');
    const query = existing?.id
      ? supabase.from('memories').update(fields).eq('id', existing.id).eq('pair_id', pair.id)
      : supabase.from('memories').insert({...fields, pair_id:pair.id, created_by:uid});
    const { error } = await query;
    if (error) throw error;
    await loadMemories();
  };
  const deleteMemory = async memory => {
    const { error } = await supabase.from('memories').delete().eq('id', memory.id).eq('pair_id', pair.id);
    if (error) throw error;
    await loadMemories();
  };

  const loadPhotos = useCallback(async () => {
    if(!pair?.id)return;
    const {data,error}=await supabase.from('memory_photos').select('*').eq('pair_id',pair.id);
    if(!error)setPhotos(data||[]);else setNotice('Photo sync: '+error.message);
  },[pair?.id]);
  useEffect(()=>{if(pair?.id)loadPhotos();},[pair?.id,loadPhotos]);

  const addPlace = useCallback(async fields => {
    if (!pair || !uid) throw new Error('Wishlist belum siap.');
    const canonical_url = normalizeUrl(fields.url);
    const { data: duplicate, error: checkErr } = await supabase.from('places').select('id').eq('pair_id',pair.id).eq('canonical_url',canonical_url).maybeSingle();
    if (checkErr) throw checkErr;
    if (duplicate) throw new Error('Link ini sudah ada di wishlist kalian ♡');
    const { error: addErr } = await supabase.from('places').insert({
      pair_id: pair.id, saved_by:uid, source_url:fields.url.trim(), canonical_url,
      title:(fields.title || placeholderTitle(fields.url)).slice(0,160), category:fields.category || 'Other',
      city:fields.city || '', notes:fields.notes || '', status:fields.status || 'want',
      cover_url:fields.cover_url||null,latitude:fields.latitude,longitude:fields.longitude,
      visited_at: fields.status === 'visited' ? new Date().toISOString() : null
    });
    if (addErr) { if (addErr.code === '23505') throw new Error('Link ini sudah ada di wishlist kalian ♡'); throw addErr; }
    await loadPlaces();
    // TikTok thumbnails are best-effort; save the place immediately even if preview fails.
    if (!fields.cover_url && /(?:tiktok\.com)/i.test(fields.url)) {
      supabase.functions.invoke('place-preview',{body:{url:fields.url}})
        .then(async ({data,error})=>{
          if(!error && data?.cover_url){
            const {error:coverErr}=await supabase.from('places').update({cover_url:data.cover_url})
              .eq('pair_id',pair.id).eq('canonical_url',canonical_url).is('cover_url',null);
            if(!coverErr) await loadPlaces();
          }
        }).catch(()=>{});
    }
  }, [pair,uid,loadPlaces]);
  const editPlace = async (place, fields) => {
    // Kolom identitas (pair_id, saved_by, URL) tidak dapat diubah melalui frontend.
    const allowed = ['title','category','city','notes','status','is_favorite','visited_at','cover_url','latitude','longitude'];
    const patch = Object.fromEntries(Object.entries(fields).filter(([k]) => allowed.includes(k)));
    if (patch.title !== undefined) patch.title = patch.title || place.title;
    if (fields.status === 'visited' && place.status !== 'visited' && !('visited_at' in patch)) patch.visited_at = new Date().toISOString();
    if (fields.status === 'want' && place.status !== 'want' && !('visited_at' in patch)) patch.visited_at = null;
    const { error } = await supabase.from('places').update(patch).eq('id', place.id).eq('pair_id', pair.id);
    if (error) throw error;
    await loadPlaces();
  };
  const removePlace = async place => {
    const { error } = await supabase.from('places').delete().eq('id', place.id).eq('pair_id',pair.id);
    if (error) throw error;
    await loadPlaces();
  };
  const setupPair = async (mode, code) => {
    setBusy(true); setError('');
    try {
      const { error: rpcErr } = await supabase.rpc(mode === 'create' ? 'create_pair' : 'join_pair', mode === 'join' ? {p_code: code.trim()} : {});
      if (rpcErr) throw rpcErr;
      if (mode === 'join') {
        const params = new URLSearchParams(window.location.search); params.delete('join');
        window.history.replaceState(null,'',`${window.location.pathname}${params.size ? `?${params.toString()}` : ''}`);
      }
      await refreshScope();
    } catch(e) { setError(e.message || 'Gagal membuat wishlist.'); }
    finally { setBusy(false); }
  };
  useEffect(() => {
    if (!pendingUrl || !pair?.id || !uid || savedFromShareRef.current) return;
    savedFromShareRef.current = true;
    (async () => {
      try {
        await addPlace({url:pendingUrl, title:'', category:'Other', city:'', notes:'',status:'want'});
        setNotice('Saved from your Share Sheet ♡');
      } catch(e) { setNotice(e.message || 'Link tidak bisa disimpan.'); }
      finally {
        setPendingUrl(null);
        const params = new URLSearchParams(window.location.search); params.delete('save');
        window.history.replaceState(null,'',`${window.location.pathname}${params.size ? `?${params.toString()}` : ''}`);
      }
    })();
  }, [pendingUrl,pair?.id,uid,addPlace]);

  if (!isConfigured) return <DemoApp/>;
  if (!authReady || (uid && scopeLoading && !profile)) return <Loader/>;
  if (!session) return <AuthScreen pendingUrl={pendingUrl}/>;
  if (error && !profile) return <div className="error-page"><Brand/><div className="alert alert--error">{error}</div><button className="btn btn-primary" onClick={refreshScope}>Try again</button><button className="btn btn-ghost" onClick={() => supabase.auth.signOut()}>Sign out</button></div>;
  if (!profile) return <Loader label="Opening our little space..."/>;
  if (!pair) return <PairSetup onCreated={setupPair} busy={busy} error={error}/>;
  return <><Dashboard user={session.user} profile={profile} pair={pair} members={members} places={places} memories={memories} photos={photos} onPhotosChange={loadPhotos} onDriveConnected={refreshScope} onSaveMemory={saveMemory} onDeleteMemory={deleteMemory} onAdd={addPlace} onEdit={editPlace} onRemove={removePlace} onSignOut={() => supabase.auth.signOut()} onRefresh={loadPlaces} notice={notice}/><Toast message={notice} close={() => setNotice('')}/></>;
}
