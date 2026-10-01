export const GENRES=[
 {id:"pop",label:"Pop"}, {id:"hip-hop",label:"Hip-Hop / Rap"},
 {id:"rnb",label:"R&B / Soul"}, {id:"electronic",label:"Electronic / Dance"},
 {id:"rock",label:"Rock / Alternative"}, {id:"metal",label:"Metal"},
 {id:"reggae",label:"Reggae / Dancehall"}, {id:"afrobeats",label:"Afrobeats / Amapiano"},
 {id:"country",label:"Country"}, {id:"folk",label:"Folk / Acoustic"},
 {id:"jazz",label:"Jazz / Blues"}, {id:"classical",label:"Classical"},
 {id:"unclassified",label:"Unclassified"}
];
const TOPICS={Pop_music:"pop",Hip_hop_music:"hip-hop",Rhythm_and_blues:"rnb",Soul_music:"rnb",Electronic_music:"electronic",Rock_music:"rock",Heavy_metal_music:"metal",Reggae:"reggae",Country_music:"country",Folk_music:"folk",Jazz:"jazz",Blues:"jazz",Classical_music:"classical"};
const ALIASES={
 pop:["pop","dance pop","synth pop","electropop","팝"],
 "hip-hop":["hip hop","hiphop","rap","trap music","drill music","힙합","랩"],
 rnb:["r&b","rnb","rhythm and blues","soul","neo soul","알앤비"],
 electronic:["edm","electronic","electronic music","house music","techno","trance music","drum and bass","dubstep"],
 rock:["rock","rock music","alternative rock","indie rock","punk rock","록"],
 metal:["metal","heavy metal","metalcore","death metal","메탈"],
 reggae:["reggae","dancehall","dub music","레게"],
 afrobeats:["afrobeats","afrobeat","amapiano"],
 country:["country music","country pop","country rock","bluegrass","컨트리"],
 folk:["folk music","indie folk","acoustic music"],
 jazz:["jazz","blues","재즈","블루스"],
 classical:["classical music","classical","클래식"]
};
function normalized(value){return String(value).normalize("NFKC").toLowerCase().replace(/^#+/,"").replace(/[-_]/g," ").replace(/\s+/g," ").trim()}
const TAG_GENRES=new Map(Object.entries(ALIASES).flatMap(([id,aliases])=>aliases.map(alias=>[normalized(alias),id])));
export function classifyGenres(item,checkedAt=new Date().toISOString()){
 const evidence=[];
 for(const url of item.topicDetails?.topicCategories||[]){try{const u=new URL(url);if(!/(^|\.)wikipedia\.org$/.test(u.hostname))continue;const topic=decodeURIComponent(u.pathname.split("/").at(-1));if(TOPICS[topic])evidence.push({genre:TOPICS[topic],basis:"video",source:"youtube-topic",value:url})}catch{}}
 const tags=[...(item.snippet?.tags||[])];
 // Only explicit hashtags and labelled genre lines; never scan ordinary lyrics or artist names.
 for(const text of [item.snippet?.title||"",item.snippet?.description||""]){for(const m of text.matchAll(/#([\p{L}\p{N}_-]+)/gu))tags.push(m[1]);for(const m of text.matchAll(/(?:^|\n)\s*(?:genre|genres|장르)\s*:\s*([^\n]+)/gi))tags.push(...m[1].split(/[,;|]/))}
 for(const tag of tags){const genre=TAG_GENRES.get(normalized(tag));if(genre&&!evidence.some(e=>e.genre===genre))evidence.push({genre,basis:"video",source:"youtube-uploader-tag",value:String(tag).slice(0,100)})}
 const genres=GENRES.map(g=>g.id).filter(id=>evidence.some(e=>e.genre===id));
 return {genres:genres.length?genres:["unclassified"],genreEvidence:evidence,genresCheckedAt:checkedAt,genreClassification:"metadata-estimate"};
}
export const MAX_GENRE_TRACKS=2000,MAX_GENRE_REQUESTS=Math.ceil(MAX_GENRE_TRACKS/50);
export async function enrichGenres({tracks,key,fetcher=fetch,now=Date.now()}){
 if(!key)throw Error("YOUTUBE_API_KEY is required");
 if(tracks.length>MAX_GENRE_TRACKS)throw Error("Genre track budget exhausted");
 const checkedAt=new Date(now).toISOString(),metadata=new Map(),status={requests:0,classified:0,unclassified:0,failedBatches:0};
 const ids=[...new Set(tracks.map(t=>t.id))];
 for(let i=0;i<ids.length;i+=50){status.requests++;const url=new URL("https://www.googleapis.com/youtube/v3/videos");for(const [k,v] of Object.entries({part:"snippet,topicDetails",id:ids.slice(i,i+50).join(","),key}))url.searchParams.set(k,v);
  let response,data;try{response=await fetcher(url,{signal:AbortSignal.timeout(15000)});data=await response.json()}catch{status.failedBatches++;continue}
  if(!response.ok){if([400,401,403,429].includes(response.status))throw Error("YouTube genre metadata HTTP "+response.status);status.failedBatches++;continue}
  if(!Array.isArray(data.items)){status.failedBatches++;continue}
  for(const item of data.items)metadata.set(item.id,classifyGenres(item,checkedAt));
 }
 const result=tracks.map(t=>{const classification=metadata.get(t.id)||{genres:["unclassified"],genreEvidence:[],genreClassification:"metadata-unavailable",genresCheckedAt:checkedAt};const classified=!classification.genres.includes("unclassified");status[classified?"classified":"unclassified"]++;return {...t,...classification}});
 return {tracks:result,status};
}
