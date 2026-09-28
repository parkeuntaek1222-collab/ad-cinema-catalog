import {readFileSync,writeFileSync} from 'node:fs';
import {parseFeed,eligible,MAX_AGE_DAYS,MIN_VIEWS} from './music-core.mjs';
const sources=JSON.parse(readFileSync('music-sources.json','utf8'));let previous={tracks:[]};try{previous=JSON.parse(readFileSync('music-catalog.json','utf8'))}catch{}
const now=Date.now(),results=[];let cursor=0;
await Promise.all(Array.from({length:5},async()=>{while(cursor<sources.length){const s=sources[cursor++];try{const r=await fetch(s.feedUrl,{signal:AbortSignal.timeout(15000)});if(!r.ok)throw Error('HTTP '+r.status);const xml=await r.text();if(!xml.includes('<feed'))throw Error('Invalid feed');const tracks=parseFeed(xml,s,now);results.push({channel:s.id,ok:true,tracks});}catch(e){results.push({channel:s.id,ok:false,error:e.message,tracks:[]})}}}));
const healthy=results.filter(r=>r.ok).length;if(healthy<Math.ceil(sources.length*.5))throw Error('Less than half of sources responded; preserving last catalog');
const map=new Map(previous.tracks.filter(t=>eligible(t,now)).map(t=>[t.id,t]));for(const t of results.flatMap(r=>r.tracks))map.set(t.id,t);
// Public channel feeds remain available on hosted runners. Watch-page/oEmbed
// responses from cloud IPs may be restricted, so they are not a publish gate.
// Preserve reviewed lengths when known; new entries get conservative title
// checks and are skipped by the actual player if embedding is unavailable.
const reviewed=new Map(previous.tracks.map(t=>[t.id,t]));
const tracks=[...map.values()].map(t=>{const old=reviewed.get(t.id);return {...t,...(old?.durationSeconds?{durationSeconds:old.durationSeconds,embedCheckedAt:old.embedCheckedAt}:{}),verification:old?.durationSeconds?'previously-reviewed':'official-feed-title'};}).filter(t=>!t.durationSeconds||(t.durationSeconds>=90&&t.durationSeconds<=900));
if(!tracks.length)throw Error('No qualifying music videos; preserving last catalog');
tracks.sort((a,b)=>b.views-a.views);const seenTitles=new Set();for(let i=0;i<tracks.length;){const key=tracks[i].originalTitle.toLowerCase().replace(/[^\p{L}\p{N}]/gu,'');if(seenTitles.has(key))tracks.splice(i,1);else{seenTitles.add(key);i++}}tracks.sort((a,b)=>Date.parse(b.publishedAt)-Date.parse(a.publishedAt));
const catalog={schemaVersion:1,generatedAt:new Date(now).toISOString(),policy:{maxAgeDays:MAX_AGE_DAYS,minViews:MIN_VIEWS,refreshHours:6,selection:'Recent official music videos with observed views; not a chart ranking',countryBasis:'Curated channel home market, not audience location or chart country'},tracks};
writeFileSync('music-catalog.json',JSON.stringify(catalog,null,2)+'\n');writeFileSync('music-status.json',JSON.stringify({checkedAt:catalog.generatedAt,sources:sources.length,healthy,tracks:tracks.length,countries:[...new Set(tracks.flatMap(t=>t.countries))].sort(),channels:results.map(({tracks,...r})=>({...r,qualified:tracks.length}))},null,2)+'\n');console.log(JSON.stringify({sources:sources.length,healthy,tracks:tracks.length,countries:catalog.tracks.reduce((m,t)=>(m[t.countries[0]]=(m[t.countries[0]]||0)+1,m),{})}));
