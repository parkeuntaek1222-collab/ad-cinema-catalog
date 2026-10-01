import test from 'node:test';
import assert from 'node:assert/strict';
import {chartTrack,collectCharts,MAX_REQUESTS,CHART_REGIONS} from './music-charts.mjs';
import {trendingEligible} from './music-core.mjs';
const now=Date.parse('2026-09-29T00:00:00Z');
function item(){return {id:'abcdefghijk',snippet:{title:'Artist - Song (Official Video)',channelTitle:'Artist',channelId:'channel',categoryId:'10',liveBroadcastContent:'none',publishedAt:'2026-09-28T00:00:00Z'},contentDetails:{duration:'PT3M20S'},status:{embeddable:true,privacyStatus:'public'},statistics:{viewCount:'20000'}}}
test('validates video and preserves regional provenance',()=>{
 assert.equal(chartTrack(item(),'KR',now).countryBasis,'youtube-regional-chart');
 for(const mutate of [i=>i.status.embeddable=false,i=>i.contentDetails.duration='PT30S',i=>i.snippet.categoryId='24',i=>i.contentDetails.regionRestriction={blocked:['KR']},i=>i.contentDetails.regionRestriction={allowed:['JP']},i=>i.snippet.liveBroadcastContent='live']){const i=item();mutate(i);assert.equal(chartTrack(i,'KR',now),null)}
});
test('merges duplicates across countries',async()=>{
 const fetcher=async url=>({ok:true,json:async()=>({items:url.pathname.endsWith('i18nRegions')?[{id:'KR'},{id:'JP'}]:[item()]})});
 const r=await collectCharts({key:'test',regions:['KR','JP','XX'],fetcher,now});
 assert.equal(r.tracks.length,1);assert.deepEqual(r.tracks[0].chartCountries,['KR','JP']);assert.equal(r.requests,3);assert(r.requests<=MAX_REQUESTS);assert(r.regions[2].unsupported);
 assert.deepEqual(r.tracks[0].regionalChartPositions,{KR:1,JP:1});
});
test('records raw list positions before filtering and across pages',async()=>{
 const fetcher=async url=>{const u=new URL(url);if(u.pathname.endsWith('i18nRegions'))return {ok:true,json:async()=>({items:[{id:'KR'},{id:'JP'}]})};const rejected=item();rejected.status.embeddable=false;const first=item();first.id='firsttrack1';const second=item();second.id='secondtrak1';return {ok:true,json:async()=>u.searchParams.get('regionCode')==='JP'?{items:[second]}:u.searchParams.has('pageToken')?{items:[rejected,second]}:{items:[rejected,first],nextPageToken:'second'}};};
 const r=await collectCharts({key:'test',regions:['KR','JP'],fetcher,now});
 assert.equal(r.tracks.find(t=>t.id==='firsttrack1').regionalChartPositions.KR,2);assert.deepEqual(r.tracks.find(t=>t.id==='secondtrak1').regionalChartPositions,{KR:4,JP:1});
});
test('stops on quota failure without exposing credentials',async()=>{
 const fetcher=async()=>({ok:false,status:403,json:async()=>({error:{message:'secret-key',errors:[{reason:'quotaExceeded'}]}})});
 await assert.rejects(collectCharts({key:'secret-key',fetcher,now}),e=>e.message==='YouTube API HTTP 403 quotaExceeded');
});
test('preserves prior catalog on empty results',async()=>{
 const fetcher=async url=>({ok:true,json:async()=>({items:url.pathname.endsWith('i18nRegions')?[{id:'KR'}]:[]})});
 await assert.rejects(collectCharts({key:'test',regions:['KR'],fetcher,now}),/No qualifying/);
});

test('all configured markets fit the two-page request budget',async()=>{
 assert.equal(new Set(CHART_REGIONS).size,110);assert.equal(CHART_REGIONS.length,110);assert(!CHART_REGIONS.includes('IS'));assert(['AM','LA','EE','BO','YE','ZW','PG'].every(code=>CHART_REGIONS.includes(code))); 
 const fetcher=async url=>({ok:true,json:async()=>url.pathname.endsWith('i18nRegions')?{items:CHART_REGIONS.map(id=>({id}))}:{items:[item()],...(url.searchParams.has('pageToken')?{}:{nextPageToken:'second'})}});
 const r=await collectCharts({key:'test',fetcher,now});
 assert.equal(r.requests,MAX_REQUESTS);
 assert.equal(r.healthy,CHART_REGIONS.length);
 assert.deepEqual(r.tracks[0].chartCountries,CHART_REGIONS);
});

