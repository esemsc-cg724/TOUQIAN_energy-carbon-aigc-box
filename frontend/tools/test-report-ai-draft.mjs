import assert from 'node:assert/strict';import vm from 'node:vm';import {readFileSync}from'node:fs';
const source=readFileSync(new URL('../public/ppt-report/document-generation-prototypes.js',import.meta.url),'utf8');
const functionText=source.slice(source.indexOf('const reportAiDraftRequests'),source.indexOf('function setupPptReviewEvents'));
let request,rendered=0;
const state={projectCode:'P'};
const context=vm.createContext({URL,Set,JSON,pickTrustedFields:()=>({}),demoState:state,aiGeneratedPptFieldKeys:new Set(),graphqlEndpoint:()=> 'http://127.0.0.1:3000/graphql',embedAuthHeaders:()=>({Authorization:'Bearer test'}),renderDraftPanels:()=>rendered++,fetch:async(url,input)=>{request={url:String(url),input};return{ok:true,json:async()=>({data:{projectCode:'P',kind:'CREDIT',provider:'ollama',model:'test',inputHash:'hash',fields:{creditRiskConclusion:'接口样例，待核验'}}})};}});
context.window={location:{href:'https://platform.example/ppt-risk-report/chatbot-embed'}};
vm.runInContext(functionText,context);context.button={dataset:{reportAiKind:'CREDIT'}};
await vm.runInContext('generateReportAiDraft(button)',context);
assert.equal(state.creditRiskConclusion,'接口样例，待核验');assert.equal(rendered,1);assert.equal(request.url,'http://127.0.0.1:3000/api/projects/P/ppt-report/ai-draft');assert.deepEqual(JSON.parse(request.input.body),{kind:'CREDIT',fields:{}});assert.match(state.reportAiDraftProvenanceJson,/PENDING/);
for(const endpoint of ['/graphql','graphql']){
 context.graphqlEndpoint=()=>endpoint;
 await vm.runInContext('generateReportAiDraft(button)',context);
 assert.equal(request.url,'https://platform.example/api/projects/P/ppt-report/ai-draft');
 assert.equal(state.creditRiskConclusion,'接口样例，待核验');
 assert.equal(context.button.disabled,false);
}
context.aiTrustedOaFieldKeys=new Set();context.aiTrustedDocumentFieldKeys=new Set();context.userEditedPptFieldKeys=new Set();
vm.runInContext(source.slice(source.indexOf('function clearTrustedAiInputSources()'),source.indexOf('function isTrustedAiInputField')),context);
vm.runInContext('clearTrustedAiInputSources()',context);assert.equal(state.creditRiskConclusion,'');assert.equal(state.reportAiDraftProvenanceJson,'{}');
context.fetch=async()=>({ok:true,json:async()=>({data:{projectCode:'OTHER',fields:{creditRiskConclusion:'wrong project'}}})});await vm.runInContext('generateReportAiDraft(button)',context);assert.equal(state.creditRiskConclusion,'');
console.log('Report AI frontend checks passed: authenticated endpoint, kind-only input, provenance, project-change clearing, cross-project result rejection.');
