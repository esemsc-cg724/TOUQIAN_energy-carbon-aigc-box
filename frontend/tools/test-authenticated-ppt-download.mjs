import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';import vm from 'node:vm';
const source=readFileSync(new URL('../public/ppt-report/document-generation-prototypes.js',import.meta.url),'utf8');
const calls=[],links=[];let status=200,payload='PK-test';
class TestURL extends URL {static createObjectURL(){return 'blob:test'}static revokeObjectURL(){}}
const context=vm.createContext({URL:TestURL,window:{location:{href:'http://127.0.0.1:5174/ppt-risk-report'}},graphqlEndpoint:()=>'/graphql',embedAuthHeaders:()=>({Authorization:'Bearer test-token'}),setTimeout:()=>1,
 fetch:async(url,options)=>{calls.push({url,options});return{ok:status===200,status,blob:async()=>new Blob([payload])}},
 document:{body:{appendChild:()=>{}},createElement:()=>{const link={click(){link.clicked=true},remove(){}};links.push(link);return link;}}});
vm.runInContext(source.slice(source.indexOf('async function downloadGeneratedPpt'),source.indexOf('function renderOutput')),context);
context.cachedBlob=await vm.runInContext('downloadGeneratedPpt("/outputs/ppt-report/report.pptx","报告.pptx")',context);
await vm.runInContext('downloadGeneratedPpt("/outputs/ppt-report/report.pptx","报告.pptx",cachedBlob)',context);
assert.equal(calls.length,1,'Repeat save must reuse the fetched file because backend links are single-use');
assert.equal(calls[0].options.headers.Authorization,'Bearer test-token');assert.equal(links[0].download,'报告.pptx');assert.equal(links[0].clicked,true);
await assert.rejects(vm.runInContext('downloadGeneratedPpt("https://other.example/outputs/ppt-report/a.pptx","a.pptx")',context),/地址无效/);
assert.equal(calls.length,1);
status=401;await assert.rejects(vm.runInContext('downloadGeneratedPpt("/outputs/ppt-report/a.pptx","a.pptx")',context),/重新登录/);
status=200;payload='<html>error';await assert.rejects(vm.runInContext('downloadGeneratedPpt("/outputs/ppt-report/a.pptx","a.pptx")',context),/不是有效/);
console.log('PPT download passed: bearer auth, backend-origin confinement, 401 guidance, binary validation and browser save.');
