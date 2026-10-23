import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
const exec=promisify(execFile);
const probe=async(command,args)=>{try{return (await exec(command,args,{timeout:5000,maxBuffer:4096,env:{PATH:process.env.PATH}})).stdout.trim();}catch{return null;}};
export async function diagnoseConnections({claudePlan='free',probeCommand=probe,env=process.env}={}){
 if(!['free','paid'].includes(claudePlan))throw Error('INVALID_PLAN');
 const versionText=await probeCommand('claude',['--version']);
 const version=/^(\d+\.\d+\.\d+)\b/.exec(versionText||'')?.[1]||null;
 const minimumVersion=version!==null&&/^2\.1\.\d+$/.test(version)&&Number(version.split('.')[2])>=286;
 const dockerAvailable=!!await probeCommand('docker',['info','--format','{{.ServerVersion}}']);
 const dedicatedApiKeyPresent=!!env.IMPROVEMENT_ANTHROPIC_API_KEY;
 return {version:1,claude:{declaredPlan:claudePlan,hostCliVersion:version,minimumVersion,dockerAvailable,dedicatedApiKeyPresent,
  automaticExecutionEnabled:false,blockers:[...(claudePlan==='free'?['FREE_PLAN_DOES_NOT_INCLUDE_CODE']:[]),...(!minimumVersion?['CLI_UPDATE_REQUIRED']:[]),...(!dockerAvailable?['DOCKER_UNAVAILABLE']:[]),...(!dedicatedApiKeyPresent?['DEDICATED_API_KEY_REQUIRED']:[]),'APPROVED_IMAGE_AND_SPEC_REQUIRED','PAID_AND_EXTERNAL_EXECUTION_DISABLED'],
  note:'ホストCLIの検査のみ。実行時は承認済みDocker内のCLIと隔離・費用上限を別途検証する。'},
  x:{bearerTokenPresent:!!env.X_BEARER_TOKEN,automaticExecutionEnabled:false},grok:{apiKeyPresent:!!env.XAI_API_KEY,automaticExecutionEnabled:false},
  inferenceRequests:0,paidRequests:0,credentialsPrinted:false};
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 try{const args=process.argv.slice(2);if(args.length&&!(args.length===2&&args[0]==='--claude-plan'))throw Error('INVALID_ARGS');console.log(JSON.stringify(await diagnoseConnections({claudePlan:args[1]||'free'}),null,2));}catch{console.error('{"error":"CONNECTION_DIAGNOSIS_FAILED"}');process.exitCode=2;}
}
