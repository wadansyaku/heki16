import {Parser,jaModel} from 'budoux';
const parser=new Parser(jaModel);
export const phrases=text=>parser.parse(String(text)).reduce((parts,part)=>{
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
