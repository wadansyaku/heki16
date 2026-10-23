import test from 'node:test';
import assert from 'node:assert/strict';
import {diagnoseConnections} from '../tools/improvement/doctor.mjs';
test('free plan diagnosis never starts inference, reads credentials or prints environment values',async()=>{
 const calls=[],secret='DO_NOT_PRINT_ME',result=await diagnoseConnections({env:{IMPROVEMENT_ANTHROPIC_API_KEY:secret,XAI_API_KEY:secret},probeCommand:async(cmd,args)=>{calls.push([cmd,args]);return cmd==='claude'?'1.0.115 (Claude Code)':null;}});
 assert.equal(result.claude.automaticExecutionEnabled,false);assert.equal(result.claude.hostCliVersion,'1.0.115');assert.equal(result.claude.minimumVersion,false);
 assert.ok(result.claude.blockers.includes('FREE_PLAN_DOES_NOT_INCLUDE_CODE'));assert.ok(result.claude.blockers.includes('DOCKER_UNAVAILABLE'));
 assert.equal(result.inferenceRequests,0);assert.equal(result.paidRequests,0);assert.ok(!JSON.stringify(result).includes(secret));
 assert.deepEqual(calls,[['claude',['--version']],['docker',['info','--format','{{.ServerVersion}}']]]);
});
test('paid plan and installed tools alone cannot authorize a run',async()=>{
 const result=await diagnoseConnections({claudePlan:'paid',env:{},probeCommand:async cmd=>cmd==='claude'?'2.1.292 (Claude Code)':'29.1.0'});
 assert.equal(result.claude.minimumVersion,true);assert.equal(result.claude.automaticExecutionEnabled,false);assert.ok(result.claude.blockers.includes('APPROVED_IMAGE_AND_SPEC_REQUIRED'));
});
