import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
const source=readFileSync(new URL('../public/ppt-report/document-generation-prototypes.js',import.meta.url),'utf8');
let response={schemaVersion:1,projectCode:'P-1',found:true,provider:'mock',isMock:true,fields:{userIndustry:'化工',legalPerson:'错误的企查查法人',userRegisterCapital:'999',totalAssets2025:'999',qccFinancialYears:'2025,2024,2023'}};
const context=vm.createContext({
 demoState:{projectCode:'P-1',legalPerson:'OA法人',userCompany:'PM用电企业',userRegisterCapital:'23700',totalAssets2025:'80000'},
 userEditedPptFieldKeys:new Set(),aiTrustedDocumentFieldKeys:new Set(['userRegisterCapital','totalAssets2025']),aiTrustedOaFieldKeys:new Set(['legalPerson','userCompany']),
 aiGeneratedPptFieldKeys:new Set(['financeSummary']),
 QCC_FINANCIAL_YEARS:['2025','2024','2023'],pptSlideFields:{slide06:[]},PPTX_TABLE_CELL_FIELD_BINDINGS:{},
 qccFinancialFieldDefinitions:()=>[],qccFinancialCellBindings:()=>({}),
 AbortController,setTimeout,clearTimeout,refreshProjectTemplates(){},renderDraftPanels(){},scheduleBusinessRiskEvaluation(){},qsa:()=>[],embedAuthHeaders:()=>({}),isMissingFieldValue:value=>!value||value==='待填写',
 fetch:async()=>({ok:true,json:async()=>({success:true,data:response})}),
});
vm.runInContext(source.slice(source.indexOf('const enterpriseSyncedFieldKeys'),source.indexOf('// TRACE[PPT-DOC-022]')),context);
await vm.runInContext('loadEnterpriseInformation()',context);
assert.equal(context.demoState.userIndustry,'化工');assert.equal(context.demoState.legalPerson,'OA法人');assert.equal(context.demoState.userRegisterCapital,'23700');assert.equal(context.demoState.totalAssets2025,'80000');
const systemKeys=['userCompany','userNature','projectCompany','projectRegisterCapital','legalPerson','shareholderRatio'];
for(const key of systemKeys) assert.equal(vm.runInContext("ENTERPRISE_REPORT_FIELD_KEYS.has('"+key+"')",context),false);
// Supplements only fill blanks; document and manual financial values have priority.
context.demoState.netProfit2025='';response={...response,fields:{netProfit2025:'500',totalAssets2025:'1',userIndustry:null}};
await vm.runInContext('loadEnterpriseInformation()',context);
assert.equal(context.demoState.netProfit2025,'');
await vm.runInContext('loadEnterpriseInformation({financialOnly:true})',context);
assert.equal(context.demoState.netProfit2025,'500');assert.equal(context.demoState.totalAssets2025,'80000');assert.equal(context.demoState.userIndustry,'');
context.demoState.netProfit2025='人工修正';
response={...response,fields:{netProfit2025:'600'}};await vm.runInContext('loadEnterpriseInformation({financialOnly:true})',context);assert.equal(context.demoState.netProfit2025,'人工修正');
let resolveFetch;context.fetch=()=>new Promise(resolve=>{resolveFetch=resolve;});const pending=vm.runInContext('loadEnterpriseInformation()',context);
context.demoState.projectCode='P-2';vm.runInContext('resetEnterpriseFields()',context);
resolveFetch({ok:true,json:async()=>({success:true,data:{...response,fields:{userIndustry:'旧项目'}}})});await pending;assert.notEqual(context.demoState.userIndustry,'旧项目');
response={...response,projectCode:'P-2',provider:'qcc',isMock:false,fields:{userIndustry:'电气机械制造'}};
context.fetch=async()=>({ok:true,json:async()=>({success:true,data:response})});await vm.runInContext('loadEnterpriseInformation()',context);assert.equal(context.demoState.userIndustry,'电气机械制造');
context.aiTrustedDocumentFieldKeys.clear();context.userEditedPptFieldKeys.clear();
vm.runInContext("applyEnterpriseYears('2022,2020,2019')",context);assert.deepEqual(context.QCC_FINANCIAL_YEARS,['2022','2020','2019']);
for(const key of systemKeys){const pattern=new RegExp('key: "'+key+'", label: "[^"]+", method: "(OA|OA/PM)抓取"');assert.ok(pattern.test(source));}
console.log('Second-edition UI checks passed: six system sources, file/manual priority, blank-only finance, actual years, null clearing and project isolation.');

// Confirming part of a file must leave genuine gaps available to the interface.
 context.window={}; context.qs=()=>null;
