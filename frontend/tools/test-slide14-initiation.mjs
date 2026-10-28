import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const source=readFileSync(new URL('../public/ppt-report/document-generation-prototypes.js',import.meta.url),'utf8');
const a=source.indexOf('  slide14: [');const b=source.indexOf('  slide15:',a);
const fields=vm.runInNewContext('('+source.slice(a,b).replace(/^\s*slide14:\s*/,'').replace(/,\s*$/,'')+')');
assert.equal(fields.length,9);assert.ok(fields.every(field=>field.key.startsWith('initiation')));
const c=source.indexOf('  slide14: {',source.indexOf('const PPTX_TABLE_CELL_FIELD_BINDINGS'));const d=source.indexOf('  slide23:',c);
const bindings=vm.runInNewContext('('+source.slice(c,d).replace(/^\s*slide14:\s*/,'').replace(/,\s*$/,'')+')');
assert.ok(Object.keys(bindings).every(key=>key.endsWith(':1')));
const values={initiationCapacity:'5.20',initiationIrr:'7.82%',approvalCapacity:'999',approvalIrr:'99.99%'};
const context=vm.createContext({renderTemplateHeader:()=>'',renderTemplateFooter:()=>'',escapeHtml:String,manualPreviewText:key=>values[key]||''});
vm.runInContext(source.slice(source.indexOf('function renderApprovalChangeSlide'),source.indexOf('function scoreFillCell')),context);
const html=vm.runInContext('renderApprovalChangeSlide({})',context);
assert.match(html,/7.82%/);assert.doesNotMatch(html,/99.99%|999/);
const rows=[...html.matchAll(/<tr>\s*<td>[\s\S]*?<\/tr>/g)];assert.equal(rows.length,9);
for(const row of rows){const cells=[...row[0].matchAll(/<td>([\s\S]*?)<\/td>/g)];assert.equal(cells[2][1].trim(),'');}
console.log('Page 14 checks passed: OA102/manual initiation values on the left; all nine decision cells blank.');
