import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const source = readFileSync(new URL('../public/ppt-report/document-generation-prototypes.js', import.meta.url), 'utf8');
const calls = [];
let request = async () => ({ items: [{ id: 'P-1', name: '烨和祥', projectCode: 'YHX' }] });
const context = vm.createContext({
  demoState: { projectCode: 'UNSELECTED' }, PROJECT_OPTIONS: [], projectSearchRequestSeq: 0,
  document: {}, qsa: () => [], selectedProject: () => null,
  escapeHtml: value => String(value).replaceAll('<', '&lt;'), projectSearchResultMeta: item => item.projectCode,
  requestOaPptProjects: async options => { calls.push(options); return request(options); },
  applyOaPptProjectListPayload: result => {
    context.PROJECT_OPTIONS = result.items;
    context.demoState.oaProjectListLoadStatus = 'success';
  },
});
vm.runInContext(source.slice(source.indexOf('function renderProjectSearchResults()'), source.indexOf('function selectedProject()')), context);
await vm.runInContext("runProjectKeywordSearch('')", context);
assert.equal(calls[0].keyword, undefined);
assert.equal(calls[0].limit, 10);
assert.match(vm.runInContext('renderProjectSearchResults()', context), /烨和祥/);
assert.equal(context.demoState.projectCode, 'UNSELECTED');
await vm.runInContext("runProjectKeywordSearch('烨和祥')", context);
assert.equal(calls[1].keyword, '烨和祥');
request = async () => { throw new Error('登录已过期'); };
await vm.runInContext("runProjectKeywordSearch('')", context);
assert.match(vm.runInContext('renderProjectSearchResults()', context), /登录已过期/);
assert.equal(context.PROJECT_OPTIONS.length, 0);
request = async () => ({ items: [] });
await vm.runInContext("runProjectKeywordSearch('不存在')", context);
assert.match(vm.runInContext('renderProjectSearchResults()', context), /暂无匹配项目/);
let finishOld;
request = options => options.keyword === '旧' ? new Promise(resolve => { finishOld = resolve; }) : Promise.resolve({ items: [{ id: 'NEW', name: '新结果' }] });
const old = vm.runInContext("runProjectKeywordSearch('旧')", context);
await vm.runInContext("runProjectKeywordSearch('新')", context);
finishOld({ items: [{ id: 'OLD', name: '旧结果' }] });
await old;
assert.equal(context.PROJECT_OPTIONS[0].id, 'NEW');
const closed = vm.runInContext("runProjectKeywordSearch('旧')", context);
vm.runInContext('projectSearchRequestSeq++; demoState.projectSearchResultsVisible = false;', context);
finishOld({ items: [{ id: 'OLD', name: '旧结果' }] });
await closed;
assert.equal(vm.runInContext('renderProjectSearchResults()', context), '');
console.log('Project dropdown checks passed: empty browsing, keyword search, no automatic selection, visible errors, no results and stale request isolation.');