import {chinaTrack,chinaChartSongs,collectChina,CHINA_CHANNELS,CHINA_MAX_REQUESTS} from './music-china.mjs';
const cnChart={songs:[{songName:'贰拾肆',singerName:'梓渝',rank:7}],issue:'202639'};
function cnItem(){const i=item();i.snippet.channelId=CHINA_CHANNELS[0].id;i.snippet.title='梓渝#ziyu | 主打曲《贰拾肆》MV正式上线！';return i}
test('China matches a reviewed official MV and preserves raw title/chart provenance',()=>{
 const i=cnItem(),t=chinaTrack(i,cnChart,now);
 assert(t);assert.equal(t.title,'贰拾肆');assert.deepEqual(t.countries,['CN']);assert.equal(t.youtubeTitle,i.snippet.title);assert.equal(t.externalCharts[0].rank,7);assert(!t.originalTitle.includes('#'));assert.equal(t.countryBasis,'external-music-chart');
 for(const mutate of [i=>i.snippet.channelId='unknown',i=>i.snippet.title+='拍摄vlog',i=>i.status.embeddable=false,i=>i.contentDetails.duration='PT40S',i=>i.snippet.title='梓渝《另一首歌》MV',i=>i.snippet.title+='预告片']){const j=cnItem();mutate(j);assert.equal(chinaTrack(j,cnChart,now),null)}
 assert.equal(chinaTrack(cnItem(),{...cnChart,songs:[...cnChart.songs,{songName:'拾肆',singerName:'梓渝',rank:8}]},now),null);
});
test('China source failure is isolated but quota failure is sanitized and stops publishing',async()=>{
 const offline=await collectChina({key:'secret-key',fetcher:async()=>{throw Error('secret-key')},now});assert.equal(offline.status.ok,false);assert.equal(offline.status.error,'Tencent chart connection failed');assert.deepEqual(offline.tracks,[]);
 const quota=async url=>String(url).includes('tencentmusic')?{ok:true,json:async()=>({code:'0',data:{content:{chartsList:cnChart.songs,issue:'202639'}}})}:{ok:false,status:403,json:async()=>({error:{message:'secret-key',errors:[{reason:'quotaExceeded'}]}})};
 await assert.rejects(collectChina({key:'secret-key',fetcher:quota,now}),e=>e.message==='YouTube API HTTP 403 quotaExceeded');
 assert.throws(()=>chinaChartSongs({code:'0',data:{content:{chartsList:[],issue:'202639'}}}),/Empty/);
});
test('China upload scanning is bounded and publishes only matching validated MVs',async()=>{
 const seen=[],fetcher=async url=>{url=new URL(url);seen.push(url);let data;
 if(url.host==='chart.tencentmusic.com')data={code:'0',data:{content:{chartsList:cnChart.songs,issue:'202639'}}};
 else if(url.pathname.endsWith('/channels'))data={items:CHINA_CHANNELS.map((c,index)=>({id:c.id,contentDetails:{relatedPlaylists:{uploads:'playlist'+index}}}))};
 else if(url.pathname.endsWith('/playlistItems'))data={items:Array.from({length:50},(_,i)=>({contentDetails:{videoId:'video'+url.searchParams.get('playlistId').slice(-1)+String(i).padStart(5,'0')}}))};
 else data={items:[cnItem()]};
 return {ok:true,json:async()=>data};};
 const result=await collectChina({key:'test',fetcher,now});assert.equal(result.status.requests,CHINA_MAX_REQUESTS);assert.equal(result.status.checkedChannels,4);assert(seen.every(u=>!u.pathname.endsWith('/search')));assert(result.tracks.every(t=>t.countryBasis==='external-music-chart'));
});

 test('old and low-view Trending MVs remain eligible; off-list sources do not',()=>{
 const i=item();i.snippet.publishedAt='2020-01-01T00:00:00Z';i.statistics.viewCount='500';
 const t={...chartTrack(i,'KR',now),regionalChartPositions:{KR:1}};
 assert(trendingEligible(t,now));
 for(const change of [{countryBasis:'curated-channel-market'},{countryBasis:'external-music-chart'},{chartCountries:[]},{regionalChartPositions:{}},{durationSeconds:30},{embedCheckedAt:'2020-01-01T00:00:00Z'}])assert(!trendingEligible({...t,...change},now));
});

test('regional music accepts unmarked titles, audio, lyrics and recorded live videos',()=>{
 for(const title of ['DRAKE - QUEBEC','Song (Official Audio)','Song (Official Lyric Video)','Song (Live from SNL)','Song [Oficial Video]']){const i=item();i.snippet.title=title;const t=chartTrack(i,'US',now);assert(t);assert(trendingEligible({...t,regionalChartPositions:{US:1}},now));}
});
