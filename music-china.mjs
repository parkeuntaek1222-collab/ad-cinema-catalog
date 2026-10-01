import {musicVideo,eligible} from './music-core.mjs';
import {durationSeconds} from './music-charts.mjs';
export const CHINA_CHART_URL='https://chart.tencentmusic.com/uni-chart';
export const CHINA_DATA_URL='https://chart.tencentmusic.com/unichartsapi/pc/yobang/dynamic?offset=0&limit=100&platform=pc';
// Reviewed label/studio channels; no arbitrary search results or reuploads.
export const CHINA_CHANNELS=[
 {id:'UCNqme3lzOGH_WN7Ny1UHZnQ',name:'HeXiMusic'},
 {id:'UCVt-XiA7Cu-d-Gs5Xtr_yig',name:'Tencent Music Distribution'},
 {id:'UCciv4gN3Jm1M8bUsaBs-a_w',name:'ZhouShen Official'},
 {id:'UCB8BLSp4Qeogxxtz3eDBajw',name:'XiaoZhan Studio'}
];
export const CHINA_MAX_REQUESTS=1+CHINA_CHANNELS.length*2;
const norm=s=>String(s||'').normalize('NFKC').toLowerCase().replace(/[^\p{L}\p{N}]/gu,'');
export function chinaChartSongs(data){
 const c=data?.data?.content;
 if(String(data?.code)!=='0'||!Array.isArray(c?.chartsList)||!/^\d{6}$/.test(c.issue||''))throw Error('Invalid Tencent chart response');
 const songs=c.chartsList.filter(s=>typeof s.songName==='string'&&typeof s.singerName==='string'&&Number.isInteger(s.rank)&&s.rank>=1&&s.rank<=100);
 if(!songs.length)throw Error('Empty Tencent chart response');
 return {songs,issue:c.issue,updatedAt:c.updateTime};
}
export function chinaTrack(item,chart,now=Date.now()){
 const s=item.snippet||{},d=item.contentDetails||{},st=item.status||{};
 if(!CHINA_CHANNELS.some(c=>c.id===s.channelId))return null;
 const raw=s.title||'';
 // Hashtag metadata is allowed only on these reviewed channels after song/artist matching.
 const title=raw.replace(/#[\p{L}\p{N}_]+/gu,'').trim();
 if(/vlog|幕后|幕後|花絮|预告|預告|明日|片段|歌词|歌詞|動態|动态|拍摄|拍攝|舞蹈|练习|練習/iu.test(title)||!musicVideo(title))return null;
 const candidates=chart.songs.filter(song=>norm(title).includes(norm(song.songName))&&song.singerName.split(/[,，、/&]/).some(artist=>norm(title).includes(norm(artist.trim()))));
 // Ambiguous title matches must be reviewed, never guessed.
 const songs=[...new Map(candidates.map(song=>[norm(song.singerName)+'|'+norm(song.songName),song])).values()];
 if(songs.length!==1)return null;
 const song=songs[0],duration=durationSeconds(d.duration);
 if(s.categoryId!=='10'||s.liveBroadcastContent!=='none'||st.embeddable!==true||st.privacyStatus!=='public'||d.contentRating?.ytRating==='ytAgeRestricted'||duration<90||duration>900)return null;
 const t={id:item.id,artist:song.singerName,title:song.songName,originalTitle:title,youtubeTitle:raw,countries:['CN'],countryBasis:'external-music-chart',channelId:s.channelId,publishedAt:s.publishedAt,views:Number(item.statistics?.viewCount),viewsCheckedAt:new Date(now).toISOString(),durationSeconds:duration,embedCheckedAt:new Date(now).toISOString(),source:'https://www.youtube.com/watch?v='+item.id,verification:'reviewed-channel-api-embeddable-chart-match',discovery:'tencent-uni-chart',externalCharts:[{market:'CN',name:'Tencent Music UNI Chart',url:CHINA_CHART_URL,issue:chart.issue,rank:song.rank,checkedAt:new Date(now).toISOString()}],regionRestriction:d.regionRestriction||{}};
 return eligible(t,now)?t:null;
}
export async function collectChina({key,fetcher=fetch,now=Date.now()}){
 let requests=0;
 async function read(url,label){
  let r;try{r=await fetcher(url,{signal:AbortSignal.timeout(15000)})}catch{throw Error(label+' connection failed')}
  let data;try{data=await r.json()}catch{throw Error('Invalid '+label+' response')}
  if(!r.ok){const reason=data.error?.errors?.[0]?.reason;throw Error(label+' HTTP '+r.status+(typeof reason==='string'&&/^[a-zA-Z]+$/.test(reason)?' '+reason:''))}return data;
 }
 async function api(resource,params){
  if(requests>=CHINA_MAX_REQUESTS)throw Error('China request budget exhausted');requests++;
  const url=new URL('https://www.googleapis.com/youtube/v3/'+resource);
  for(const [k,v] of Object.entries({...params,key}))url.searchParams.set(k,String(v));
  const data=await read(url,'YouTube API');if(!Array.isArray(data.items))throw Error('Invalid YouTube API items');return data;
 }
 try{
  if(!key)throw Error('YOUTUBE_API_KEY is required');
  const chart=chinaChartSongs(await read(CHINA_DATA_URL,'Tencent chart'));
  const channels=await api('channels',{part:'contentDetails',id:CHINA_CHANNELS.map(c=>c.id).join(',')});
  const ids=new Set();let checkedChannels=0;
  for(const channel of channels.items){
   if(!CHINA_CHANNELS.some(c=>c.id===channel.id))continue;
   const playlistId=channel.contentDetails?.relatedPlaylists?.uploads;if(!playlistId)continue;
   const page=await api('playlistItems',{part:'contentDetails',playlistId,maxResults:50});checkedChannels++;
   for(const i of page.items)if(/^[\w-]{11}$/.test(i.contentDetails?.videoId||''))ids.add(i.contentDetails.videoId);
  }
  const tracks=[],all=[...ids];
  for(let i=0;i<all.length;i+=50){const page=await api('videos',{part:'snippet,contentDetails,statistics,status',id:all.slice(i,i+50).join(',')});tracks.push(...page.items.map(item=>chinaTrack(item,chart,now)).filter(Boolean))}
  return {tracks,status:{ok:true,source:CHINA_CHART_URL,issue:chart.issue,chartSongs:chart.songs.length,checkedChannels,requests,qualified:tracks.length,checkedAt:new Date(now).toISOString()}};
 }catch(e){
  // Quota/auth failures stop the whole publish; other China source failures remain isolated.
  if(/YouTube API HTTP (400|401|403|429)|budget/.test(e.message))throw e;
  return {tracks:[],status:{ok:false,error:e.message,requests,checkedAt:new Date(now).toISOString()}};
 }
}