context.syncProjectAssetSource=()=>{};context.subscribeProjectAssets=()=>()=>{};context.loadProjectAssetPreview=async()=>{};
context.QCC_FINANCIAL_METRICS=[['totalAssets','总资产'],['netAssets','净资产']];
vm.runInContext(source.slice(source.indexOf('window.__PPT_REPORT_FILE_WORKSPACE ='),source.indexOf('window.__PPT_REPORT_SETUP_PAGE =')),context);
response={...response,fields:{totalAssets2022:'999',netAssets2022:'80',userIndustry:'不得由财务补充修改'}};
context.demoState.userIndustry='原行业';
context.demoState.financeSummary='财务数据完全缺失';
assert.equal(context.window.__PPT_REPORT_FILE_WORKSPACE.apply('P-2',{totalAssets2022:'123'},6,[2022]),true);
const supplemented=await context.window.__PPT_REPORT_FILE_WORKSPACE.supplementFinancial();
assert.equal(supplemented.applied,1);
assert.equal(context.demoState.totalAssets2022,'123');
assert.equal(context.demoState.netAssets2022,'80');
assert.equal(context.demoState.pptPage,'slide06');
assert.equal(context.demoState.userIndustry,'原行业');
assert.equal(context.demoState.financeSummary,'');
// Reconfirmation removes stale interface provenance without clearing another confirmed cell.
context.window.__PPT_REPORT_FILE_WORKSPACE.apply('P-2',{netAssets2022:'90'},6,[2022]);
assert.equal(context.demoState.totalAssets2022,'123');
await context.window.__PPT_REPORT_FILE_WORKSPACE.supplementFinancial();
assert.equal(context.demoState.netAssets2022,'90');
assert.equal(context.demoState.totalAssets2022,'123');
assert.equal(vm.runInContext("enterpriseSyncedFieldKeys.has('netAssets2022')",context),false);
console.log('Mixed finance checks passed: file priority, missing-only supplements, source transfer and current financial page.');

// Entry and company refresh cannot populate finance or change the reporting years.
context.demoState.projectCode='P-3';context.demoState.totalAssets2024='';
vm.runInContext('resetEnterpriseFields()',context);
context.aiTrustedDocumentFieldKeys.clear(); context.userEditedPptFieldKeys.clear();
context.QCC_FINANCIAL_YEARS.splice(0,3,'2024');
response={schemaVersion:1,projectCode:'P-3',found:true,provider:'mock',isMock:true,fields:{qccFinancialYears:'2025,2024,2023',totalAssets2025:'100',totalAssets2024:'200',netAssets2024:'0',userIndustry:'制造业'}};
await vm.runInContext('loadEnterpriseInformation({reveal:false})',context);
assert.equal(context.demoState.totalAssets2025,'');
assert.equal(context.demoState.totalAssets2024,'');
assert.deepEqual(context.QCC_FINANCIAL_YEARS,['2024']);
assert.equal(context.demoState.userIndustry,'制造业');
// A confirmed year constrains import; zeros and manual entries are real values.
context.window.__PPT_REPORT_FILE_WORKSPACE.apply('P-3',{totalAssets2024:'0'},6,[2024]);
context.demoState.currentRatio2024='1.5';context.userEditedPptFieldKeys.add('currentRatio2024');
response.fields.currentRatio2024='9';
let imported=await context.window.__PPT_REPORT_FILE_WORKSPACE.supplementFinancial();
assert.equal(imported.applied,1);assert.equal(imported.isMock,true);
assert.equal(context.demoState.totalAssets2024,'0');assert.equal(context.demoState.netAssets2024,'0');
assert.equal(context.demoState.currentRatio2024,'1.5');assert.equal(context.demoState.totalAssets2025,'');
assert.deepEqual(context.QCC_FINANCIAL_YEARS,['2024']);
assert.match(vm.runInContext('financialImportMessage',context),/样例/);
response.fields.netAssets2024='500';
imported=await context.window.__PPT_REPORT_FILE_WORKSPACE.supplementFinancial();
assert.equal(imported.applied,0);assert.equal(context.demoState.netAssets2024,'0');
await vm.runInContext('loadEnterpriseInformation()',context);
assert.equal(context.demoState.netAssets2024,'0');
// Import failures preserve both file facts and existing imported values.
context.fetch=async()=>({ok:false,json:async()=>({message:'服务不可用'})});
await assert.rejects(context.window.__PPT_REPORT_FILE_WORKSPACE.supplementFinancial(),/服务不可用/);
assert.equal(context.demoState.totalAssets2024,'0');assert.equal(context.demoState.netAssets2024,'0');
// A delayed import cannot land in the next project.
context.fetch=()=>new Promise(resolve=>{resolveFetch=resolve;});
const stale=context.window.__PPT_REPORT_FILE_WORKSPACE.supplementFinancial();
context.demoState.projectCode='P-4';vm.runInContext('resetEnterpriseFields()',context);
resolveFetch({ok:true,json:async()=>({success:true,data:response})});
await assert.rejects(stale,/项目已变化/);assert.equal(context.demoState.netAssets2024,'');
assert.equal(vm.runInContext('financialImportMessage',context),'');
// Even the initial offline view has no seeded financial numbers or conclusions.
const initial=vm.runInNewContext(source.slice(source.indexOf('const demoState ='),source.indexOf('const demoState =')+source.slice(source.indexOf('const demoState =')).indexOf('\n};')+3)+';demoState');
for(const [key,value] of Object.entries(initial)) if(/^(totalAssets|netAssets|operatingRevenue|netProfit|cashFunds|netProfitRate|roe|currentRatio|quickRatio|debtRatio)20\d{2}$/.test(key)||['financeSummary','profitabilityAnalysis','operationCashflowAnalysis','assetDebtAnalysis'].includes(key)) assert.equal(value,'',key);
assert.match(source,/data-financial-import/);
console.log('Manual finance import passed: blank entry, explicit import, correct years, zero/manual/file priority, idempotence, failures and project races.');

vm.runInContext(source.slice(source.indexOf('function entryAiDraftFields'),source.indexOf('// 动态方案')),context);
const filtered=vm.runInContext('entryAiDraftFields({totalAssets2025:"123", financeSummary:"autofill", profitabilityAnalysis:"autofill", operationCashflowAnalysis:"autofill", assetDebtAnalysis:"autofill", decisionSummary:"项目总结"})',context);
assert.deepEqual(Object.keys(filtered),['decisionSummary']);
console.log('Entry AI draft cannot silently refill financial numbers or analysis.');
