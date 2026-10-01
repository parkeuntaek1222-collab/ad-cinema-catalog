import {collectChina} from './music-china.mjs';
import {enrichGenres,GENRES} from './music-genres.mjs';
import {collectCharts} from './music-charts.mjs';
import {readFileSync,writeFileSync} from 'node:fs';
import {parseFeed,eligible,MAX_AGE_DAYS,MIN_VIEWS} from './music-core.mjs';
const sources=JSON.parse(readFileSync('music-sources.json','utf8'));let previous={tracks:[]};try{previous=JSON.parse(readFileSync('music-catalog.json','utf8'))}catch{}
const now=Date.now(),results=[];let cursor=0;
const chart=await collectCharts({key:process.env.YOUTUBE_API_KEY,now});
const china=await collectChina({key:process.env.YOUTUBE_API_KEY,now});
await Promise.all(Array.from({length:5},async()=>{while(cursor<sources.length){const s=sources[cursor++];try{const r=await fetch(s.feedUrl,{signal:AbortSignal.timeout(15000)});if(!r.ok)throw Error('HTTP '+r.status);const xml=await r.text();if(!xml.includes('<feed'))throw Error('Invalid feed');const tracks=parseFeed(xml,s,now);results.push({channel:s.id,ok:true,tracks});}catch(e){results.push({channel:s.id,ok:false,error:e.message,tracks:[]})}}}));
const healthy=results.filter(r=>r.ok).length;// Channel feeds are supplemental; regional API success is the publish gate.
const map=new Map(previous.tracks.filter(t=>!['youtube-regional-chart','external-music-chart'].includes(t.countryBasis)&&eligible(t,now)).map(t=>[t.id,t]));for(const t of results.flatMap(r=>r.tracks))map.set(t.id,t);
for(const t of chart.tracks)map.set(t.id,t);
for(const t of china.tracks){const old=map.get(t.id);map.set(t.id,{...old,...t,countries:[...new Set([...t.countries,...(old?.countries||[])])],...(old?.chartCountries?{chartCountries:old.chartCountries}:{})})}
// Public channel feeds remain available on hosted runners. Watch-page/oEmbed
// responses from cloud IPs may be restricted, so they are not a publish gate.
// Preserve reviewed lengths when known; new entries get conservative title
// checks and are skipped by the actual player if embedding is unavailable.
const reviewed=new Map(previous.tracks.map(t=>[t.id,t]));
const tracks=[...map.values()].map(t=>{const old=reviewed.get(t.id);if(['youtube-regional-chart','external-music-chart'].includes(t.countryBasis))return t;return {...t,...(old?.durationSeconds?{durationSeconds:old.durationSeconds,embedCheckedAt:old.embedCheckedAt}:{}),verification:old?.durationSeconds?'previously-reviewed':'official-feed-title'};}).filter(t=>!t.durationSeconds||(t.durationSeconds>=90&&t.durationSeconds<=900));
if(!tracks.length)throw Error('No qualifying music videos; preserving last catalog');
tracks.sort((a,b)=>b.views-a.views);const seenTitles=new Set();for(let i=0;i<tracks.length;){const key=tracks[i].originalTitle.toLowerCase().replace(/[^\p{L}\p{N}]/gu,'');if(seenTitles.has(key))tracks.splice(i,1);else{seenTitles.add(key);i++}}tracks.sort((a,b)=>Date.parse(b.publishedAt)-Date.parse(a.publishedAt));
const genre=await enrichGenres({tracks,key:process.env.YOUTUBE_API_KEY,now});
const catalog={schemaVersion:1,generatedAt:new Date(now).toISOString(),genreDefinitions:GENRES,policy:{maxAgeDays:MAX_AGE_DAYS,minViews:MIN_VIEWS,refreshHours:6,selection:'Regional YouTube mostPopular music candidates, Tencent UNI Chart matches on reviewed channels, plus recent channel feeds; title-based music-video filtering, not a verified official song chart',countryBasis:'Per-track countryBasis distinguishes regional chart appearances from curated channel home markets',genreBasis:'Estimated video genres from YouTube music topics and explicit uploader genre tags; unknown genres remain unclassified'},tracks:genre.tracks};
writeFileSync('music-catalog.json',JSON.stringify(catalog,null,2)+'\n');writeFileSync('music-status.json',JSON.stringify({checkedAt:catalog.generatedAt,sources:sources.length,healthy,chartRequests:chart.requests,chartRegions:chart.regions,chartTracks:chart.tracks.length,china:china.status,genres:genre.status,tracks:tracks.length,countries:[...new Set(tracks.flatMap(t=>t.countries))].sort(),channels:results.map(({tracks,...r})=>({...r,qualified:tracks.length}))},null,2)+'\n');console.log(JSON.stringify({sources:sources.length,healthy,chartRequests:chart.requests,chartRegions:chart.regions,chartTracks:chart.tracks.length,china:china.status,genres:genre.status,tracks:tracks.length,countries:catalog.tracks.reduce((m,t)=>(m[t.countries[0]]=(m[t.countries[0]]||0)+1,m),{})}));
