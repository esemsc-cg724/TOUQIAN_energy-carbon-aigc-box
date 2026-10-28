import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const source=readFileSync(new URL('../public/ppt-report/document-generation-prototypes.js',import.meta.url),'utf8');
const state={projectCode:'A',oaProjectLoadSource:{provider:'oa-pg+pm-mysql-live'}};
let response;
const calls=[];
const context=vm.createContext({demoState:state, aiTrustedOaFieldKeys:new Set(), enterpriseSyncedFieldKeys:new Set(['fkxz8']),enterpriseLastAppliedValues:new Map(),
  renderDraftPanels:()=>{},graphqlHeaders:()=>({}),clearTimeout:()=>{},setTimeout:()=>1,AbortSignal,
  fetch:async(url,options)=>{calls.push({url,body:JSON.parse(options.body)});return await response;}});
vm.runInContext(source.slice(source.indexOf('let businessRiskTimer'),source.indexOf('function applyOaPptProjectPayload')),context);
response={ok:true,json:async()=>({success:true,data:{projectCode:'A',fields:{fkxz4:'×',fkxz8:'待确认',returnConclusion:'待确认',projectName:'MALICIOUS'}}})};
await vm.runInContext('refreshBusinessRiskEvaluation()',context);
assert.equal(state.fkxz4,'×');assert.equal(state.fkxz8,'待确认');assert.equal(state.projectName,undefined);
assert.match(calls[0].url,/\/A\/ppt-report\/risk-rules$/);
assert.deepEqual(Object.keys(calls[0].body.fields),['manualRiskDecisionsJson']);
let resolveOld;
response=new Promise(resolve=>{resolveOld=resolve;});
const old=vm.runInContext('refreshBusinessRiskEvaluation()',context);
state.projectCode='B';state.fkxz4='B-current';
resolveOld({ok:true,json:async()=>({success:true,data:{projectCode:'A',fields:{fkxz4:'✓'}}})});await old;
assert.equal(state.fkxz4,'B-current');
response=Promise.reject(new Error('network_down'));
await assert.rejects(vm.runInContext('refreshBusinessRiskEvaluation()',context),/network_down/);
assert.equal(state.fkxz4,'待确认');assert.equal(state.returnConclusion,'待确认');
assert.match(source,/result\.riskRules\) applyBusinessRiskEvaluation/);
assert.match(source,/const riskCondition =/);
console.log('Page 9 preview passed: scoped server decisions, no browser financial spoofing, stale-response rejection and failure clearing.');

const controls=vm.createContext({fieldValue:()=> '×（接口样例）', businessRiskFieldHint:()=> '接口样例资本大于1000万元', escapeHtml:String, methodTone:()=>''});
vm.runInContext(source.slice(source.indexOf('function pptFieldControl'),source.indexOf('function admissionImageMarkup')),controls);
const control=vm.runInContext('pptFieldControl({key:"fkxz8",label:"资本",method:"规则"})',controls);
assert.match(control,/<option value="不触发" selected>×（接口样例）/);
assert.match(control,/title="接口样例资本大于1000万元"/);
