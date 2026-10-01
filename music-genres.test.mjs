import test from "node:test";
import assert from "node:assert/strict";
import {classifyGenres,enrichGenres,GENRES,MAX_GENRE_REQUESTS} from "./music-genres.mjs";
test("music topics classify multiple genres with evidence, not geography",()=>{
 const r=classifyGenres({topicDetails:{topicCategories:["https://en.wikipedia.org/wiki/Pop_music","https://en.wikipedia.org/wiki/Rhythm_and_blues","https://en.wikipedia.org/wiki/Music_of_Asia","https://en.wikipedia.org/wiki/Independent_music"]}},"now");
 assert.deepEqual(r.genres,["pop","rnb"]);assert(r.genreEvidence.every(e=>e.basis==="video"&&e.source==="youtube-topic"));
});
test("ordinary artist names, lyrics, regions and ambiguous country words are not genres",()=>{
 const r=classifyGenres({snippet:{title:"Pop Smoke - Song",description:"This country loves rock and soul",tags:["K-Pop","Latin America","country","Artist Pop"]}});assert.deepEqual(r.genres,["unclassified"]);
});
test("explicit uploader genre markers cover narrow topics and do not copy description text",()=>{
 const r=classifyGenres({snippet:{title:"Song #Afrobeats",tags:["bluegrass","metalcore"],description:"Genre: Jazz, Folk Music\nprivate-looking irrelevant text"}});
 assert.deepEqual(r.genres,["metal","afrobeats","country","folk","jazz"]);assert(!JSON.stringify(r).includes("private-looking"));assert.deepEqual(r.subgenres,["metalcore","bluegrass","jazz-music"]);assert.equal(GENRES.filter(g=>!g.parent).length,15);
});
test("subgenres require their own evidence; broad topics never imply a narrow style",()=>{
 const broad=classifyGenres({topicDetails:{topicCategories:["https://en.wikipedia.org/wiki/Electronic_music"]}});assert.deepEqual(broad.genres,["electronic"]);assert.deepEqual(broad.subgenres,[]);
 const detailed=classifyGenres({snippet:{tags:["deep house","techno","indierock"],description:"#NeoSoul"}});assert.deepEqual(detailed.genres,["rnb","electronic","rock"]);assert.deepEqual(detailed.subgenres,["neo-soul","house","techno","indie-rock"]);assert(detailed.genreEvidence.some(e=>e.genre==='house'));
});
test("batch enrichment preserves existing track data and uses fifty ID requests",async()=>{
 const tracks=Array.from({length:51},(_,i)=>({id:String(i),countries:["KR"],artist:"Artist"}));let requests=0;
 const fetcher=async url=>{requests++;assert(url.searchParams.get("id").split(",").length<=50);return {ok:true,json:async()=>({items:url.searchParams.get("id").split(",").map(id=>({id,topicDetails:{topicCategories:["https://en.wikipedia.org/wiki/Reggae"]}}))})}};
 const r=await enrichGenres({key:"test",tracks,fetcher});assert.equal(requests,2);assert.equal(r.status.classified,51);assert.deepEqual(r.tracks[0].countries,["KR"]);assert.equal(MAX_GENRE_REQUESTS,40);
});
test("unavailable metadata removes stale classification without discarding music",async()=>{
 const r=await enrichGenres({key:"test",tracks:[{id:"a",genres:["pop"]}],fetcher:async()=>{throw Error("secret-key")}});assert.equal(r.tracks.length,1);assert.deepEqual(r.tracks[0].genres,["unclassified"]);assert.equal(r.status.failedBatches,1);
});
test("quota failures stop publication and errors never expose credentials",async()=>{
 await assert.rejects(enrichGenres({key:"secret-key",tracks:[{id:"a"}],fetcher:async()=>({ok:false,status:403,json:async()=>({error:{message:"secret-key"}})})}),e=>e.message==="YouTube genre metadata HTTP 403");
});

test("Latin and Funk / Disco classify from explicit genres, not language or chart markets",()=>{
 const r=classifyGenres({snippet:{tags:["Reggaeton","bachata","nu-disco","funk"]}},"now");assert.deepEqual(r.genres,["latin","funk-disco"]);assert.deepEqual(r.subgenres,[]);assert(r.genreEvidence.every(e=>e.source==="youtube-uploader-tag"));
 const regional=classifyGenres({snippet:{title:"Brazilian artist - Song",tags:["Brazil","Spanish","Latin America"]},topicDetails:{topicCategories:["https://en.wikipedia.org/wiki/Music_of_Latin_America"]}});assert.deepEqual(regional.genres,["unclassified"]);
 const topics=classifyGenres({topicDetails:{topicCategories:["https://en.wikipedia.org/wiki/Reggaeton","https://en.wikipedia.org/wiki/Funk","https://en.wikipedia.org/wiki/Disco"]}});assert.deepEqual(topics.genres,["latin","funk-disco"]);
 assert.deepEqual(classifyGenres({snippet:{tags:["funk carioca"]}}).genres,["latin"]);
});
