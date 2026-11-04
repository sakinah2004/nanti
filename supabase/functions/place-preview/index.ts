import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.49.0";

const json = (body: unknown, status=200, origin='') => new Response(JSON.stringify(body), {
  status, headers: {"Content-Type":"application/json","Access-Control-Allow-Origin":origin,
    "Access-Control-Allow-Headers":"authorization,apikey,content-type", "Vary":"Origin"}
});
Deno.serve(async request => {
  const origin = request.headers.get('origin') || '';
  const allowed = /^https:\/\/(?:[a-z0-9-]+\.)?nanti\.pages\.dev$/.test(origin) || /^http:\/\/localhost:\d+$/.test(origin);
  if (request.method === 'OPTIONS') return new Response(null,{status:204,headers:{
    'Access-Control-Allow-Origin': allowed?origin:'','Access-Control-Allow-Headers':'authorization,apikey,content-type',
    'Access-Control-Allow-Methods':'POST,OPTIONS','Vary':'Origin'
  }});
  if (request.method !== 'POST' || !allowed) return json({error:'Not allowed'},403,allowed?origin:'');
  try {
    const auth = request.headers.get('Authorization') || '';
    if (!auth.startsWith('Bearer ')) return json({error:'Unauthorized'},401,origin);
    const supabase = createClient(Deno.env.get('SUPABASE_URL')!,Deno.env.get('SUPABASE_ANON_KEY')!,{global:{headers:{Authorization:auth}}});
    const {data:{user},error} = await supabase.auth.getUser(auth.slice(7));
    if(error || !user) return json({error:'Unauthorized'},401,origin);
    const {url} = await request.json();
    if(typeof url!=='string'||url.length>2048) return json({error:'Invalid URL'},400,origin);
    const parsed=new URL(url);
    if(parsed.protocol!=='https:') return json({error:'Only HTTPS URLs'},400,origin);
    const domain=parsed.hostname.toLowerCase();
    let endpoint: string|undefined;
    if(['www.tiktok.com','tiktok.com','m.tiktok.com','vm.tiktok.com','vt.tiktok.com'].includes(domain)) {
      endpoint='https://www.tiktok.com/oembed?url='+encodeURIComponent(url);
    } else if(['www.instagram.com','instagram.com'].includes(domain) && /^\/(p|reel|reels)\//.test(parsed.pathname)) {
      // Instagram oEmbed generally requires Meta app authorization; don't scrape/rehost private posts.
      return json({cover_url:null,reason:'Instagram requires an authorized preview source. You can add a cover manually.'},200,origin);
    } else return json({cover_url:null,reason:'No supported video thumbnail source.'},200,origin);
    const response=await fetch(endpoint,{signal:AbortSignal.timeout(6000)});
    if(!response.ok) return json({cover_url:null,reason:'Preview unavailable'},200,origin);
    const obj=await response.json();
    const image=typeof obj.thumbnail_url==='string'?obj.thumbnail_url:null;
    if(!image || !image.startsWith('https://')) return json({cover_url:null,reason:'No thumbnail returned'},200,origin);
    return json({cover_url:image,title:typeof obj.title==='string'?obj.title.slice(0,160):null,source:'TikTok oEmbed'},200,origin);
  } catch {return json({cover_url:null,reason:'Preview unavailable'},200,origin);}
});