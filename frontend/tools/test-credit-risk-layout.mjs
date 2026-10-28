import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const frontend=readFileSync(new URL('../public/ppt-report/document-generation-prototypes.js',import.meta.url),'utf8');
const backend=readFileSync(new URL('../../../energy-carbon-aigc-backend/assets/ppt-report/scripts/generate_pv_risk_ppt_from_template.mjs',import.meta.url),'utf8');
const summaryBlock=source=>source.slice(source.indexOf('// Page 4 uses'),source.indexOf('\nfunction ',source.indexOf('function policyRiskParagraphs')));
assert.equal(summaryBlock(frontend),summaryBlock(backend),'Browser and PPT export must use identical summaries');
const context=vm.createContext({demoState:{businessStatus:'存续'},PPTX_TEMPLATE_PREVIEW_BASE_WIDTH:920,
  templatePreviewSourceWidth:()=>1280,safeCssNumber:value=>value,scaledInset:value=>`${value*920/1280}px`,
  pptxRectStyle:()=>({}),cssDecls:style=>Object.entries(style).map(([key,value])=>`${key}:${value}`).join(';'),
  escapeHtml:value=>String(value)});
vm.runInContext(summaryBlock(frontend),context);
for (const [value,expected] of [
  ['','待补充'],['未查询到相关记录','无记录'],['查询到相关记录（共0条）','无记录'],
  ['查询到相关记录（共1条）；状态：已解除质押','1条（已解除）'],
  ['查询到相关记录（本页1条）；移出日期：2023-09-18','1条（已移出）'],
  ['查询到相关记录（共1条）；状态：未解除质押','1条'],
  ['查询到相关记录（共1条）；状态：未履行','1条'],
]) assert.equal(vm.runInContext(`creditRiskFinding(${JSON.stringify(value)})`,context),expected);
const empty=vm.runInContext('creditRiskParagraphs(demoState)',context);
assert.equal(empty.length,5);assert.match(empty[4],/待补充/);assert.doesNotMatch(empty[4],/干净|未见/);
vm.runInContext(frontend.slice(frontend.indexOf('function renderCreditRiskOverlay'),frontend.indexOf('function renderPptxImageOverlayText')),context);
const html=vm.runInContext('renderCreditRiskOverlay({rect:{}},0,"qccRiskSummary")',context);
assert.match(html,/font-family:微软雅黑/);assert.match(html,/color:#BF9000/);assert.match(html,/font-size:15\.333/);
assert.match(html,/font-weight:400/);assert.match(html,/font-weight:700/);assert.match(html,/企业资信与司法风险/);
console.log('Page 4 passed: shared summary, missing/negative states, template typography and paragraph hierarchy.');
