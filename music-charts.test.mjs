import test from 'node:test';
import assert from 'node:assert/strict';
import {chartTrack,collectCharts,MAX_REQUESTS,CHART_REGIONS} from './music-charts.mjs';
const now=Date.parse('2026-09-29T00:00:00Z');
function item(){return {id:'abcdefghijk',snippet:{title:'Artist - Song (Official Video)',channelTitle:'Artist',channelId:'channel',categoryId:'10',liveBroadcastContent:'none',publishedAt:'2026-09-28T00:00:00Z'},contentDetails:{duration:'PT3M20S'},status:{embeddable:true,privacyStatus:'public'},statistics:{viewCount:'20000'}}}
test('validates video and preserves regional provenance',()=>{
 assert.equal(chartTrack(item(),'KR',now).countryBasis,'youtube-regional-chart');
 for(const mutate of [i=>i.status.embeddable=false,i=>i.contentDetails.duration='PT30S',i=>i.snippet.title='Song (Official Audio)',i=>i.contentDetails.regionRestriction={blocked:['KR']},i=>i.contentDetails.regionRestriction={allowed:['JP']},i=>i.snippet.liveBroadcastContent='live']){const i=item();mutate(i);assert.equal(chartTrack(i,'KR',now),null)}
});
test('merges duplicates across countries',async()=>{
 const fetcher=async url=>({ok:true,json:async()=>({items:url.pathname.endsWith('i18nRegions')?[{id:'KR'},{id:'JP'}]:[item()]})});
 const r=await collectCharts({key:'test',regions:['KR','JP','XX'],fetcher,now});
 assert.equal(r.tracks.length,1);assert.deepEqual(r.tracks[0].chartCountries,['KR','JP']);assert.equal(r.requests,3);assert(r.requests<=MAX_REQUESTS);assert(r.regions[2].unsupported);
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
 assert.equal(new Set(CHART_REGIONS).size,CHART_REGIONS.length);
 const fetcher=async url=>({ok:true,json:async()=>url.pathname.endsWith('i18nRegions')?{items:CHART_REGIONS.map(id=>({id}))}:{items:[item()],...(url.searchParams.has('pageToken')?{}:{nextPageToken:'second'})}});
 const r=await collectCharts({key:'test',fetcher,now});
 assert.equal(r.requests,MAX_REQUESTS);
 assert.equal(r.healthy,CHART_REGIONS.length);
 assert.deepEqual(r.tracks[0].chartCountries,CHART_REGIONS);
});
