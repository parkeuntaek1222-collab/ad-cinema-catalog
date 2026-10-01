export const GENRES=[
 {id:"pop",label:"Pop"}, {id:"hip-hop",label:"Hip-Hop / Rap"},
 {id:"rnb",label:"R&B / Soul"}, {id:"electronic",label:"Electronic / Dance"},
 {id:"rock",label:"Rock / Alternative"}, {id:"metal",label:"Metal"},
 {id:"reggae",label:"Reggae / Dancehall"}, {id:"afrobeats",label:"Afrobeats / Amapiano"},
 {id:"country",label:"Country"}, {id:"folk",label:"Folk / Acoustic"},
 {id:"jazz",label:"Jazz / Blues"}, {id:"classical",label:"Classical"},
 {id:"latin",label:"Latin"}, {id:"funk-disco",label:"Funk / Disco"},
 {id:"unclassified",label:"Unclassified"},
 {id:"dance-pop",label:"Dance-Pop",parent:"pop"}, {id:"synth-pop",label:"Synth-Pop",parent:"pop"}, {id:"electropop",label:"Electropop",parent:"pop"}, {id:"indie-pop",label:"Indie Pop",parent:"pop"},
 {id:"trap",label:"Trap",parent:"hip-hop"}, {id:"drill",label:"Drill",parent:"hip-hop"}, {id:"boom-bap",label:"Boom Bap",parent:"hip-hop"},
 {id:"soul",label:"Soul",parent:"rnb"}, {id:"neo-soul",label:"Neo-Soul",parent:"rnb"},
 {id:"house",label:"House",parent:"electronic"}, {id:"techno",label:"Techno",parent:"electronic"}, {id:"trance",label:"Trance",parent:"electronic"}, {id:"drum-and-bass",label:"Drum & Bass",parent:"electronic"}, {id:"dubstep",label:"Dubstep",parent:"electronic"},
 {id:"alternative-rock",label:"Alternative Rock",parent:"rock"}, {id:"indie-rock",label:"Indie Rock",parent:"rock"}, {id:"punk-rock",label:"Punk Rock",parent:"rock"}, {id:"hard-rock",label:"Hard Rock",parent:"rock"},
 {id:"metalcore",label:"Metalcore",parent:"metal"}, {id:"death-metal",label:"Death Metal",parent:"metal"},
 {id:"dancehall",label:"Dancehall",parent:"reggae"}, {id:"dub",label:"Dub",parent:"reggae"}, {id:"amapiano",label:"Amapiano",parent:"afrobeats"},
 {id:"country-pop",label:"Country Pop",parent:"country"}, {id:"bluegrass",label:"Bluegrass",parent:"country"},
 {id:"indie-folk",label:"Indie Folk",parent:"folk"}, {id:"acoustic",label:"Acoustic",parent:"folk"},
 {id:"jazz-music",label:"Jazz",parent:"jazz"}, {id:"blues",label:"Blues",parent:"jazz"}
];
const TOPICS={Pop_music:"pop",Hip_hop_music:"hip-hop",Rhythm_and_blues:"rnb",Soul_music:"rnb",Electronic_music:"electronic",Rock_music:"rock",Heavy_metal_music:"metal",Reggae:"reggae",Country_music:"country",Folk_music:"folk",Jazz:"jazz",Blues:"jazz",Classical_music:"classical",Latin_music:"latin",Latin_pop:"latin",Reggaeton:"latin",Bachata:"latin",Salsa_music:"latin",Cumbia:"latin",Merengue_music:"latin",Regional_Mexican:"latin",Norteño:"latin",Corrido:"latin",Samba:"latin",Bossa_nova:"latin",Sertanejo_music:"latin",Forró:"latin",Funk_carioca:"latin",Funk:"funk-disco",Disco:"funk-disco"};
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
 classical:["classical music","classical","클래식"],
 latin:["latin","latin music","latin pop","reggaeton","reggaetón","latin urban","urbano latino","salsa","bachata","cumbia","merengue","regional mexican","musica mexicana","música mexicana","norteño","norteno","corridos","corrido","samba","bossa nova","sertanejo","forro","forró","funk carioca","baile funk"],
 "funk-disco":["funk","funk music","disco","disco music","nu disco","nudisco","펑크 음악","디스코"]
};
const SUBGENRE_ALIASES={
 "dance-pop":["dance pop","dancepop"],"synth-pop":["synth pop","synthpop"],electropop:["electropop","electro pop"],"indie-pop":["indie pop","indiepop"],
 trap:["trap","trap music"],drill:["drill","drill music"],"boom-bap":["boom bap","boombap"],
 soul:["soul","soul music"],"neo-soul":["neo soul","neosoul"],
 house:["house","house music","deep house","deephouse","tech house","techhouse"],techno:["techno","techno music"],trance:["trance","trance music"],"drum-and-bass":["drum and bass","drum & bass","drumandbass","dnb"],dubstep:["dubstep"],
 "alternative-rock":["alternative rock","alternativerock"],"indie-rock":["indie rock","indierock"],"punk-rock":["punk rock","punkrock"],"hard-rock":["hard rock","hardrock"],metalcore:["metalcore"],"death-metal":["death metal","deathmetal"],
 dancehall:["dancehall"],dub:["dub music","dub reggae"],amapiano:["amapiano"],"country-pop":["country pop","countrypop"],bluegrass:["bluegrass"],
 "indie-folk":["indie folk","indiefolk"],acoustic:["acoustic music","acoustic folk"],"jazz-music":["jazz","jazz music","재즈"],blues:["blues","blues music","블루스"]
};
const SUBGENRE_TOPICS={Dance_pop:"dance-pop",Synth_pop:"synth-pop",Synthpop:"synth-pop",Indie_pop:"indie-pop",Trap_music:"trap",Drill_music:"drill",Boom_bap:"boom-bap",Soul_music:"soul",Neo_soul:"neo-soul",House_music:"house",Techno:"techno",Trance_music:"trance",Drum_and_bass:"drum-and-bass",Dubstep:"dubstep",Alternative_rock:"alternative-rock",Indie_rock:"indie-rock",Punk_rock:"punk-rock",Hard_rock:"hard-rock",Metalcore:"metalcore",Death_metal:"death-metal",Dancehall:"dancehall",Dub_music:"dub",Amapiano:"amapiano",Country_pop:"country-pop",Bluegrass_music:"bluegrass",Indie_folk:"indie-folk",Acoustic_music:"acoustic",Jazz:"jazz-music",Blues:"blues"};
function normalized(value){return String(value).normalize("NFKC").toLowerCase().replace(/^#+/,"").replace(/[-_]/g," ").replace(/\s+/g," ").trim()}
const TAG_GENRES=new Map(Object.entries(ALIASES).flatMap(([id,aliases])=>aliases.map(alias=>[normalized(alias),id])));
const TAG_SUBGENRES=new Map(Object.entries(SUBGENRE_ALIASES).flatMap(([id,aliases])=>aliases.map(alias=>[normalized(alias),id])));
export function classifyGenres(item,checkedAt=new Date().toISOString()){
 const evidence=[];
 function add(genre,source,value){if(genre&&!evidence.some(e=>e.genre===genre))evidence.push({genre,basis:"video",source,value});const parent=GENRES.find(g=>g.id===genre)?.parent;if(parent&&!evidence.some(e=>e.genre===parent))evidence.push({genre:parent,basis:"video",source,value})}
 for(const url of item.topicDetails?.topicCategories||[]){try{const u=new URL(url);if(!/(^|\.)wikipedia\.org$/.test(u.hostname))continue;const topic=decodeURIComponent(u.pathname.split("/").at(-1));add(TOPICS[topic],"youtube-topic",url);add(SUBGENRE_TOPICS[topic],"youtube-topic",url)}catch{}}
 const tags=[...(item.snippet?.tags||[])];
 // Only explicit hashtags and labelled genre lines; never scan ordinary lyrics or artist names.
 for(const text of [item.snippet?.title||"",item.snippet?.description||""]){for(const m of text.matchAll(/#([\p{L}\p{N}_-]+)/gu))tags.push(m[1]);for(const m of text.matchAll(/(?:^|\n)\s*(?:genre|genres|장르)\s*:\s*([^\n]+)/gi))tags.push(...m[1].split(/[,;|]/))}
 for(const tag of tags){add(TAG_GENRES.get(normalized(tag)),"youtube-uploader-tag",String(tag).slice(0,100));add(TAG_SUBGENRES.get(normalized(tag)),"youtube-uploader-tag",String(tag).slice(0,100))}
 const genres=GENRES.filter(g=>!g.parent&&evidence.some(e=>e.genre===g.id)).map(g=>g.id),subgenres=GENRES.filter(g=>g.parent&&evidence.some(e=>e.genre===g.id)).map(g=>g.id);
 return {genres:genres.length?genres:["unclassified"],subgenres,genreEvidence:evidence,genresCheckedAt:checkedAt,genreClassification:"metadata-estimate"};
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
 const result=tracks.map(t=>{const classification=metadata.get(t.id)||{genres:["unclassified"],subgenres:[],genreEvidence:[],genreClassification:"metadata-unavailable",genresCheckedAt:checkedAt};const classified=!classification.genres.includes("unclassified");status[classified?"classified":"unclassified"]++;return {...t,...classification}});
 return {tracks:result,status};
}
