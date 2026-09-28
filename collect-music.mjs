import {readFileSync,writeFileSync} from 'node:fs';
import {parseFeed,eligible,MAX_AGE_DAYS,MIN_VIEWS} from './music-core.mjs';
const sources=JSON.parse(readFileSync('music-sources.json','utf8'));let previous={tracks:[]};try{previous=JSON.parse(readFileSync('music-catalog.json','utf8'))}catch{}
const now=Date.now(),results=[];let cursor=0;
await Promise.all(Array.from({length:5},async()=>{while(cursor<sources.length){const s=sources[cursor++];try{const r=await fetch(s.feedUrl,{signal:AbortSignal.timeout(15000)});if(!r.ok)throw Error('HTTP '+r.status);const xml=await r.text();if(!xml.includes('<feed'))throw Error('Invalid feed');const tracks=parseFeed(xml,s,now);results.push({channel:s.id,ok:true,tracks});}catch(e){results.push({channel:s.id,ok:false,error:e.message,tracks:[]})}}}));
const healthy=results.filter(r=>r.ok).length;if(healthy<Math.ceil(sources.length*.5))throw Error('Less than half of sources responded; preserving last catalog');
const map=new Map(previous.tracks.filter(t=>eligible(t,now)).map(t=>[t.id,t]));for(const t of results.flatMap(r=>r.tracks))map.set(t.id,t);
const candidates=[...map.values()];let n=0;const tracks=[];
await Promise.all(Array.from({length:4},async()=>{while(n<candidates.length){const t=candidates[n++];try{const r=await fetch('https://www.youtube.com/oembed?url='+encodeURIComponent(t.source)+'&format=json',{signal:AbortSignal.timeout(12000)});if(!r.ok){if([401,403,404].includes(r.status))continue;throw Error('Temporary oEmbed error')}const data=await r.json();if(data.type!=='video')continue;
 const page=await fetch(t.source,{signal:AbortSignal.timeout(15000)});if(!page.ok)throw Error('Metadata unavailable');
 const html=await page.text();const match=html.match(/(?:var\s+)?ytInitialPlayerResponse\s*=\s*(\{.*?\});/s);const video=JSON.parse(match?.[1]||'{}');
 const seconds=Number(video.videoDetails?.lengthSeconds);
 if(video.videoDetails?.videoId!==t.id||!Number.isFinite(seconds))throw Error('Missing duration');
 if(seconds<90||seconds>900||video.videoDetails?.isLiveContent||video.playabilityStatus?.playableInEmbed===false)continue;
 tracks.push({...t,durationSeconds:seconds,embedCheckedAt:new Date(now).toISOString()})}catch{if(t.durationSeconds>=90&&t.durationSeconds<=900&&now-Date.parse(t.embedCheckedAt)<72*3600000)tracks.push(t)}}}));
if(!tracks.length)throw Error('No qualifying music videos; preserving last catalog');
tracks.sort((a,b)=>b.views-a.views);const seenTitles=new Set();for(let i=0;i<tracks.length;){const key=tracks[i].originalTitle.toLowerCase().replace(/[^\p{L}\p{N}]/gu,'');if(seenTitles.has(key))tracks.splice(i,1);else{seenTitles.add(key);i++}}tracks.sort((a,b)=>Date.parse(b.publishedAt)-Date.parse(a.publishedAt));
const catalog={schemaVersion:1,generatedAt:new Date(now).toISOString(),policy:{maxAgeDays:MAX_AGE_DAYS,minViews:MIN_VIEWS,refreshHours:6,selection:'Recent official music videos with observed views; not a chart ranking',countryBasis:'Curated channel home market, not audience location or chart country'},tracks};
writeFileSync('music-catalog.json',JSON.stringify(catalog,null,2)+'\n');writeFileSync('music-status.json',JSON.stringify({checkedAt:catalog.generatedAt,sources:sources.length,healthy,tracks:tracks.length,countries:[...new Set(tracks.flatMap(t=>t.countries))].sort(),channels:results.map(({tracks,...r})=>({...r,qualified:tracks.length}))},null,2)+'\n');console.log(JSON.stringify({sources:sources.length,healthy,tracks:tracks.length,countries:catalog.tracks.reduce((m,t)=>(m[t.countries[0]]=(m[t.countries[0]]||0)+1,m),{})}));
