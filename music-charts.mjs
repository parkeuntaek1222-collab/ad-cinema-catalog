import {eligible} from './music-core.mjs';
export const CHART_REGIONS=['KR','JP','IN','VN','ID','PH','TH','MY','TW','HK','SG','PK','BD','LK','NP','US','CA','GB','FR','DE','NL','BE','ES','IT','SE','NO','DK','FI','CH','AT','IE','PT','PL','CZ','RO','GR','HU','UA','TR','RU','BR','CO','MX','PR','DO','AR','CL','PE','EC','UY','NG','ZA','KE','GH','TZ','SN','EG','MA','DZ','SA','AE','IL','AU','NZ','JM','PA','RS','KZ','UG','AM','AZ','GE','KH','LA','BA','BG','BY','CY','EE','HR','LI','LT','LU','LV','MD','ME','MK','MT','SI','SK','BO','CR','GT','HN','NI','PY','SV','VE','BH','IQ','JO','KW','LB','OM','QA','YE','LY','TN','ZW','PG'];
export const MAX_REQUESTS=1+CHART_REGIONS.length*2; // Two pages per market, plus supported-region lookup.
export function durationSeconds(value=''){
 const m=value.match(/^PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/);
 return m?Number(m[1]||0)*3600+Number(m[2]||0)*60+Number(m[3]||0):0;
}
export function chartTrack(item,region,now=Date.now()){
 const s=item.snippet||{},d=item.contentDetails||{},st=item.status||{};
 const duration=durationSeconds(d.duration),restriction=d.regionRestriction||{};
 if(s.categoryId!=='10'||s.liveBroadcastContent!=='none'||st.embeddable!==true||st.privacyStatus!=='public'||d.contentRating?.ytRating==='ytAgeRestricted'||duration<90||duration>900)return null;
 if(restriction.blocked?.includes(region)||(restriction.allowed&&!restriction.allowed.includes(region)))return null;
 let artist=s.channelTitle||'',title=s.title;
 const split=title.match(/^(.{1,100}?)\s[-–—]\s(.+)$/);if(split){artist=split[1];title=split[2]}
 title=title.replace(/\s*[\[(](?:official\s*(?:music\s*)?video|music\s*video|MV|video\s*oficial|clipe\s*oficial)[\])]/ig,'').trim();
 const t={id:item.id,artist,title,originalTitle:s.title,countries:[region],chartCountries:[region],countryBasis:'youtube-regional-chart',channelId:s.channelId,publishedAt:s.publishedAt,views:Number(item.statistics?.viewCount),viewsCheckedAt:new Date(now).toISOString(),durationSeconds:duration,embedCheckedAt:new Date(now).toISOString(),source:'https://www.youtube.com/watch?v='+item.id,verification:'api-embeddable-music',discovery:'youtube-mostPopular-music',regionRestriction:restriction};
 return eligible(t,now)?t:null;
}
export async function collectCharts({key,fetcher=fetch,now=Date.now(),regions=CHART_REGIONS}){
 if(!key)throw Error('YOUTUBE_API_KEY is required');
 let requests=0;const results=[],tracks=new Map();
 async function get(resource,params){
  if(requests>=MAX_REQUESTS)throw Error('Request budget exhausted');requests++;
  const url=new URL('https://www.googleapis.com/youtube/v3/'+resource);
  for(const [k,v] of Object.entries({...params,key}))url.searchParams.set(k,String(v));
  let r;try{r=await fetcher(url,{signal:AbortSignal.timeout(15000)})}catch{throw Error('YouTube API connection failed')}
  let data;try{data=await r.json()}catch{throw Error('Invalid YouTube API response')}
  if(!r.ok){const reason=data.error?.errors?.[0]?.reason;throw Error('YouTube API HTTP '+r.status+(typeof reason==='string'&&/^[a-zA-Z]+$/.test(reason)?' '+reason:''))}
  if(!Array.isArray(data.items))throw Error('Invalid YouTube API items');return data;
 }
 const supported=new Set((await get('i18nRegions',{part:'snippet'})).items.map(i=>i.id));
 for(const region of regions){
  if(!supported.has(region)){results.push({region,ok:false,unsupported:true});continue}
  try{
   const found=[];let pageToken,offset=0;
   for(let page=0;page<2;page++){
    const data=await get('videos',{part:'snippet,contentDetails,statistics,status',chart:'mostPopular',regionCode:region,videoCategoryId:'10',maxResults:50,...(pageToken?{pageToken}:{})});
    found.push(...data.items.map((item,index)=>{const track=chartTrack(item,region,now);return track?{...track,regionalChartPositions:{[region]:offset+index+1}}:null}).filter(Boolean));
    offset+=data.items.length;
    pageToken=data.nextPageToken;if(!pageToken)break;
   }
   for(const t of found){const old=tracks.get(t.id);if(old){old.countries=[...new Set([...old.countries,region])];old.chartCountries=[...old.countries];old.regionalChartPositions[region]=Math.min(old.regionalChartPositions[region]||Infinity,t.regionalChartPositions[region])}else tracks.set(t.id,t)}
   results.push({region,ok:true,qualified:found.length});
  }catch(e){
   results.push({region,ok:false,error:e.message});
   if(/HTTP (400|401|403|429)|budget/.test(e.message)&&!/videoChartNotFound/.test(e.message))throw Error(e.message);
  }
 }
 const available=results.filter(r=>!r.unsupported),healthy=available.filter(r=>r.ok).length;
 if(!available.length||healthy<Math.ceil(available.length*.75))throw Error('Too few regional charts responded; preserving last catalog');
 if(!tracks.size)throw Error('No qualifying regional music videos; preserving last catalog');
 return {tracks:[...tracks.values()],regions:results,requests,healthy};
}
