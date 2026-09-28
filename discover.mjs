import {readFileSync,writeFileSync} from 'node:fs';
import {parseChannel,parseEditorial,eligibleAds,regionFor} from './catalog.mjs';
const load=(file,fallback)=>{try{return JSON.parse(readFileSync(file,'utf8'))}catch{return fallback}};
const now=Date.now(),state=load('discovery-state.json',{});
if(now-Date.parse(state.checkedAt)<7*86400000){console.log('Source discovery is current.');process.exit(0);}
const aliases={DE:['deutsch','german'],FR:['france','français'],IT:['italia'],NL:['nederland','netherlands'],SE:['sverige','sweden'],ES:['españa','spain'],IN:['india'],TH:['thai'],ID:['indonesia','telkomsel'],PH:['philippines'],VN:['vietnam'],MY:['malaysia'],SG:['singapore'],AU:['australia','telstra','woolworths'],NZ:['newzealand','new zealand'],BR:['brasil','brazil','itaú'],MX:['méxico','mexico'],ZA:['south africa','southafrica'],TR:['türkiye','turkiye'],PL:['polska','poland'],AR:['argentina'],CL:['chile'],TW:['taiwan'],CA:['canada']};
const sources=load('sources.json',[]),known=new Set(sources.map(s=>s.id)),seeds=load('discovery-seeds.json',[]),candidates=[];let added=0;
// Editorial campaigns discover new uploader candidates beyond the fixed seed list.
try{
 const feed=await fetch('https://marcommnews.com/feed/',{signal:AbortSignal.timeout(8000)});
 if(feed.ok){const ads=parseEditorial(await feed.text()).slice(0,8);for(const ad of ads){try{
 const r=await fetch('https://www.youtube.com/oembed?format=json&url='+encodeURIComponent('https://www.youtube.com/watch?v='+ad.id),{signal:AbortSignal.timeout(6000)});if(!r.ok)continue;const info=await r.json();
 if(typeof info.author_url==='string'&&/^https:\/\/(www\.)?youtube\.com\//.test(info.author_url))candidates.push({url:info.author_url,brand:info.author_name||'',exampleVideo:ad.id,evidenceUrl:ad.source,status:'needs-official-and-country-review',discoveryMethod:'editorial-campaign',checkedAt:new Date(now).toISOString()});
 }catch{}}}
}catch{}
for(const seed of seeds){try{
 const home=new URL(seed.officialPage);if(home.protocol!=='https:')continue;
 const r=await fetch(home,{signal:AbortSignal.timeout(8000)});if(!r.ok)throw Error('Website '+r.status);
 const html=(await r.text()).replace(/\\u002F/g,'/').replace(/\\\//g,'/').replace(/&amp;/g,'&');
 const links=[...new Set((html.match(/https?:\/\/(?:www\.)?youtube\.com\/[^\s"'<>\\]+/g)||[]).map(u=>u.split('&#')[0].split('?')[0].replace('http:','https:')).filter(u=>!/(?:watch|embed|shorts|playlist|iframe_api|\/live\/|\/samsung$)/i.test(u)))].slice(0,4);
 for(const url of links){try{
 const channel=await fetch(url,{signal:AbortSignal.timeout(8000)});if(!channel.ok)throw Error('Channel '+channel.status);const page=await channel.text();const id=page.match(/feeds\/videos\.xml\?channel_id=(UC[\w-]{22})/)?.[1],title=page.match(/<title>(.*?)<\/title>/)?.[1]||'';if(!id||known.has(id))continue;
 const candidate={...seed,id,url,title,feedUrl:'https://www.youtube.com/feeds/videos.xml?channel_id='+id,region:regionFor(seed.countryCode),checkedAt:new Date(now).toISOString(),discoveryMethod:'official-website-link',countryBasis:'official-channel-market'};
 const countryMatches=(aliases[seed.countryCode]||[]).some(a=>(title+' '+url).toLowerCase().includes(a));
 if(!countryMatches){candidates.push({...candidate,status:'needs-country-review'});continue;}
 const feed=await fetch(candidate.feedUrl,{signal:AbortSignal.timeout(8000)});if(!feed.ok)throw Error('Feed '+feed.status);const ads=eligibleAds(parseChannel(await feed.text(),candidate));
 if(!ads.length){candidates.push({...candidate,status:'waiting-for-qualified-ad'});continue;}
 if(added>=10||sources.length>=250){candidates.push({...candidate,status:'capacity-review'});continue;}
 sources.push({...candidate,market:seed.countryCode,status:'active'});known.add(id);added++;candidates.push({...candidate,status:'added',eligibleAds:ads.length});
 }catch(e){candidates.push({...seed,url,status:'retry',error:e.message})}}
 }catch(e){candidates.push({...seed,status:'retry',error:e.message})}}
writeFileSync('sources.json',JSON.stringify(sources,null,2)+'\n');writeFileSync('discovery-candidates.json',JSON.stringify(candidates,null,2)+'\n');writeFileSync('discovery-state.json',JSON.stringify({checkedAt:new Date(now).toISOString(),seedCount:seeds.length,added},null,2)+'\n');console.log(JSON.stringify({seeds:seeds.length,added,candidates:candidates.length}));
