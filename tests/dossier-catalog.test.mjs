import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {DOSSIER_CATALOG,NAMED_DOSSIERS,PENDING_DOSSIERS,dossierByTitle,dossierById,dossierUrl,LEGACY_TYPE_CODES} from '../src/dossier-catalog.mjs';
import {TITLE_ART,validArt} from '../src/art.mjs';
import {SCENES,FACETS,diagnose,validAnswers,emptyAnswers} from '../src/nocturne.mjs';
import {encodeResult,decodeResult,readResultLink,diagnose as diagnoseLegacy} from '../src/diagnosis.mjs';
import {encodePrevious} from '../src/share-compat.mjs';
import {encodeFifth} from '../src/share-v5.mjs';

test('current named results and undetermined states share one unique catalog; historic artwork remains available',()=>{
 assert.equal(NAMED_DOSSIERS.length,37);assert.equal(PENDING_DOSSIERS.length,2);assert.equal(DOSSIER_CATALOG.filter(e=>e.kind==='historical').length,1);
 for(const key of ['id','title','art'])assert.equal(new Set(DOSSIER_CATALOG.map(e=>e[key])).size,DOSSIER_CATALOG.length,key);
 for(const entry of DOSSIER_CATALOG){assert.equal(TITLE_ART[entry.title],entry.art);assert.ok(validArt(entry.art));assert.ok(entry.focus.every(id=>SCENES.some(q=>q.choices.some(c=>c.signals.includes(id)))));assert.ok(entry.intro&&entry.question);assert.match(entry.id,/^[a-z]+(?:-[a-z]+)*$/);assert.equal(dossierByTitle(entry.title),entry);}
 for(const entry of NAMED_DOSSIERS)assert.equal(dossierUrl(entry),`/types/${entry.id}/`);
 for(const entry of PENDING_DOSSIERS)assert.equal(dossierUrl(entry),'/types/undetermined/');
 assert.equal(dossierUrl(dossierById('beyond-the-options')),'/types/');assert.equal(dossierUrl(undefined),'/types/');
 assert.equal(LEGACY_TYPE_CODES.length,16);assert.equal(new Set(LEGACY_TYPE_CODES).size,16);
});

test('valid current choices never emit a retired classification; both undetermined outcomes stay outside named results',()=>{
 const masks=SCENES.map((q,i)=>Array.from({length:31},(_,j)=>j+1).filter(mask=>{const a=emptyAnswers();a[i]=mask;return validAnswers(a);}));
 let seed=6931;const random=n=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)%n);
 const outputs=[diagnose(emptyAnswers())];
 for(let i=0;i<1200;i++)outputs.push(diagnose(SCENES.map((q,index)=>random(5)===0?null:masks[index][random(masks[index].length)])));
 const one=emptyAnswers();one[7]=1;outputs.push(diagnose(one));
 for(const p of outputs){const entry=dossierByTitle(p.title);assert.ok(entry,p.title);assert.notEqual(entry.kind,'historical');assert.equal(p.art,entry.art);if(entry.kind==='pending')assert.ok(!NAMED_DOSSIERS.includes(entry));}
 assert.deepEqual(new Set(outputs.filter(p=>dossierByTitle(p.title).kind==='pending').map(p=>p.title)),new Set(PENDING_DOSSIERS.map(e=>e.title)));
 assert.equal(validAnswers(Array(24).fill(0)),false);
});

test('old H4/H5/H6 share payloads retain the original names and artwork through the unchanged readers',()=>{
 const fixture=fs.readFileSync(new URL('./diagnosis.test.mjs',import.meta.url),'utf8').match(/const PREVIOUS_LINK="([^"]+)"/)[1];
 const fifth=JSON.parse(fs.readFileSync(new URL('./fixtures/share-v5.json',import.meta.url),'utf8'))[0].code;
 for(const payload of [encodePrevious(fixture,[]),encodeFifth(fifth,[])]){const result=readResultLink('https://kuseiro.com/#share='+payload);assert.ok(result.title);assert.match(payload,/^H[45]\./);assert.ok(!dossierByTitle(result.title));}
 const old=readResultLink('https://kuseiro.com/#share='+fixture);assert.equal(old.typeCode,'DCNX');
 const legacy=diagnoseLegacy(Array(40).fill(3));const sixth=encodeResult(legacy);assert.match(sixth,/^H6\./);assert.equal(readResultLink('https://kuseiro.com/#share='+sixth).title,legacy.title);
});
