// Offline export of the original vector sources. Uses an already installed Sharp;
// never installs dependencies or calls an image generation service.
import {readdir,mkdir,readFile} from 'node:fs/promises';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
const require=createRequire(import.meta.url),root=path.dirname(fileURLToPath(import.meta.url));
const modulePath=process.argv[2]==='--sharp'?process.argv[3]:'sharp',sharp=require(modulePath);
const output=path.resolve(root,'../../src/art');await mkdir(output,{recursive:true});
for(const file of (await readdir(root)).filter(f=>/^crest-\d\d\.svg$/.test(f)).sort()){
 const source=await readFile(path.join(root,file)),name=file.slice(0,-4);
 await sharp(source).webp({quality:85}).toFile(path.join(output,name+'.webp'));
 await sharp(source).resize(480,320).webp({quality:80}).toFile(path.join(output,name+'-small.webp'));
}
