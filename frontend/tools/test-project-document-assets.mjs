import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFileSync } from 'node:fs';
const source = readFileSync(new URL('../public/ppt-report/document-generation-prototypes.js', import.meta.url), 'utf8');
const segment = source.slice(source.indexOf('const projectAssetPreview ='), source.indexOf('function renderSiteSurveySlide('));
let sequence = 0, rendered = 0;
const revoked = [], requests = [];
class PreviewURL extends URL {
  static createObjectURL() { return `blob:test-${++sequence}`; }
  static revokeObjectURL(value) { revoked.push(value); }
}
const records = [
  { assetId: 'roof', assetType: 'ROOF_SITE_PHOTO', sourcePage: 19, sourceType: 'PROJECT_INITIATION_REPORT' },
  { assetId: 'credit', assetType: 'NATIONAL_ENTERPRISE_CREDIT', sourcePage: 9, sourceType: 'PROJECT_INITIATION_REPORT' },
  { assetId: 'court', assetType: 'COURT_ENFORCEMENT_QUERY', sourcePage: 9, sourceType: 'PROJECT_INITIATION_REPORT' },
];
const state = { projectCode: 'P', pptPage: 'slide24' };
const context = vm.createContext({
  URL: PreviewURL, AbortController, demoState: state,
  window: { location: { href: 'https://platform.example/ppt-risk-report/chatbot-embed' } },
  graphqlEndpoint: () => '/graphql', embedAuthHeaders: () => ({ Authorization: 'Bearer test' }),
  renderDraftPanels: () => rendered++,
  escapeHtml: value => String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('"', '&quot;'),
  fetch: async (url, options) => {
    requests.push({ url, options });
    return url.endsWith('/content') ? { ok: true, blob: async () => ({ type: 'image/jpeg' }) } : { ok: true, json: async () => ({ success: true, data: records }) };
  },
});
vm.runInContext(segment, context);
await vm.runInContext('loadProjectAssetPreview()', context);
assert.equal(requests.length, 4);
assert.ok(requests.every(r => r.options.headers.Authorization === 'Bearer test' && !r.url.includes('Bearer')));
assert.equal(requests[0].url, 'https://platform.example/api/projects/P/document-assets');
let html = vm.runInContext('renderProjectAssetGallery("slide24")', context);
assert.equal((html.match(/<img /g) || []).length, 2);
assert.match(html, /立项报告第 9 页/);
assert.doesNotMatch(html, /屋顶|人工粘贴/);
assert.match(vm.runInContext('renderProjectAssetGallery("slide05")', context), /立项报告第 19 页/);
await vm.runInContext('loadProjectAssetPreview()', context);
assert.equal(requests.length, 4, 'rendering must not refetch loaded images');
await vm.runInContext('loadProjectAssetPreview(true)', context);
assert.equal(revoked.length, 3);
assert.equal(requests.length, 8);
state.projectCode = 'Q';
assert.doesNotMatch(vm.runInContext('renderProjectAssetGallery("slide24")', context), /blob:test/);
context.fetch = async () => ({ ok: true, json: async () => [] });
await vm.runInContext('loadProjectAssetPreview()', context);
assert.match(vm.runInContext('renderProjectAssetGallery("slide24")', context), /未提取/);
assert.equal(revoked.length, 6);
context.fetch = async () => ({ ok: false });
await vm.runInContext('loadProjectAssetPreview(true)', context);
assert.match(vm.runInContext('renderProjectAssetGallery("slide24")', context), /读取失败/);
// A pending response for an old project must not overwrite the new project's images.
let resolveOld;
context.fetch = async () => ({ ok: true, json: () => new Promise(resolve => { resolveOld = resolve; }) });
const old = vm.runInContext('loadProjectAssetPreview(true)', context);
await new Promise(resolve => setImmediate(resolve));
state.projectCode = 'R';
context.fetch = async url => url.endsWith('/content') ? { ok: true, blob: async () => ({ type: 'image/jpeg' }) } : { ok: true, json: async () => [records[0]] };
await vm.runInContext('loadProjectAssetPreview()', context);
resolveOld(records);
await old;
assert.equal(vm.runInContext('projectAssetPreview.projectCode', context), 'R');
assert.equal(vm.runInContext('projectAssetPreview.assets.length', context), 1);
const count = rendered;
vm.runInContext('syncProjectAssetSource("OTHER", "v2")', context);
assert.equal(rendered, count);
vm.runInContext('syncProjectAssetSource("R", "v2")', context);
await new Promise(resolve => setImmediate(resolve));
assert.equal(vm.runInContext('projectAssetPreview.signature', context), 'v2');
assert.equal(vm.runInContext('projectAssetPreview.status', context), 'loaded');
// Partial download failures remain explicit; executable image formats are rejected.
context.fetch = async url => url.endsWith('/content') ? { ok: true, blob: async () => ({ type: 'image/svg+xml' }) } : { ok: true, json: async () => records };
await vm.runInContext('loadProjectAssetPreview(true)', context);
html = vm.runInContext('renderProjectAssetGallery("slide24")', context);
assert.doesNotMatch(html, /<img /);
assert.match(html, /读取失败/);
assert.match(source, /\["slide05", "slide24"\]\.includes\(page.id\)/);
// The parsing workspace shares the same URLs and receives reset/loading/loaded updates.
const notifications = [];
context.captureAssetSnapshot = snapshot => notifications.push(JSON.parse(JSON.stringify(snapshot)));
context.fetch = async url => url.endsWith('/content') ? { ok: true, blob: async () => ({ type: 'image/png' }) } : { ok: true, json: async () => records };
vm.runInContext('var unsubscribeAssets = subscribeProjectAssets(captureAssetSnapshot)', context);
await vm.runInContext('loadProjectAssetPreview(true)', context);
assert.equal(notifications.at(-1).status, 'loaded');
assert.equal(notifications.at(-1).assets.length, 3);
assert.match(notifications.at(-1).assets[0].caption, /立项报告第 19 页/);
assert.equal(notifications.at(-1).assets[0].url, vm.runInContext('projectAssetPreview.assets[0].url', context));
// Source replacement refreshes the workspace even when the report is on another slide.
state.pptPage = 'slide03';
vm.runInContext('syncProjectAssetSource("R", "v3")', context);
await new Promise(resolve => setImmediate(resolve));
assert.equal(notifications.at(-1).status, 'loaded');
assert.ok(notifications.some(s => s.status === 'idle' && s.assets.length === 0));
assert.ok(notifications.some(s => s.status === 'loading' && s.assets.length === 0));
vm.runInContext('unsubscribeAssets()', context);
const delivered = notifications.length;
await vm.runInContext('loadProjectAssetPreview(true)', context);
assert.equal(notifications.length, delivered, 'unmounted workspace receives no updates');
console.log('Asset preview checks passed: authenticated content, page mapping, refresh, version invalidation, project race, empty/error and MIME handling.');
