import fs from 'node:fs';
import {DatabaseSync} from 'node:sqlite';
export class D1 {
 constructor(){this.db=new DatabaseSync(':memory:');for(const f of fs.readdirSync('migrations').sort())this.db.exec(fs.readFileSync('migrations/'+f,'utf8'));}
 prepare(sql){const db=this.db;return {args:[],bind(...args){this.args=args;return this;},async first(key){const r=db.prepare(sql).get(...this.args);return key?r?.[key]:r||null;},async all(){return {results:db.prepare(sql).all(...this.args)};},async run(){const r=db.prepare(sql).run(...this.args);return {meta:{changes:Number(r.changes)},results:[]};}};}
 async batch(list){this.db.exec('BEGIN');try{const results=[];for(const q of list)results.push(await q.all());this.db.exec('COMMIT');return results;}catch(e){this.db.exec('ROLLBACK');throw e;}}
}
