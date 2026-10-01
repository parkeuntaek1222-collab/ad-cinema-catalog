export const MAX_CHECK_AGE=72*3600000;
export function decode(s){return s.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g,'$1').replace(/<[^>]*>/g,'').replace(/&#(x[\da-f]+|\d+);/gi,(_,v)=>{const n=v[0].toLowerCase()==='x'?parseInt(v.slice(1),16):+v;return n>0&&n<=0x10ffff?String.fromCodePoint(n):''}).replace(/&quot;/g,'"').replace(/&apos;/g,"'").replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&amp;/g,'&').trim()}
function field(xml,key){return decode(xml.match(new RegExp('<'+key+'(?:\\s[^>]*)?>([\\s\\S]*?)<\\/'+key+'>'))?.[1]||'')}
export function musicVideo(title){return !/#|teaser|trailer|tomorrow|now playing|\btest\b|MV公開|MV公開され|behind|making|interview|reaction|tutorial|lyrics?|\baudio\b|visuali[sz]er|live\b|performance|dance practice|choreography|shorts?|challenge|preview|snippet|메이킹|비하인드|티저|챌린지|직캠|라이브|안무|쇼츠|予告|メイキング|歌詞|舞台裏|เบื้องหลัง|bastidores|ao vivo|hậu trường/iu.test(title)&&/official\s*(?:music\s*)?video|music\s*video|\bM\.?V\b|videoclip|video\s*oficial|clipe\s*oficial|뮤직비디오|ミュージックビデオ|คลิปเพลง|full\s*video|video\s*song/iu.test(title)}
export function eligible(t,now=Date.now()){
 const published=Date.parse(t.publishedAt),check=now-Date.parse(t.viewsCheckedAt);
 return /^[\w-]{11}$/.test(t.id)&&typeof t.title==='string'&&typeof t.artist==='string'&&Array.isArray(t.countries)&&t.countries.length>0&&t.countries.every(c=>/^[A-Z]{2}$/.test(c))&&Number.isFinite(published)&&published<=now+60000&&check>=-60000&&check<=MAX_CHECK_AGE&&Number.isSafeInteger(t.views)&&t.views>=0&&musicVideo(t.originalTitle||t.title);
}
export function trendingEligible(t,now=Date.now()){
 const check=now-Date.parse(t.embedCheckedAt);
 return eligible(t,now)&&t.countryBasis==='youtube-regional-chart'&&t.discovery==='youtube-mostPopular-music'&&t.verification==='api-embeddable-music-title'&&Array.isArray(t.chartCountries)&&t.chartCountries.length>0&&t.chartCountries.every(c=>t.countries.includes(c)&&Number.isInteger(t.regionalChartPositions?.[c])&&t.regionalChartPositions[c]>0)&&Number.isFinite(t.durationSeconds)&&t.durationSeconds>=90&&t.durationSeconds<=900&&check>=-60000&&check<=MAX_CHECK_AGE;
}
export function parseFeed(xml,source,now=Date.now()){return [...xml.matchAll(/<entry>([\s\S]*?)<\/entry>/g)].flatMap(([,e])=>{const id=field(e,'yt:videoId'),originalTitle=field(e,'title'),publishedAt=field(e,'published'),views=Number(e.match(/<media:statistics\b[^>]*\bviews=["'](\d+)["']/)?.[1]||NaN);let artist=source.name,title=originalTitle;const split=originalTitle.match(/^(.{1,100}?)\s[-–—]\s(.+)$/);if(split){artist=split[1];title=split[2]}title=title.replace(/\s*[\[(](?:official\s*(?:music\s*)?video|music\s*video|MV|video\s*oficial|clipe\s*oficial)[\])]/ig,'').trim();const t={id,artist,title,originalTitle,countries:[source.countryCode],countryBasis:source.countryBasis,channelId:source.id,publishedAt,views,viewsCheckedAt:new Date(now).toISOString(),source:'https://www.youtube.com/watch?v='+id};return eligible(t,now)?[t]:[]})}
export function program(tracks,random=Math.random,now=Date.now()){
 const unique=new Map(tracks.filter(t=>eligible(t,now)).map(t=>[t.id,t])),groups=new Map();
 for(const t of unique.values()){const key=t.countries[0]||'GLOBAL';if(!groups.has(key))groups.set(key,[]);groups.get(key).push(t)}
 // Randomize each market without upload-age, view-count or chart-position weighting.
 let buckets=[...groups.values()].map(g=>{const a=[...g];for(let i=a.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a});
 for(let i=buckets.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[buckets[i],buckets[j]]=[buckets[j],buckets[i]]}
 const out=[];let lastArtist='';while(buckets.some(b=>b.length)){for(const b of buckets){if(!b.length)continue;const different=b.findIndex(t=>t.artist!==lastArtist);const t=b.splice(Math.max(0,different),1)[0];out.push(t);lastArtist=t.artist}}return out;
}
