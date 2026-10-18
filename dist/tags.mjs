export const GROUPS = {atmosphere:'雰囲気',relationship:'関係性',values:'大切なこと',other:'自由なメモ'};
const synonyms = new Map([['安心する声','落ち着く声'],['落ち着いた声','落ち着く声'],['2人の時間','ふたりの時間'],['二人の時間','ふたりの時間'],['一人の時間','ひとりの時間'],['1人の時間','ひとりの時間']]);
export function normalizeLabel(value) {
  if(typeof value!=='string')return '';
  const clean=value.normalize('NFKC').replace(/[\u0000-\u001f\u007f\u200b-\u200f\u202a-\u202e\u2066-\u2069]/g,'').trim().replace(/^#+\s*/,'').replace(/\s+/g,' ');
  return Array.from(new TextDecoder().decode(new TextEncoder().encode(clean))).slice(0,32).join('');
}
export function guessGroup(label) {
  if(/声|香|音|照明|雰囲気|場所|手触り|静か|空間/.test(label))return 'atmosphere';
  if(/共依存|重愛|溺愛|褒め|二人|合図|目隠し|リボン|挑発|陥落|翻弄|余裕|独占|主従|わからせ|甘やか|飼|攻守|リバ|焦らし|温度差|時間|距離|ペース|一緒|ふたり|ひとり|連絡|リード|主導|委ね|束縛|誘|関係|役回り|ギャップ/.test(label))return 'relationship';
  if(/安心|思いやり|尊重|同意|信頼|誠実|優し|対話|自由|確かめ/.test(label))return 'values';
  return 'other';
}
export function organizeTags(tags,learned={}) {
  const out=[],seen=new Set();
  for(const tag of tags.slice(0,24)){
    const raw=normalizeLabel(typeof tag==='string'?tag:tag?.label);if(!raw)continue;
    const label=synonyms.get(raw)||raw,kind=tag?.kind==='boundary'?'boundary':'like';
    const key=kind+':'+label.toLocaleLowerCase('ja');if(seen.has(key))continue;seen.add(key);
    const chosen=tag?.manual&&Object.hasOwn(GROUPS,tag.group)?tag.group:learned[label];
    out.push({label,kind,group:Object.hasOwn(GROUPS,chosen)?chosen:guessGroup(label),manual:!!tag?.manual});
  }return out;
}
