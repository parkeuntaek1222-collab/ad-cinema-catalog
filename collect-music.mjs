import {enrichGenres,GENRES} from './music-genres.mjs';
import {collectCharts,CHART_REGIONS} from './music-charts.mjs';
import {writeFileSync} from 'node:fs';
import {trendingEligible} from './music-core.mjs';
const now=Date.now();
// Only the fresh YouTube regional Trending music results enter this catalog.
// RSS, external charts and previous off-list entries are not merged back in.
const chart=await collectCharts({key:process.env.YOUTUBE_API_KEY,now});
const tracks=chart.tracks.filter(t=>trendingEligible(t,now));
if(!tracks.length)throw Error('No qualifying trending music videos; preserving last catalog');
const genre=await enrichGenres({tracks,key:process.env.YOUTUBE_API_KEY,now});
const catalog={schemaVersion:1,generatedAt:new Date(now).toISOString(),genreDefinitions:GENRES,policy:{sourceMode:'youtube-trending-only',videoFormat:'all-music',titleFilter:false,maxAgeDays:null,minViews:null,refreshHours:6,maxPerRegion:100,minDurationSeconds:90,maxDurationSeconds:900,selection:'YouTube regional Trending music API results only; validated public embeddable music including audio, lyric and recorded live videos; no title, upload-age or view-count threshold',countryBasis:'Countries indicate appearances in YouTube regional Trending music lists, not artist nationality',genreBasis:'Estimated video genres from YouTube music topics and explicit uploader genre tags; unclassified videos are excluded from playback'},tracks:genre.tracks.sort((a,b)=>Date.parse(b.publishedAt)-Date.parse(a.publishedAt))};
const status={checkedAt:catalog.generatedAt,sourceMode:'youtube-trending-only',sources:0,healthy:0,configuredRegions:CHART_REGIONS.length,chartRequests:chart.requests,chartRegions:chart.regions,chartTracks:chart.tracks.length,genres:genre.status,tracks:catalog.tracks.length,playableTracks:genre.status.classified,countries:[...new Set(tracks.flatMap(t=>t.countries))].sort(),channels:[],supplementalSourcesEnabled:false};
writeFileSync('music-catalog.json',JSON.stringify(catalog,null,2)+'\n');
writeFileSync('music-status.json',JSON.stringify(status,null,2)+'\n');
console.log(JSON.stringify(status));
