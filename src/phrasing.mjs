import {Parser,jaModel} from 'budoux';
const parser=new Parser(jaModel);
export const phrases=text=>parser.parse(String(text)).reduce((parts,part)=>{if(parts.length&&/^(?:したい|してほしい|されたい|られたい|かれる|かれない|ずつ)[。！？、」』]*$/.test(part))parts[parts.length-1]+=part;else parts.push(part);return parts;},[]);
