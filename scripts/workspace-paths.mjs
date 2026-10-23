import os from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

export const WORKSPACE_ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..','..');
export const WORKSPACE_PATHS=Object.freeze({
 app:path.join(WORKSPACE_ROOT,'app'),
 operations:path.join(WORKSPACE_ROOT,'operations'),
 private:path.join(WORKSPACE_ROOT,'private'),
 admin:path.join(WORKSPACE_ROOT,'operations','admin')
});

// Submitted records retain their original bytes and hashes after a directory move.
export function resolveRecordedPath(file,{workspaceRoot=WORKSPACE_ROOT,home=os.homedir()}={}){
 if(typeof file!=='string'||!path.isAbsolute(file)||file.includes('\0'))throw Error('INVALID_RECORDED_PATH');
 const value=path.normalize(file);
 const previousRoot=path.join(home,'NOCTURNE');
 if(value===previousRoot||value.startsWith(previousRoot+path.sep))return path.join(workspaceRoot,path.relative(previousRoot,value));
 const aliases=[['heki16-operations','operations'],['heki16-private','private'],['heki16','app'],['nocturne-admin',path.join('operations','admin')]];
 for(const [oldName,newName]of aliases){
  const oldRoot=path.join(home,oldName);
  if(value===oldRoot||value.startsWith(oldRoot+path.sep))return path.join(workspaceRoot,newName,path.relative(oldRoot,value));
 }
 return value;
}
