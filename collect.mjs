import {readFileSync,writeFileSync,existsSync} from 'node:fs';
import {parseChannel,eligibleAds,regionFor} from './catalog.mjs';
export function addGrowth(ad,previous,now=Date.now()){
 const before=previous?.views,elapsed=now-Date.parse(previous?.viewsCheckedAt);
 if(!Number.isSafeInteger(before)||!Number.isSafeInteger(ad.views)||elapsed<3*3600000||elapsed>48*3600000||ad.views<before)return {...ad,viewGain:null,viewsPerHour:null,growthWindowHours:null};
 return {...ad,viewGain:ad.views-before,viewsPerHour:Math.round((ad.views-before)/(elapsed/3600000)),growthWindowHours:Math.round(elapsed/36000)/100};
}
export async function collect(){
 const sources=JSON.parse(readFileSync('sources.json','utf8')).filter(s=>s.status!=='disabled');
 let previous={ads:[]};try{previous=JSON.parse(readFileSync('catalog.json','utf8'))}catch{}
 const previousById=new Map(previous.ads.map(a=>[a.id,a])),now=Date.now(),results=[];let cursor=0;
 await Promise.all(Array.from({length:5},async()=>{while(cursor<sources.length){const source=sources[cursor++];try{
 const r=await fetch(source.feedUrl,{signal:AbortSignal.timeout(12000)});if(!r.ok)throw Error('HTTP '+r.status);const xml=await r.text();if(!xml.includes('<feed'))throw Error('Invalid feed');
 const ads=parseChannel(xml,{...source,region:regionFor(source.countryCode)},now).map(a=>addGrowth(a,previousById.get(a.id),now));results.push({id:source.id,ok:true,ads});
 }catch(e){results.push({id:source.id,ok:false,error:e.message,ads:previous.ads.filter(a=>a.channelId===source.id)})}}}));
 if(!results.some(r=>r.ok))throw Error('All sources failed. Preserve last published catalog.');
 const ads=eligibleAds(results.flatMap(r=>r.ads),now),catalog={schemaVersion:1,generatedAt:new Date(now).toISOString(),policy:{maxAgeDays:30,minViews:1000,maxViewAgeHours:72},ads};
 writeFileSync('catalog.json',JSON.stringify(catalog,null,2)+'\n');
 writeFileSync('collection-status.json',JSON.stringify({checkedAt:catalog.generatedAt,sources:sources.length,healthy:results.filter(r=>r.ok).length,ads:ads.length,countries:[...new Set(ads.map(a=>a.countryCode).filter(Boolean))].sort(),channels:results.map(({ads,...r})=>({...r,eligible:eligibleAds(ads,now).length}))},null,2)+'\n');
 console.log(JSON.stringify({sources:sources.length,healthy:results.filter(r=>r.ok).length,ads:ads.length}));
}
if(process.argv[1]?.endsWith('/collect.mjs'))await collect();
