// tools/test-file-parser-report-bridge.mjs
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
const source = readFileSync(new URL('../public/ppt-report/document-generation-prototypes.js', import.meta.url), 'utf8');
const start = source.indexOf('window.__PPT_REPORT_FILE_WORKSPACE =');
const end = source.indexOf('window.__PPT_REPORT_SETUP_PAGE =', start);
const context = {
  window: {}, demoState: { projectCode: 'P-1', financeSummary: '已核对的财务结论', projectCompanyCapital: '100', priorPostEval: '已核对的前序项目' },
  QCC_FINANCIAL_METRICS: [['totalAssets', '总资产'], ['netAssets', '净资产']], QCC_FINANCIAL_YEARS: ['2025', '2024', '2023'],
  pptSlideFields: { slide06: [] }, PPTX_TABLE_CELL_FIELD_BINDINGS: {},
  aiTrustedDocumentFieldKeys: new Set(), userEditedPptFieldKeys: new Set(),
  enterpriseSyncedFieldKeys: new Set(), enterpriseLastAppliedValues: new Map(),
  clearUnverifiedFinancialAnalyses: () => {}, scheduleBusinessRiskEvaluation: () => {},
  qccFinancialFieldDefinitions: () => [], qccFinancialCellBindings: () => ({}),
  renderDraftPanels: () => {}, qsa: () => [], qs: () => null,
  syncProjectAssetSource: () => {},
  subscribeProjectAssets: () => () => {},
  loadProjectAssetPreview: async () => {},
};
const bindingStart = source.indexOf('function qccFinancialCellBindings() {');
const bindingEnd = source.indexOf('// TRACE[PPT-TEMPLATE-NEW-005]', bindingStart);
vm.runInNewContext(source.slice(bindingStart, bindingEnd), context);
vm.runInNewContext(source.slice(start, end), context);
const bridge = context.window.__PPT_REPORT_FILE_WORKSPACE;
assert.equal(bridge.apply('P-2', { userRegisterCapital: '900' }, 20), false);
assert.equal(context.demoState.userRegisterCapital, undefined);
assert.equal(bridge.apply('P-1', { userRegisterCapital: '900', projectCode: 'P-2', unknownField: 'bad' }, 20), true);
assert.equal(context.demoState.projectCode, 'P-1');
assert.equal(context.demoState.userRegisterCapital, '900');
assert.equal(context.demoState.projectCompanyCapital, '100');
assert.equal(context.demoState.unknownField, undefined);
assert.equal(context.demoState.financeSummary, '已核对的财务结论');
assert.equal(context.demoState.priorPostEval, '已核对的前序项目');
assert.equal(bridge.apply('P-1', { totalAssets2024: '1234' }, 6), true);
assert.equal(context.demoState.totalAssets2024, '1234');
assert.deepEqual(Array.from(context.QCC_FINANCIAL_YEARS), ['2024']);
assert.equal(bridge.apply('P-1', { totalAssets2025: '2500', totalAssets2023: '2300', totalAssets2021: '2100' }, 6, [2025, 2023, 2021]), true);
assert.deepEqual(Array.from(context.QCC_FINANCIAL_YEARS), ['2025', '2023', '2021']);
assert.equal(context.demoState.totalAssets2021, '2100');
assert.equal(context.demoState.financialPeriodLabel2, '2021年');
assert.equal(context.PPTX_TABLE_CELL_FIELD_BINDINGS.slide06['0:4:0'], 'financialPeriodLabel2');
assert.equal(context.demoState.netAssets2025, '');
assert.equal(context.aiTrustedDocumentFieldKeys.has('netAssets2025'), false);
assert.equal(context.userEditedPptFieldKeys.has('netAssets2025'), false);
assert.equal(bridge.apply('P-1', { totalAssets2023: '2301' }, 6, [2023]), true);
assert.deepEqual(Array.from(context.QCC_FINANCIAL_YEARS), ['2023']);
assert.equal(context.demoState.financialPeriodLabel1, '');
assert.equal(context.demoState.financialPeriodLabel2, '');
assert.equal(context.demoState.financialEmpty1_0, '');
assert.equal(bridge.apply('P-1', { totalAssets2023: 'bad' }, 6, [2023, 2023]), false);
assert.equal(context.demoState.totalAssets2023, '2301');
assert.equal(bridge.apply('P-1', { totalAssets2025: 'bad' }, 6, [2025, 2023, 2021, 2019]), false);
console.log('Report bridge checks passed: project isolation, field whitelist, category preservation, reporting years.');

context.PPTX_TABLE_CELL_FIELD_BINDINGS.slide10 = {};
assert.equal(bridge.apply('P-1', {contractTerm:'25年',contractKeyClauses:'电价：0.495元/kWh\n屋顶场地租金：无偿\n消纳：优先供甲方使用',emcBusinessSummary:'整段商务总结'}, 10),true);
assert.match(context.demoState.tariffTerm,/0.495/);
assert.equal(context.demoState.roofRentTerm,'屋顶场地租金：无偿');
assert.equal(context.demoState.consumptionTerm,'消纳：优先供甲方使用');
assert.ok(!context.demoState.tariffTerm.includes('整段商务总结'));
console.log('EMC bridge checks passed: confirmed original clauses populate separate rows.');
