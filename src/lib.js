import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
export const isConfigured = !!(url && key && !url.includes('YOUR_PROJECT') && !key.includes('YOUR_'));
export const supabase = isConfigured ? createClient(url, key, {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
}) : null;

export const CATEGORIES = [
  { value: 'Cafe', label: 'Café', emoji: '☕', gradient: 'rose' },
  { value: 'Restaurant', label: 'Dinner', emoji: '🍝', gradient: 'peach' },
  { value: 'Activity', label: 'Activities', emoji: '🎨', gradient: 'lavender' },
  { value: 'Nature', label: 'Outdoor', emoji: '🌿', gradient: 'sage' },
  { value: 'Other', label: 'Others', emoji: '✨', gradient: 'butter' }
];

export function normalizeUrl(input) {
  const raw = String(input || '').trim();
  let parsed;
  try { parsed = new URL(raw); } catch { throw new Error('Masukkan link lengkap yang dimulai dengan https://'); }
  if (!['http:', 'https:'].includes(parsed.protocol)) throw new Error('Hanya link http/https yang didukung.');
  if (!parsed.hostname || parsed.username || parsed.password) throw new Error('Link tidak valid.');
  parsed.hash = '';
  parsed.hostname = parsed.hostname.toLowerCase();
  // Parameter tracking tidak memengaruhi identitas postingan.
  [...parsed.searchParams.keys()].forEach(p => {
    if (/^(utm_.*|igsh|igshid|fbclid|gclid|si|ref|ref_src|feature|share_id|share_url)$/i.test(p)) parsed.searchParams.delete(p);
  });
  if (parsed.pathname.length > 1) parsed.pathname = parsed.pathname.replace(/\/+$/, '');
  return parsed.toString();
}

export function getSource(url) {
  try {
    const host = new URL(url).hostname.replace(/^www\./, '');
    if (host.includes('instagram.com')) return 'Instagram';
    if (host.includes('threads.net') || host.includes('threads.com')) return 'Threads';
    if (host.includes('tiktok.com')) return 'TikTok';
    if (host.includes('maps.google') || host.includes('google.com')) return 'Google Maps';
    return host;
  } catch { return 'Link'; }
}
export function placeholderTitle(url) {
  const source = getSource(url);
  return source === 'Link' ? 'New date idea' : `${source} find`;
}
export function localDate(value) {
  if (!value) return '';
  return new Date(value).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
}
