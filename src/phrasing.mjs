import {Parser,jaModel} from 'budoux';
const parser=new Parser(jaModel);
const protectedTerms=['飼い主','小悪魔','負けず嫌い','共犯者','司令塔','主導権','二人きり','どう始めたい','一人の時間','言い切れない','したい・されたい','甘やかされたい','引き継ぎ','わからない','とことん','もう少し','2つまで','主従逆転','手綱を預ける','余裕を奪われる'];
export const phrases=text=>{
const value=String(text),base=parser.parse(value).reduce((parts,part)=>{
  if(parts.length&&parts.at(-1).endsWith('少し')&&part.startsWith('ずつ')){
    const before=parts.pop().slice(0,-2);
    if(before)parts.push(before);
    parts.push('少しずつ');
    if(part.slice(2))parts.push(part.slice(2));
  }else if(parts.length&&parts.at(-1).endsWith('欲しい')&&part.startsWith('一言')){
    const before=parts.pop().slice(0,-3);
    if(before)parts.push(before);
    parts.push('欲しい'+part);
  }else if(parts.length&&/^(?:したい|してほしい|されたい|られたい|かれる|かれない|ずつ)[。！？、」』]*$/.test(part))parts[parts.length-1]+=part;
  else parts.push(part);
  return parts;
},[]);
const boundaries=[];let offset=0;for(const part of base){offset+=part.length;if(offset<value.length)boundaries.push(offset);}
const inside=[];for(const term of protectedTerms){let from=0;for(;;){const i=value.indexOf(term,from);if(i<0)break;inside.push([i,i+term.length]);from=i+term.length;}}
const safe=boundaries.filter(i=>!inside.some(([a,b])=>i>a&&i<b));return [0,...safe].map((start,i,all)=>value.slice(start,all[i+1]??value.length));
};
