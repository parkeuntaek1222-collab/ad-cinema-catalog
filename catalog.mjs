export const DAY = 86400000;
export const REFRESH_MS = 6 * 60 * 60 * 1000;
export const MIN_VIEWS = 1000;
export const MAX_VIEW_AGE_MS = 72 * 60 * 60 * 1000;
export const REGION_COUNTRIES = {Asia:['KR','JP','IN','ID','VN','MY','SG','TW','TH','PH','LK'],Europe:['GB','DE','FR','IT','NL','SE','ES','PL','TR'],NorthAmerica:['US','CA','MX'],SouthAmerica:['BR','AR','CL','BO'],Africa:['ZA'],Oceania:['AU','NZ']};
export function regionFor(country){return Object.keys(REGION_COUNTRIES).find(r=>REGION_COUNTRIES[r].includes(country))||'Global';}
export function trafficQualified(ad,now=Date.now()){const checked=Date.parse(ad.viewsCheckedAt);return Number.isSafeInteger(ad.views)&&ad.views>=MIN_VIEWS&&Number.isFinite(checked)&&checked<=now&&now-checked<=MAX_VIEW_AGE_MS;}
export function eligibleAds(ads,now=Date.now()){return cleanAds(ads,now).filter(a=>a.sourceType==='official'&&a.dateBasis==='published'&&trafficQualified(a,now));}
export function recent(ad,now=Date.now()) {const age=now-Date.parse(ad.date);return Number.isFinite(age)&&age>=0&&age<=30*DAY;}
export function decode(s) {
 return s.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g,'$1').replace(/<[^>]*>/g,'')
 .replace(/&#(x[\da-f]+|\d+);/gi,(_,v)=>{const n=v[0].toLowerCase()==='x'?parseInt(v.slice(1),16):+v;return n>0&&n<=0x10ffff?String.fromCodePoint(n):''})
 .replace(/&quot;/g,'"').replace(/&apos;/g,"'").replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&amp;/g,'&').trim();
}
function field(xml,name){return decode(xml.match(new RegExp('<'+name+'(?:\\s[^>]*)?>([\\s\\S]*?)<\\/'+name+'>'))?.[1]||'')}
// Conservative title rules: ambiguous uploads wait for a clearer campaign signal.
export function isCampaign(title,channel={}) {
 const excluded=/behind[ -]the[ -]scenes|making[ -]of|\binterview\b|\btutorial\b|\breview\b|\bunboxing\b|\bkeynote\b|\blivestream\b|\bhighlights\b|\bpodcast\b|\bgameplay\b|\btrailer\b|\bhow to\b|\blaunch(?:ing)? event\b|\bwalkaround\b|메이킹|비하인드|인터뷰|사용법|리뷰|언박싱|생중계|현장 스케치|발표회|メイキング|インタビュー|使い方|発表会|舞台裏|生配信|決算|採用/iu;
 const signal=/werbung|werbespot|publicité|publicidad|anuncio|campanha|comercial|quảng cáo|iklan|โฆษณา|廣告|广告|reklam|spot reklamowy|\bcommercial\b|\bcampaign\b|\badvert(?:isement)?\b|\bTV\s*(?:ad|spot)\b|\bTVC\b|\bCM\b|\bbrand film\b|\bfilm\b|\bintroducing\b|shot on iphone|광고|캠페인|브랜드\s*필름|\d+\s*(?:초|秒)|[「『].+[」』].*(?:篇|編)|(?:新登場|誕生)|キャンペーン/iu;
 return !excluded.test(title)&&!/unpacked|live stream|webinar|recette|rezept|recipe|cooking|tutorial|behind|making|lançamento ao vivo|bastidores|entrevista|kulisy|เบื้องหลัง|hậu trường/iu.test(title)&&!/対談|起用理由|behind the design/iu.test(title)&&(signal.test(title)||(channel.campaignPhrases||[]).some(phrase=>title.toLowerCase().includes(phrase.toLowerCase())));
}
export function parseChannel(xml,channel,now=Date.now()) {
 return [...xml.matchAll(/<entry>([\s\S]*?)<\/entry>/g)].flatMap(([,entry])=>{
  const id=field(entry,'yt:videoId'),title=field(entry,'title'),date=field(entry,'published');
  const viewsRaw=entry.match(/<media:statistics\b[^>]*\bviews=["'](\d+)["']/)?.[1];
  const views=viewsRaw===undefined?null:Number(viewsRaw);
  const countryCode=channel.countryCode||null;
  const ad={id,title,date,views:Number.isSafeInteger(views)?views:null,viewsCheckedAt:new Date(now).toISOString(),countryCode,region:channel.region||regionFor(countryCode),countryBasis:countryCode?'official-channel-market':'global',brand:channel.brand,market:channel.market,channelId:channel.id,source:'https://www.youtube.com/watch?v='+id,sourceType:'official',dateBasis:'published'};
  return /^[\w-]{11}$/.test(id)&&recent(ad,now)&&isCampaign(title,channel)?[ad]:[];
 });
}
export function parseEditorial(xml,now=Date.now()) {
 return [...xml.matchAll(/<item>([\s\S]*?)<\/item>/g)].flatMap(([,item])=>{
  const title=field(item,'title'),date=field(item,'pubDate'),source=field(item,'link').split('?')[0];
  if(!/campaign|commercial|tvc|advert|tv spot/i.test(title)||!source.startsWith('https://marcommnews.com/'))return [];
  return [...item.matchAll(/(?:youtube(?:-nocookie)?\.com\/(?:embed\/|watch\?v=)|youtu\.be\/)([\w-]{11})/g)].map(([,id])=>({id,title,date,brand:'',market:'',source,sourceType:'editorial',dateBasis:'introduced'}));
 }).filter(ad=>recent(ad,now));
}
export function cleanAds(ads,now=Date.now()) {
 const unique=new Map();for(const ad of ads){if(!recent(ad,now))continue;const previous=unique.get(ad.id);if(!previous||ad.sourceType==='official')unique.set(ad.id,ad)}
 return [...unique.values()].sort((a,b)=>Date.parse(b.date)-Date.parse(a.date));
}
export function programming(ads,random=Math.random,now=Date.now()) {
 const groups=new Map();
 for(const ad of eligibleAds(ads,now)){
  const country=ad.countryCode||'GLOBAL';if(!groups.has(country))groups.set(country,[]);
  const age=Math.max(1,(now-Date.parse(ad.date))/DAY);
  const weight=1+Math.log10(ad.views+1)/3+Math.log10(Math.max(0,ad.viewsPerHour||0)+1)/2+2/Math.sqrt(age);
  groups.get(country).push({ad,rank:Math.pow(Math.max(.00001,random()),1/weight)});
 }
 const buckets=[...groups.values()].map(bucket=>bucket.sort((a,b)=>b.rank-a.rank).map(x=>x.ad));
 for(let i=buckets.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[buckets[i],buckets[j]]=[buckets[j],buckets[i]];}
 const result=[];let lastBrand='';while(buckets.some(b=>b.length)){for(const bucket of buckets){if(!bucket.length)continue;const different=bucket.findIndex(ad=>ad.brand!==lastBrand);const ad=bucket.splice(Math.max(0,different),1)[0];result.push(ad);lastBrand=ad.brand;}}
 return result;
}
