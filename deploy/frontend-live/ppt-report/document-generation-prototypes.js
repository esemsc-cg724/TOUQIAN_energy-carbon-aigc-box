/**
 * PPT 文档生成最小前端。
 *
 * 这个文件只负责三件事：
 * 1. 保存用户选择项目、LangGraph 返回字段、人工修改字段形成的统一字段对象。
 * 2. 用同一批字段渲染网页里的“模拟 PPT”，让用户能实时预览修改效果。
 * 3. 点击生成时把字段 JSON 发给后端 `/api/ppt/generate`，由后端写入真实 PPTX 模板。
 *
 * 注意：网页里的模拟 PPT 不是最终文件，最终文件永远由后端基于真实 PPTX 模板生成。
 */
const demoState = {
  docType: "ppt",
  // TRACE[PPT-CHAT-006]: PPT 预览默认用“适宽”，比全页适配更大；用户可再切换全页或自定义缩放。
  pptPreviewZoomMode: "fitWidth",
  pptPreviewZoom: 0.85,
  projectId: "suzhou-oulai",
  projectName: "苏州欧莱屋顶分布式光伏项目",
  projectCode: "ZNE-2024-SZ-028",
  selfScore: "85",
  businessDept: "项目风控部",
  manager: "张经理",
  projectType: "屋顶分布式光伏",
  address: "苏州市吴中区",
  city: "苏州",
  roofArea: "35866.09",
  capacity: "3.5866",
  developMode: "开发 / 投标",
  operationYears: "25",
  investment: "1685.71",
  irr: "10.72",
  payback: "8.26",
  milestone: "商务合同签订、备案、电网接入意见办理中",
  consumptionRatio: "90%",
  desulfurPrice: "0.3910 元/kWh",
  priceDiscount: "90%/固定电价",
  powerPrice: "0.6448 元/kWh",
  accessVoltage: "10",
  transformerCapacity: "1250",
  userCompany: "苏州欧莱新能源配套有限公司",
  userNature: "民营企业",
  userRegisterCapital: "5000",
  userIndustry: "制造业",
  projectCompany: "苏州欧莱光伏项目有限公司",
  projectRegisterCapital: "1000",
  shareholderRatio: "控股股东持股100%",
  roofOwner: "苏州欧莱厂区",
  roofType: "彩钢瓦 / 混凝土",
  roofLeaseArea: "35866.09㎡",
  roofRent: "21.52 万元/年",
  scoreLoss: "企业资料完整度、用电数据仍需核验",
  advantage: "1. 企业母公司与我司曾有项目合作，且目前项目运行状态正常，有一定的合作信任和合作基础；\n\n2. XXXX",
  riskMeasure: "1、企业涉及铺设区域较多，且尚无消防验收证书，请注意后续运维管理，后续补充完整产权证；\n\n2、XXXX",
  departmentOpinion: "该项目涉及容量及区域较大，建议后续施工和运维过程中加强过程和时间的管理，并在企业完成消防验收后及时补充和跟进后续产权证的办理进度。企业2025年上半年营收明显增加，且达产率已经上升至80%，生产经营较为稳定。综上，建议项目实施。",
  coverDate: "2025年5月",
  qccRisk: "股权质押无、被执行记录无、纳税信用等级A级",
  financeSummary: "",
  industryOverview: "行业需求保持平稳，需结合企业订单和产能情况持续判断。",
  policyText: "拟补充项目所在地分布式光伏支持政策。",
  boundaryText: "装机容量、运营年限、电价、租金、运维费用等测算边界已形成初稿。",
  reviewMeeting: "立项会意见待补充。",
  annualGeneration: "371.9 万度",
  annualRevenue: "238.4 万元",
  sensitivityAuto: "如电价下降5分，IRR需结合测算模型复核；如电价上涨5分，IRR需结合测算模型复核。",
  consumptionSensitivityAuto: "自发自用比例降低10%时，IRR需结合测算模型复核。",
  legalPerson: "王某",
  registerCapital: "5000 万元",
  equityInfo: "项目公司股权结构待企查查结果复核。",
  equityPledge: "无",
  executionRecord: "无",
  movableMortgage: "无",
  noDishonestExecution: "无失信被执行人",
  businessStatus: "存续",
  operationAbnormal: "无经营异常",
  seriousIllegal: "无严重违法失信",
  taxCredit: "A级",
  // TRACE[PPT-TEMPLATE-NEW-003]: 以下字段来自新版《新PPT模版字段提取表》。
  // 它们先作为本地演示值参与预览和 GraphQL payload，正式接 OA/企查查/AI 后再由对应适配器覆盖。
  productionCapacity: "厂区一期已进入试生产，生产率约 80%。",
  majorCustomers: "主要服务集团内部及周边制造客户。",
  workMode: "24小时生产，年生产约350天。",
  policyComplianceRisk: "暂未发现明确政策限制，需以项目所在地正式政策为准。",
  qccConclusion: "企业资信干净，无司法与信用硬伤。",
  propertyCertificateStatus: "新建厂房产证及消防验收资料待补充。",
  // TRACE[PPT-FE-OA-005]: 项目下拉选择后会读取后端 pptOaProject(projectCode)，并把 OA 标准字段写回 demoState。
  // 这些状态只用于页面提示和后续 AI 失分点上下文，不参与最终 PPT 模板占位替换。
  oaProjectLoadStatus: "idle",
  oaProjectLoadedProjectCode: "",
  oaProjectLoadMessage: "",
  oaProjectLoadWarnings: [],
  oaProjectLoadSource: null,
  oaScoreLossDetails: [],
  // TRACE[PPT-FE-OA-LIST-004]: 项目搜索状态只影响搜索结果框，不直接写入 PPT 字段。
  oaProjectListLoaded: false,
  oaProjectListLoadMessage: "",
  oaProjectListLoadSource: null,
  oaProjectListLoadStatus: "idle",
  oaProjectListWarnings: [],
  // TRACE[PPT-FE-OA-SEARCH-001]: 项目入口改成“空白搜索框 + 下方结果列表”。
  // 搜索只更新候选项目，不自动切换当前项目；点击结果后才同步 OA 字段。
  projectSearchKeyword: "",
  projectSearchResultsVisible: false,
  // TRACE[PPT-COMPLIANCE-001]: 第 8 页按 PPTX 源文件的 8 行“办理进展”逐行维护。
  // 第三列“风险项提示”是模板固定评判标准，不从左侧字段覆盖。
  compliancePropertyProgress: "新建厂房产证及消防验收资料待补充。",
  complianceFilingProgress: "商务合同签订、备案办理中。",
  complianceAccessPlanProgress: "接入方案资料待补充。",
  complianceAccessApprovalProgress: "电网接入意见/接入批复办理中。",
  complianceBusinessLicenseProgress: "用电企业营业执照待上传复核。",
  complianceFranchiseProgress: "如涉及特许经营权文件则补充。",
  complianceLeaseProgress: "用电方与产权方一致性、租赁合同待复核。",
  complianceOtherProgress: "其他合规文件待人工补充。",
  totalAssets: "待企查查同步",
  netAssets: "待企查查同步",
  operatingRevenue: "待企查查同步",
  netProfit: "待企查查同步",
  cashFunds: "待企查查同步",
  netProfitRate: "待企查查同步",
  roe: "待企查查同步",
  currentRatio: "待企查查同步",
  quickRatio: "待企查查同步",
  debtRatio: "待企查查同步",
  // TRACE[PPT-QCC-001]: 财务字段初始为空；财务文件优先，企查查仅由用户手动导入补缺。
  totalAssets2025: "",
  netAssets2025: "",
  operatingRevenue2025: "",
  netProfit2025: "",
  cashFunds2025: "",
  netProfitRate2025: "",
  roe2025: "",
  currentRatio2025: "",
  quickRatio2025: "",
  debtRatio2025: "",
  totalAssets2024: "",
  netAssets2024: "",
  operatingRevenue2024: "",
  netProfit2024: "",
  cashFunds2024: "",
  netProfitRate2024: "",
  roe2024: "",
  currentRatio2024: "",
  quickRatio2024: "",
  debtRatio2024: "",
  totalAssets2023: "",
  netAssets2023: "",
  operatingRevenue2023: "",
  netProfit2023: "",
  cashFunds2023: "",
  netProfitRate2023: "",
  roe2023: "",
  currentRatio2023: "",
  quickRatio2023: "",
  debtRatio2023: "",
  profitabilityAnalysis: "",
  operationCashflowAnalysis: "",
  assetDebtAnalysis: "",
  acquisitionCreditCheck: "承债式收购资信调查按项目情况补充。",
  originalShareholderRisk: "",
  projectCompanyLitigation: "项目公司诉讼情况待企查查复核。",
  pledgeFreezeStatus: "股权质押/冻结情况待企查查复核。",
  complianceFileRisk: "合规文件完整性待上传资料和 OA 节点共同复核。",
  benchmarkReturn: "7.7%",
  returnConclusion: "",
  // TRACE[PPT-BIZ-006]: 第 9 页“符合请打勾”列全部预留人工填写。
  // 默认值必须为空，不能沿用 PPTX 底图里的示例勾选，避免误判为系统自动结论。
  fkxz1: "",
  fkxz2: "",
  fkxz3: "",
  fkxz4: "",
  fkxz5: "",
  fkxz6: "",
  fkxz7: "",
  fkxz8: "",
  fkxz9: "",
  fkxz10: "",
  tariffTerm: "电价随国网电价波动条款待复核。",
  priceChangeTerm: "如国网电价上下波动后，结算电价折扣变化。",
  roofRentTerm: "屋顶租金及支付周期待合同解析。",
  consumptionTerm: "消纳比例按测算边界暂取 90%。",
  waterproofTerm: "建设及运营期防水责任待合同确认。",
  constructionDeadline: "并网工期要求待合同解析。",
  delayPenalty: "工期罚则待合同解析。",
  carbonAssetTerm: "附属用电方所有。",
  dismantlingTerm: "免费全面积拆装一次。",
  gridPriceShareTerm: "2%上网电价分享给用电方。",
  // TRACE[PPT-EMC-001]: 第 10 页第三列“对收益率的影响”全部人工填写。
  // 这里默认留空，生成 PPTX 时也会清空模板示例值。
  tariffImpact: "",
  priceChangeImpact: "",
  roofRentImpact: "",
  consumptionImpact: "",
  waterproofImpact: "",
  constructionImpact: "",
  delayPenaltyImpact: "",
  carbonAssetImpact: "",
  dismantlingImpact: "",
  gridPriceShareImpact: "",
  emcRiskImpact: "",
  priorGridConnection: "无前序项目或待补充。",
  priorGenerationHours: "待补充。",
  priorCollectionException: "待补充。",
  priorMaintenanceException: "待补充。",
  priorLitigation: "待补充。",
  priorPostEval: "待补充。",
  riskCategory1: "人工填写",
  riskPoint1: "人工填写",
  riskLevel1: "人工填写",
  riskNote1: "人工填写",
  riskCategory2: "人工填写",
  riskPoint2: "人工填写",
  riskLevel2: "人工填写",
  riskNote2: "人工填写",
  riskCategory3: "人工填写",
  riskPoint3: "人工填写",
  riskLevel3: "人工填写",
  riskNote3: "人工填写",
  riskCategory4: "人工填写",
  riskPoint4: "人工填写",
  riskLevel4: "人工填写",
  riskNote4: "人工填写",
  riskCategory5: "人工填写",
  riskPoint5: "人工填写",
  riskLevel5: "人工填写",
  riskNote5: "人工填写",
  riskCategory6: "人工填写",
  riskPoint6: "人工填写",
  riskLevel6: "人工填写",
  riskNote6: "人工填写",
  approvalCapacity: "",
  approvalConsumption: "",
  approvalUserPowerPrice: "",
  approvalOperationYears: "",
  approvalRoofRent: "",
  approvalGridType: "是否余电上网",
  approvalFeedInPrice: "",
  approvalManagementFee: "",
  approvalIrr: "",
  legalRiskMeasure: "该项目XXX",
  // TRACE[PPT-SCORE-001]: 新版 PPTX 附录评分表的绿色/蓝色格子保留为字段，固定评分规则不再交给模型改写。
  enterpriseNatureScore: "6",
  enterpriseNatureRemark: "",
  paidCapitalScore: "4",
  paidCapitalRemark: "5000万元",
  operationYearsScore: "3",
  operationYearsRemark: "2025年",
  industryScore: "5",
  industryRemark: "其他未列明专业技术服务业",
  regionScore: "5",
  regionRemark: "",
  enterpriseBasicTotalScore: "23",
  enterpriseBasicTotalRemark: "0",
  qccRiskLevel: "低风险",
  qccRiskScore: "10",
  qccRiskRemark: "低风险",
  creditTotalScore: "10",
  creditTotalRemark: "0",
  profitabilityScore: "",
  profitabilityRemark: "",
  liabilityLevelScore: "",
  liabilityLevelRemark: "",
  netAssetScaleScore: "",
  netAssetScaleRemark: "",
  assetLiquidityScore: "3",
  assetLiquidityRemark: "",
  operationAbilityTotalScore: "15",
  operationAbilityTotalRemark: "",
  certificateScore: "2",
  certificateRemark: "仅有土地证",
  roofAgeScore: "3",
  roofAgeRemark: "彩钢瓦",
  complianceTotalScore: "5",
  complianceTotalRemark: "",
  consumptionScore: "3",
  consumptionRemark: "66%",
  returnRateScore: "2",
  returnRateRemark: "5.55%",
  safetyEnvironmentScore: "7",
  safetyEnvironmentRemark: "",
  stationRevenueTotalScore: "12",
  stationRevenueTotalRemark: "",
  totalScore: "65",
  generationTotalPower: "",
  generationTotalRevenue: "",
  generationAveragePower: "",
  generationAverageRevenue: "",
  generationForecastTable: "发电量及收益预测表待测算模型同步。",
  pptPage: "slide03",
  summaryScore: "",
  decisionSummary: "",
  riskHighlights: "",
  aiRecommendation: "",
  aiDraftProvider: "",
  aiDraftProviderRaw: "",
  aiDraftMock: "",
  aiDraftProjectCode: "",
  aiDraftProjectName: "",
  aiDraftFingerprint: "",
  aiDraftStatus: "stale",
  confirmedPages: {},
  documentParseMessage: "",
  documentParseStatus: "",
  documentParseSuggestions: [],
  documentParseWarnings: []
};

// TRACE[PPT-CHAT-006]: 记录已绑定尺寸观察的 PPT 预览窗口，防止重复绑定导致缩放回调叠加。
const pptPreviewResizeTargets = new WeakSet();
let pptPreviewResizeObserver = null;
// TRACE[PPT-TEMPLATE-NEW-001]: 新版风控报告统一使用用户提供的 25 页 PPTX 模板。
// 预览先加载 PPTX 渲染图 manifest；PDF 预览只作为老资产兜底，避免调试环境空白。
const PPTX_TEMPLATE_PREVIEW_URL = "/ppt-report/rendered-preview/manifest.json";
const PPTX_TEMPLATE_PREVIEW_ASSET_ROOT = "/ppt-report/rendered-preview";
const PPTX_TEMPLATE_PREVIEW_FALLBACK_URL = "/ppt-report/pdf-template-preview/manifest.json";
const PPTX_TEMPLATE_PREVIEW_FALLBACK_ASSET_ROOT = "/ppt-report/pdf-template-preview";
const PPTX_TEMPLATE_PREVIEW_BASE_WIDTH = 920;
const PPTX_TEMPLATE_PREVIEW_BASE_HEIGHT = 518;
let pptxTemplatePreview = null;
let pptxTemplatePreviewPromise = null;

let PROJECT_OPTIONS = [
  {
    id: "suzhou-oulai",
    name: "苏州欧莱屋顶分布式光伏项目",
    projectCode: "ZNE-2024-SZ-028",
    address: "苏州市吴中区",
    city: "苏州",
    roofArea: "35866.09",
    capacity: "3.5866",
    investment: "1685.71",
    irr: "10.72",
    payback: "8.26",
    userCompany: "苏州欧莱新能源配套有限公司",
    projectCompany: "苏州欧莱光伏项目有限公司",
    roofOwner: "苏州欧莱厂区",
    roofType: "彩钢瓦 / 混凝土",
    annualGeneration: "371.9 万度",
    annualRevenue: "238.4 万元"
  },
  // TRACE[PPT-FE-OA-007]: 以下两个选项来自本地 ppt_business mock 业务库，便于验证“下拉选择 -> 后端字段同步”链路。
  // 后续接甲方 SQL Server 后，项目列表应由后端 project list query 返回，而不是继续手写在前端。
  {
    id: "taizhou-hengsheng-pg",
    name: "浙江台州恒胜环保3.5MW分布式光伏项目",
    projectCode: "ZNE-2022-0278",
    address: "浙江台州台州湾新区",
    city: "台州",
    roofArea: "待后端同步",
    capacity: "3.5",
    investment: "待后端同步",
    irr: "待后端同步",
    payback: "待测算",
    userCompany: "待企查查同步",
    projectCompany: "待后端同步",
    roofOwner: "待合同解析",
    roofType: "待合同解析",
    annualGeneration: "待测算",
    annualRevenue: "待测算"
  },
  {
    id: "weihai-demo-pg",
    name: "山东威海项目（本地业务库样例）",
    projectCode: "ZNE-2023-0015",
    address: "山东威海",
    city: "威海",
    roofArea: "待后端同步",
    capacity: "待后端同步",
    investment: "待后端同步",
    irr: "待后端同步",
    payback: "待测算",
    userCompany: "待企查查同步",
    projectCompany: "待后端同步",
    roofOwner: "待合同解析",
    roofType: "待合同解析",
    annualGeneration: "待测算",
    annualRevenue: "待测算"
  },
  {
    id: "shanghai-rooftop",
    name: "上海临港厂房屋顶分布式光伏项目",
    projectCode: "ZNE-2024-SH-016",
    address: "上海市浦东新区临港产业区",
    city: "上海",
    roofArea: "28640.00",
    capacity: "-",
    investment: "待测算",
    irr: "待测算",
    payback: "待测算",
    userCompany: "上海临港制造有限公司",
    projectCompany: "上海临港光伏项目有限公司",
    roofOwner: "临港厂区",
    roofType: "彩钢瓦",
    annualGeneration: "待测算",
    annualRevenue: "待测算"
  },
  {
    id: "fujian-park",
    name: "福建园区分布式光伏示范项目",
    projectCode: "ZNE-2024-FJ-009",
    address: "福建省泉州市晋江产业园",
    city: "泉州",
    roofArea: "42120.50",
    capacity: "4.2120",
    investment: "1979.64",
    irr: "9.86",
    payback: "8.91",
    userCompany: "福建园区能源科技有限公司",
    projectCompany: "福建园区光伏项目有限公司",
    roofOwner: "晋江产业园",
    roofType: "混凝土",
    annualGeneration: "438.6 万度",
    annualRevenue: "261.8 万元"
  }
];

// TRACE[PPT-FE-OA-LIST-005]: 保留本地下拉兜底；后端列表失败时页面仍可进入演示流程。
const FALLBACK_PROJECT_OPTIONS = PROJECT_OPTIONS.map((project) => ({ ...project }));
let projectSearchTimer = null;
let projectSearchRequestSeq = 0;

const docLabels = {
  excel: {
    name: "Excel 测算模型",
    file: "投前报告生成.xlsx",
    summary: "项目输入、鑫浦 初稿、人工补填字段已写入测算模板。"
  },
  ppt: {
    name: "PPT 风控报告",
    file: "投前报告生成.pptx",
    summary: "项目输入、鑫浦 初稿、人工复核内容已写入风控报告模板。"
  }
};

const THINKING_DELAY_MS = 2000;
// LangGraph 接入点：未来正式接 LangGraph 后，只需要让该接口返回 { fields: {...} }。
const AI_DRAFT_ENDPOINTS = [
  "/api/langgraph/fields"
];

const AI_DECISION_FIELD_KEYS = [
  "summaryScore",
  "decisionSummary",
  "riskHighlights",
  "aiRecommendation"
];
const AI_DRAFT_FINGERPRINT_KEYS = [
  "projectCode",
  "projectName",
  "city",
  "address",
  "roofArea",
  "capacity",
  "investment",
  "irr",
  "consumptionRatio",
  "powerPrice",
  "userCompany",
  "projectCompany",
  "annualGeneration",
  "annualRevenue"
];
const AI_DRAFT_META_KEYS = [
  "aiDraftProvider",
  "aiDraftProviderRaw",
  "aiDraftMock",
  "aiDraftProjectCode",
  "aiDraftProjectName",
  "aiDraftFingerprint",
  "aiDraftStatus"
];

const PPT_PROJECT_PAYLOAD_KEYS = [
  "projectName",
  "projectCode",
  "city",
  "address",
  "roofArea",
  "capacity",
  "investment",
  "irr",
  "userCompany",
  "projectCompany",
  "roofOwner",
  "roofType",
  "annualGeneration",
  "annualRevenue"
];
const AI_ALWAYS_TRUSTED_PROJECT_KEYS = new Set(["projectName", "projectCode"]);
const aiTrustedOaFieldKeys = new Set();
const aiTrustedDocumentFieldKeys = new Set();
const userEditedPptFieldKeys = new Set();
const aiGeneratedPptFieldKeys = new Set();
const enterpriseSyncedFieldKeys = new Set();
const enterpriseLastAppliedValues = new Map();
const ENTERPRISE_REPORT_FIELD_KEYS = new Set([
  "userIndustry", "equityPledge", "executionRecord", "movableMortgage",
  "noDishonestExecution", "businessStatus", "operationAbnormal", "seriousIllegal",
  "userPaidUpCapital", "fkxz8", "seriousIllegalConclusion", "debtAcquisitionStatus",
  "projectCompanyLitigation", "pledgeFreezeStatus", "qccAdmissionImage"
]);
const enterpriseFinancialKey = key => /^(totalAssets|netAssets|operatingRevenue|netProfit|cashFunds|netProfitRate|roe|currentRatio|quickRatio|debtRatio)(19|20)\d{2}$/.test(key);
function clearUnverifiedFinancialAnalyses() {
  for (const key of ["profitabilityAnalysis", "operationCashflowAnalysis", "assetDebtAnalysis", "financeSummary", "fkxz4"]) {
    if (!aiGeneratedPptFieldKeys.has(key) && (aiTrustedDocumentFieldKeys.has(key) || userEditedPptFieldKeys.has(key))) continue;
    demoState[key] = "";
    aiGeneratedPptFieldKeys.delete(key);
  }
}
function applyEnterpriseYears(value) {
  const hasPrimaryValues = [...aiTrustedDocumentFieldKeys, ...userEditedPptFieldKeys].some(key => enterpriseFinancialKey(key) && !isMissingFieldValue(demoState[key]) && (!enterpriseSyncedFieldKeys.has(key) || demoState[key] !== enterpriseLastAppliedValues.get(key)));
  if (hasPrimaryValues || typeof value !== "string") return;
  const years = [...new Set(value.split(",").filter(year => /^(19|20)\d{2}$/.test(year)))].sort().reverse().slice(0, 3);
  if (!years.length) return;
  QCC_FINANCIAL_YEARS.splice(0, QCC_FINANCIAL_YEARS.length, ...years);
  pptSlideFields.slide06 = [...qccFinancialFieldDefinitions(), ...pptSlideFields.slide06.filter(field => !enterpriseFinancialKey(field.key))];
  PPTX_TABLE_CELL_FIELD_BINDINGS.slide06 = qccFinancialCellBindings();
}
let enterpriseRequestController = null;
let enterpriseLoadStatus = "idle";
let enterpriseLoadMessage = "";
let enterpriseIsMock = false;
let financialImportMessage = "";

function resetEnterpriseFields() {
  enterpriseRequestController?.abort();
  enterpriseSyncedFieldKeys.forEach(key => { demoState[key] = ""; userEditedPptFieldKeys.delete(key); });
  enterpriseSyncedFieldKeys.clear();
  enterpriseLastAppliedValues.clear();
  demoState.originalShareholderRisk = "";
  Object.keys(demoState).filter(enterpriseFinancialKey).forEach(key => {
    // This reset runs on project selection, so no previous project's financial values survive.
    demoState[key] = "";
  });
  enterpriseLoadStatus = "idle";
  enterpriseLoadMessage = "";
  enterpriseIsMock = false;
  financialImportMessage = "";
}

async function loadEnterpriseInformation({ financialOnly = false, reveal = true } = {}) {
  if (enterpriseLoadStatus === "loading") {
    if (financialOnly) throw new Error("企业信息正在查询，请稍后重试。");
    return;
  }
  const projectCode = String(demoState.projectCode || "").trim();
  if (!projectCode) return;
  const controller = new AbortController();
  enterpriseRequestController = controller;
  enterpriseLoadStatus = "loading";
  enterpriseLoadMessage = "正在查询企业信息…";
  if (financialOnly) financialImportMessage = "正在导入企查查财务数据…";
  refreshProjectTemplates();
  renderDraftPanels();
  const timeout = setTimeout(() => controller.abort(), 15000);
  try {
    const response = await (globalThis.__PPT_REPORT_FETCH || fetch)(`/api/projects/${encodeURIComponent(projectCode)}/enterprise-information`, {
      headers: embedAuthHeaders(), signal: controller.signal
    });
    const payload = await response.json();
    if (!response.ok || payload.success === false) throw new Error(payload.errorMessage || payload.message || "企业信息查询失败。");
    const data = payload.success === true ? payload.data : payload;
    if (demoState.projectCode !== projectCode || controller !== enterpriseRequestController) {
      if (financialOnly) throw new Error("报告项目已变化。");
      return;
    }
    if (data.schemaVersion !== 1 || data.projectCode !== projectCode || typeof data.isMock !== "boolean" || !data.fields || data.isMock !== (data.provider === "mock")) throw new Error("企业信息接口返回格式有误。");
    if (!data.found) throw new Error("该项目尚无企业信息，请在数据脚本中补充。");
    if (!financialOnly && !aiTrustedDocumentFieldKeys.has("userRegisterCapital") && !userEditedPptFieldKeys.has("userRegisterCapital")) demoState.userRegisterCapital = "";
    // A fresh empty field must not inherit an older mock/official value.
    enterpriseSyncedFieldKeys.forEach(key => {
      // Automatic company queries never modify finance; explicit imports only fill gaps.
      if (financialOnly || enterpriseFinancialKey(key)) return;
      if (demoState[key] === enterpriseLastAppliedValues.get(key)) {
        demoState[key] = "";
        userEditedPptFieldKeys.delete(key);
      }
    });
    let applied = 0;
    let financialApplied = 0;
    if (financialOnly) applyEnterpriseYears(data.fields.qccFinancialYears);
    Object.entries(data.fields).forEach(([key, value]) => {
      // Second-edition source ownership: six OA/PM fields never enter through this route.
      const financial = enterpriseFinancialKey(key);
      if (financialOnly !== financial) return;
      if ((!ENTERPRISE_REPORT_FIELD_KEYS.has(key) && !financial) ||
        (!financial && (aiTrustedDocumentFieldKeys.has(key) || userEditedPptFieldKeys.has(key))) ||
        (aiTrustedOaFieldKeys.has(key) && !isMissingFieldValue(demoState[key]))) return;
      if (financial && (!QCC_FINANCIAL_YEARS.includes(key.slice(-4)) || !isMissingFieldValue(demoState[key]))) return;
      if (key === "qccAdmissionImage" && value && !/^\/ppt-report\/qcc-samples\/[A-Z]+-admission\.png$/.test(value)) return;
      if (typeof value !== "string" || !value.trim()) { demoState[key] = ""; return; }
      demoState[key] = value;
      enterpriseLastAppliedValues.set(key, demoState[key]);
      enterpriseSyncedFieldKeys.add(key);
      userEditedPptFieldKeys.add(key);
      applied++;
      if (financial) financialApplied++;
    });
    if (financialApplied) {
      clearUnverifiedFinancialAnalyses();
      demoState.confirmedPages = { ...(demoState.confirmedPages || {}), slide06: false };
    }
    enterpriseLoadStatus = "success";
    enterpriseIsMock = data.isMock;
    enterpriseLoadMessage = `已填入${applied}项企业信息。`;
    if (financialOnly) financialImportMessage = `${data.isMock ? "当前为企查查样例，非正式企业财务数据。" : ""}${financialApplied ? `已补充 ${financialApplied} 个空白项，已有值保持不变，请核对。` : "当前年度没有可补充的空白项，已有值保持不变。"}`;
    if (reveal) {
      demoState.pptPage = financialOnly ? "slide06" : "slide04";
      qsa("[data-after-draft]").forEach(node => node.classList.remove("is-hidden"));
    }
    renderDraftPanels();
    scheduleBusinessRiskEvaluation();
    return { applied, isMock: data.isMock };
  } catch (error) {
    if (demoState.projectCode !== projectCode || controller !== enterpriseRequestController) {
      if (financialOnly) throw new Error("报告项目已变化。");
      return;
    }
    enterpriseLoadStatus = "error";
    enterpriseLoadMessage = error?.name === "AbortError" ? "企业信息查询超时，请重试。" : error instanceof Error ? error.message : "企业信息查询失败。";
    if (financialOnly) { financialImportMessage = enterpriseLoadMessage; throw new Error(enterpriseLoadMessage); }
  } finally {
    clearTimeout(timeout);
    if (demoState.projectCode === projectCode && controller === enterpriseRequestController) { refreshProjectTemplates(); renderDraftPanels(); }
  }
}

// TRACE[PPT-DOC-022]: 上传资料只允许自动填入新版字段表确认的“文件解析字段”。
// 目前范围收窄为第 8 页合规性文件概览 + EMC 商务条款页的“条款内容”列；
// OA、企查查、AI、人工字段不允许被上传文件自动覆盖。
const PPT_DOCUMENT_FILE_PARSE_FIELD_KEYS = new Set([
  // TRACE[PPT-DOC-043]: 第 8 页字段来自合规资料文件，允许上传解析后写入“办理进展”列。
  "compliancePropertyProgress",
  "complianceFilingProgress",
  "complianceAccessPlanProgress",
  "complianceAccessApprovalProgress",
  "complianceBusinessLicenseProgress",
  "complianceFranchiseProgress",
  "complianceLeaseProgress",
  "complianceOtherProgress",
  // TRACE[PPT-DOC-045]: EMC 页只解析合同条款内容；“对收益率的影响”仍由人工填写。
  "tariffTerm",
  "priceChangeTerm",
  "roofRentTerm",
  "consumptionTerm",
  "waterproofTerm",
  "constructionDeadline",
  "delayPenalty",
  "carbonAssetTerm",
  "dismantlingTerm",
  "gridPriceShareTerm"
]);

// TRACE[PPT-TEMPLATE-NEW-004]: 新版模板统一以用户提供的 25 页 PPTX 为准。
// 页签、左侧字段、右侧预览和后端下载都必须围绕同一份 PPTX 模板维护。
const pptPages = [
  {
    id: "slide01",
    index: "01",
    name: "封面",
    title: "分布式光伏项目风控报告",
    bodyTitle: "分布式光伏项目风控报告"
  },
  {
    id: "slide02",
    index: "02",
    name: "目录",
    title: "目录",
    sectionTitle: "目录",
    templateTitle: ""
  },
  {
    id: "slide03",
    index: "03",
    name: "用电方介绍",
    title: "经营能力分析-用电方介绍",
    sectionTitle: "一、企业经营能力分析",
    templateTitle: "经营能力分析-用电方介绍"
  },
  {
    id: "slide04",
    index: "04",
    name: "资信风险",
    title: "企业资信与政策风险",
    sectionTitle: "一、企业经营能力分析",
    templateTitle: "资信风险"
  },
  {
    id: "slide05",
    index: "05",
    name: "现场踏勘情况",
    title: "现场踏勘情况",
    sectionTitle: "一、企业经营能力分析",
    templateTitle: "现场踏勘情况"
  },
  {
    id: "slide06",
    index: "06",
    name: "财务分析与回款风险",
    title: "用电企业财务分析与回款风险",
    sectionTitle: "一、企业经营能力分析",
    templateTitle: "用电企业财务分析与回款风险"
  },
  {
    id: "slide07",
    index: "07",
    name: "承债式收购资信调查",
    title: "承债式收购资信调查",
    sectionTitle: "",
    templateTitle: "",
    bodyTitle: "新增承债式收购项目中项目公司及其原股东方资信调查"
  },
  {
    id: "slide08",
    index: "08",
    name: "合规性文件概览",
    title: "合规性文件概览",
    sectionTitle: "二、项目合规性分析",
    templateTitle: "合规性文件概览"
  },
  {
    id: "slide09",
    index: "09",
    name: "商务条件与收益风险",
    title: "商务条件与收益风险",
    sectionTitle: "三、项目商务条件",
    templateTitle: "商务条件与收益风险"
  },
  {
    id: "slide10",
    index: "10",
    name: "EMC商务条款",
    title: "商务条件与收益风险",
    sectionTitle: "三、项目商务条件",
    templateTitle: "商务条件与收益风险"
  },
  {
    id: "slide11",
    index: "11",
    name: "电价敏感性",
    title: "商务条件与收益风险",
    sectionTitle: "三、项目商务条件",
    templateTitle: "商务条件与收益风险",
    bodyTitle: "电价-单瓦投资成本 双因素敏感性分析"
  },
  {
    id: "slide12",
    index: "12",
    name: "前序项目回顾",
    title: "前序项目回顾（如有）",
    sectionTitle: "三、项目商务条件",
    templateTitle: "前序项目回顾（如有）"
  },
  {
    id: "slide13",
    index: "13",
    name: "风险一览表",
    title: "风险一览表",
    sectionTitle: "四、项目风险一览表及项目评审意见",
    templateTitle: "风险一览表"
  },
  {
    id: "slide14",
    index: "14",
    name: "立项会变更事宜",
    title: "立项会变更事宜",
    sectionTitle: "四、项目风险一览表及项目评审意见",
    templateTitle: "立项会变更事宜"
  },
  {
    id: "slide15",
    index: "15",
    name: "项目优势分析",
    title: "项目优势分析",
    sectionTitle: "四、项目风险一览表及项目评审意见",
    templateTitle: "项目优势分析",
    bodyTitle: "项目优势分析"
  },
  {
    id: "slide16",
    index: "16",
    name: "项目风险及措施",
    title: "项目风险及措施",
    sectionTitle: "四、项目风险一览表及项目评审意见",
    templateTitle: "项目风险及措施",
    bodyTitle: "项目风险及措施"
  },
  {
    id: "slide17",
    index: "17",
    name: "项目法务风险",
    title: "项目法务风险",
    sectionTitle: "四、项目风险一览表及项目评审意见",
    templateTitle: "项目风险及措施",
    bodyTitle: "项目法务风险"
  },
  {
    id: "slide18",
    index: "18",
    name: "部门评审意见",
    title: "部门评审意见",
    sectionTitle: "四、项目风险一览表及项目评审意见",
    templateTitle: "部门评审意见",
    bodyTitle: "部门评审意见"
  },
  {
    id: "slide19",
    index: "19",
    name: "附录目录",
    title: "附录",
    sectionTitle: "目录",
    templateTitle: "",
    bodyTitle: "附    录"
  },
  {
    id: "slide20",
    index: "20",
    name: "项目基本概况",
    title: "项目基本概况-项目基本面",
    sectionTitle: "附录",
    templateTitle: "项目基本概况-项目基本面"
  },
  {
    id: "slide21",
    index: "21",
    name: "打分自评表1",
    title: "项目基本概况-项目打分自评表",
    sectionTitle: "附录",
    templateTitle: "项目基本概况-项目打分自评表"
  },
  {
    id: "slide22",
    index: "22",
    name: "打分自评表2",
    title: "项目基本概况-项目打分自评表",
    sectionTitle: "附录",
    templateTitle: "项目基本概况-项目打分自评表"
  },
  {
    id: "slide23",
    index: "23",
    name: "发电量及收益预测",
    title: "发电量及收益预测",
    sectionTitle: "附录",
    templateTitle: "发电量及收益预测"
  },
  {
    id: "slide24",
    index: "24",
    name: "用电企业资信信息",
    title: "用电企业情况-资信信息",
    sectionTitle: "附录",
    templateTitle: "用电企业情况-资信信息"
  },
  {
    id: "slide25",
    index: "25",
    name: "结束页",
    title: "结束页",
    sectionTitle: "",
    templateTitle: ""
  }
];

const FIELD_COVERAGE = {
  total: 94,
  businessRows: 130,
  oa: 28,
  manual: 38,
  qcc: 15,
  aiSummary: 8,
  auto: 1,
  slides: 25
};

// TRACE[PPT-QCC-002]: 第 6 页财务分析表的字段定义、左侧表单和右侧 PPTX 表格映射共用这组顺序。
// 顺序必须与新版 PPTX 第 6 页表头保持一致：总资产、净资产、营业收入、净利润、货币资金、净利率、ROE、流动比率、速动比率、负债率。
const QCC_FINANCIAL_YEARS = ["2025", "2024", "2023"];
const QCC_FINANCIAL_METRICS = [
  ["totalAssets", "总资产（万元）"],
  ["netAssets", "净资产（万元）"],
  ["operatingRevenue", "营业收入（万元）"],
  ["netProfit", "净利润（万元）"],
  ["cashFunds", "货币资金（万元）"],
  ["netProfitRate", "净利率"],
  ["roe", "ROE"],
  ["currentRatio", "流动比率"],
  ["quickRatio", "速动比率"],
  ["debtRatio", "负债率"]
];

function buildQccFinancialRows(source) {
  return QCC_FINANCIAL_YEARS.map((year) => {
    const row = { year: Number(year) };

    QCC_FINANCIAL_METRICS.forEach(([key]) => {
      row[key] = source[`${key}${year}`] || "";
    });

    return row;
  });
}

function qccFinancialFieldDefinitions() {
  return QCC_FINANCIAL_YEARS.flatMap((year) =>
    QCC_FINANCIAL_METRICS.map(([key, label]) => ({
      key: `${key}${year}`,
      label: `${year} ${label}`,
      method: "财务文件解析，人工确认",
      inputMode: "decimal",
      group: `${year} 财务表`
    }))
  );
}

function qccFinancialCellBindings() {
  const bindings = {};
  for (let yearIndex = 0; yearIndex < 3; yearIndex += 1) {
    const year = QCC_FINANCIAL_YEARS[yearIndex];
    const labelKey = `financialPeriodLabel${yearIndex}`;
    demoState[labelKey] = year ? `${year}年` : "";
    bindings[`0:${yearIndex + 2}:0`] = labelKey;
    QCC_FINANCIAL_METRICS.forEach(([key], metricIndex) => {
      const emptyKey = `financialEmpty${yearIndex}_${metricIndex}`;
      demoState[emptyKey] = "";
      bindings[`0:${yearIndex + 2}:${metricIndex + 1}`] = year ? `${key}${year}` : emptyKey;
    });
  }
  return bindings;
}

// TRACE[PPT-TEMPLATE-NEW-005]: 字段来自新版 `新PPT模版字段提取表(3).xlsx` 的人工整理版。
// 这里保留 label/method/group，是为了左侧字段核对、AI 草稿、GraphQL payload 和最终 PPTX 使用同一批键。
const pptSlideFields = {
  slide01: [
    { key: "projectName", label: "项目名称", method: "OA抓取", group: "封面" },
    { key: "coverDate", label: "报告日期", method: "人工填写", group: "封面" },
    { key: "businessDept", label: "编制部门", method: "OA抓取", group: "封面" }
  ],
  slide03: [
    { key: "userCompany", label: "用电企业名称", method: "OA抓取", group: "用电方介绍" },
    { key: "productionCapacity", label: "产线及产能", method: "人工填写", type: "textarea", group: "用电方介绍" },
    { key: "majorCustomers", label: "主要客户", method: "人工填写", type: "textarea", group: "用电方介绍" },
    { key: "workMode", label: "工作模式", method: "人工填写", type: "textarea", group: "用电方介绍" }
  ],
  slide04: [
    // TRACE[PPT-TEMPLATE-NEW-017]: 第 4 页企查查字段按新版字段表逐项展示；
    // 右侧预览和后端生成会把这些字段组合成“企业资信与司法风险”摘要。
    { key: "equityPledge", label: "股权质押情况", method: "企查查抓取", group: "资信风险" },
    { key: "executionRecord", label: "被执行记录", method: "企查查抓取", group: "资信风险" },
    { key: "movableMortgage", label: "动产抵押情况", method: "企查查抓取", group: "资信风险" },
    { key: "noDishonestExecution", label: "失信被执行人情况", method: "企查查抓取", group: "资信风险" },
    { key: "businessStatus", label: "企业登记状态", method: "企查查抓取", group: "资信风险" },
    { key: "operationAbnormal", label: "经营异常情况", method: "企查查抓取", group: "资信风险" },
    { key: "seriousIllegal", label: "严重违法失信情况", method: "企查查抓取", type: "textarea", group: "资信风险" },
    { key: "seriousIllegalConclusion", label: "严重违法失信结论", method: "企查查＋AI分析", type: "textarea", group: "资信风险" },
    { key: "qccAdmissionImage", label: "准入建议截图", method: "企查查网页截图", type: "image", group: "准入建议" },
    { key: "creditRiskConclusion", label: "资信结论", method: "AI分析", type: "textarea", group: "AI结论" },
    { key: "shareholderBackground", label: "股东背景", method: "AI分析", type: "textarea", group: "AI结论" },
    { key: "policyComplianceRisk", label: "政策合规性风险结论", method: "AI分析", type: "textarea", group: "政策合规性风险" }
  ],
  slide05: [
    // TRACE[PPT-SITE-001]: 第 5 页严格以 PPTX 源文件为准，只开放源文件文字框中真实存在的三项。
    // 图片区域（产线图/屋顶照片）留给后续人工在 PPTX 中粘贴，不在左侧字段里维护。
    { key: "roofOwner", label: "屋顶产权方", method: "OA抓取", group: "现场踏勘情况" },
    { key: "propertyCertificateStatus", label: "产证情况", method: "人工填写", type: "textarea", group: "现场踏勘情况" },
    { key: "roofType", label: "屋顶类型", method: "OA抓取", group: "现场踏勘情况" }
  ],
  slide06: [
    ...qccFinancialFieldDefinitions(),
    { key: "profitabilityAnalysis", label: "盈利能力分析", method: "鑫浦AI总结", type: "textarea", group: "AI结论" },
    { key: "operationCashflowAnalysis", label: "经营效率与现金流状况", method: "鑫浦AI总结", type: "textarea", group: "AI结论" },
    { key: "assetDebtAnalysis", label: "资产负债情况", method: "鑫浦AI总结", type: "textarea", group: "AI结论" },
    { key: "financeSummary", label: "结论", method: "鑫浦AI总结", type: "textarea", group: "AI结论" }
  ],
  // Second-edition row103: condition first; AI only analyzes investigation items 2 and 3.
  slide07: [
    { key: "debtAcquisitionStatus", label: "是否承债式收购", method: "项目条件，人工确认", group: "适用条件" },
    { key: "originalShareholderRisk", label: "1. 原股东及增信措施", method: "人工填写", type: "textarea", group: "第1项调查" },
    { key: "acquisitionLitigationAnalysis", label: "2. 项目公司是否涉及诉讼", method: "AI总结，可核对修改", type: "textarea", group: "第2项调查" },
    { key: "acquisitionPledgeAnalysis", label: "3. 项目公司及母公司是否已有股权质押/冻结情况", method: "AI总结，可核对修改", type: "textarea", group: "第3项调查" }
  ],
  slide08: [
    // TRACE[PPT-COMPLIANCE-002]: 第 8 页只开放源 PPTX 表格的“办理进展”列。
    // 左侧字段顺序必须和右侧表格 1-8 行一致。
    { key: "compliancePropertyProgress", label: "不动产权证（三证一书文件）办理进展", method: "文件解析，人工确认", type: "textarea", group: "合规性文件概览" },
    { key: "complianceFilingProgress", label: "项目备案办理进展", method: "OA抓取，人工确认", type: "textarea", group: "合规性文件概览" },
    { key: "complianceAccessPlanProgress", label: "项目接入方案办理进展", method: "OA抓取，人工确认", type: "textarea", group: "合规性文件概览" },
    { key: "complianceAccessApprovalProgress", label: "项目接入评审意见/接入批复办理进展", method: "OA抓取，人工确认", type: "textarea", group: "合规性文件概览" },
    { key: "complianceBusinessLicenseProgress", label: "用电企业营业执照办理进展", method: "文件解析，人工确认", type: "textarea", group: "合规性文件概览" },
    { key: "complianceFranchiseProgress", label: "特许经营权文件办理进展", method: "人工确认", type: "textarea", group: "合规性文件概览" },
    { key: "complianceLeaseProgress", label: "用电方和产权方一致性/租赁合同办理进展", method: "人工确认", type: "textarea", group: "合规性文件概览" },
    { key: "complianceOtherProgress", label: "其他合规文件办理进展", method: "人工填写", type: "textarea", group: "合规性文件概览" }
  ],
  slide09: [
    { key: "irr", label: "全投资税后IRR", method: "OA抓取", group: "收益率达标判定" },
    { key: "benchmarkReturn", label: "基准收益率要求", method: "模板固定：7.7%", group: "收益率达标判定" },
    // TRACE[PPT-BIZ-007]: 第 9 页结论由员工人工填写，不再默认使用系统判断文案。
    { key: "returnConclusion", label: "结论", method: "规则计算", type: "textarea", group: "收益率达标判定" },
    { key: "fkxz1", label: "项目所在地属于限制准入区域", method: "自动判断／人工确认", group: "风控细则条件" },
    { key: "fkxz2", label: "项目位于东北区域", method: "自动判断／人工确认", group: "风控细则条件" },
    { key: "fkxz3", label: "战略核心区域外无投运项目且规模小于3MW", method: "自动判断／人工确认", group: "风控细则条件" },
    { key: "fkxz4", label: "用能企业财报亏损情况", method: "自动判断／人工确认", group: "风控细则条件" },
    { key: "fkxz5", label: "用能企业属于限制准入行业", method: "自动判断／人工确认", group: "风控细则条件" },
    { key: "fkxz6", label: "无法提供盖章财务/用电数据", method: "自动判断／人工确认", group: "风控细则条件" },
    { key: "fkxz7", label: "用能企业为产业园类型", method: "自动判断／人工确认", group: "风控细则条件" },
    { key: "userPaidUpCapital", label: "用电企业实收资本（万元）", method: "企查查抓取", group: "规模判断依据" },
    { key: "fkxz8", label: "用能企业规模小、实收资本低于1000万元", method: "自动判断／人工确认", type: "textarea", group: "风控细则条件" },
    { key: "fkxz9", label: "项目消纳率不足80%", method: "自动判断／人工确认", group: "风控细则条件" },
    { key: "fkxz10", label: "项目余电不上网", method: "自动判断／人工确认", group: "风控细则条件" }
  ],
  slide10: [
    // TRACE[PPT-EMC-002]: 第 10 页中间“条款内容”列模拟从 OA 合同文件解析而来，
    // 第三列“对收益率的影响”保持人工填写，二者拆成独立字段，避免解析结论覆盖人工判断。
    { key: "tariffTerm", label: "电价-条款内容", method: "合同解析、AI整理，人工确认", type: "textarea", group: "EMC条款内容" },
    { key: "tariffImpact", label: "电价-对收益率的影响", method: "人工填写", type: "textarea", group: "收益率影响" },
    { key: "priceChangeTerm", label: "电价变更条款-条款内容", method: "合同解析、AI整理，人工确认", type: "textarea", group: "EMC条款内容" },
    { key: "priceChangeImpact", label: "电价变更条款-对收益率的影响", method: "人工填写", type: "textarea", group: "收益率影响" },
    { key: "roofRentTerm", label: "屋顶-条款内容", method: "合同解析、AI整理，人工确认", type: "textarea", group: "EMC条款内容" },
    { key: "roofRentImpact", label: "屋顶-对收益率的影响", method: "人工填写", type: "textarea", group: "收益率影响" },
    { key: "consumptionTerm", label: "消纳-条款内容", method: "合同解析、AI整理，人工确认", type: "textarea", group: "EMC条款内容" },
    { key: "consumptionImpact", label: "消纳-对收益率的影响", method: "人工填写", type: "textarea", group: "收益率影响" },
    { key: "waterproofTerm", label: "防水要求-条款内容", method: "合同解析、AI整理，人工确认", type: "textarea", group: "EMC条款内容" },
    { key: "waterproofImpact", label: "防水要求-对收益率的影响", method: "人工填写", type: "textarea", group: "收益率影响" },
    { key: "constructionDeadline", label: "工期-条款内容", method: "合同解析、AI整理，人工确认", type: "textarea", group: "EMC条款内容" },
    { key: "constructionImpact", label: "工期-对收益率的影响", method: "人工填写", type: "textarea", group: "收益率影响" },
    { key: "delayPenalty", label: "工期罚则-条款内容", method: "合同解析、AI整理，人工确认", type: "textarea", group: "EMC条款内容" },
    { key: "delayPenaltyImpact", label: "工期罚则-对收益率的影响", method: "人工填写", type: "textarea", group: "收益率影响" },
    { key: "carbonAssetTerm", label: "碳资产归属-条款内容", method: "合同解析、AI整理，人工确认", type: "textarea", group: "EMC条款内容" },
    { key: "carbonAssetImpact", label: "碳资产归属-对收益率的影响", method: "人工填写", type: "textarea", group: "收益率影响" },
    { key: "dismantlingTerm", label: "拆装要求-条款内容", method: "合同解析、AI整理，人工确认", type: "textarea", group: "EMC条款内容" },
    { key: "dismantlingImpact", label: "拆装要求-对收益率的影响", method: "人工填写", type: "textarea", group: "收益率影响" },
    { key: "gridPriceShareTerm", label: "上网电价分成-条款内容", method: "合同解析、AI整理，人工确认", type: "textarea", group: "EMC条款内容" },
    { key: "gridPriceShareImpact", label: "上网电价分成-对收益率的影响", method: "人工填写", type: "textarea", group: "收益率影响" }
  ],
  // TRACE[PPT-SENSITIVITY-001]: 第 11 页敏感性分析表格不在系统内填写。
  // 后续由员工下载 PPTX 后手工维护，因此左侧不暴露字段，后端也不覆盖模板文本。
  slide11: [],
  slide12: [
    { key: "priorGridConnection", label: "并网情况", method: "PM抓取", group: "前序项目回顾" },
    { key: "priorGenerationHours", label: "发电小时数", method: "人工填写", group: "前序项目回顾" },
    { key: "priorCollectionException", label: "回款异常情况", method: "人工填写", group: "前序项目回顾" },
    { key: "priorMaintenanceException", label: "运维异常", method: "人工填写", group: "前序项目回顾" },
    { key: "priorLitigation", label: "诉讼情况", method: "人工填写", group: "前序项目回顾" },
    { key: "priorPostEval", label: "后评价收益率及结论", method: "OA抓取", type: "textarea", group: "前序项目回顾" }
  ],
  slide13: [
    { key: "selfScore", label: "项目评分表得分", method: "OA抓取", group: "风险一览表" },
    { key: "scoreLoss", label: "主要失分点", method: "AI总结", type: "textarea", group: "风险一览表" },
    // TRACE[PPT-RISK-011]: 第 13 页源 PPTX 左侧只有“评分表详见附录”，不存在可填写“评分细则”字段。
    // 因此删除 scoreRule 表单项，避免左侧出现一个最终 PPTX 不接收的假字段。
    { key: "riskCategory1", label: "风险类别1", method: "人工填写", group: "风险量表" },
    { key: "riskPoint1", label: "风险点1", method: "人工填写", type: "textarea", group: "风险量表" },
    { key: "riskLevel1", label: "风险等级1", method: "人工填写", group: "风险量表" },
    { key: "riskNote1", label: "说明1", method: "人工填写", type: "textarea", group: "风险量表" },
    { key: "riskCategory2", label: "风险类别2", method: "人工填写", group: "风险量表" },
    { key: "riskPoint2", label: "风险点2", method: "人工填写", type: "textarea", group: "风险量表" },
    { key: "riskLevel2", label: "风险等级2", method: "人工填写", group: "风险量表" },
    { key: "riskNote2", label: "说明2", method: "人工填写", type: "textarea", group: "风险量表" },
    { key: "riskCategory3", label: "风险类别3", method: "人工填写", group: "风险量表" },
    { key: "riskPoint3", label: "风险点3", method: "人工填写", type: "textarea", group: "风险量表" },
    { key: "riskLevel3", label: "风险等级3", method: "人工填写", group: "风险量表" },
    { key: "riskNote3", label: "说明3", method: "人工填写", type: "textarea", group: "风险量表" },
    { key: "riskCategory4", label: "风险类别4", method: "人工填写", group: "风险量表" },
    { key: "riskPoint4", label: "风险点4", method: "人工填写", type: "textarea", group: "风险量表" },
    { key: "riskLevel4", label: "风险等级4", method: "人工填写", group: "风险量表" },
    { key: "riskNote4", label: "说明4", method: "人工填写", type: "textarea", group: "风险量表" },
    { key: "riskCategory5", label: "风险类别5", method: "人工填写", group: "风险量表" },
    { key: "riskPoint5", label: "风险点5", method: "人工填写", type: "textarea", group: "风险量表" },
    { key: "riskLevel5", label: "风险等级5", method: "人工填写", group: "风险量表" },
    { key: "riskNote5", label: "说明5", method: "人工填写", type: "textarea", group: "风险量表" },
    { key: "riskCategory6", label: "风险类别6", method: "人工填写", group: "风险量表" },
    { key: "riskPoint6", label: "风险点6", method: "人工填写", type: "textarea", group: "风险量表" },
    { key: "riskLevel6", label: "风险等级6", method: "人工填写", group: "风险量表" },
    { key: "riskNote6", label: "说明6", method: "人工填写", type: "textarea", group: "风险量表" }
  ],
  slide14: [
    { key: "initiationCapacity", label: "容量", method: "立项：OA102/人工；投决列留空", group: "立项会变更事宜" },
    { key: "initiationConsumption", label: "消纳比例", method: "立项：OA102/人工；投决列留空", group: "立项会变更事宜" },
    { key: "initiationUserPowerPrice", label: "用户折后电价", method: "立项：OA102/人工；投决列留空", group: "立项会变更事宜" },
    { key: "initiationOperationYears", label: "运营年限", method: "立项：OA102/人工；投决列留空", group: "立项会变更事宜" },
    { key: "initiationRoofRent", label: "屋顶租金", method: "立项：OA102/人工；投决列留空", group: "立项会变更事宜" },
    { key: "initiationGridType", label: "接网形式/是否余电上网", method: "立项：OA102/人工；投决列留空", group: "立项会变更事宜" },
    { key: "initiationFeedInPrice", label: "余电上网电价", method: "立项：OA102/人工；投决列留空", group: "立项会变更事宜" },
    { key: "initiationManagementFee", label: "公司管理费", method: "立项：OA102/人工；投决列留空", group: "立项会变更事宜" },
    { key: "initiationIrr", label: "全投资收益率", method: "立项：OA102/人工；投决列留空", group: "立项会变更事宜" }
  ],
  slide15: [
    { key: "advantage", label: "项目优势分析", method: "人工填写", type: "textarea", group: "项目优势分析" }
  ],
  slide16: [
    { key: "riskMeasure", label: "项目风险及措施", method: "人工填写", type: "textarea", group: "项目风险及措施" }
  ],
  slide17: [
    { key: "legalRiskMeasure", label: "项目法务风险", method: "人工填写", type: "textarea", group: "项目法务风险" }
  ],
  slide18: [
    { key: "departmentOpinion", label: "部门评审意见", method: "人工填写", type: "textarea", group: "部门评审意见" }
  ],
  slide19: [
    { key: "appendixList", label: "附录目录", method: "模板复用", type: "textarea", group: "附录" }
  ],
  slide20: [
    { key: "projectName", label: "项目名称", method: "OA抓取", group: "项目概要" },
    { key: "projectCode", label: "项目编号", method: "OA抓取", group: "项目概要" },
    { key: "selfScore", label: "项目自评分", method: "人工填写", group: "项目概要" },
    // { key: "businessDept", label: "业务部", method: "OA抓取", group: "项目概要" },
    { key: "manager", label: "项目经理", method: "OA抓取", group: "项目概要" },
    { key: "projectType", label: "项目类型", method: "OA抓取", group: "项目概要" },
    { key: "capacity", label: "项目规模（MW）", method: "OA抓取", group: "项目概要" },
    { key: "developMode", label: "开发方式", method: "OA抓取", group: "项目概要" },
    { key: "operationYears", label: "运营年限（年）", method: "OA抓取", group: "项目概要" },
    { key: "investment", label: "预算总投资（万元）", method: "OA抓取", group: "项目概要" },
    { key: "irr", label: "全投资税后IRR", method: "OA抓取", group: "项目概要" },
    { key: "consumptionRatio", label: "消纳比例", method: "OA抓取", group: "消纳、电价、接入" },
    { key: "desulfurPrice", label: "脱硫标杆电价", method: "OA抓取", group: "消纳、电价、接入" },
    { key: "priceDiscount", label: "电价折扣", method: "OA抓取", group: "消纳、电价、接入" },
    { key: "powerPrice", label: "企业用电电价", method: "OA抓取", group: "消纳、电价、接入" },
    { key: "accessVoltage", label: "接入电压等级（kV）", method: "OA抓取", group: "消纳、电价、接入" },
    { key: "userCompany", label: "用电企业名称", method: "OA/PM抓取", group: "用电方信息" },
    { key: "userNature", label: "用电企业性质", method: "OA/PM抓取", group: "用电方信息" },
    { key: "userRegisterCapital", label: "注册资本金（万元）", method: "立项报告解析，人工确认", group: "用电方信息" },
    { key: "userIndustry", label: "所处行业", method: "企查查抓取", group: "用电方信息" },
    { key: "projectCompany", label: "项目公司名称", method: "OA/PM抓取", group: "项目公司" },
    { key: "projectRegisterCapital", label: "项目公司注册资本金（万元）", method: "OA/PM抓取", group: "项目公司" },
    { key: "legalPerson", label: "法人代表", method: "OA抓取", group: "项目公司" },
    { key: "shareholderRatio", label: "股东名称及持股比例", method: "OA抓取", group: "项目公司" },
    { key: "roofOwner", label: "产权方名称", method: "OA抓取", group: "屋顶情况" },
    { key: "roofLeaseArea", label: "租赁面积", method: "OA抓取", group: "屋顶情况" },
    // TRACE[PPT-TEMPLATE-NEW-018]: 新版 PPTX 第 20 页没有“抵押情况”字段，不能为了旧版占位继续采集。
    { key: "roofRent", label: "租赁金额", method: "OA抓取", group: "屋顶情况" }
  ],
  // TRACE[PPT-MANUAL-021]: 第 21、22 页是评分表模板页，不在系统内设置输入字段。
  // 业务方下载 PPTX 后按模板人工维护，避免预览字段和评分口径不一致。
  slide21: [],
  slide22: [],
  slide23: [
    { key: "annualGeneration", label: "发电量预测", method: "测算模型同步", group: "发电量及收益预测" },
    { key: "annualRevenue", label: "发电收益预测", method: "测算模型同步", group: "发电量及收益预测" },
    { key: "generationTotalPower", label: "发电量合计", method: "人工填写", group: "发电量及收益预测" },
    { key: "generationTotalRevenue", label: "发电收益合计", method: "人工填写", group: "发电量及收益预测" },
    { key: "generationAveragePower", label: "发电量年均", method: "人工填写", group: "发电量及收益预测" },
    { key: "generationAverageRevenue", label: "发电收益年均", method: "人工填写", group: "发电量及收益预测" },
    { key: "generationForecastTable", label: "25年预测表", method: "测算模型同步", type: "textarea", group: "发电量及收益预测" }
  ],
  // TRACE[PPT-MANUAL-024]: 第 24 页资信信息作为图片/资料粘贴页保留，不再设置结构化输入字段。
  // TRACE[PPT-MANUAL-025]: 第 25 页是结束页，不参与字段采集和自动写入。
  slide24: [],
  slide25: []
};

const FIELD_SAMPLE_VALUES = {
  "脱硫标杆电价": "0.3910 元/kWh",
  "电价折扣": "90%",
  "接入电压等级（kV）": "10",
  "变压器容量（kVA）": "1250",
  "用电企业性质": "民营企业",
  "所处行业": "制造业",
  "注册资本金（万元）": "5000",
  "股东名称及持股比例": "控股股东持股100%",
  "租赁面积": "35866.09 平方米",
  "租赁金额": "21.52 万元/年",
  "股权质押情况": "无",
  "被执行记录": "无",
  "动产抵押情况": "无",
  "纳税信用等级": "A级",
  "屋顶产权方": "苏州欧莱厂区",
  "产权剩余年限（年）": "20",
  "厂房已使用年限（年）": "5",
  "年用电量（万度）": "1015",
  "逆变器形式": "组串式",
  "本地脱硫标杆电价": "0.3910 元/kWh",
  "折扣": "90%",
  "上年度平均电价:峰、平、谷（元/kWh）": "峰0.8060 / 平0.6045 / 谷0.3910",
  "折前电价": "0.6448 元/kWh",
  "折后电价": "0.6194 元/kWh",
  "峰值时段": "08:00-11:00, 18:00-21:00",
  "峰值电价": "0.8060 元/kWh",
  "平值时段": "11:00-18:00",
  "平值电价": "0.6045 元/kWh",
  "谷值时段": "21:00-08:00",
  "谷值电价": "0.3910 元/kWh",
  "03 首年利用小时数": "1015",
  "07 预算单瓦造价": "4.70 元/W",
  "09 运维费用": "21.52 万元/年",
  "12 碳资产归属": "项目公司",
  "全投资收益率双因素敏感性分析": "根据上页成本边界生成敏感性矩阵。",
  "成本估算": "1685.71 万元",
  "首年发电量": "364.1 万度",
  "项目进展补充说明": "例：备案、电网接入意见和商务合同进度待补充。",
  "附录目录": "项目打分自评表、发电量及收益预测、工商信息、股权结构及资信证明。",
  "模板提示": "本页为模板提示页。"
};

function qs(selector, root = document) {
  return root.querySelector(selector);
}

function qsa(selector, root = document) {
  return Array.from(root.querySelectorAll(selector));
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function fetchTemplateManifest(url, assetRoot) {
  return (globalThis.__PPT_REPORT_FETCH || fetch)(url)
    .then((response) => {
      if (!response.ok) throw new Error(`PPT preview manifest load failed: ${response.status}`);
      return response.json();
    })
    .then((manifest) => ({ ...manifest, assetRoot }));
}

function loadPptxTemplatePreview() {
  // TRACE[PPT-TEMPLATE-NEW-006]: 预加载新版 PPTX 渲染 manifest；
  // 失败时回退 PDF 预览，避免本地演示因为资产缺失直接空白。
  if (pptxTemplatePreview) return Promise.resolve(pptxTemplatePreview);
  if (pptxTemplatePreviewPromise) return pptxTemplatePreviewPromise;

  pptxTemplatePreviewPromise = fetchTemplateManifest(PPTX_TEMPLATE_PREVIEW_URL, PPTX_TEMPLATE_PREVIEW_ASSET_ROOT)
    .catch((primaryError) => {
      console.warn("[PPT-TEMPLATE-NEW-006] PPTX rendered preview failed, fallback to PDF manifest:", primaryError);
      return fetchTemplateManifest(PPTX_TEMPLATE_PREVIEW_FALLBACK_URL, PPTX_TEMPLATE_PREVIEW_FALLBACK_ASSET_ROOT);
    })
    .then((manifest) => {
      pptxTemplatePreview = manifest;
      refreshPptPreviewSlide();
      return manifest;
    })
    .catch((error) => {
      console.warn("[PPT-CHAT-008]", error);
      pptxTemplatePreviewPromise = null;
      return null;
    });

  return pptxTemplatePreviewPromise;
}

function ensurePercent(value) {
  const text = String(value ?? "").trim();
  if (!text) return "";
  return text.includes("%") ? text : `${text}%`;
}

function compactSlash(value) {
  return String(value ?? "").replace(/\s+\/\s+/g, "/");
}

function costPerWatt() {
  const investment = Number(String(demoState.investment || "").replace(/[^\d.]/g, ""));
  const capacity = Number(String(demoState.capacity || "").replace(/[^\d.]/g, ""));
  if (!Number.isFinite(investment) || !Number.isFinite(capacity) || capacity <= 0) return "待测算";
  return (investment / capacity / 100).toFixed(2);
}

function templateShortName() {
  return (
    demoState.shortName ||
    String(demoState.projectName || "")
      .replace(/屋顶分布式光伏项目|分布式光伏项目|光伏项目/g, "")
      .trim() ||
    "项目"
  );
}

function replaceLabelValue(text, label, value) {
  const pattern = new RegExp(`(${escapeRegExp(label)}：)[^\\n]*`, "g");
  return text.replace(pattern, `$1${value}`);
}

function pptxTemplateReplacementMap() {
  // TRACE[PPT-CHAT-008]: 与后端 PPTX 生成脚本保持同一套占位替换口径，让预览和最终文件同源。
  return [
    ["项目名称", demoState.projectName],
    ["项目编号", demoState.projectCode],
    ["项目自评分", demoState.selfScore],
    ["业务部", demoState.businessDept],
    ["项目经理", demoState.manager],
    ["项目类型", demoState.projectType],
    ["项目规模（MW）", demoState.capacity],
    ["开发方式", compactSlash(demoState.developMode)],
    ["运营年限（年）", demoState.operationYears],
    ["预算总投资（万元）", demoState.investment],
    ["全投资税后IRR", ensurePercent(demoState.irr)],
    ["项目里程碑", demoState.milestone],
    ["项目公司名称", demoState.projectCompany],
    ["法人代表", demoState.legalPerson],
    ["产权方名称", demoState.roofOwner],
    ["屋顶类型", compactSlash(demoState.roofType)],
    ["租赁面积", demoState.roofLeaseArea || `${demoState.roofArea}㎡`],
    ["租赁金额", demoState.roofRent],
    ["消纳比例", ensurePercent(demoState.consumptionRatio)],
    ["脱硫标杆电价", demoState.desulfurPrice],
    ["电价折扣", demoState.priceDiscount],
    ["度电成本", demoState.levelizedCost || "待补充"],
    ["企业用电电价", demoState.powerPrice],
    ["接入电压等级（kV）", demoState.accessVoltage],
    ["变压器容量（kVA）", demoState.transformerCapacity],
    ["用电企业名称", demoState.userCompany],
    ["用电企业性质", demoState.userNature],
    ["用电方注册资本金（万元）", demoState.userRegisterCapital],
    ["所处行业", demoState.userIndustry],
    ["项目评分表得分", `${demoState.selfScore}分`],
    ["主要失分点", demoState.scoreLoss],
    ["股权质押情况", demoState.equityPledge],
    ["被执行记录", demoState.executionRecord],
    ["动产抵押情况", demoState.movableMortgage],
    ["纳税信用等级", demoState.taxCredit],
    ["财务状况简要分析", demoState.financeSummary],
    ["行业概览", demoState.industryOverview],
    ["发电量", demoState.annualGeneration],
    ["发电收益", demoState.annualRevenue],
    ["投资回收期", `${demoState.payback}年`],
    ["其他测算边界", demoState.boundaryText],
    ["优势分析", demoState.advantage],
    ["项目风险及措施", demoState.riskMeasure],
    ["合同风险及措施", demoState.riskMeasure],
    ["部门评审意见", demoState.departmentOpinion],
    ["立项会意见", demoState.reviewMeeting]
  ];
}

function transformPptxTemplateText(original) {
  // TRACE[PPT-CHAT-008]: 将真实 PPTX 文本框里的模板占位符替换为当前用户复核字段。
  let text = String(original || "")
    .replace(/XXX分布式光伏项目/g, demoState.projectName)
    .replace(/湖北XXX项目/g, demoState.projectName)
    .replace(/ZNE-2024-XXX/g, demoState.projectCode)
    .replace(/ZNE-2026-XXX/g, demoState.projectCode)
    .replace(/2025年X月/g, demoState.coverDate)
    .replace(/2026年X月/g, demoState.coverDate)
    .replace(/业务X部/g, demoState.businessDept)
    .replace(/项目风控部/g, demoState.businessDept)
    .replace(/\/XXX/g, `/${templateShortName()}`)
    .replace(/这一块是AI/g, "AI已生成企业资信摘要")
    .replace(/（企查查截图）/g, "（企查查截图区域，可由系统自动插入或人工补充）")
    .replace(/如企业经营情况/g, demoState.scoreLoss)
    .replace(/商务合同签订、备案已完成、电网接入意见批复正在办理等/g, demoState.milestone)
    .replace(/XX有限公司（100%）/g, demoState.shareholderRatio)
    .replace(/低压\/高压/g, `${demoState.accessVoltage}kV`)
    .replace(/成本估算:XX元\/瓦/g, `成本估算:${costPerWatt()}元/瓦`)
    .replace(/首年发电量：XX万度/g, `首年发电量：${demoState.annualGeneration}`)
    .replace(/年均发电量:XXX万度/g, `年均发电量:${demoState.annualGeneration}`)
    .replace(/XX万元\/年/g, `${demoState.annualRevenue}/年`)
    .replace(/XX%/g, ensurePercent(demoState.irr))
    .replace(/XXX万度/g, demoState.annualGeneration);

  if (text.includes("项目公司名称")) {
    text = replaceLabelValue(text, "注册资本金（万元）", demoState.projectRegisterCapital);
    text = text.replace(/股东名称及持股比例：\s*\n[^\n]*/g, `股东名称及持股比例：\n${demoState.shareholderRatio}`);
  }

  if (text.includes("用电企业名称")) {
    text = replaceLabelValue(text, "注册资本金（万元）", demoState.userRegisterCapital);
  }

  for (const [label, value] of pptxTemplateReplacementMap()) {
    text = replaceLabelValue(text, label, value);
  }

  return text;
}

function currentDocLabel() {
  return docLabels[demoState.docType];
}

function coerceOaPptProjectListItem(item) {
  const projectCode = normalizeOaPptFieldValue(item?.projectCode);
  const projectName = normalizeOaPptFieldValue(item?.projectName);
  if (!projectCode || !projectName) {
    return null;
  }

  // TRACE[PPT-FE-OA-LIST-006]: 列表项只保留下拉框需要的轻字段；完整 PPT 字段仍由 pptOaProject(projectCode) 写入。
  const option = {
    id: projectCode,
    name: projectName,
    projectCode
  };
  const optionalFields = {
    address: item.address,
    capacity: item.capacity,
    city: item.city,
    investment: item.investment,
    irr: item.irr
  };

  Object.entries(optionalFields).forEach(([key, value]) => {
    const text = normalizeOaPptFieldValue(value);
    if (text) option[key] = text;
  });

  return option;
}

function mergeOaPptProjectOptions(items, options = {}) {
  const seenBackendProjectCodes = new Set();
  const backendOptions = (Array.isArray(items) ? items : [])
    .map(coerceOaPptProjectListItem)
    .filter((item) => {
      if (!item) return false;
      const projectCode = normalizeOaPptFieldValue(item.projectCode);
      if (!projectCode || seenBackendProjectCodes.has(projectCode)) return false;
      seenBackendProjectCodes.add(projectCode);
      return true;
    });

  if (!backendOptions.length) {
    return options.useFallback === false
      ? []
      : FALLBACK_PROJECT_OPTIONS.map((project) => ({ ...project }));
  }

  const currentProject = selectedProject();
  const currentProjectCode = normalizeOaPptFieldValue(demoState.projectCode || currentProject?.projectCode);
  if (
    options.keepCurrentProject !== false &&
    currentProjectCode &&
    !seenBackendProjectCodes.has(currentProjectCode) &&
    currentProject
  ) {
    backendOptions.unshift({ ...currentProject, id: currentProjectCode });
  }

  return backendOptions;
}

function applyOaPptProjectListPayload(result, options = {}) {
  if (!result || result.ok === false) {
    demoState.oaProjectListLoaded = false;
    demoState.oaProjectListLoadStatus = "error";
    demoState.oaProjectListLoadMessage = "后端未返回可用的 OA 项目列表。";
    demoState.oaProjectListWarnings = result?.warnings || [];
    return false;
  }

  PROJECT_OPTIONS = mergeOaPptProjectOptions(result.items, {
    keepCurrentProject: options.keepCurrentProject,
    useFallback: options.useFallback
  });
  const currentProjectCode = normalizeOaPptFieldValue(demoState.projectCode);
  const activeProject =
    PROJECT_OPTIONS.find((item) => item.projectCode === currentProjectCode) ||
    (options.applyActiveSelection === false ? null : PROJECT_OPTIONS[0]);
  if (activeProject && options.applyActiveSelection !== false) {
    applyProjectSelection(activeProject.id, { refresh: false });
  }

  demoState.oaProjectListLoaded = true;
  demoState.oaProjectListLoadSource = result.source || null;
  demoState.oaProjectListWarnings = result.warnings || [];
  demoState.oaProjectListLoadStatus = demoState.oaProjectListWarnings.length ? "warning" : "success";
  demoState.oaProjectListLoadMessage = `已从后端业务库加载 ${PROJECT_OPTIONS.length} 个项目。`;

  postEmbedMessage("PPT_OA_PROJECT_LIST_SYNCED", {
    itemCount: PROJECT_OPTIONS.length,
    total: result.total || PROJECT_OPTIONS.length
  });
  return true;
}

async function requestOaPptProjects(options = {}) {
  const client = window.PptOaProjectClient;
  if (client?.loadProjects) {
    return client.loadProjects({
      endpoint: graphqlEndpoint(),
      headers: graphqlHeaders(),
      keyword: options.keyword,
      limit: options.limit
    });
  }

  // TRACE[PPT-FE-OA-LIST-007]: 桥接脚本异常时保留直接 fetch 兜底，便于本地 iframe 调试。
  const response = await (globalThis.__PPT_REPORT_FETCH || fetch)(graphqlEndpoint(), {
    method: "POST",
    headers: graphqlHeaders(),
    body: JSON.stringify({
      query: `
        query PptOaProjects($keyword: String, $limit: Int) {
          pptOaProjects(keyword: $keyword, limit: $limit) {
            ok
            items
            source
            total
            warnings
          }
        }
      `,
      variables: {
        keyword: options.keyword,
        limit: options.limit
      }
    })
  });
  const payload = await response.json().catch(() => null);
  if (!response.ok) throw new Error(`pptOaProjects 请求失败：${response.status}`);
  if (payload?.errors?.length) throw new Error(payload.errors[0]?.message || "GraphQL 返回异常。");
  return payload?.data?.pptOaProjects;
}

async function loadOaPptProjectOptions(options = {}) {
  if (
    !options.force &&
    (demoState.oaProjectListLoaded || demoState.oaProjectListLoadStatus === "loading")
  ) {
    return;
  }

  demoState.oaProjectListLoadStatus = "loading";
  demoState.oaProjectListLoadMessage = options.keyword
    ? `正在搜索项目：${options.keyword}`
    : "正在从后端业务库加载项目列表。";
  demoState.oaProjectListWarnings = [];
  if (options.refreshOnStart !== false) refreshProjectTemplates();

  try {
    const result = await requestOaPptProjects({ limit: 50, ...options });
    applyOaPptProjectListPayload(result, {
      applyActiveSelection: options.applyActiveSelection,
      keepCurrentProject: options.keepCurrentProject,
      useFallback: options.useFallback
    });
  } catch (error) {
    demoState.oaProjectListLoaded = false;
    demoState.oaProjectListLoadStatus = "error";
    demoState.oaProjectListLoadMessage = error?.message || "项目列表加载失败，当前保留本地演示列表。";
    demoState.oaProjectListWarnings = [];
    if (!PROJECT_OPTIONS.length) {
      PROJECT_OPTIONS = FALLBACK_PROJECT_OPTIONS.map((project) => ({ ...project }));
    }
  } finally {
    refreshProjectTemplates();
  }
}

function renderOaProjectListNotice() {
  const status = demoState.oaProjectListLoadStatus || "idle";
  if (status === "idle" || status === "loading" || status === "success") return "";

  const warnings = Array.isArray(demoState.oaProjectListWarnings)
    ? demoState.oaProjectListWarnings
    : [];
  const warningText = warnings.length ? `<small>${escapeHtml(warnings.join("；"))}</small>` : "";
  return `
    <div class="project-sync-notice ${escapeHtml(status)}">
      <strong>${escapeHtml(demoState.oaProjectListLoadMessage || "正在加载项目列表。")}</strong>
      ${warningText}
    </div>
  `;
}

function projectSearchResultMeta(item) {
  return [item.projectCode, item.city || "未标城市", `${item.capacity || "-"} MW`]
    .filter(Boolean)
    .join(" · ");
}

function renderProjectSearchResults() {
  if (!demoState.projectSearchResultsVisible) return "";
  if (demoState.oaProjectListLoadStatus === "loading") {
    return `<div class="project-search-results" data-project-search-results><div class="project-search-empty" role="status">正在加载项目…</div></div>`;
  }
  if (demoState.oaProjectListLoadStatus === "error") {
    return `<div class="project-search-results" data-project-search-results><div class="project-search-empty" role="status">${escapeHtml(demoState.oaProjectListLoadMessage || "项目加载失败，请重新点击搜索框。")}</div></div>`;
  }

  const project = selectedProject();
  const items = PROJECT_OPTIONS.slice(0, 10);
  if (!items.length) {
    return `
      <div class="project-search-results" data-project-search-results>
        <div class="project-search-empty">暂无匹配项目</div>
      </div>
    `;
  }

  // TRACE[PPT-FE-OA-SEARCH-002]: 搜索结果只展示轻字段；点击后复用 handleProjectSelectionChange 拉取完整 OA 字段。
  return `
    <div class="project-search-results" data-project-search-results>
      ${items.map((item) => {
        const active = item.projectCode === project?.projectCode || item.id === project?.id;
        return `
          <button class="project-search-result ${active ? "active" : ""}" type="button" data-project-search-option="${escapeHtml(item.id)}">
            <strong>${escapeHtml(item.name)}</strong>
            <small>${escapeHtml(projectSearchResultMeta(item))}</small>
          </button>
        `;
      }).join("")}
    </div>
  `;
}

function renderProjectSearchResultsInto(root = document) {
  qsa("[data-project-search]", root).forEach(input => input.setAttribute("aria-expanded", String(Boolean(demoState.projectSearchResultsVisible))));
  qsa("[data-project-search-results-slot]", root).forEach((slot) => {
    slot.innerHTML = renderProjectSearchResults();
    setupProjectSearchResultButtons(slot);
  });
}

async function runProjectKeywordSearch(keyword) {
  const searchText = String(keyword || "").trim();
  const requestSeq = ++projectSearchRequestSeq;

  demoState.projectSearchKeyword = searchText;
  demoState.projectSearchResultsVisible = true;
  demoState.oaProjectListLoadStatus = "loading";
  demoState.oaProjectListLoadMessage = "";
  renderProjectSearchResultsInto();

  try {
    // Load only the first ten choices on focus; keyword input still filters on the server.
    const result = await requestOaPptProjects({ keyword: searchText || undefined, limit: 10 });
    if (requestSeq !== projectSearchRequestSeq || searchText !== demoState.projectSearchKeyword) return;
    applyOaPptProjectListPayload(result, {
      applyActiveSelection: false,
      keepCurrentProject: false,
      useFallback: false
    });
    if (demoState.oaProjectListLoadStatus === "error") PROJECT_OPTIONS = [];
  } catch (error) {
    if (requestSeq !== projectSearchRequestSeq) return;
    PROJECT_OPTIONS = [];
    demoState.oaProjectListLoaded = false;
    demoState.oaProjectListLoadStatus = "error";
    demoState.oaProjectListLoadMessage = error?.message || "项目搜索失败。";
    demoState.oaProjectListWarnings = [];
  }

  renderProjectSearchResultsInto();
}

function selectedProject() {
  return (
    PROJECT_OPTIONS.find((project) => project.id === demoState.projectId) ||
    PROJECT_OPTIONS.find((project) => project.projectCode === demoState.projectCode) ||
    FALLBACK_PROJECT_OPTIONS.find((project) => project.id === demoState.projectId) ||
    FALLBACK_PROJECT_OPTIONS.find((project) => project.projectCode === demoState.projectCode) ||
    PROJECT_OPTIONS[0] ||
    FALLBACK_PROJECT_OPTIONS[0]
  );
}

function applyProjectSelection(projectId, options = {}) {
  const previousProjectCode = String(demoState.projectCode || "");
  const project =
    PROJECT_OPTIONS.find((item) => item.id === projectId || item.projectCode === projectId) ||
    PROJECT_OPTIONS[0];
  if (!project) return;
  if (options.resetReview || previousProjectCode !== String(project.projectCode || "")) resetEnterpriseFields();
  demoState.projectId = project.id;
  Object.assign(demoState, project, { projectName: project.name });

  if (options.resetReview || previousProjectCode !== String(demoState.projectCode || "")) {
    resetPriorGridLookup();
    resetProjectAssetPreview();
    clearTrustedAiInputSources();
    clearAiDraftState();
  }

  if (options.resetReview) {
    // TRACE[PPT-FE-OA-013]: 切换项目后立即清理上一项目的 OA 字段。
    // 详情接口返回前先显示“待填写”，避免 userCompany/projectCompany 等区域短暂残留旧数据。
    resetOaPptSyncedFields();
    demoState.confirmedPages = {};
    demoState.pptPage = "slide03";
    demoState.displayedCompletionPercent = 0;
  }
}

const OA_PPT_FIELD_ALIASES = {};

const OA_PPT_MISSING_FIELD_TEXT = "待填写";
const OA_PPT_STANDARD_FIELD_KEYS = [
  "address",
  "city",
  "projectCompany",
  "projectStatus",
  "projectType",
  "developMode",
  "capacity",
  "investment",
  "irr",
  "consumptionRatio",
  "desulfurPrice",
  "priceDiscount",
  "powerPrice",
  "accessVoltage",
  "operationYears",
  "roofArea",
  "roofRent",
  "roofType",
  "roofOwner",
  "userCompany",
  "userNature",
  "projectRegisterCapital",
  "legalPerson",
  "shareholderRatio",
  "gridMode",
  "managementFee",
  "selfUseRatio",
  "selfScore",
  "postEvalReturn",
  "businessDept",
  "manager",
  "milestone"
];

const OA_PPT_RATIO_PERCENT_FIELDS = new Set(["consumptionRatio"]);
const OA_PPT_NUMBER_PERCENT_FIELDS = new Set(["irr", "postEvalReturn"]);
const OA_PPT_ENUM_TEXT_FIELDS = new Set(["projectStatus", "projectType", "developMode", "roofType", "gridMode"]);
const OA_PPT_OPAQUE_CODE_FIELDS = new Set(["projectCompany"]);
const OA_PPT_PRICE_FIELDS = new Set(["desulfurPrice", "powerPrice"]);
const OA_PPT_ROOF_TYPE_LABELS = {
  "0": "水泥",
  "1": "彩钢瓦",
  "2": "其他"
};

function normalizeOaPptFieldValue(value) {
  if (value === null || value === undefined) return "";
  return String(value).trim();
}

function normalizeRatioAsPercentText(value) {
  const text = normalizeOaPptFieldValue(value);
  if (!text || text.includes("%")) return text;
  const numeric = Number(text.replace(/[^\d.-]/g, ""));
  if (!Number.isFinite(numeric)) return text;
  if (numeric > 0 && numeric <= 1) {
    return `${Number((numeric * 100).toFixed(2))}%`;
  }
  return `${Number(numeric.toFixed(2))}%`;
}

function normalizeRatioAsPercentNumberText(value) {
  const text = normalizeOaPptFieldValue(value);
  if (!text || text.includes("%")) return text.replace("%", "");
  const numeric = Number(text.replace(/[^\d.-]/g, ""));
  if (!Number.isFinite(numeric)) return text;
  if (numeric > 0 && numeric <= 1) {
    return String(Number((numeric * 100).toFixed(2)));
  }
  return String(Number(numeric.toFixed(2)));
}

function shouldSkipOpaqueOaCodeField(key, value) {
  // TRACE[PPT-FE-OA-010]: 本地模拟库部分字段暂时只有 OA 枚举码。
  // 纯数字码不能直接展示到 PPT，正式业务视图 join 字典表返回中文后再允许覆盖。
  return (OA_PPT_ENUM_TEXT_FIELDS.has(key) || OA_PPT_OPAQUE_CODE_FIELDS.has(key)) && /^\d+(\.\d+)?$/.test(value);
}

function normalizeRoofTypeText(value) {
  const text = normalizeOaPptFieldValue(value);
  const code = text.replace(/\.0$/, "");
  return OA_PPT_ROOF_TYPE_LABELS[code] || text;
}

function normalizePriceText(value) {
  const text = normalizeOaPptFieldValue(value);
  if (!text || /元|kWh|度/.test(text)) return text;
  const numeric = Number(text.replace(/[^\d.-]/g, ""));
  if (!Number.isFinite(numeric)) return text;
  return `${text} 元/kWh`;
}

function coerceOaPptFields(fields) {
  // TRACE[PPT-FE-OA-008]: 后端 fields 是跨数据库统一 JSON；这里只做前端已有字段名和展示格式的轻量适配。
  const output = {};
  Object.entries(fields || {}).forEach(([sourceKey, rawValue]) => {
    const key = OA_PPT_FIELD_ALIASES[sourceKey] || sourceKey;
    let value = normalizeOaPptFieldValue(rawValue);
    if (!value) return;
    if (key === "roofType") {
      value = normalizeRoofTypeText(value);
    }
    if (shouldSkipOpaqueOaCodeField(key, value)) return;
    if (OA_PPT_RATIO_PERCENT_FIELDS.has(key)) {
      value = normalizeRatioAsPercentText(value);
    }
    if (OA_PPT_NUMBER_PERCENT_FIELDS.has(key)) {
      value = normalizeRatioAsPercentNumberText(value);
    }
    if (OA_PPT_PRICE_FIELDS.has(key)) {
      value = normalizePriceText(value);
    }
    output[key] = value;
  });
  return output;
}

function resetOaPptSyncedFields() {
  // TRACE[PPT-FE-OA-012]: 选择新项目时先清空上一个项目的 OA 标准字段。
  // 后端视图某些列可能为空；若不重置，右侧 PPT 预览会残留上一项目的 userCompany 等旧值。
  const previousKeys = new Set([...OA_PPT_STANDARD_FIELD_KEYS, ...aiTrustedOaFieldKeys]);
  previousKeys.forEach((key) => {
    if (aiTrustedDocumentFieldKeys.has(key) || userEditedPptFieldKeys.has(key)) return;
    demoState[key] = OA_PPT_STANDARD_FIELD_KEYS.includes(key) ? OA_PPT_MISSING_FIELD_TEXT : '';
  });
  aiTrustedOaFieldKeys.clear();
}

let businessRiskTimer = null;
let businessRiskRequest = 0;
let businessRiskProject = "";
function scheduleBusinessRiskEvaluation() {
  if (demoState.oaProjectLoadSource?.provider !== 'oa-pg+pm-mysql-live') return;
  ++businessRiskRequest;
  clearTimeout(businessRiskTimer);
  businessRiskTimer = setTimeout(() => { refreshBusinessRiskEvaluation().catch(() => {}); }, 500);
}
async function refreshBusinessRiskEvaluation() {
  const projectCode = demoState.projectCode;
  const request = ++businessRiskRequest;
  if (businessRiskProject !== projectCode) {
    businessRiskProject = projectCode;
    demoState.manualRiskDecisionsJson = '{}';
  }
  try {
    const response = await (globalThis.__PPT_REPORT_FETCH || fetch)(`/api/projects/${encodeURIComponent(projectCode)}/ppt-report/risk-rules`, {
      method: 'POST', headers: graphqlHeaders(),
      body: JSON.stringify({fields: {manualRiskDecisionsJson: demoState.manualRiskDecisionsJson || '{}'}}),
      signal: AbortSignal.timeout(60000)
    });
    const body = await response.json();
    if (request !== businessRiskRequest || demoState.projectCode !== projectCode) return;
    if (!response.ok || !body.success || !body.data?.fields) throw new Error(body.message || '规则数据读取失败');
    applyBusinessRiskEvaluation(body.data);
  } catch (error) {
    if (request !== businessRiskRequest || demoState.projectCode !== projectCode) return;
    // A failed read cannot leave stale green results from the previous evaluation.
    for (const key of [...Array.from({length:10},(_,i)=>`fkxz${i+1}`), 'returnConclusion']) {
      demoState[key] = '待确认'; aiTrustedOaFieldKeys.delete(key);
    }
    renderDraftPanels();
    throw error;
  }
}

function applyBusinessRiskEvaluation(result) {
  if (result.projectCode !== demoState.projectCode) return false;
  for (const [key, value] of Object.entries(result.fields || {})) {
    if (!/^(fkxz(?:[1-9]|10)|benchmarkReturn|returnConclusion|riskRuleEvaluationJson)$/.test(key) || typeof value !== 'string') continue;
    demoState[key] = key === 'benchmarkReturn' ? '7.7%' : value;
    aiTrustedOaFieldKeys.add(key);
    enterpriseSyncedFieldKeys.delete(key);
    enterpriseLastAppliedValues.delete(key);
  }
  renderDraftPanels();
  return true;
}

function applyOaPptProjectPayload(result) {
  clearAiDraftState();

  if (!result || result.ok === false) {
    demoState.oaProjectLoadStatus = "error";
    demoState.oaProjectLoadedProjectCode = "";
    demoState.oaProjectLoadMessage = "后端未返回可用的 OA 项目字段。";
    demoState.oaProjectLoadWarnings = result?.warnings || [];
    return false;
  }

  if (!result.found) {
    resetOaPptSyncedFields();
    demoState.oaProjectLoadStatus = "warning";
    demoState.oaProjectLoadedProjectCode = result.projectCode || demoState.projectCode;
    demoState.oaProjectLoadMessage = `后端业务库暂未找到项目 ${result.projectCode || demoState.projectCode}，当前字段已标记为待填写。`;
    demoState.oaProjectLoadWarnings = result.warnings || [];
    return false;
  }

  if (result.source?.provider === 'oa-pg+pm-mysql-live' && demoState.liveSourceResetProjectCode !== result.projectCode) {
    // Real project tests must never inherit the initial example's manual text or numbers.
    allPptFieldItems().forEach(field => { demoState[field.key] = ''; });
    demoState.liveSourceResetProjectCode = result.projectCode;
  }
  const fields = coerceOaPptFields(result.fields);
  Object.entries(result.fields || {}).filter(([key,value])=>/^scoreCell\d+_\d+_\d+$/.test(key)&&typeof value==='string').forEach(([key,value])=>{fields[key]=value;});
  resetOaPptSyncedFields();
  Object.assign(demoState, fields);
  Object.keys(fields).forEach((key) => aiTrustedOaFieldKeys.add(key));
  if (fields.scoreRowsJson) {
    for (const page of [21,22]) {
      const id=`slide${page}`;
      PPTX_TABLE_CELL_FIELD_BINDINGS[id]={};
      for (const key of Object.keys(fields).filter(key=>key.startsWith(`scoreCell${page}_`))) {
        const [,row,column]=key.match(/^scoreCell\d+_(\d+)_(\d+)$/) || [];
        if (row !== undefined) PPTX_TABLE_CELL_FIELD_BINDINGS[id][`0:${row}:${column}`]=key;
      }
      pptSlideFields[id]=Object.keys(fields).filter(key=>key.startsWith(`scoreCell${page}_`)&&key.endsWith('_4')).map(key=>({key,label:`评分表第${key.split('_')[1]}行得分`,method:'OA抓取',group:'同一评分表'}));
    }
  }
  demoState.projectCode = result.projectCode || demoState.projectCode;
  demoState.projectName = fields.projectName || demoState.projectName;
  aiTrustedOaFieldKeys.add("projectCode");
  aiTrustedOaFieldKeys.add("projectName");
  demoState.oaProjectLoadedProjectCode = demoState.projectCode;
  demoState.oaScoreLossDetails = Array.isArray(result.scoreLossDetails) ? result.scoreLossDetails : [];
  demoState.oaProjectLoadSource = result.source || null;
  scheduleBusinessRiskEvaluation();
  if (!currentPriorGridSession().checked && !currentPriorGridSession().busy) void checkPriorProjects();
  demoState.oaProjectLoadWarnings = result.warnings || [];
  demoState.oaProjectLoadStatus = demoState.oaProjectLoadWarnings.length ? "warning" : "success";
  demoState.oaProjectLoadMessage = `已从后端业务库同步 ${Object.keys(fields).length} 个 OA 标准字段。`;

  postEmbedMessage("PPT_OA_PROJECT_SYNCED", {
    projectCode: demoState.projectCode,
    scoreLossRows: demoState.oaScoreLossDetails.length,
    syncedFieldCount: Object.keys(fields).length
  });
  return true;
}

async function requestOaPptProject(projectCode) {
  const client = window.PptOaProjectClient;
  if (client?.loadProject) {
    return client.loadProject({
      endpoint: graphqlEndpoint(),
      headers: graphqlHeaders(),
      projectCode
    });
  }

  // TRACE[PPT-FE-OA-009]: 如果桥接脚本加载失败，legacy 页面仍能直接 fetch GraphQL，保证本地演示不中断。
  const response = await (globalThis.__PPT_REPORT_FETCH || fetch)(graphqlEndpoint(), {
    method: "POST",
    headers: graphqlHeaders(),
    body: JSON.stringify({
      query: `
        query PptOaProject($projectCode: String!) {
          pptOaProject(projectCode: $projectCode) {
            ok
            found
            projectCode
            fields
            scoreLossDetails
            source
            warnings
          }
        }
      `,
      variables: { projectCode }
    })
  });
  const payload = await response.json().catch(() => null);
  if (!response.ok) throw new Error(`pptOaProject 请求失败：${response.status}`);
  if (payload?.errors?.length) throw new Error(payload.errors[0]?.message || "GraphQL 返回异常。");
  return payload?.data?.pptOaProject;
}

function renderOaProjectLoadNotice() {
  const status = demoState.oaProjectLoadStatus || "idle";
  if (status === "idle") return "";
  const warnings = Array.isArray(demoState.oaProjectLoadWarnings) ? demoState.oaProjectLoadWarnings : [];
  const warningText = warnings.length ? `<small>${escapeHtml(warnings.join("；"))}</small>` : "";
  const source = demoState.oaProjectLoadSource;
  const sourceText = source?.schema
    ? `<small>来源：${escapeHtml(source.schema)}.${escapeHtml(source.projectSnapshotView || "")}</small>`
    : "";
  return "";
// 如果要看抓取了什么数据库就打开
  // return `
  //   <div class="project-sync-notice ${escapeHtml(status)}">
  //     <strong>${escapeHtml(demoState.oaProjectLoadMessage || "正在同步 OA 项目字段。")}</strong>
  //     ${warningText}
  //     ${sourceText}
  //   </div>
  // `;
}

function refreshProjectTemplates() {
  const templates = qsa("[data-input-template]");
  if (!templates.length) {
    updateProjectAutofill(document);
    return;
  }
  templates.forEach((template) => refreshProjectTemplate(template));
}

function isCurrentOaProjectAlreadyLoaded() {
  const projectCode = String(demoState.projectCode || "").trim();
  return Boolean(
    projectCode &&
      demoState.oaProjectLoadedProjectCode === projectCode &&
      (demoState.oaProjectLoadStatus === "success" || demoState.oaProjectLoadStatus === "warning")
  );
}

async function ensureCurrentOaPptProjectLoaded(options = {}) {
  // TRACE[PPT-FE-OA-011]: “进入”按钮兜底同步。
  // 如果用户没有切换下拉框，也要在进入 AI 草稿前按当前 projectCode 拉一次后端标准字段。
  if (isCurrentOaProjectAlreadyLoaded()) return;

  const projectCode = String(demoState.projectCode || "").trim();
  if (!projectCode) return;

  demoState.oaProjectLoadStatus = "loading";
  demoState.oaProjectLoadedProjectCode = "";
  demoState.oaProjectLoadMessage = `正在按项目编号 ${projectCode} 读取后端 OA 标准字段。`;
  demoState.oaProjectLoadWarnings = [];
  if (options.refresh !== false) refreshProjectTemplates();

  try {
    const result = await requestOaPptProject(projectCode);
    applyOaPptProjectPayload(result);
  } catch (error) {
    resetOaPptSyncedFields();
    demoState.oaProjectLoadStatus = "error";
    demoState.oaProjectLoadedProjectCode = "";
    demoState.oaProjectLoadMessage = `读取 OA 项目字段失败：${error instanceof Error ? error.message : "未知错误"}`;
    demoState.oaProjectLoadWarnings = [];
  }

  if (options.refresh !== false) refreshProjectTemplates();
}

async function handleProjectSelectionChange(projectId) {
  applyProjectSelection(projectId, { resetReview: true });
  await ensureCurrentOaPptProjectLoaded();
  if (demoState.oaProjectLoadSource?.provider === 'oa-pg+pm-mysql-live') await loadEnterpriseInformation({reveal:false});
}

function readForm(root = document) {
  const previousFingerprint = currentAiDraftFingerprint();
  demoState.projectCode = qs("[data-field='projectCode']", root)?.value || demoState.projectCode;
  demoState.address = qs("[data-field='address']", root)?.value || demoState.address;
  demoState.roofArea = qs("[data-field='roofArea']", root)?.value || demoState.roofArea;
  demoState.capacity = qs("[data-field='capacity']", root)?.value || demoState.capacity;
  if (previousFingerprint !== currentAiDraftFingerprint()) {
    clearAiDraftState();
  }
}

function updateDocMode(mode) {
  demoState.docType = mode;
  qsa("[data-doc-mode]").forEach((button) => button.classList.toggle("active", button.dataset.docMode === mode));
  qsa("[data-doc-label]").forEach((node) => {
    node.textContent = currentDocLabel().name;
  });
  renderDraftPanels();
}

function renderInputTemplate(root = document) {
  const targets = root.matches?.("[data-input-template]") ? [root] : qsa("[data-input-template]", root);
  targets.forEach((target) => {
    target.innerHTML = `
      <div class="project-select-card">
        <span class="project-select-title">搜索已有项目</span>
        <input
          class="project-search-input"
          type="search"
          data-project-search
          aria-label="搜索已有项目"
          aria-expanded="${Boolean(demoState.projectSearchResultsVisible)}"
          placeholder="点击选择，或输入项目名称、项目编号或城市"
          value="${escapeHtml(demoState.projectSearchKeyword || "")}"
        />
        <div data-project-search-results-slot>${renderProjectSearchResults()}</div>
        ${renderOaProjectListNotice()}
      </div>
      ${renderOaProjectLoadNotice()}
      <div class="form-grid project-autofill-grid">
        <label>项目编号<input data-field="projectCode" value="${escapeHtml(demoState.projectCode)}" readonly /></label>
        <label>项目地址<input data-field="address" value="${escapeHtml(demoState.address)}" readonly /></label>
        <label>屋顶面积（平方米）<input data-field="roofArea" value="${escapeHtml(demoState.roofArea)}" readonly /></label>
        <label>装机容量（MW）<input data-field="capacity" value="${escapeHtml(demoState.capacity || "-")}" readonly /></label>
      </div>
      <div class="actions">
        <button class="primary" data-ai-draft>进入</button>
        <button type="button" data-enterprise-query ${enterpriseLoadStatus === "loading" ? "disabled" : ""}>查询企业信息</button>
      </div>
      <div role="status" data-enterprise-query-status>${escapeHtml(enterpriseLoadMessage)}</div>
    `;
    qs("[data-enterprise-query]", target)?.addEventListener("click", () => void loadEnterpriseInformation());
  });
  window.dispatchEvent(new CustomEvent("ppt-report:document-context"));
  qsa('[data-final-generate]').forEach(button => {
    if (button.firstChild?.nodeType === Node.TEXT_NODE) button.firstChild.textContent = demoState.oaProjectLoadSource?.provider === 'oa-pg+pm-mysql-live' ? '生成测试稿' : '生成最终';
  });
}

function renderDraftPanels() {
  invalidateRenderedPreviewSummary();
  qsa("[data-ai-draft-preview]").forEach((target) => {
    const label = currentDocLabel();
    if (demoState.docType === "ppt") {
      target.innerHTML = renderPptReview();
      observePptSlidePreviewSize(target);
      schedulePptSlidePreviewFit(target);
      animateCompletionModules(target);
      return;
    }
    target.innerHTML = `
      <div class="simple-draft">
        <div class="draft-document">
          <div class="draft-title">
            <span>AI 初稿</span>
            <strong>${escapeHtml(label.name)}</strong>
          </div>
          <h3>${escapeHtml(demoState.projectName)}</h3>
          <div class="draft-lines">
            <span></span><span></span><span></span><span></span><span></span><span></span>
          </div>
        </div>
      </div>
    `;
  });
}

function currentPptPage() {
  return pptPages.find((page) => page.id === demoState.pptPage) || pptPages[0];
}

function normalizePptField(field) {
  if (!Array.isArray(field)) return field;
  return {
    key: field[0],
    label: field[1],
    type: field[2] || "text",
    method: field[3] || "OA抓取",
    group: field[4] || ""
  };
}

function pageFields(page) {
  if (page.id === "slide12" && currentPriorGridSession().status === "none") return [];
  let fields = (pptSlideFields[page.id] || page.fields || []).map(normalizePptField);
  if (page.id === "slide07" && String(demoState.debtAcquisitionStatus || "").trim() !== "是") fields = fields.filter(field => field.key === "debtAcquisitionStatus");
  return fields.map(field => enterpriseFinancialKey(field.key) && enterpriseSyncedFieldKeys.has(field.key) && !aiTrustedDocumentFieldKeys.has(field.key)
    ? { ...field, method: demoState[field.key] === enterpriseLastAppliedValues.get(field.key) ? "企查查补充（财务文件优先）" : "人工填写" } : field);
}

function methodTone(method = "") {
  if (method.includes("人工")) return "manual";
  if (method.includes("企查查")) return "qcc";
  if (method.includes("AI")) return "ai";
  if (method.includes("自动")) return "auto";
  if (method.includes("PM")) return "pm";
  if (method.includes("OA")) return "oa";
  return "template";
}

function hasStateField(key) {
  return Object.prototype.hasOwnProperty.call(demoState, key);
}

// Page 4 uses the template's five paragraphs; full API records remain in the source fields.
function creditRiskFinding(value) {
  const text = String(value ?? '').trim();
  if (!text || /^(待补充|待同步|待确认|未查询|未扫描成功)$/.test(text)) return '待补充';
  const count = text.match(/(?:共|本页|合计|总计)\s*(\d+)\s*条/);
  if (count?.[1] === '0' || /^(无|未查询到|暂无|没有)(?:相关)?(?:记录|失信|被执行|股权质押|动产抵押|经营异常|严重违法)/.test(text)) return '无记录';
  const result = count ? `${count[1]}条` : '有记录';
  if (/已解除质押/.test(text)) return `${result}（已解除）`;
  if (/状态[：:\s]*已注销/.test(text)) return `${result}（已注销）`;
  if (/移出日期[：:\s]*\d{4}[-年/]\d{1,2}/.test(text)) return `${result}（已移出）`;
  if (/已全部履行/.test(text)) return `${result}（已履行）`;
  return result;
}

function creditRiskParagraphs(data) {
  const finding = key => creditRiskFinding(data[key]);
  const riskKeys = ['operationAbnormal', 'seriousIllegal', 'noDishonestExecution', 'executionRecord', 'equityPledge', 'movableMortgage'];
  const findings = riskKeys.map(finding);
  const isSample = riskKeys.concat('seriousIllegalConclusion').some(key => /接口样例|示例|LOCAL-/.test(String(data[key] ?? '')));
  const conclusion = data.creditRiskConclusion || (isSample ? '接口样例含历史风险记录，当前状态及影响待核对。'
    : findings.includes('待补充') ? '资料待补充，资信结论待核对。'
    : findings.every(value => value === '无记录') ? '本次查询未见上述风险记录。'
    : '存在风险记录，当前状态及影响待核对。');
  const abnormal = finding('operationAbnormal');
  const illegal = finding('seriousIllegal');
  const businessFindings = abnormal === illegal && /^\d+条（已移出）$/.test(abnormal)
    ? `经营异常、严重违法各${abnormal.replace('（已移出）', '')}，均已移出`
    : `经营异常${abnormal}；严重违法${illegal}`;
  return [
    '企业资信与司法风险：',
    `工商状态：${String(data.businessStatus || '待补充').trim()}；${businessFindings}`,
    `司法记录：失信${finding('noDishonestExecution')}；执行${finding('executionRecord')}；质押${finding('equityPledge')}；抵押${finding('movableMortgage')}`,
    `股东背景：${data.shareholderBackground || '待补充'}`,
    `     结论：${conclusion}`,
  ];
}

function policyRiskParagraphs(data) {
  const text = String(data.policyComplianceRisk || '').trim().replace(/^政策合规性风险[：:]\s*/, '');
  const conclusion = text.match(/(?:^|\n)\s*结论[：:]\s*([^\n]*)/);
  const body = text.replace(/(?:^|\n)\s*结论[：:][^\n]*/, '').trim();
  return ['政策合规性风险：', body || '待补充', `结论：${conclusion?.[1]?.trim() || '待补充'}`];
}

function qccRiskSummaryText() {
  return creditRiskParagraphs(demoState).join('\n');
}

function slide09BusinessSummaryBlockText() {
  // TRACE[PPT-BIZ-010]: 第9页结论来自服务端规则计算，与后端生成脚本保持同一段落格式。
  return [
    "收益率达标判定：",
    `全投资税后 IRR：${ensurePercent(demoState.irr)}`,
    `基准收益率要求：7.7%`,
    `结论：${demoState.returnConclusion || "待填写"}`
  ].join("\n");
}

function fieldValue(field) {
  if (field.key === "benchmarkReturn") return "7.7%";
  if (hasStateField(field.key)) return demoState[field.key] ?? "";
  if (FIELD_SAMPLE_VALUES[field.label]) return FIELD_SAMPLE_VALUES[field.label];
  if (field.method.includes("人工")) return "";
  if (field.method.includes("AI总结")) return "AI 已生成摘要，等待人工确认。";
  if (field.method.includes("AI生成")) return "AI 已按项目所在地生成政策初稿。";
  if (field.method.includes("企查查")) return "企查查待同步";
  if (field.method.includes("自动")) return "由测算边界自动计算";
  if (field.method.includes("OA")) return "OA 待同步";
  return "待补充";
}

function observedFieldValue(field) {
  return String(fieldValue(field) ?? "").trim();
}

function groupFields(fields) {
  return fields.reduce((groups, field) => {
    const group = field.group || "本页字段";
    if (!groups[group]) groups[group] = [];
    groups[group].push(field);
    return groups;
  }, {});
}

function countMethods(fields) {
  return fields.reduce((counts, field) => {
    const tone = methodTone(field.method);
    counts[tone] = (counts[tone] || 0) + 1;
    return counts;
  }, {});
}

function allPptFieldItems() {
  return pptPages.flatMap((page) =>
    pageFields(page).map((field) => ({
      ...field,
      pageId: page.id,
      pageIndex: page.index,
      pageName: page.name,
      pageTitle: page.title
    }))
  );
}

function isMissingFieldValue(value) {
  const text = String(value ?? "").trim();
  if (!text) return true;
  if (/^[-—]+$/.test(text)) return true;
  // TRACE[PPT-SENTINEL-001]: 字段监控只诊断“空缺/占位”字段，不再把复核、办理中等业务风险文案判为问题。
  return /^(待同步|待补充|待人工补充|待填写|待填|待企查查同步|OA 待同步|空缺|缺失)[。.]?$/.test(text);
}

function hasAiUsableValue(value) {
  if (value === null || value === undefined) return false;
  if (typeof value === "string") return !isMissingFieldValue(value);
  return ["number", "boolean"].includes(typeof value);
}

function clearTrustedAiInputSources() {
  try { JSON.parse(demoState.reportAiDraftFieldKeysJson || "[]").forEach(key => { demoState[key] = ""; }); } catch {}
  demoState.reportAiDraftFieldKeysJson = "[]";
  demoState.reportAiDraftProvenanceJson = "{}";
  aiTrustedOaFieldKeys.clear();
  aiTrustedDocumentFieldKeys.clear();
  userEditedPptFieldKeys.clear();
  aiGeneratedPptFieldKeys.clear();
}

function isTrustedAiInputField(key) {
  return (
    AI_ALWAYS_TRUSTED_PROJECT_KEYS.has(key) ||
    aiTrustedOaFieldKeys.has(key) ||
    aiTrustedDocumentFieldKeys.has(key) ||
    userEditedPptFieldKeys.has(key) ||
    aiGeneratedPptFieldKeys.has(key)
  );
}

function pickTrustedFields(keys, options = {}) {
  const output = {};
  const alwaysInclude = options.alwaysInclude || new Set();
  keys.forEach((key) => {
    if (!alwaysInclude.has(key) && !isTrustedAiInputField(key)) return;
    if (!hasAiUsableValue(demoState[key])) return;
    output[key] = demoState[key];
  });
  return output;
}

function fieldIssueReason(field) {
  const value = observedFieldValue(field);
  if (!isMissingFieldValue(value)) return "";
  if (!value) return "当前字段为空";
  return "当前字段仍是占位值";
}

function fieldIssueItems(fields) {
  return fields
    .map((field) => ({ ...field, issueReason: fieldIssueReason(field) }))
    .filter((field) => field.issueReason);
}

function fieldRobustness(fields) {
  if (!fields.length) return 100;
  const issueCount = fieldIssueItems(fields).length;
  return Math.max(0, Math.round(((fields.length - issueCount) / fields.length) * 100));
}

function uniqueFields(fields) {
  const seen = new Set();
  return fields.filter((field) => {
    if (seen.has(field.key)) return false;
    seen.add(field.key);
    return true;
  });
}

function aiDraftFields() {
  return uniqueFields(
    pptPages.flatMap((page) => pageFields(page).map((field) => ({ ...field, page: `${page.index} ${page.name}` })))
      .filter((field) => methodTone(field.method) === "ai")
  );
}

function projectPayload() {
  return {
    projectName: demoState.projectName,
    projectCode: demoState.projectCode,
    city: demoState.city,
    address: demoState.address,
    roofArea: demoState.roofArea,
    capacity: demoState.capacity,
    developMode: demoState.developMode,
    operationYears: demoState.operationYears,
    investment: demoState.investment,
    irr: demoState.irr,
    payback: demoState.payback,
    consumptionRatio: demoState.consumptionRatio,
    powerPrice: demoState.powerPrice,
    userCompany: demoState.userCompany,
    projectCompany: demoState.projectCompany,
    roofOwner: demoState.roofOwner,
    roofType: demoState.roofType,
    qccRisk: demoState.qccRisk,
    selfScore: demoState.selfScore,
    scoreLoss: demoState.scoreLoss,
    financeSummary: demoState.financeSummary,
    industryOverview: demoState.industryOverview
  };
}

function graphqlEndpoint() {
  return window.__PPT_REPORT_GRAPHQL_ENDPOINT || "/graphql";
}

function resolvePptDownloadUrl(downloadUrl) {
  // TRACE[PPT-DOWNLOAD-002]: 后端可能返回绝对下载地址，也可能返回 /outputs/ppt-report/xxx.pptx。
  // 如果 GraphQL endpoint 指向真实后端域名，则把相对下载地址也绑定到同一个后端 origin。
  const rawUrl = String(downloadUrl || "").trim();
  if (!rawUrl) return "";
  if (/^https?:\/\//i.test(rawUrl)) return rawUrl;

  const endpoint = graphqlEndpoint();
  if (rawUrl.startsWith("/") && /^https?:\/\//i.test(endpoint)) {
    return new URL(rawUrl, endpoint).toString();
  }

  return rawUrl;
}

function documentParseEndpoint() {
  // TRACE[PPT-DOC-023]: 上传解析接口由 React 运行时注入，便于 iframe 部署到客户系统时切换后端域名。
  return window.__PPT_REPORT_DOCUMENT_PARSE_ENDPOINT || "/api/ppt-document/parse";
}

function embedContext() {
  // TRACE[PPT-IFR-001]: React 嵌入页会把 iframe 参数写到这个全局上下文，legacy JS 只读取，不负责解析 URL。
  return window.__PPT_REPORT_EMBED_CONTEXT || null;
}

function graphqlHeaders() {
  // TRACE[PPT-IFR-004]: iframe 场景下 token 由父系统放进 URL，后续正式环境可以替换成一次性 embed token。
  const headers = { "Content-Type": "application/json" };
  const token = window.__PPT_REPORT_ACCESS_TOKEN?.() || embedContext()?.token;
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  return headers;
}

function embedAuthHeaders() {
  // TRACE[PPT-DOC-024]: multipart 上传不能手动设置 Content-Type，否则浏览器不会生成 boundary。
  // 这里只透传 iframe token，Content-Type 交给 FormData 自动处理。
  const headers = {};
  const token = window.__PPT_REPORT_ACCESS_TOKEN?.() || embedContext()?.token;
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  return headers;
}

function postEmbedMessage(type, payload = {}) {
  // TRACE[PPT-IFR-003]: 只有 iframe 嵌入模式才给父窗口发消息，普通 /ppt-risk-report 页面保持原样运行。
  const context = embedContext();
  if (!context?.embedMode || window.parent === window) return;

  window.parent.postMessage(
    {
      projectId: context.projectId,
      sessionId: context.sessionId,
      type,
      ...payload
    },
    context.parentOrigin || "*"
  );
}

function graphqlProjectPayload() {
  // AIGC backend 的 GraphQL project input 只接收稳定项目快照字段；
  // 其他页面字段通过 fields JSON 传入，避免 GraphQL 输入类型膨胀。
  return pickTrustedFields(PPT_PROJECT_PAYLOAD_KEYS, {
    alwaysInclude: AI_ALWAYS_TRUSTED_PROJECT_KEYS
  });
}

function trustedPptGenerationFields() {
  const trustedKeys = new Set([
    ...aiTrustedOaFieldKeys,
    ...aiTrustedDocumentFieldKeys,
    ...userEditedPptFieldKeys,
    ...aiGeneratedPptFieldKeys,
    ...AI_DECISION_FIELD_KEYS,
    ...AI_DRAFT_META_KEYS
  ]);

  const output = Object.fromEntries(
    Object.entries(demoState)
      .filter(([key]) => trustedKeys.has(key))
      .filter(([, value]) => hasAiUsableValue(value))
  );
  if (demoState.debtAcquisitionStatus !== "是") {
    ["originalShareholderRisk", "projectCompanyLitigation", "pledgeFreezeStatus", "acquisitionLitigationAnalysis", "acquisitionPledgeAnalysis"].forEach(key => delete output[key]);
  }
  const prior = currentPriorGridSession();
  if (prior.status !== 'has') {
    for (const key of PRIOR_REVIEW_KEYS) output[key] = prior.status === 'none' ? '不适用（已核实无前序项目）' : '待确认（前序项目关系未确认）';
  }
  if (Object.keys(output).some(enterpriseFinancialKey)) output.financialReportYears = QCC_FINANCIAL_YEARS.join(",");
  return output;
}

function pptGenerationPayload() {
  // TRACE[PPT-TEMPLATE-NEW-008]: 后端生成真实 PPTX 时使用这个 payload。
  // 当前前端预览、左侧字段和后端模板已统一到新版 25 页 PPTX，字段 JSON 保持同源。
  return {
    project: graphqlProjectPayload(),
    fields: trustedPptGenerationFields(),
    confirmedPages: { ...(demoState.confirmedPages || {}) },
    fieldMappingVersion: "minimal-ppt-v1"
  };
}

async function requestPptGeneration() {
  // TRACE[PPT-IFR-005]: AIGC 大盒子中通过 GraphQL 生成真实 PPTX；失败后仍退回静态样例文件，方便离线演示。
  if (demoState.docType !== "ppt") return null;
  if (!hasCurrentDeepSeekAiDraft()) {
    throw new Error("当前字段没有绑定本项目的 DeepSeek 草稿，已停止生成，避免复用旧项目 AI 结论。");
  }

  try {
    if (demoState.oaProjectLoadSource?.provider === 'oa-pg+pm-mysql-live') {
      const response = await (globalThis.__PPT_REPORT_FETCH || fetch)(`/api/projects/${encodeURIComponent(demoState.projectCode)}/ppt-report/review-draft`, {
        method: 'POST', headers: graphqlHeaders(), body: JSON.stringify({fields: trustedPptGenerationFields()})
      });
      const body = await response.json();
      const result = body.data;
      if (!response.ok || !body.success || !result?.downloadUrl) throw new Error(body.message || '测试稿生成失败');
      if (result.riskRules) applyBusinessRiskEvaluation(result.riskRules);
      return {href: resolvePptDownloadUrl(result.downloadUrl), text: '下载测试PPT', note: '端到端测试稿，待补充项和接口样例需核对。', fileName: cleanPptDownloadName(result.fileName)};
    }
    const response = await (globalThis.__PPT_REPORT_FETCH || fetch)(graphqlEndpoint(), {
      method: "POST",
      headers: graphqlHeaders(),
      body: JSON.stringify({
        query: `
          mutation GeneratePptReport($input: GeneratePptReportInput!) {
            generatePptReport(input: $input) {
              ok
              fileName
              downloadUrl
              bytes
            }
          }
        `,
        variables: {
          input: {
            project: graphqlProjectPayload(),
            fields: trustedPptGenerationFields()
          }
        }
      })
    });
    if (!response.ok) throw new Error(`PPT generate failed: ${response.status}`);
    const data = await response.json();
    const result = data?.data?.generatePptReport;
    const downloadUrl = resolvePptDownloadUrl(result?.downloadUrl);
    if (!result?.ok || !downloadUrl) {
      throw new Error(data?.errors?.[0]?.message || "PPT generate response missing downloadUrl");
    }
    return {
      href: downloadUrl,
      text: "下载生成PPT",
      note: `后端已把当前字段写入当前 PPTX 模板，文件大小 ${Math.round((result.bytes || 0) / 1024)} KB。`,
      fileName: cleanPptDownloadName(result.fileName || "风控报告.pptx")
    };
  } catch (error) {
    if (demoState.oaProjectLoadSource?.provider === 'oa-pg+pm-mysql-live') throw error;
    console.warn("[ppt-generate] fallback to static sample:", error);
    return null;
  }
}

function parsedDocumentFileParseFields(result) {
  const rawFields = result?.fields && typeof result.fields === "object" ? result.fields : {};
  return Object.fromEntries(
    Object.entries(rawFields).filter(([key, value]) => (
      PPT_DOCUMENT_FILE_PARSE_FIELD_KEYS.has(key) &&
      value !== null &&
      value !== undefined &&
      String(value).trim() !== ""
    ))
  );
}

function applyParsedDocumentFields(result) {
  // TRACE[PPT-DOC-025]: 前端再次白名单过滤文件解析字段，形成“后端抽取 + 前端保护”的双保险。
  const fields = parsedDocumentFileParseFields(result);
  const fieldCount = Object.keys(fields).length;
  if (fieldCount > 0) {
    clearAiDraftState();
  }
  Object.assign(demoState, fields);
  Object.keys(fields).forEach((key) => aiTrustedDocumentFieldKeys.add(key));

  demoState.documentParseSuggestions = Array.isArray(result?.suggestions) ? result.suggestions : [];
  demoState.documentParseWarnings = Array.isArray(result?.warnings) ? result.warnings : [];
  demoState.documentParseStatus = fieldCount > 0 ? "success" : "warning";
  demoState.documentParseMessage = fieldCount > 0
    ? `已从资料中填入 ${fieldCount} 个文件解析字段，原文件已在后端临时区删除。`
    : "资料已解析，但未命中第 8 页或 EMC 条款页可自动填入字段；请继续人工核对。";

  postEmbedMessage("PPT_DOCUMENT_PARSED", {
    fieldCount,
    parser: result?.document?.parser || "",
    warnings: demoState.documentParseWarnings
  });
}

async function requestPptDocumentParse(file) {
  // TRACE[PPT-DOC-026]: 上传原文件只进入解析接口，返回后只保留 Markdown 摘要和结构化字段。
  const form = new FormData();
  form.append("file", file);

  const response = await (globalThis.__PPT_REPORT_FETCH || fetch)(documentParseEndpoint(), {
    method: "POST",
    headers: embedAuthHeaders(),
    body: form
  });

  const result = await response.json().catch(() => null);
  if (!response.ok) {
    // REVIEW[PPT-DOC-038]: 404 多半是本地 dev 代理或后端启动问题，不是文件解析内容问题。
    // 这里把低层 HTTP 状态翻译成可操作提示，方便甲方现场联调时快速定位。
    if (response.status === 404) {
      throw new Error("资料解析接口未找到：请确认后端已启动，并且前端代理或 VITE_PPT_DOCUMENT_PARSE_ENDPOINT 指向后端。");
    }
    if (response.status === 502) {
      throw new Error("资料解析后端未连接：前端代理已生效，但 AIGC backend 3000 端口未启动或启动失败。");
    }
    throw new Error(result?.message || `资料解析失败：${response.status}`);
  }
  return result;
}

async function handlePptDocumentUpload(input) {
  const file = input.files?.[0];
  if (!file) return;

  demoState.documentParseStatus = "loading";
  demoState.documentParseMessage = `正在解析 ${file.name}，只会自动填入第 8 页和 EMC 条款页的文件解析字段。`;
  demoState.documentParseWarnings = [];
  demoState.documentParseSuggestions = [];
  renderDraftPanels();

  try {
    const result = await requestPptDocumentParse(file);
    applyParsedDocumentFields(result);
  } catch (error) {
    demoState.documentParseStatus = "error";
    demoState.documentParseMessage = error.message || "资料解析失败，请检查文件或后端服务。";
    demoState.documentParseWarnings = [];
    postEmbedMessage("PPT_DOCUMENT_PARSE_ERROR", {
      message: demoState.documentParseMessage
    });
  } finally {
    input.value = "";
    renderDraftPanels();
  }
}

function localAiDraftValues(fields) {
  const values = {};
  fields.forEach((field) => {
    if (field.label.includes("主要失分点")) {
      values[field.key] = "AI识别：企业资料完整度、用电数据连续性和合同边界仍需复核。";
    } else if (field.label.includes("资信结论")) {
      values[field.key] = "AI总结：企查查风险项暂未发现重大硬伤，仍需结合工商状态、司法记录和股权质押明细人工复核。";
    } else if (field.label.includes("盈利能力分析")) {
      values[field.key] = "AI总结：盈利能力需结合近三年营业收入、净利润、净利率与ROE判断，重点识别利润波动和持续盈利能力。";
    } else if (field.label.includes("经营效率与现金流")) {
      values[field.key] = "AI总结：经营效率与现金流需关注货币资金规模、回款稳定性和短期流动性，避免账面盈利但现金偏紧。";
    } else if (field.label.includes("资产负债情况")) {
      values[field.key] = "AI总结：资产负债情况需结合负债率、流动比率和速动比率复核偿债能力，必要时补充近三年财报。";
    } else if (field.label === "结论") {
      values[field.key] = "AI总结：基于当前财务和资信资料，企业具备初步合作基础，但回款能力、现金流稳定性和合同边界仍需人工复核。";
    } else if (field.label.includes("财务状况")) {
      values[field.key] = "AI总结：企业经营规模具备基础支撑，需结合近三年财务报表核验偿债能力与现金流稳定性。";
    } else if (field.label.includes("行业概览")) {
      values[field.key] = `AI总结：${demoState.city}制造业用电需求相对稳定，需重点关注订单稳定性与产能利用率。`;
    } else if (field.label.includes("市场规模")) {
      values[field.key] = "AI总结：行业处于稳步发展阶段，终端需求与区域产业链配套能力是后续判断重点。";
    } else if (field.label.includes("行业特征")) {
      values[field.key] = "AI总结：行业具有设备投入重、用电负荷连续、客户集中度需核验等特征。";
    } else if (field.label.includes("企业画像")) {
      values[field.key] = "AI总结：企业经营状态正常，股权结构和信用情况需结合企查查与财务资料进入人工复核。";
    } else if (field.label.includes("发文时间")) {
      values[field.key] = "待联网核验";
    } else if (field.label.includes("发文机构")) {
      values[field.key] = `${demoState.city}相关主管部门`;
    } else if (field.label.includes("政策有效期")) {
      values[field.key] = "以正式政策文件为准";
    } else if (field.label.includes("主要条款")) {
      values[field.key] = `AI生成：围绕${demoState.capacity}MW分布式光伏项目，补充地方备案、并网、补贴和消纳要求摘要。`;
    } else {
      values[field.key] = `AI生成：${field.label}初稿待人工复核。`;
    }
  });

  values.summaryScore = "82";
  values.decisionSummary =
    "AI总结：该项目装机容量3.5866MW，投资规模1685.71万元，测算IRR为10.72%，具备初步推进基础。项目消纳比例较高，但企业财务、用电稳定性、合同边界及屋顶条件仍需进一步复核。";

  values.riskHighlights =
    "主要风险集中在用电企业资料完整度、连续用电数据、合同能源管理协议关键条款及电价波动影响。若相关资料无法闭环，将影响项目收益稳定性判断。";

  values.aiRecommendation =
    "建议补充近三年财务报表、连续用电数据、电费缴纳记录及租赁/EMC协议关键条款，并结合企查查风险事项和并网条件完成最终评审。";
  return values;
}

function formatAiDraftProvider(provider, mock) {
  // TRACE[PPT-AI-FE-001]: 后端只返回机器可读 provider；前端在这里转成用户可理解的模型来源。
  if (mock) return "AIGC 后端模拟";
  if (String(provider || "").startsWith("deepseek:")) {
    // return `鑫浦大模型 · ${String(provider).replace("deepseek:", "")}`;
    return `鑫浦大模型`;
  }
  return provider || "接入模型";
}

function previewSummarySeedFields() {
  const blocked = new Set([...AI_DECISION_FIELD_KEYS, ...AI_DRAFT_META_KEYS]);
  const fields = Object.fromEntries(Object.entries({ ...graphqlProjectPayload(), ...trustedPptGenerationFields() })
    .filter(([key, value]) => !blocked.has(key) && !/^(generatedFile|projectSearch|qccAdmissionImage)/.test(key) && typeof value !== 'object')
    .map(([key, value]) => [key, String(value ?? '')]));
  return { ...fields, summaryScope: 'CURRENT_PREVIEW',
    financialRowsJson: JSON.stringify(buildTrustedQccFinancialRows()),
    previewContextJson: JSON.stringify({ enterpriseIsMock,
      enterpriseFieldKeys: [...enterpriseSyncedFieldKeys].sort(),
      manualFieldKeys: [...userEditedPptFieldKeys].sort(),
      documentFieldKeys: [...aiTrustedDocumentFieldKeys].sort(),
      aiDraftFieldKeys: [...aiGeneratedPptFieldKeys].filter(key => !blocked.has(key)).sort(),
      selectedFinancialYears: [...QCC_FINANCIAL_YEARS],
    }) };
}

function currentAiDraftFingerprint() {
  const fields = previewSummarySeedFields();
  return JSON.stringify(Object.keys(fields).sort().map(key => [key, fields[key]]));
}

async function generateCurrentPreviewSummary() {
  const fingerprint = currentAiDraftFingerprint();
  const response = await (globalThis.__PPT_REPORT_FETCH || fetch)(graphqlEndpoint(), {
    method: 'POST', headers: graphqlHeaders(),
    body: JSON.stringify({ query: `mutation DraftPptReportFields($input: DraftPptReportFieldsInput!) {
      draftPptReportFields(input: $input) { ok provider mock fields }
    }`, variables: { input: { project: graphqlProjectPayload(), seedFields: previewSummarySeedFields() } } })
  });
  const body = await response.json().catch(() => null);
  const result = body?.data?.draftPptReportFields;
  if (!response.ok || body?.errors?.length || !result || !isDeepSeekDraftResult(result))
    throw new Error(body?.errors?.[0]?.message || '当前预览AI总结生成失败，请重试。');
  if (fingerprint !== currentAiDraftFingerprint())
    throw new Error('分析期间预览内容已变化，请重新点击生成，以确保总结与当前预览一致。');
  if (!['decisionSummary', 'riskHighlights', 'aiRecommendation'].every(key => typeof result.fields?.[key] === 'string' && result.fields[key].trim()))
    throw new Error('AI总结返回不完整，请重试。');
  // Never let the overall summary rewrite manually reviewed slide content.
  AI_DECISION_FIELD_KEYS.forEach(key => { demoState[key] = String(result.fields[key] || ''); });
  if (enterpriseIsMock && enterpriseSyncedFieldKeys.size && !/接口样例|样例数据/.test(demoState.decisionSummary))
    demoState.decisionSummary = '部分企业信息来自接口样例。' + demoState.decisionSummary;
  const score = String(demoState.selfScore || '').trim();
  demoState.summaryScore = /^\d+(?:\.\d+)?$/.test(score) && Number(score) <= 100 ? score : '未评分';
  markAiDraftResult(result);
}

function invalidateRenderedPreviewSummary() {
  if (hasCurrentDeepSeekAiDraft()) return;
  qsa('.ai-summary-module').forEach(node => {
    node.innerHTML = '<p>预览内容已更新，请重新点击“生成测试稿PPT 风控报告”获取本轮分析。</p>';
  });
}

function clearAiDraftState() {
  AI_DECISION_FIELD_KEYS.forEach((key) => {
    demoState[key] = "";
  });
  AI_DRAFT_META_KEYS.forEach((key) => {
    demoState[key] = "";
  });
  AI_DECISION_FIELD_KEYS.forEach(key => aiGeneratedPptFieldKeys.delete(key));
  demoState.aiDraftStatus = "stale";
}

function isDeepSeekDraftResult(result) {
  return Boolean(
    result &&
      result.mock === false &&
      (
        String(result.provider || "").startsWith("deepseek:") ||
        String(result.provider || "").startsWith("ollama:")
      )
  );
}

function markAiDraftResult(result) {
  const isDeepSeek = isDeepSeekDraftResult(result);
  demoState.aiDraftProvider = formatAiDraftProvider(result?.provider, result?.mock);
  demoState.aiDraftProviderRaw = String(result?.provider || "");
  demoState.aiDraftMock = Boolean(result?.mock);
  demoState.aiDraftProjectCode = String(demoState.projectCode || "");
  demoState.aiDraftProjectName = String(demoState.projectName || "");
  demoState.aiDraftFingerprint = currentAiDraftFingerprint();
  demoState.aiDraftStatus = isDeepSeek ? "deepseek" : result?.mock ? "mock" : "provider";
}

function hasCurrentDeepSeekAiDraft() {
  return Boolean(
    demoState.aiDraftStatus === "deepseek" &&
      demoState.aiDraftMock === false &&
      demoState.aiDraftProjectCode === String(demoState.projectCode || "") &&
      demoState.aiDraftProjectName === String(demoState.projectName || "") &&
      demoState.aiDraftFingerprint === currentAiDraftFingerprint()
  );
}

async function ensureCurrentDeepSeekAiDraft() {
  if (hasCurrentDeepSeekAiDraft()) return;
  await applyAiDraft({ requireDeepSeek: true });
  if (!hasCurrentDeepSeekAiDraft()) {
    throw new Error("当前项目尚未生成有效的 DeepSeek 草稿，请先完成 AI 草稿后再生成 PPT。");
  }
}



function buildTrustedQccFinancialRows() {
  let hasTrustedFinancialValue = false;
  const rows = QCC_FINANCIAL_YEARS.map((year) => {
    const row = { year: Number(year) };

    QCC_FINANCIAL_METRICS.forEach(([key]) => {
      const fieldKey = `${key}${year}`;
      if (isTrustedAiInputField(fieldKey) && hasAiUsableValue(demoState[fieldKey])) {
        row[key] = demoState[fieldKey];
        hasTrustedFinancialValue = true;
      } else {
        row[key] = "";
      }
    });

    return row;
  });

  return hasTrustedFinancialValue ? rows : [];
}

function buildAiSeedFields() {
  // TRACE[PPT-AI-FE-002]: AI seed 只允许可信来源进入，避免前端演示默认值被 DeepSeek 当作真实材料。
  const blockedKeys = new Set([
    "docType",
    ...AI_DRAFT_META_KEYS,
    ...AI_DECISION_FIELD_KEYS,
    ...aiDraftFields().map((field) => field.key),
    "projectSearchKeyword",
    "projectSearchResults",
    "projectSearchLoading",
    "projectSearchError",
    "projectSearchOpen",
    "selectedSearchIndex",
    "generatedFileName",
    "generatedFileUrl",
    "generatedFileSize",
    "pptZoom",
    "currentPage",
    "activePageId"
  ]);

  return Object.fromEntries(
    Object.entries(demoState)
      .filter(([key]) => !blockedKeys.has(key))
      .filter(([key]) => isTrustedAiInputField(key))
      .filter(([, value]) => {
        if (value === null || value === undefined) return false;
        if (typeof value === "string") return !isMissingFieldValue(value);
        return ["number", "boolean"].includes(typeof value);
      })
  );
}

// The entry-level draft must not fill page 6. Financial analysis is an explicit action.
function entryAiDraftFields(fields) {
  const financialAnalysisKeys = new Set(["profitabilityAnalysis", "operationCashflowAnalysis", "assetDebtAnalysis", "financeSummary"]);
  return Object.fromEntries(Object.entries(fields).filter(([key]) => !enterpriseFinancialKey(key) && !financialAnalysisKeys.has(key)));
}

// 动态方案
async function applyAiDraft(options = {}) {
  const requireDeepSeek = options.requireDeepSeek === true;
  if (demoState.docType !== "ppt") return { ok: false, mock: true, provider: "not-ppt" };

  const fields = aiDraftFields();
  if (!fields.length) {
    if (requireDeepSeek) throw new Error("当前模板没有可生成的 AI 字段。");
    return { ok: false, mock: true, provider: "no-ai-fields" };
  }

  const fallbackValues = entryAiDraftFields(localAiDraftValues(fields));
  const fullAiSeedFields = buildAiSeedFields();
  const financialRows = buildTrustedQccFinancialRows();



  try {
    const response = await (globalThis.__PPT_REPORT_FETCH || fetch)(graphqlEndpoint(), {
      method: "POST",
      headers: graphqlHeaders(),
      body: JSON.stringify({
        query: `
          mutation DraftPptReportFields($input: DraftPptReportFieldsInput!) {
            draftPptReportFields(input: $input) {
              ok
              provider
              mock
              fields
            }
          }
        `,
        variables: {
          input: {
            project: graphqlProjectPayload(),
            seedFields: {
              ...fullAiSeedFields,
              financialRowsJson: JSON.stringify(financialRows)
            }
          }
        }
      })
    });

    const data = await response.json().catch(() => null);
    if (!response.ok || data?.errors?.length) {
      throw new Error(data?.errors?.[0]?.message || `AI 草稿接口失败：${response.status}`);
    }

    const result = data?.data?.draftPptReportFields;
    if (result?.fields && typeof result.fields === "object") {
      if (requireDeepSeek && !isDeepSeekDraftResult(result)) {
        throw new Error(`AI 草稿未成功生成，后端返回 ${result.provider || "unknown"}${result.mock ? " / mock" : ""}。`);
      }
      const entryFields = entryAiDraftFields(result.fields);
      Object.assign(demoState, entryFields);
      Object.keys(entryFields).forEach((key) => aiGeneratedPptFieldKeys.add(key));
      markAiDraftResult(result);
      return { ok: true, ...result };
    }

    throw new Error("AI 草稿接口未返回字段。");
  } catch (error) {
    // 后端未启动时继续使用本地草稿，保证完整页面仍可演示。
    if (requireDeepSeek) throw error;
  }

  Object.assign(demoState, fallbackValues);
  markAiDraftResult({ provider: "local-frontend-fallback", mock: true });
  demoState.aiDraftProvider = "DeepSeek 模拟";
  return { ok: true, fields: fallbackValues, mock: true, provider: "local-frontend-fallback" };
}

// // 静态方案
// async function applyAiDraft() {
//   if (demoState.docType !== "ppt") return;

//   const fields = aiDraftFields();
//   if (!fields.length) return;

//   const fallbackValues = entryAiDraftFields(localAiDraftValues(fields));

//   if (typeof STATIC_DEMO_MODE !== "undefined" && STATIC_DEMO_MODE) {
//     Object.assign(demoState, fallbackValues);
//     demoState.aiDraftProvider = "演示 AI";
//     return;
//   }

//   const payload = {
//     project: projectPayload(),
//     fields: fields.map((field) => ({
//       key: field.key,
//       label: field.label,
//       method: field.method,
//       page: field.page
//     }))
//   };

//   for (const endpoint of AI_DRAFT_ENDPOINTS) {
//     try {
//       const response = await (globalThis.__PPT_REPORT_FETCH || fetch)(endpoint, {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify(payload)
//       });

//       if (!response.ok) continue;

//       const data = await response.json();

//       if (data?.fields && typeof data.fields === "object") {
//         Object.assign(demoState, fallbackValues, data.fields);

//         demoState.aiDraftProvider = data.provider === "deepseek"
//           ? "DeepSeek"
//           : data.provider === "deepseek-mock"
//             ? "DeepSeek 模拟"
//             : "本地演示";

//         return;
//       }
//     } catch (error) {
//       continue;
//     }
//   }

//   Object.assign(demoState, fallbackValues);
//   demoState.aiDraftProvider = "演示 AI";
// }


function pptCompletionStats() {
  const totalPages = pptPages.length;
  const confirmedPages = pptPages.filter((page) => demoState.confirmedPages?.[page.id]).length;
  const totalItems = pptPages.reduce((sum, page) => sum + pageFields(page).length, 0);
  const confirmedItems = pptPages.reduce(
    (sum, page) => sum + (demoState.confirmedPages?.[page.id] ? pageFields(page).length : 0),
    0
  );
  const pagePercent = Math.round((confirmedPages / totalPages) * 100);
  const fieldPercent = totalItems ? Math.round((confirmedItems / totalItems) * 100) : 0;
  return { totalPages, confirmedPages, totalItems, confirmedItems, pagePercent, fieldPercent };
}

function businessRiskFieldHint(key) {
  try { return JSON.parse(demoState.riskRuleEvaluationJson || '{}').decisions?.find(item=>item.fieldKey === key)?.reason || ''; }
  catch { return ''; }
}

// Prior-project gate: search current PM facts first; unproven relationships remain pending.
const PRIOR_REVIEW_KEYS = ['priorGridConnection','priorGenerationHours','priorCollectionException','priorMaintenanceException','priorLitigation','priorPostEval'];
let priorGridSession = null;
function newPriorSession() {
  return { projectCode: demoState.projectCode || '', status: 'pending', busy: false, checked: false, message: '等待当前项目资料加载后自动检查。', items: [], confirmed: new Set(), selected: new Set(), reports: new Map(), open: false, keyword: '', manualNone: false, revision: 0 };
}
function resetPriorGridLookup() {
  priorGridSession = newPriorSession();
  for (const key of PRIOR_REVIEW_KEYS) {
    demoState[key] = '';
    aiTrustedOaFieldKeys.delete(key); aiTrustedDocumentFieldKeys.delete(key); userEditedPptFieldKeys.delete(key);
  }
}
function currentPriorGridSession() {
  if (!priorGridSession || priorGridSession.projectCode !== demoState.projectCode) resetPriorGridLookup();
  return priorGridSession;
}
function priorNameStem(value) {
  return String(value || '').replace(/\s+/g,'').replace(/[（(][^）)]*[）)]/g,'')
    .replace(/第?[一二三四五六七八九十百\d]+期/g,'').replace(/\d+(?:\.\d+)?\s*(?:MW|KW|兆瓦|千瓦)/ig,'')
    .replace(/(?:分布式|集中式)?光伏(?:发电)?(?:项目|电站)?|发电项目|新能源项目/g,'').replace(/[，,、;；]/g,'').trim();
}
function priorSearchKeywords() {
  const company = String(demoState.userCompany || '').split(/[、；;]/).map(s=>s.trim()).filter(s=>s.length>=3 && !/^(待|未|无|—)/.test(s));
  const stem = priorNameStem(demoState.projectName);
  const city = String(demoState.city || '').trim();
  return [...new Set([...company.slice(0,2), stem.length >= 4 ? stem : '', city.length >= 2 && !/^(待|未|无)/.test(city) ? city : ''].filter(Boolean))].slice(0,4);
}
function priorSourceStatus(result, code) {
  if (!result?.ok || !result.found || result.projectCode !== code || result.source?.provider !== 'oa-pg+pm-mysql-live') throw new Error('未取得PM真实项目数据');
  let source = {}; try { source = JSON.parse(result.fields?.sourceProvenanceJson || '{}'); } catch {}
  const status = String(result.fields?.projectStatus || '').trim();
  if (!status || !/^PM\.zhxxny_develop_project:.*\.status$/.test(source.projectStatus || '')) throw new Error('PM状态或来源证据缺失');
  return { status, connected: /^(已?并网|已?投运|部分并网|GRID_CONNECTED|COMMISSIONED|PARTIAL_GRID_CONNECTED)$/.test(status), projectName: String(result.fields.projectName || code), userCompany: String(result.fields.userCompany || '') };
}
async function priorWithTimeout(promise) {
  let timer;
  try { return await Promise.race([promise,new Promise((_,reject)=>{timer=setTimeout(()=>reject(new Error('PM查询超时，可重新检查')),60000);})]); }
  finally { clearTimeout(timer); }
}
function publishPriorContext() { window.dispatchEvent(new CustomEvent('ppt-report:document-context')); }
function updatePriorDecision(s) {
  const confirmed = s.items.filter(item=>s.confirmed.has(item.projectCode) && item.connected && !item.error);
  s.status = s.manualNone ? 'none' : confirmed.length ? 'has' : 'pending';
  // Never promote a similar name, same city, or empty search into a confirmed relation.
  if (s.status === 'has') s.message = `已确认${confirmed.length}个已并网前序项目。${s.items.some(item=>!s.confirmed.has(item.projectCode)) ? '其余候选关系仍待核对。' : ''}`;
  if (s.status === 'none') s.message = '已人工核实无前序项目；本页六项不参与填写和抓取。';
  if (s.status === 'pending' && !s.message) s.message = '集团或厂区关系证据不足，请核对候选；未找到候选不代表没有前序项目。';
  syncPriorPostEvaluation(s);
  publishPriorContext();
}
function confirmedPriorCodes() {
  const s=currentPriorGridSession();
  return s.status === 'has' ? s.items.filter(item=>s.confirmed.has(item.projectCode)&&item.connected&&!item.error).map(item=>item.projectCode) : [];
}
function syncPriorPostEvaluation(s) {
  const codes=s.status==='has' ? s.items.filter(item=>s.confirmed.has(item.projectCode)&&item.connected&&!item.error).map(item=>item.projectCode) : [];
  if (s.reports.size) {
    demoState.priorPostEval=codes.filter(code=>s.reports.has(code)).map(code=>`${code}：${s.reports.get(code)}`).join('\n\n');
    if (demoState.priorPostEval) { aiTrustedDocumentFieldKeys.add('priorPostEval'); userEditedPptFieldKeys.add('priorPostEval'); }
    else { aiTrustedDocumentFieldKeys.delete('priorPostEval'); userEditedPptFieldKeys.delete('priorPostEval'); }
  }
}
function applyPriorReportItems(raw) {
  let items; try { items=JSON.parse(raw); } catch { return false; }
  const s=currentPriorGridSession();
  if (!Array.isArray(items) || !items.length || items.some(item=>!item || !/^[A-Za-z0-9][A-Za-z0-9_-]{0,99}$/.test(item.projectCode) || item.projectCode===s.projectCode || typeof item.summary!=='string' || !item.summary.trim())) return false;
  for(const item of items) {
    s.reports.set(item.projectCode,item.summary);
    // An explicitly confirmed report binding is relationship evidence, not evidence of grid status.
    s.confirmed.add(item.projectCode); s.selected.add(item.projectCode);
    if (!s.items.some(candidate=>candidate.projectCode===item.projectCode)) s.items.push({projectCode:item.projectCode,projectName:item.projectCode,reasons:['已确认后评价报告的前序项目绑定'],status:'待查询',connected:false});
  }
  s.manualNone=false;
  ++s.revision; s.busy=false;
  void checkPriorProjects({ keepCandidates:true });
  return true;
}
async function checkPriorProjects(options={}) {
  const s=currentPriorGridSession();
  if (s.busy || !s.projectCode) return;
  if (demoState.oaProjectLoadSource?.provider !== 'oa-pg+pm-mysql-live' || demoState.oaProjectLoadedProjectCode !== s.projectCode) {
    s.message='当前项目的PM资料尚未加载完成，请稍后重新检查。'; s.status='pending'; renderDraftPanels(); return;
  }
  const revision=++s.revision;
  const active=()=>s===priorGridSession && s.projectCode===demoState.projectCode && s.revision===revision;
  const keywords=options.keyword ? [options.keyword.trim()] : priorSearchKeywords();
  s.busy=true; s.status='checking'; s.manualNone=false; s.message='正在根据当前项目名称、客户及地区检查PM前序项目…'; renderDraftPanels(); publishPriorContext();
  const pool=new Map((options.keepCandidates ? s.items : s.items.filter(item=>s.confirmed.has(item.projectCode))).map(item=>[item.projectCode,{...item}]));
  let failures=0, truncated=false;
  try {
    for(const keyword of keywords) {
      if (!active()) return;
      try {
        const result=await priorWithTimeout(requestOaPptProjects({keyword,limit:50}));
        if (!active()) return;
        if(!result?.ok || result.source?.provider!=='oa-pg+pm-mysql-live' || !Array.isArray(result.items)) throw new Error('PM候选列表不可用');
        if(result.items.length>=50) truncated=true;
        for(const item of result.items) {
          if(!item.projectCode || !item.projectName || item.projectCode===s.projectCode) continue;
          const old=pool.get(item.projectCode);
          const reason=`关键词“${keyword}”匹配`;
          pool.set(item.projectCode,{...item,...old,reasons:[...new Set([...(old?.reasons||[]),reason])],status:old?.status||'待查询',connected:false});
        }
      } catch { failures++; }
    }
    if(!active()) return;
    const stem=priorNameStem(demoState.projectName);
    const ranked=[...pool.values()].sort((a,b)=>{
      const rank=item=>(s.confirmed.has(item.projectCode)?100:0)+(stem.length>=4&&priorNameStem(item.projectName)===stem?20:0)+(item.reasons||[]).length;
      return rank(b)-rank(a);
    });
    if(ranked.length>12) truncated=true;
    // Bound automatic detail reads; never claim full coverage after a capped search.
    s.items=ranked.slice(0,Math.max(12,s.confirmed.size));
    for(let offset=0;offset<s.items.length;offset+=2) {
      const batch=s.items.slice(offset,offset+2);
      const results=await Promise.allSettled(batch.map(item=>priorWithTimeout(requestOaPptProject(item.projectCode))));
      if(!active()) return;
      results.forEach((result,i)=>{
        const item=batch[i];
        try {
          if(result.status==='rejected') throw result.reason;
          const detail=priorSourceStatus(result.value,item.projectCode);
          Object.assign(item,detail,{error:''});
          const phaseMatch=stem.length>=4&&priorNameStem(item.projectName)===stem;
          if(phaseMatch) item.reasons=[...new Set([...item.reasons,'名称主干一致（已去除期数、容量），关系需核对'])];
          if(detail.userCompany && String(demoState.userCompany||'').split('、').includes(detail.userCompany)) item.reasons=[...new Set([...item.reasons,'用电企业名称一致，集团／厂区关系仍需核对'])];
        } catch(error) { item.connected=false;item.status='待查询';item.error=error.message||'PM读取失败';failures++; }
      });
      s.message=`正在核对候选PM状态（${Math.min(offset+2,s.items.length)}/${s.items.length}）…`;renderDraftPanels();
    }
    if(!active()) return;
    s.checked=true;
    s.message=s.items.length ? `找到${s.items.length}个候选；仅凭名称、客户或地区相似不能确认集团／厂区关系。` : '未找到可确认的前序项目，仍需核实集团／厂区关系，不能直接判定为“无”。';
    if(failures) s.message+=`有${failures}项查询未完成，可重新检查。`;
    if(truncated) s.message+='查询范围有限，可补充项目名称或编号搜索。';
    updatePriorDecision(s);
    if(s.status==='has' && demoState.priorGridConnection) {
      // Refresh only an existing machine-sourced value, never stale or manually edited text.
      if(aiTrustedOaFieldKeys.has('priorGridConnection')&&!userEditedPptFieldKeys.has('priorGridConnection')&&!s.items.some(item=>s.confirmed.has(item.projectCode)&&item.error)) fillPriorGridFromChecked(s);
    }
  } finally { if(active()){s.busy=false;renderDraftPanels();publishPriorContext();} }
}
function fillPriorGridFromChecked(s) {
  const items=s.items.filter(item=>s.confirmed.has(item.projectCode)&&item.connected&&!item.error);
  demoState.priorGridConnection=items.map(item=>`${item.projectName}（${item.projectCode}）：${({GRID_CONNECTED:'并网',COMMISSIONED:'投运',PARTIAL_GRID_CONNECTED:'部分并网'})[item.status]||item.status}`).join('；');
  aiTrustedOaFieldKeys.add('priorGridConnection');userEditedPptFieldKeys.delete('priorGridConnection');
  demoState.confirmedPages={...(demoState.confirmedPages||{}),slide12:false};
}
async function fetchPriorGridStatuses() {
  const s=currentPriorGridSession();
  if(s.busy||s.status!=='has') return;
  const items=s.items.filter(item=>s.confirmed.has(item.projectCode));
  const revision=++s.revision;
  const active=()=>s===priorGridSession&&s.projectCode===demoState.projectCode&&s.revision===revision;
  s.busy=true;s.message='正在从PM重新读取已确认前序项目的并网情况…';renderDraftPanels();
  try {
    const results=await Promise.allSettled(items.map(item=>priorWithTimeout(requestOaPptProject(item.projectCode))));
    if(!active())return;
    const values=results.map((result,i)=>{
      if(result.status==='rejected')throw result.reason;
      const detail=priorSourceStatus(result.value,items[i].projectCode);
      if(!detail.connected)throw new Error(`${items[i].projectName}的当前状态不符合已并网条件，请重新检查`);
      return detail;
    });
    values.forEach((detail,i)=>Object.assign(items[i],detail,{error:''}));
    fillPriorGridFromChecked(s);s.message='已从PM填入全部已确认前序项目的并网情况。';
  }catch(error){if(active())s.message=`${error.message||'PM读取失败'}；本次未覆盖原值。`;}
  finally{if(active()){s.busy=false;renderDraftPanels();}}
}
function renderPriorProjectGate() {
  const s=currentPriorGridSession();
  const label={checking:'检查中',has:'有',none:'无',pending:'待确认'}[s.status];
  const disabled=s.busy?'disabled':'';
  return `<section class="ppt-prior-gate" aria-label="前序项目自动检查"><div class="ppt-prior-gate-heading"><strong>是否有前序项目：<b>${label}</b></strong><button type="button" class="ppt-report-ai-button" data-prior-grid-action="check" ${disabled}>${s.busy?'检查中…':'重新检查'}</button></div><p role="status">${escapeHtml(s.message)}</p>
  ${s.status==='has'?`<ul>${s.items.filter(item=>s.confirmed.has(item.projectCode)&&item.connected&&!item.error).map(item=>`<li>${escapeHtml(item.projectName)}（${escapeHtml(item.projectCode)}）</li>`).join('')}</ul><small>并网情况从PM抓取；下方后评价报告按上述项目编号关联。</small>`:''}
  <button type="button" class="ppt-report-ai-button" data-prior-grid-action="toggle" ${disabled}>${s.open?'收起候选':'核对候选／补充查找'}</button>
  ${s.open?`<div class="ppt-prior-grid-search"><input aria-label="补充搜索前序项目" data-prior-grid-keyword placeholder="项目名称或编号" value="${escapeHtml(s.keyword)}" ${disabled}/><button type="button" class="ppt-report-ai-button" data-prior-grid-action="search" ${disabled}>搜索PM</button></div><div class="ppt-prior-grid-candidates">${s.items.map(item=>`<label><input type="checkbox" data-prior-grid-candidate="${escapeHtml(item.projectCode)}" ${s.selected.has(item.projectCode)?'checked':''} ${s.busy||!item.connected||item.error?'disabled':''}/><span><strong>${escapeHtml(item.projectName)}（${escapeHtml(item.projectCode)}）</strong><small>PM状态：${escapeHtml(item.status)}${item.error?'；'+escapeHtml(item.error):''}</small><small>${escapeHtml((item.reasons||[]).join('；'))}</small></span></label>`).join('')}</div><small>只有关系不确定时才需核对。勾选表示确认属于同一集团或同一厂区的已并网前序项目。</small><button type="button" class="ppt-report-ai-button" data-prior-grid-action="confirm" ${s.busy||!s.selected.size?'disabled':''}>确认所选关系</button>${s.status==='pending'?`<button type="button" class="ppt-report-ai-button" data-prior-grid-action="none" ${disabled}>已核实无前序项目</button>`:''}`:''}</section>`;
}
function priorGridControl(field,value) {
  const s=currentPriorGridSession();
  return `<div class="ppt-field-row ppt-prior-grid-row"><span><strong>${escapeHtml(field.label)}</strong><em class="ppt-method oa">PM抓取</em></span><div class="ppt-prior-grid-value"><input aria-label="并网情况" data-ppt-field="priorGridConnection" value="${escapeHtml(fieldValue(field))}"/><button type="button" class="ppt-report-ai-button" data-prior-grid-action="fetch" ${s.busy||s.status!=='has'?'disabled':''}>抓取</button></div></div>`;
}
function handlePriorGridClick(event) {
  const button=event.target.closest?.('[data-prior-grid-action]');if(!button)return false;
  event.preventDefault();const s=currentPriorGridSession();if(s.busy)return true;
  const action=button.dataset.priorGridAction;
  if(action==='check')void checkPriorProjects();
  if(action==='fetch')void fetchPriorGridStatuses();
  if(action==='toggle'){s.open=!s.open;renderDraftPanels();}
  if(action==='search') {
    if(!s.keyword.trim()){s.message='请输入补充搜索的项目名称或编号。';renderDraftPanels();}
    else void checkPriorProjects({keepCandidates:true,keyword:s.keyword});
  }
  if(action==='confirm') {
    s.confirmed=new Set(s.items.filter(item=>s.selected.has(item.projectCode)&&item.connected&&!item.error).map(item=>item.projectCode));
    s.manualNone=false;s.open=false;s.message='';updatePriorDecision(s);fillPriorGridFromChecked(s);renderDraftPanels();
  }
  if(action==='none') {
    s.manualNone=true;s.confirmed.clear();s.selected.clear();updatePriorDecision(s);demoState.confirmedPages={...(demoState.confirmedPages||{}),slide12:false};renderDraftPanels();
  }
  return true;
}
function handlePriorGridChange(event) {
  const s=currentPriorGridSession();if(s.busy)return;
  if(event.target.matches?.('[data-prior-grid-keyword]'))s.keyword=event.target.value;
  if(event.target.matches?.('[data-prior-grid-candidate]')) {
    const code=event.target.dataset.priorGridCandidate;
    if(event.target.checked)s.selected.add(code);else s.selected.delete(code);renderDraftPanels();
  }
}
function priorPostReportDefaultCode() {const codes=confirmedPriorCodes();return codes.length===1?codes[0]:'';}

function pptFieldControl(field) {
  if (field.key === "priorGridConnection") return priorGridControl(field, fieldValue(field));
  const value = fieldValue(field);
  const method = field.method || "模板字段";
  // TRACE[PPT-QCC-003]: 财务表单元格仍用 text 保存，允许输入百分号；
  // inputmode 只影响键盘和编辑体验，不强行把“5.82%”截成数字。
  const inputMode = field.inputMode ? ` inputmode="${escapeHtml(field.inputMode)}"` : "";
  const riskCondition = /^fkxz(?:[1-9]|10)$/.test(field.key);
  const riskSymbols = {'待确认':'待确认','触发':'✓','不触发':'×'};
  const riskSelected = String(value).startsWith('✓') ? '触发' : String(value).startsWith('×') ? '不触发' : value;
  const calculated = ['benchmarkReturn', 'returnConclusion'].includes(field.key);
  const control = field.key === "debtAcquisitionStatus"
    ? `<select data-ppt-field="debtAcquisitionStatus" aria-label="是否承债式收购">${['待确认', '是', '否'].map(status => `<option value="${status}"${status === String(value || '待确认').trim() ? ' selected' : ''}>${status}</option>`).join('')}</select>`
    : riskCondition
    ? `<select title="${escapeHtml(businessRiskFieldHint(field.key))}" data-ppt-field="${escapeHtml(field.key)}">${['待确认','触发','不触发'].map(status=>`<option value="${status}"${status === riskSelected || (status !== '待确认' && String(value).startsWith(status+'（')) ? ' selected' : ''}>${status === '待确认' && value === '盖章待核验' ? '盖章待核验' : riskSymbols[status]}${status === riskSelected && String(value).includes('接口样例') ? '（接口样例）' : ''}</option>`).join('')}</select>`
    : calculated ? `<input readonly data-ppt-calculated="${escapeHtml(field.key)}" value="${escapeHtml(value)}" />`
    : field.type === "textarea"
    ? `<textarea data-ppt-field="${escapeHtml(field.key)}">${escapeHtml(value)}</textarea>`
    : field.type === "image" ? admissionImageMarkup(value)
    : `<input data-ppt-field="${escapeHtml(field.key)}" value="${escapeHtml(value)}"${inputMode} />`;
  return `
    <label class="ppt-field-row">
      <span>
        <strong>${escapeHtml(field.label)}</strong>
        <em class="ppt-method ${methodTone(method)}">${escapeHtml(method)}</em>
      </span>
      ${control}
    </label>
  `;
}

function admissionImageMarkup(value) {
  return /^\/ppt-report\/qcc-samples\/[A-Z]+-admission\.png$/.test(value || "")
    ? `<img alt="准入建议截图" src="${escapeHtml(value)}" style="width:100%;object-fit:contain;background:white" />` : `<div>待上传图片</div>`;
}

function renderPptDocumentUploadCard() {
  if (window.__PPT_REPORT_FILE_WORKSPACE) return "";
  // TRACE[PPT-DOC-027]: 上传入口放在字段核对区，定位为“资料补填”，不改变原来的 AI 初稿和最终生成主流程。
  const status = demoState.documentParseStatus || "idle";
  const suggestions = Array.isArray(demoState.documentParseSuggestions)
    ? demoState.documentParseSuggestions
    : [];
  const warnings = Array.isArray(demoState.documentParseWarnings)
    ? demoState.documentParseWarnings
    : [];
  const matchedCount = suggestions.filter((item) => item?.confidence === "high").length;
  const message =
    demoState.documentParseMessage ||
    "上传 PDF、Word、Excel 后提取文字，只自动填入第 8 页和 EMC 条款页字段；原文件解析后删除。";

  return `
    <section class="ppt-document-upload-card ${escapeHtml(status)}">
      <div>
        <span>资料上传解析</span>
        <strong>补填文件解析字段</strong>
        <small>${escapeHtml(message)}</small>
        ${matchedCount ? `<em>本次命中 ${matchedCount} 个文件解析字段</em>` : ""}
        ${warnings.length ? `<em class="warning">${escapeHtml(warnings[0])}</em>` : ""}
      </div>
      <label class="ppt-document-upload-button">
        上传资料
        <input
          type="file"
          data-ppt-document-upload
          accept=".pdf,.doc,.docx,.xls,.xlsx,.txt,.md,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        />
      </label>
    </section>
  `;
}

function renderPageRail(page) {
  return pptPages.map((item) => `
    <button data-ppt-page="${escapeHtml(item.id)}" class="${item.id === page.id ? "active" : ""}">
      <b>${escapeHtml(item.index)}</b>
      <span>${escapeHtml(item.name)}</span>
    </button>
  `).join("");
}

function currentPptxTemplateSlide(page) {
  if (!pptxTemplatePreview?.slides?.length) return null;
  const slideNo = Number(page.index);
  return pptxTemplatePreview.slides.find((slide) => slide.slideNo === slideNo || slide.id === page.id) || null;
}

function cssDecls(declarations) {
  return Object.entries(declarations)
    .filter(([, value]) => value !== null && value !== undefined && value !== "")
    .map(([key, value]) => `${key}: ${value}`)
    .join("; ");
}

function safeCssColor(value, fallback = "transparent") {
  return /^#[0-9A-Fa-f]{6}$/.test(String(value || "")) ? value : fallback;
}

function templatePreviewSourceWidth() {
  const size = pptxTemplatePreview?.slideSize || {};
  return size?.px?.width || size?.width || 1280;
}

function templatePreviewSourceHeight() {
  const size = pptxTemplatePreview?.slideSize || {};
  return size?.px?.height || size?.height || 720;
}

function templatePreviewAssetUrl(src) {
  const root = pptxTemplatePreview?.assetRoot || PPTX_TEMPLATE_PREVIEW_ASSET_ROOT;
  return `${root}/${String(src || "").replace(/^\/+/, "")}`;
}

function pptxRectStyle(rect) {
  const scaleX = PPTX_TEMPLATE_PREVIEW_BASE_WIDTH / templatePreviewSourceWidth();
  const scaleY = PPTX_TEMPLATE_PREVIEW_BASE_HEIGHT / templatePreviewSourceHeight();
  return {
    left: `${safeCssNumber(rect.x * scaleX)}px`,
    top: `${safeCssNumber(rect.y * scaleY)}px`,
    width: `${safeCssNumber(rect.w * scaleX)}px`,
    height: `${safeCssNumber(rect.h * scaleY)}px`
  };
}

function pptxRectStyleWithPad(rect, pad = 0) {
  const scaleX = PPTX_TEMPLATE_PREVIEW_BASE_WIDTH / templatePreviewSourceWidth();
  const scaleY = PPTX_TEMPLATE_PREVIEW_BASE_HEIGHT / templatePreviewSourceHeight();
  // TRACE[PPT-PREVIEW-001]: 字段覆盖层要略大于源 PPTX 文本框，
  // 否则底图里旧文字的抗锯齿边缘会露出来，看起来像重影。
  return {
    left: `${safeCssNumber(rect.x * scaleX - pad)}px`,
    top: `${safeCssNumber(rect.y * scaleY - pad)}px`,
    width: `${safeCssNumber(rect.w * scaleX + pad * 2)}px`,
    height: `${safeCssNumber(rect.h * scaleY + pad * 2)}px`
  };
}

function safeCssNumber(value) {
  return Number(value).toFixed(3).replace(/\.?0+$/, "");
}

function pptxBorderRadius(geometry) {
  if (geometry === "ellipse") return "999px";
  if (geometry === "roundRect") return "14px";
  return "0";
}

function pptxTextAlign(value) {
  if (value === "ctr") return "center";
  if (value === "r") return "right";
  if (value === "just") return "justify";
  return "left";
}

function pptxVerticalAlign(value) {
  if (value === "mid") return "center";
  if (value === "b") return "flex-end";
  return "flex-start";
}

function scaledInset(value) {
  const scale = PPTX_TEMPLATE_PREVIEW_BASE_WIDTH / templatePreviewSourceWidth();
  return `${safeCssNumber(Number(value || 0) * scale)}px`;
}

function renderPptxTemplateElement(element, index) {
  const rectStyle = pptxRectStyleWithPad(element.rect || { x: 0, y: 0, w: 0, h: 0 }, 2);

  if (element.type === "image" && element.src) {
    return `
      <img
        class="pptx-template-element pptx-template-image"
        src="${escapeHtml(templatePreviewAssetUrl(element.src))}"
        alt=""
        style="${escapeHtml(cssDecls(rectStyle))}"
      />
    `;
  }

  const line = element.style?.line;
  const fill = safeCssColor(element.style?.fill, "transparent");
  const border = line?.color
    ? `${Math.max(1, Number(line.width || 1))}px solid ${safeCssColor(line.color, "#d1d5db")}`
    : "0";
  const baseStyle = {
    ...rectStyle,
    "z-index": index + 1,
    "background": fill,
    "border": border,
    "border-radius": pptxBorderRadius(element.geometry)
  };

  if (element.type !== "text") {
    return `<div class="pptx-template-element pptx-template-shape" style="${escapeHtml(cssDecls(baseStyle))}"></div>`;
  }

  const textStyle = element.style?.text || {};
  const fontScale = PPTX_TEMPLATE_PREVIEW_BASE_WIDTH / templatePreviewSourceWidth();
  const insets = textStyle.insets || {};
  const style = {
    ...baseStyle,
    "padding": `${scaledInset(insets.top)} ${scaledInset(insets.right)} ${scaledInset(insets.bottom)} ${scaledInset(insets.left)}`,
    "color": safeCssColor(textStyle.color, "#111827"),
    "font-size": `${safeCssNumber(Number(textStyle.fontSize || 16) * fontScale)}px`,
    "font-weight": textStyle.bold ? "800" : "500",
    "text-align": pptxTextAlign(textStyle.align),
    "justify-content": pptxVerticalAlign(textStyle.verticalAlign)
  };
  const text = transformPptxTemplateText(element.text || "");
  return `
    <div class="pptx-template-element pptx-template-text" style="${escapeHtml(cssDecls(style))}">
      <span>${escapeHtml(text).replace(/\n/g, "<br />")}</span>
    </div>
  `;
}

function renderCreditRiskOverlay(element, index, key) {
  const paragraphs = key === "qccRiskSummary" ? creditRiskParagraphs(demoState) : policyRiskParagraphs(demoState);
  const scale = PPTX_TEMPLATE_PREVIEW_BASE_WIDTH / templatePreviewSourceWidth();
  const pt = value => `${safeCssNumber(value * 4 / 3 * scale)}px`;
  const indent = safeCssNumber(30 * scale);
  const style = {...pptxRectStyle(element.rect), "z-index":100 + index, "background":"#fff",
    "display":"block", "font-family":"微软雅黑, Microsoft YaHei, sans-serif",
    "padding":`${scaledInset(4.8)} ${scaledInset(9.6)}`, "text-align":"left", "color":"#000"};
  const rows = paragraphs.map((text, paragraphIndex) => {
    const heading = paragraphIndex === 0;
    const conclusion = paragraphIndex === paragraphs.length - 1;
    const rowStyle = {"margin":"0", "font-size":pt(heading ? 18 : 16), "line-height":"1.5",
      "font-weight":heading || conclusion ? "700" : "400", "color":heading ? "#BF9000" : "#000",
      "padding-left":conclusion ? "0" : `${indent}px`, "text-indent":conclusion ? "0" : `-${indent}px`};
    const bullet = heading ? "□" : conclusion ? "" : "•";
    return `<div style="${escapeHtml(cssDecls(rowStyle))}">${bullet ? `<span style="display:inline-block;width:${indent}px;text-indent:0">${bullet}</span>` : ""}${escapeHtml(text).replace(/\n/g, "<br />")}</div>`;
  }).join("");
  return `<div class="pptx-template-overlay pptx-template-text-overlay" data-ppt-bind="${key}" style="${escapeHtml(cssDecls(style))}">${rows}</div>`;
}

function renderPptxImageOverlayText(page, element, index) {
  const original = String(element.text || "");
  const fallbackKey = textFallbackFieldKey(page, original);
  const transformed = fallbackKey ? overlayFieldValue(fallbackKey) : transformPptxTemplateText(original);

  if (!fallbackKey && transformed === original) return "";
  if (page.id === "slide04" && ["qccRiskSummary", "policyComplianceRisk"].includes(fallbackKey)) {
    return renderCreditRiskOverlay(element, index, fallbackKey);
  }

  const rectStyle = pptxRectStyle(element.rect || { x: 0, y: 0, w: 0, h: 0 });
  const textStyle = element.style?.text || {};
  const fontScale = PPTX_TEMPLATE_PREVIEW_BASE_WIDTH / templatePreviewSourceWidth();
  const insets = textStyle.insets || {};
  const style = {
    ...rectStyle,
    "z-index": 100 + index,
    "padding": `${scaledInset(insets.top || 2)} ${scaledInset(insets.right || 4)} ${scaledInset(insets.bottom || 2)} ${scaledInset(insets.left || 4)}`,
    // TRACE[PPT-PREVIEW-001]: 必须使用不透明遮罩，不能半透明叠字。
    "background": "#ffffff",
    "color": safeCssColor(textStyle.color, "#111827"),
    "font-size": `${safeCssNumber(Number(textStyle.fontSize || 14) * fontScale)}px`,
    "font-weight": textStyle.bold ? "800" : "700",
    "text-align": pptxTextAlign(textStyle.align),
    "justify-content": pptxVerticalAlign(textStyle.verticalAlign),
    "line-height": "1.28",
    "opacity": "1",
    "text-shadow": "none"
  };

  return `
    <div
      class="pptx-template-overlay pptx-template-text-overlay"
      data-ppt-bind="${escapeHtml(fallbackKey || "pptx-text")}"
      style="${escapeHtml(cssDecls(style))}"
    >
      <span>${escapeHtml(transformed).replace(/\n/g, "<br />")}</span>
    </div>
  `;
}

function renderPptxImageOverlayCell(page, element, index) {
  const key = tableCellFieldKey(page, element);
  if (!key) return "";

  const rawValue = overlayFieldValue(key);
  let value = page.id === "slide09" ? String(rawValue).replace(/^([✓×])（接口样例）$/, "$1\n（接口样例）") : page.id === "slide10" && key === "tariffTerm" && demoState.emcDraftScopeNote ? `${demoState.emcDraftScopeNote}。${rawValue}` : rawValue;
  let isCalculated = false;
  try { isCalculated = page.id === "slide06" && Boolean(JSON.parse(demoState.calculatedFinancialFieldsJson || "{}")[key]); } catch {}
  if (isCalculated && value) value = `${value}\n测算值，待核对`;
  const rectStyle = pptxRectStyle(element.rect || { x: 0, y: 0, w: 0, h: 0 });
  const borderColor = page.id === "slide23" ? "rgba(17, 24, 39, 0.55)" : "rgba(230, 0, 18, 0.55)";
  const shouldCenterCellText = page.id === "slide06" || element.columnIndex >= 2 || (page.id === "slide09" && /^fkxz/.test(key));
  const style = {
    ...rectStyle,
    "z-index": 200 + index,
    "padding": "2px 4px",
    // TRACE[PPT-PREVIEW-002]: 表格单元格也用不透明底色，彻底盖掉底图旧值。
    "background": "#ffffff",
    "border": `0.6px solid ${borderColor}`,
    "color": isCalculated ? "#9C6500" : "#111827",
    "font-size": "10px",
    "font-weight": "800",
    "line-height": "1.25",
    "text-align": shouldCenterCellText ? "center" : "left",
    "justify-content": "center",
    "align-items": "center",
    "opacity": "1",
    "text-shadow": "none"
  };

  return `
    <div
      class="pptx-template-overlay pptx-template-cell-overlay"
      data-ppt-bind="${escapeHtml(key)}"
      style="${escapeHtml(cssDecls(style))}"
    >
      <span>${escapeHtml(value || "").replace(/\n/g, "<br />")}</span>
    </div>
  `;
}

function renderReviewPanelOverlay(page) {
  const config = REVIEW_PANEL_FIELD_CONFIG[page.id];
  if (!config) return "";

  const titleStyle = {
    ...pptxRectStyle({ x: 118, y: 120, w: 335, h: 48 }),
    "z-index": 420,
    "background": "#e3aa00",
    "color": "#ffffff",
    "font-size": "26px",
    "font-weight": "800",
    "line-height": "48px",
    "padding": "0 22px",
    "clip-path": "polygon(0 0, calc(100% - 28px) 0, 100% 50%, calc(100% - 28px) 100%, 0 100%)"
  };
  const panelStyle = {
    ...pptxRectStyle({ x: 190, y: 164, w: 925, h: 380 }),
    "z-index": 410,
    "background": "#eeeeee",
    "border": "0",
    "box-shadow": "none"
  };
  const bodyStyle = {
    ...pptxRectStyle({ x: 220, y: 205, w: 850, h: 300 }),
    "z-index": 430,
    "background": "transparent",
    "color": "#111111",
    "font-size": "17px",
    "font-weight": "700",
    "line-height": "1.65",
    "white-space": "pre-wrap"
  };

  return `
    <div class="pptx-template-overlay pptx-template-review-panel" style="${escapeHtml(cssDecls(panelStyle))}"></div>
    <div class="pptx-template-overlay pptx-template-review-title" style="${escapeHtml(cssDecls(titleStyle))}">
      ${escapeHtml(config.title)}
    </div>
    <div
      class="pptx-template-overlay pptx-template-review-body"
      data-ppt-bind="${escapeHtml(config.key)}"
      style="${escapeHtml(cssDecls(bodyStyle))}"
    >
      ${multilineHtml(overlayFieldValue(config.key) || "待补充")}
    </div>
  `;
}

function renderPptxImageBackedSlide(page, templateSlide) {
  // TRACE[PPT-TEMPLATE-NEW-015]: 新模板预览以真实 PPTX 渲染图为底图。
  // 左侧字段变化只更新覆盖层，避免手写 HTML 破坏原 PPTX 标题、表格、图片和 logo。
  const elements = Array.isArray(templateSlide.elements) ? templateSlide.elements : [];
  const overlays = elements
    .map((element, index) => {
      if (element.type === "tableCell") return renderPptxImageOverlayCell(page, element, index);
      if (element.type === "text") return renderPptxImageOverlayText(page, element, index);
      return "";
    })
    .join("");
  const reviewPanelOverlay = renderReviewPanelOverlay(page);

  return `
    <div class="ppt-slide pptx-template-slide pptx-template-image-backed" data-pptx-template-slide="${escapeHtml(page.id)}">
      <img
        class="pptx-template-background"
        src="${escapeHtml(templatePreviewAssetUrl(templateSlide.image))}"
        alt="${escapeHtml(page.title)}"
      />
      ${overlays}
      ${reviewPanelOverlay}
      ${page.id === "slide04" && demoState.qccAdmissionImage ? `<div style="position:absolute;left:69%;top:17%;width:29%;height:62%;background:white;overflow:hidden">${admissionImageMarkup(demoState.qccAdmissionImage)}</div>` : ""}
    </div>
  `;
}

function previewText(key, label = key) {
  return `<span data-ppt-bind="${escapeHtml(key)}">${escapeHtml(fieldValue({ key, label, method: "模板字段" }) || "待补充")}</span>`;
}

function manualPreviewText(key) {
  // TRACE[PPT-SCORE-004]: 人工填写格允许为空，避免把“待补充”误渲染成 PDF 评分表里的真实内容。
  return `<span data-ppt-bind="${escapeHtml(key)}">${escapeHtml(hasStateField(key) ? demoState[key] ?? "" : "")}</span>`;
}

const PPTX_TABLE_CELL_FIELD_BINDINGS = {
  // TRACE[PPT-TEMPLATE-NEW-013]: 表格覆盖层只覆盖明确可编辑的单元格。
  // key 格式为 tableIndex:rowIndex:columnIndex，坐标来自真实 PPTX manifest。
  // TRACE[PPT-QCC-004]: 第 6 页覆盖 3 年 x 10 个企查查模拟财务字段，保证左侧每个数字都能实时进表。
  slide06: qccFinancialCellBindings(),
  slide08: {
    // TRACE[PPT-COMPLIANCE-003]: 只覆盖第 8 页表格“办理进展”列，第一列文件名和第三列风险提示保持 PPTX 源文案。
    "0:1:1": "compliancePropertyProgress",
    "0:2:1": "complianceFilingProgress",
    "0:3:1": "complianceAccessPlanProgress",
    "0:4:1": "complianceAccessApprovalProgress",
    "0:5:1": "complianceBusinessLicenseProgress",
    "0:6:1": "complianceFranchiseProgress",
    "0:7:1": "complianceLeaseProgress",
    "0:8:1": "complianceOtherProgress"
  },
  // TRACE[PPT-BIZ-008]: 第9页判断列显示服务端结果，支持逐项人工确认。
  slide09: Object.fromEntries(Array.from({ length: 10 }, (_, index) => [`0:${index + 1}:2`, `fkxz${index + 1}`])),
  slide10: {
    // TRACE[PPT-EMC-003]: 第 10 页中间列来自合同解析字段，右侧影响列来自人工字段。
    // 两列都覆盖源 PPTX 示例文字，确保左侧、预览、最终 PPTX 同源。
    "0:1:1": "tariffTerm",
    "0:1:2": "tariffImpact",
    "0:2:1": "priceChangeTerm",
    "0:2:2": "priceChangeImpact",
    "0:3:1": "roofRentTerm",
    "0:3:2": "roofRentImpact",
    "0:4:1": "consumptionTerm",
    "0:4:2": "consumptionImpact",
    "0:5:1": "waterproofTerm",
    "0:5:2": "waterproofImpact",
    "0:6:1": "constructionDeadline",
    "0:6:2": "constructionImpact",
    "0:7:1": "delayPenalty",
    "0:7:2": "delayPenaltyImpact",
    "0:8:1": "carbonAssetTerm",
    "0:8:2": "carbonAssetImpact",
    "0:9:1": "dismantlingTerm",
    "0:9:2": "dismantlingImpact",
    "0:10:1": "gridPriceShareTerm",
    "0:10:2": "gridPriceShareImpact"
  },
  slide13: {
    "0:1:0": "riskCategory1",
    "0:1:1": "riskPoint1",
    "0:1:2": "riskLevel1",
    "0:1:3": "riskNote1",
    "0:2:0": "riskCategory2",
    "0:2:1": "riskPoint2",
    "0:2:2": "riskLevel2",
    "0:2:3": "riskNote2",
    "0:3:0": "riskCategory3",
    "0:3:1": "riskPoint3",
    "0:3:2": "riskLevel3",
    "0:3:3": "riskNote3",
    "0:4:0": "riskCategory4",
    "0:4:1": "riskPoint4",
    "0:4:2": "riskLevel4",
    "0:4:3": "riskNote4",
    "0:5:0": "riskCategory5",
    "0:5:1": "riskPoint5",
    "0:5:2": "riskLevel5",
    "0:5:3": "riskNote5",
    "0:6:0": "riskCategory6",
    "0:6:1": "riskPoint6",
    "0:6:2": "riskLevel6",
    "0:6:3": "riskNote6"
  },
  slide14: {
    "0:1:1": "initiationCapacity",
    "0:2:1": "initiationConsumption",
    "0:3:1": "initiationUserPowerPrice",
    "0:4:1": "initiationOperationYears",
    "0:5:1": "initiationRoofRent",
    "0:6:1": "initiationGridType",
    "0:7:1": "initiationFeedInPrice",
    "0:8:1": "initiationManagementFee",
    "0:9:1": "initiationIrr"
  },
  slide23: {
    "0:1:1": "annualGeneration",
    "0:1:2": "annualRevenue"
  }
};

const PPTX_TEXT_FIELD_FALLBACKS = {
  // TRACE[PPT-TEMPLATE-NEW-014]: 以下页在源 PPTX 中存在整段说明文本，
  // 预览侧按页码把左侧字段覆盖到对应文本框，避免手写 HTML 版式和 PPTX 失配。
  slide03: {
    "湖北新祥云新材料有限公司xxx": "userCompany",
    "厂区一期2025年5月开始设备调试，同年8月开始试生产，目前企业生产率达80%以上。": "productionCapacity",
    "主要为集团复合肥产品的生产进行一些中间环节原材料的加工制作。": "majorCustomers",
    "24小时生产，年生产350天。": "workMode"
  },
  slide04: {
    "企业资信与司法风险": "qccRiskSummary",
    "政策合规性风险": "policyComplianceRisk"
  },
  slide05: {
    "屋顶产权方：湖北新祥云新材料有限公司": "slide05SiteSurveyBlock"
  },
  slide06: {
    "盈利能力分析": "slide06FinanceAnalysisBlock"
  },
  slide09: {
    "收益率达标判定": "slide09BusinessSummaryBlock"
  },
  slide12: {
    // TRACE[PPT-PRIOR-001]: 第 12 页源 PPTX 是一个整段项目回顾文本框，
    // 覆盖层必须写完整句式和 6 个项目符号，不能只写某一个字段。
    "同一集团": "slide12PriorProjectBlock"
  }
};

const REVIEW_PANEL_FIELD_CONFIG = {
  // TRACE[PPT-PREVIEW-003]: 第 15-18 页正文区在 PPTX 中是黄色标题条 + 灰色正文板。
  // 这里不用普通白底覆盖层，而是按模板视觉重新铺底，再把左侧字段写到灰色区域。
  slide15: { key: "advantage", title: "项目优势分析" },
  slide16: { key: "riskMeasure", title: "项目风险及措施" },
  slide17: { key: "legalRiskMeasure", title: "项目法务风险" },
  slide18: { key: "departmentOpinion", title: "部门评审意见" }
};

function tableCellFieldKey(page, element) {
  const bindings = PPTX_TABLE_CELL_FIELD_BINDINGS[page.id] || {};
  return bindings[`${element.tableIndex}:${element.rowIndex}:${element.columnIndex}`] || "";
}

function textFallbackFieldKey(page, text) {
  const fallbacks = PPTX_TEXT_FIELD_FALLBACKS[page.id] || {};
  return Object.entries(fallbacks).find(([needle]) => String(text || "").includes(needle))?.[1] || "";
}

function overlayFieldValue(key) {
  if (!key) return "";
  if (key === "qccRiskSummary") return qccRiskSummaryText();
  if (key === "slide09BusinessSummaryBlock") return slide09BusinessSummaryBlockText();
  if (key === "slide12PriorProjectBlock") return slide12PriorProjectBlockText();
  if (key === "slide05SiteSurveyBlock") return slide05SiteSurveyBlockText();
  if (key === "slide06FinanceAnalysisBlock") return slide06FinanceAnalysisBlockText();
  const field = allPptFieldItems().find((item) => item.key === key) || { key, label: key, method: "人工填写" };
  return fieldValue(field);
}

function slide05SiteSurveyBlockText() {
  // TRACE[PPT-PREVIEW-004]: 第 5 页源 PPTX 把现场踏勘文字放在一个整段文本框，
  // 覆盖时只写源文件真实存在的三行；图片占位文案保留模板原样，后续由人工粘贴图片。
  return [
    `屋顶产权方：${fieldValue({ key: "roofOwner", label: "屋顶产权方" })}`,
    `产证情况：${fieldValue({ key: "propertyCertificateStatus", label: "产证情况" })}`,
    `屋顶类型：${fieldValue({ key: "roofType", label: "屋顶类型" })}`
  ].join("\n");
}

function slide06FinanceAnalysisBlockText() {
  // TRACE[PPT-QCC-005]: 第 6 页 PPTX 底图只有一个整段分析文本框，
  // 因此预览和后端都把四个 AI/人工分析字段组合成同一段文字写入。
  return [
    `1. 盈利能力分析：${fieldValue({ key: "profitabilityAnalysis", label: "盈利能力分析" })}`,
    `2. 经营效率与现金流状况：${fieldValue({ key: "operationCashflowAnalysis", label: "经营效率与现金流状况" })}`,
    `3. 资产负债情况：${fieldValue({ key: "assetDebtAnalysis", label: "资产负债情况" })}`,
    `结论：${fieldValue({ key: "financeSummary", label: "结论" })}`
  ].join("\n");
}

function slide12PriorProjectBlockText() {
  const prior = currentPriorGridSession();
  if (prior.status !== "has") return prior.status === "none" ? "无前序项目（已人工核实）" : prior.status === "checking" ? "正在检查前序项目…" : "前序项目关系待确认";
  // TRACE[PPT-PRIOR-002]: 第 12 页“前序项目回顾”按 PPTX 源文件的固定标题句和项目符号组织。
  // 左侧字段仍保留为最终来源；空值时只显示字段名，避免把“待补充”误认为正式事实。
  const rows = [
    ["并网情况", "priorGridConnection"],
    ["发电小时数", "priorGenerationHours"],
    ["回款异常情况", "priorCollectionException"],
    ["运维异常", "priorMaintenanceException"],
    ["诉讼情况", "priorLitigation"],
    ["后评价的收益率&结论", "priorPostEval"]
  ];
  return [
    "“同一集团“项目或”同一厂区内” 已并网项目，项目情况；",
    ...rows.map(([label, key]) => {
      const value = hasStateField(key) ? String(demoState[key] || "").trim().replace(/\s+/g, " ") : "";
      return `• ${label}${value ? `：${value}` : ""}`;
    })
  ].join("\n");
}

function multilineHtml(value) {
  return escapeHtml(value).replace(/\n/g, "<br />");
}

function previewLine(label, key) {
  return `<p><b>${escapeHtml(label)}：</b>${previewText(key, label)}</p>`;
}

function templateSectionTitle(page) {
  return Object.prototype.hasOwnProperty.call(page, "sectionTitle") ? page.sectionTitle : page.name;
}

function templatePageTitle(page) {
  return Object.prototype.hasOwnProperty.call(page, "templateTitle") ? page.templateTitle : page.title;
}

function renderTemplateHeader(page) {
  const sectionTitle = templateSectionTitle(page);
  const pageTitle = templatePageTitle(page);
  return `
    <div class="ppt-template-header ${sectionTitle || pageTitle ? "" : "is-titleless"}">
      <span>${escapeHtml(sectionTitle)}</span>
      <strong>${escapeHtml(pageTitle)}</strong>
    </div>
  `;
}

function renderTemplateFooter() {
  return `
    <div class="ppt-template-footer">
      <i></i><i></i><i></i>
      <strong>中鑫新能源</strong>
      <i></i><i></i>
    </div>
  `;
}

function renderTemplateBodyTitle(page) {
  if (!page.bodyTitle) return "";
  return `<h3 class="ppt-template-body-title">${escapeHtml(page.bodyTitle)}</h3>`;
}

function renderHtmlTemplateGrid(page, fields) {
  const groups = Object.entries(groupFields(fields));
  return `
    <div class="ppt-template-generic-grid">
      ${renderTemplateBodyTitle(page)}
      ${groups.map(([group, items]) => `
        <section>
          <h4>${escapeHtml(group)}</h4>
          ${items.slice(0, 8).map((field) => previewLine(field.label, field.key)).join("")}
        </section>
      `).join("")}
    </div>
  `;
}

function renderMainDirectorySlide(page) {
  // TRACE[PPT-TEMPLATE-NEW-011]: 目录页按 PDF 原文固定展示，不能再自动列出 25 个内部页签。
  const items = [
    "一． 企业经营能力",
    "二． 项目合规性分析",
    "三． 项目商务条件",
    "四． 项目风险一览表及项目评审意见",
    "五． 附   录"
  ];
  return `
    ${renderTemplateHeader(page)}
    <div class="ppt-template-directory is-main-directory">
      ${items.map((item) => `<p>${escapeHtml(item)}</p>`).join("")}
    </div>
    ${renderTemplateFooter()}
  `;
}

function renderAppendixDirectorySlide(page) {
  return `
    ${renderTemplateHeader(page)}
    <div class="ppt-template-appendix-title">
      <span></span>
      <strong>附　录</strong>
    </div>
    ${renderTemplateFooter()}
  `;
}

function renderStatementSlide(page, fieldKey, fallbackText) {
  // TRACE[PPT-REVIEW-001]: 项目优势/风险/法务页按 PDF 原版黄色箭头 + 灰底正文框重排。
  // 字段仍然来自左侧表单，确保人工修改后右侧正文同步更新。
  return `
    ${renderTemplateHeader(page)}
    <div class="ppt-template-statement">
      <div class="ppt-template-statement-ribbon">${escapeHtml(page.bodyTitle || page.name)}</div>
      <div class="ppt-template-statement-box">
        <div class="ppt-template-statement-copy">
          ${previewText(fieldKey, page.bodyTitle || page.name || fieldKey) || escapeHtml(fallbackText)}
        </div>
      </div>
    </div>
    ${renderTemplateFooter()}
  `;
}

// Project images stay outside report fields: blob URLs are session-only and never exported.
const projectAssetPreview = { projectCode: "", status: "idle", assets: [], generation: 0, controller: null, signature: "" };
const PROJECT_ASSET_LABELS = {
  ROOF_SITE_PHOTO: "屋顶 / 厂区图",
  NATIONAL_ENTERPRISE_CREDIT: "工商资信截图",
  COURT_ENFORCEMENT_QUERY: "执行查询截图"
};

// Both report preview and the parsing workspace observe the same authenticated image cache.
const projectAssetSubscribers = new Set();
function projectAssetSnapshot() {
  return {
    projectCode: projectAssetPreview.projectCode,
    status: projectAssetPreview.status,
    assets: projectAssetPreview.assets.map(asset => ({
      assetId: asset.assetId, url: asset.url, caption: projectAssetCaption(asset),
      sourceFileId: asset.sourceFileId, sourceVersion: asset.sourceVersion, sourceType: asset.sourceType
    }))
  };
}
function notifyProjectAssetSubscribers() {
  const snapshot = projectAssetSnapshot();
  projectAssetSubscribers.forEach(listener => listener(snapshot));
}
function subscribeProjectAssets(listener) {
  projectAssetSubscribers.add(listener);
  listener(projectAssetSnapshot());
  void loadProjectAssetPreview();
  return () => projectAssetSubscribers.delete(listener);
}

function resetProjectAssetPreview() {
  projectAssetPreview.controller?.abort();
  projectAssetPreview.assets.forEach(asset => { if (asset.url) URL.revokeObjectURL(asset.url); });
  Object.assign(projectAssetPreview, { projectCode: "", status: "idle", assets: [], controller: null, signature: "", generation: projectAssetPreview.generation + 1 });
  notifyProjectAssetSubscribers();
}

async function loadProjectAssetPreview(force = false) {
  const projectCode = String(demoState.projectCode || "");
  if (!projectCode) return;
  if (!force && projectAssetPreview.projectCode === projectCode && projectAssetPreview.status !== "idle") return;
  const signature = projectAssetPreview.projectCode === projectCode ? projectAssetPreview.signature : "";
  resetProjectAssetPreview();
  const controller = new AbortController();
  Object.assign(projectAssetPreview, { projectCode, status: "loading", controller, signature });
  notifyProjectAssetSubscribers();
  const generation = projectAssetPreview.generation;
  const current = () => generation === projectAssetPreview.generation && projectCode === String(demoState.projectCode || "") && !controller.signal.aborted;
  const request = globalThis.__PPT_REPORT_FETCH || fetch;
  const base = new URL(`/api/projects/${encodeURIComponent(projectCode)}/document-assets`, new URL(graphqlEndpoint(), window.location.href));
  const options = { headers: embedAuthHeaders(), signal: controller.signal, cache: "no-store" };
  try {
    const response = await request(base.toString(), options);
    if (!response.ok) throw new Error("图片列表读取失败");
    const body = await response.json();
    const records = Array.isArray(body) ? body : body.success === true ? body.data : null;
    if (!Array.isArray(records)) throw new Error("图片列表格式异常");
    if (!current()) return;
    const assets = await Promise.all(records.filter(asset => Object.hasOwn(PROJECT_ASSET_LABELS, asset.assetType)).map(async asset => {
      try {
        const content = await request(`${base}/${encodeURIComponent(asset.assetId)}/content`, options);
        if (!content.ok) throw new Error("图片读取失败");
        const blob = await content.blob();
        if (!/^image\/(jpeg|png|webp)$/.test(blob.type)) throw new Error("图片格式异常");
        return { ...asset, url: current() ? URL.createObjectURL(blob) : "" };
      } catch { return { ...asset, url: "" }; }
    }));
    if (!current()) {
      assets.forEach(asset => { if (asset.url) URL.revokeObjectURL(asset.url); });
      return;
    }
    Object.assign(projectAssetPreview, { assets, status: "loaded" });
  } catch {
    if (current()) projectAssetPreview.status = "error";
  } finally {
    if (current()) { notifyProjectAssetSubscribers(); renderDraftPanels(); }
  }
}

function syncProjectAssetSource(projectCode, signature) {
  if (projectCode !== demoState.projectCode) return;
  if (projectAssetPreview.projectCode === projectCode && projectAssetPreview.signature === signature) return;
  resetProjectAssetPreview();
  Object.assign(projectAssetPreview, { projectCode, signature });
  if (projectAssetSubscribers.size || ["slide05", "slide24"].includes(demoState.pptPage)) {
    void loadProjectAssetPreview();
    renderDraftPanels();
  }
}

function projectAssetCaption(asset) {
  const source = asset.sourceType === "MANUAL_OVERRIDE" ? "人工上传" : `立项报告第 ${asset.sourcePage} 页`;
  return `${PROJECT_ASSET_LABELS[asset.assetType]} · ${source}`;
}

function renderProjectAssetGallery(pageId) {
  const types = pageId === "slide05" ? ["ROOF_SITE_PHOTO"] : ["NATIONAL_ENTERPRISE_CREDIT", "COURT_ENFORCEMENT_QUERY"];
  const assets = projectAssetPreview.projectCode === String(demoState.projectCode || "") ? projectAssetPreview.assets.filter(asset => types.includes(asset.assetType)) : [];
  if (!assets.length) {
    const message = !demoState.projectCode ? "请先选择项目" : projectAssetPreview.status === "loading" ? "正在读取立项报告图片…" : projectAssetPreview.status === "error" ? "图片读取失败，请点击刷新重试" : "当前立项报告未提取到此类图片，请补充报告后重新解析";
    return `<div class="ppt-project-asset-empty" role="status">${message}</div>`;
  }
  return `<div class="ppt-project-asset-gallery" data-project-asset-count="${assets.length}">${assets.map(asset => `<figure>${asset.url ? `<img src="${escapeHtml(asset.url)}" alt="${escapeHtml(projectAssetCaption(asset))}" />` : '<div class="ppt-project-asset-empty">图片读取失败，请点击刷新重试</div>'}<figcaption>${escapeHtml(projectAssetCaption(asset))}</figcaption></figure>`).join("")}</div>`;
}

function renderSiteSurveySlide(page) {
  return `
    ${renderTemplateHeader(page)}
    <div class="ppt-template-list-layout ppt-site-asset-layout">
      <ol>
        <li>屋顶产权方：${previewText("roofOwner", "屋顶产权方")}</li>
        <li>产证情况：${previewText("propertyCertificateStatus", "产证情况")}</li>
        <li>屋顶类型：${previewText("roofType", "屋顶类型")}</li>
      </ol>
      ${renderProjectAssetGallery("slide05")}
    </div>
    ${renderTemplateFooter()}
  `;
}

function renderComplianceSlide(page) {
  const rows = [
    // TRACE[PPT-COMPLIANCE-004]: HTML 兜底预览也按 PPTX 源文件 8 行展示。
    // 第三列风险提示为固定模板文案，只有第二列“办理进展”绑定字段。
    ["不动产权证（三证一书文件）", "附图；项目产权、EMC协议经营期限不满25年", "compliancePropertyProgress"],
    ["项目备案", "特殊项目形式：绿电直联、源网荷储", "complianceFilingProgress"],
    ["项目接入方案", "", "complianceAccessPlanProgress"],
    ["项目接入评审意见/接入批复", "接入电压等级高压，符合配电网接入要求", "complianceAccessApprovalProgress"],
    ["用电企业营业执照", "", "complianceBusinessLicenseProgress"],
    ["特许经营权文件", "", "complianceFranchiseProgress"],
    ["是否用电方和产权房不一致，有无租赁合同", "", "complianceLeaseProgress"],
    ["XXX", "", "complianceOtherProgress"]
  ];
  return `
    ${renderTemplateHeader(page)}
    <table class="ppt-template-check-table">
      <thead>
        <tr>
          <th>屋顶分布式项目（根据不同项目类型修改下述文件）</th>
          <th>办理进展</th>
          <th>风险项提示（*需明确评判标准）</th>
        </tr>
      </thead>
      <tbody>
        ${rows.map(([label, note, key]) => `
          <tr>
            <td>${escapeHtml(label)}</td>
            <td>${previewText(key, label)}</td>
            <td>${escapeHtml(note)}</td>
          </tr>
        `).join("")}
      </tbody>
    </table>
    ${renderTemplateFooter()}
  `;
}

function renderAcquisitionCreditInstructionSlide(page) {
  // Second-edition row103 replaces the fixed instruction with a conditional investigation.
  const gate = String(demoState.debtAcquisitionStatus || "待确认").trim();
  if (gate !== "是") return `${renderTemplateHeader(page)}<div class="ppt-template-instruction-page"><h3>承债式收购项目资信调查</h3><p>${gate === "否" ? "不适用：本项目非承债式收购。" : "适用条件待确认：请确认是否属于承债式收购。"}</p></div>${renderTemplateFooter()}`;
  return `
    ${renderTemplateHeader(page)}
    <div class="ppt-template-instruction-page">
      <h3>新增承债式收购项目中项目公司及其原股东方资信调查</h3>
      <p>针对承债式收购的项目公司原股东：</p>
      <ol>
        <li>原股东及增信措施：${previewText("originalShareholderRisk")}</li>
        <li>项目公司是否涉及诉讼：${previewText("acquisitionLitigationAnalysis")}</li>
        <li>项目公司及母公司是否已有股权质押/冻结情况：${previewText("acquisitionPledgeAnalysis")}</li>
      </ol>
    </div>
    ${renderTemplateFooter()}
  `;
}

function renderBusinessRiskSlide(page) {
  // TRACE[PPT-BIZ-009]: 第9页展示服务端规则结果及明确的人工确认，不推测缺失条件。
  const renderCheckValue = (key) => {
    const value = manualFieldValue(key);
    return escapeHtml(value || "");
  };
  const conditions = [
    ["1", "项目所在地属于限制准入区域 GDP100以外", "fkxz1"],
    ["2", "项目位于东北区域", "fkxz2"],
    ["3", "项目所在地市（公司战略核心区域外）无其他已投运项目且项目规模小于3MW", "fkxz3"],
    ["4", "用能企业仅提供一年财报且亏损，或提供两年及以上财报连续两年及以上亏损", "fkxz4"],
    ["5", "用能企业属于限制准入的行业", "fkxz5"],
    ["6", "用能企业无法提供加盖公章的近三年财务数据、用电数据等项目相关数据", "fkxz6"],
    ["7", "用能企业为产业园类型", "fkxz7"],
    ["8", "用能企业规模小（如民营企业且实收资本金低于1000万元）", "fkxz8"],
    ["9", "项目消纳率不足80%", "fkxz9"],
    ["10", "项目余电不上网", "fkxz10"]
  ];
  return `
    ${renderTemplateHeader(page)}
    <div class="ppt-template-business-layout">
      <section class="ppt-template-business-summary">
        <h4>收益率达标判定：</h4>
        <ul>
          <li>全投资税后 IRR：${escapeHtml(ensurePercent(demoState.irr))}</li>
          <li>基准收益率要求：${previewText("benchmarkReturn", "基准收益率要求")}</li>
          <li>结论：<strong>${previewText("returnConclusion", "收益率达标结论")}</strong></li>
        </ul>
      </section>
      <table class="ppt-template-condition-table">
        <thead><tr><th>序号</th><th>条件说明</th><th>符合请打<span class="ppt-template-green-check">✓</span></th></tr></thead>
        <tbody>
          ${conditions.map(([index, label, key]) => `
            <tr>
              <td>${index}</td>
              <td>${escapeHtml(label)}</td>
              <td>${renderCheckValue(key)}</td>
            </tr>
          `).join("")}
        </tbody>
      </table>
      <small>*符合其中任意1-3条(含)时，原则上项目收益率要求须在基准收益率(7.7%)的基础上增加0.5%;超过3条时原则上不建议项目继续推进</small>
    </div>
    ${renderTemplateFooter()}
  `;
}

function renderEmcTermsSlide(page) {
  const rows = [
    // TRACE[PPT-EMC-004]: 条款内容列来自 OA 合同文件解析字段，影响列来自人工字段。
    ["电价及结算", "tariffTerm", "tariffImpact"],
    ["电价变更条款", "priceChangeTerm", "priceChangeImpact"],
    ["屋顶", "roofRentTerm", "roofRentImpact"],
    ["消纳", "consumptionTerm", "consumptionImpact"],
    ["防水要求", "waterproofTerm", "waterproofImpact"],
    ["工期", "constructionDeadline", "constructionImpact"],
    ["工期罚则", "delayPenalty", "delayPenaltyImpact"],
    ["碳资产归属", "carbonAssetTerm", "carbonAssetImpact"],
    ["拆装要求", "dismantlingTerm", "dismantlingImpact"],
    ["上网电价分成(如有）", "gridPriceShareTerm", "gridPriceShareImpact"]
  ];
  return `
    ${renderTemplateHeader(page)}
    <table class="ppt-template-emc-table">
      <thead><tr><th>EMC商务条款</th><th>条款内容</th><th>对收益率的影响</th></tr></thead>
      <tbody>
        ${rows.map(([label, content, impact]) => `
          <tr>
            <td>${escapeHtml(label)}</td>
            <td>${previewText(content, label)}</td>
            <td>${manualPreviewText(impact)}</td>
          </tr>
        `).join("")}
      </tbody>
    </table>
    ${renderTemplateFooter()}
  `;
}

function renderSensitivityMatrix(type) {
  // TRACE[PPT-BIZ-002]: 敏感性分析页左侧矩阵按 PDF 原版灰色网格保留，后续可由测算模型填值。
  const headers = type === "price"
    ? ["", "0.36", "0.38", "0.40", "0.42", "0.44", "0.46", "0.48"]
    : ["", "6.50%", "6.75%", "7.00%", "7.25%", "7.50%", "7.75%", "8.00%"];
  const rows = ["3.8", "3.9", "4.0", "4.1", "4.2", "4.3", "4.4", "4.5", "4.6"];
  return `
    <table class="ppt-template-sensitivity-matrix">
      <thead><tr>${headers.map((header) => `<th>${escapeHtml(header)}</th>`).join("")}</tr></thead>
      <tbody>
        ${rows.map((row) => `
          <tr>
            <th>${escapeHtml(row)}</th>
            ${headers.slice(1).map(() => "<td></td>").join("")}
          </tr>
        `).join("")}
      </tbody>
    </table>
  `;
}

function renderSensitivitySlide(page) {
  // TRACE[PPT-SENSITIVITY-002]: 第 11 页只保留模板表格和说明文本，不绑定字段。
  // 表格数据后续由员工下载 PPTX 后人工填写。
  return `
    ${renderTemplateHeader(page)}
    <div class="ppt-template-sensitivity-layout">
      <section class="sensitivity-left">
        <h4>电价-单瓦投资成本 双因素敏感性分析</h4>
        ${renderSensitivityMatrix("price")}
        <h4>消纳-单瓦投资成本 双因素敏感性分析</h4>
        ${renderSensitivityMatrix("consumption")}
      </section>
      <section class="sensitivity-right">
        <p>此项目光伏项目容量XXMW，自发自用比例为90%，以项目总投入为XX，IRR为XX%；</p>
        <p>1、如电价下降5分，IRR 为5.19%；</p>
        <p>2、如电价上涨5分，IRR 为8.48%；</p>
        <p>3、如果电站正常拆除，拆装费306万元，全投资IRR下降为6.22%；</p>
        <p class="sensitivity-warning">4、电站25年防水，考虑每年运维费加2分？</p>
        <p class="sensitivity-second">此项目光伏项目容量XXMW，自发自用比例为90%，以项目总投入为2.52元/W，IRR为XX%；</p>
        <p>1.如总投入降低0.2元/W时，IRR为XX%；</p>
        <p>2.如总投入增加0.2元/W时，IRR为XX%；</p>
        <p>3.若自发自用比例降低10%时，IRR为XX%。</p>
      </section>
    </div>
    ${renderTemplateFooter()}
  `;
}

function renderPriorProjectSlide(page) {
  if (currentPriorGridSession().status !== "has") return `${renderTemplateHeader(page)}<div class="ppt-template-prior-layout"><h3>${escapeHtml(slide12PriorProjectBlockText())}</h3></div>${renderTemplateFooter()}`;
  // TRACE[PPT-PRIOR-003]: HTML 兜底预览也必须复刻 PPTX 第 12 页正文结构。
  // 页面有渲染底图时优先走 slide12PriorProjectBlockText 覆盖层。
  const rows = [
    ["并网情况", "priorGridConnection"],
    ["发电小时数", "priorGenerationHours"],
    ["回款异常情况", "priorCollectionException"],
    ["运维异常", "priorMaintenanceException"],
    ["诉讼情况", "priorLitigation"],
    ["后评价的收益率&结论", "priorPostEval"]
  ];
  return `
    ${renderTemplateHeader(page)}
    <div class="ppt-template-prior-layout">
      <h3>“同一集团“项目或”同一厂区内” 已并网项目，项目情况；</h3>
      <ul>
        ${rows.map(([label, key]) => `<li>${escapeHtml(label)}：${previewText(key, label)}</li>`).join("")}
      </ul>
    </div>
    ${renderTemplateFooter()}
  `;
}

function renderApprovalChangeSlide(page) {
  // TRACE[PPT-REVIEW-002]: 第二版105字段第55—63行：左列取立项OA102/人工值，右侧投决列始终留空。
  const rows = [
    ["容量", "initiationCapacity"],
    ["消纳比例", "initiationConsumption"],
    ["用户折后电价", "initiationUserPowerPrice"],
    ["运营年限", "initiationOperationYears"],
    ["屋顶租金", "initiationRoofRent"],
    ["接网型式 是否余电上网", "initiationGridType"],
    ["余电上网电价", "initiationFeedInPrice"],
    ["公司管理费", "initiationManagementFee"],
    ["全投资收益率", "initiationIrr"]
  ];
  return `
    ${renderTemplateHeader(page)}
    <table class="ppt-template-approval-table">
      <thead><tr><th></th><th>立项上会数据</th><th>投决上会数据</th></tr></thead>
      <tbody>
        ${rows.map(([label, key]) => `
          <tr>
            <td>${escapeHtml(label)}</td>
            <td>${manualPreviewText(key)}</td>
            <td></td>
          </tr>
        `).join("")}
      </tbody>
    </table>
    ${renderTemplateFooter()}
  `;
}

function scoreFillCell(key, className = "") {
  return `<td class="score-fill ${className}">${manualPreviewText(key)}</td>`;
}

function scoreRemarkCell(key, className = "") {
  return `<td class="score-fill ${className}">${manualPreviewText(key)}</td>`;
}

function scoreRuleCell(text, className = "") {
  return `<td class="score-rule ${className}">${multilineHtml(text)}</td>`;
}

function renderScoreAppendixSlide(page, variant) {
  // TRACE[PPT-SCORE-005]: 评分表页按 PDF 源模板拆成两页，固定规则原文保留，可填写格绑定字段。
  return variant === "operating"
    ? renderOperatingScoreAppendixSlide(page)
    : renderBasicScoreAppendixSlide(page);
}

function renderManualTemplateOnlySlide(page, message) {
  // TRACE[PPT-MANUAL-022]: 模板页兜底预览只展示说明，不创建 data-ppt-bind 覆盖层。
  // 这能保证“无输入字段”的页不会在没有 PPTX 底图时误退回成可编辑字段页。
  return `
    ${renderTemplateHeader(page)}
    <div class="ppt-template-manual-only">
      <strong>${escapeHtml(message)}</strong>
    </div>
    ${renderTemplateFooter()}
  `;
}

function renderBasicScoreAppendixSlide(page) {
  return `
    ${renderTemplateHeader(page)}
    <table class="ppt-template-score-table is-score-page-one">
      <colgroup>
        <col class="score-col-level" />
        <col class="score-col-metric" />
        <col class="score-col-weight" />
        <col class="score-col-rule" />
        <col class="score-col-value" />
        <col class="score-col-note" />
      </colgroup>
      <thead>
        <tr>
          <th>一级指标</th>
          <th>二级指标</th>
          <th>权重</th>
          <th>打分细则</th>
          <th>得分</th>
          <th>备注情况</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td class="score-level" rowspan="5">企业基本情况</td>
          <td>企业性质</td>
          <td>8%</td>
          ${scoreRuleCell("A类客户：央企、国企、知名外企（如：世界500强）及其全资子公司或控股公司（8分）；\nB类客户：优质上市公司、民营企业（行业龙头）（6分）；\nC类客户：一般民营企业，但企业用电量大于1000万度/年，资信较好（4分）；\nD类：除上述三类之外的（1分）；")}
          ${scoreFillCell("enterpriseNatureScore")}
          ${scoreRemarkCell("enterpriseNatureRemark")}
        </tr>
        <tr>
          <td>企业实收资本</td>
          <td>5%</td>
          ${scoreRuleCell("0＜实收资本＜3000万（2分）；\n3000万≤实收资本＜5000万（3分）；\n5000万≤实收资本＜1亿（4分）；                      实收资本≥1亿（5分）")}
          ${scoreFillCell("paidCapitalScore")}
          ${scoreRemarkCell("paidCapitalRemark")}
        </tr>
        <tr>
          <td>企业经营年限</td>
          <td>5%</td>
          ${scoreRuleCell("0＜经营年限＜5年（3分）；\n5≤经营年限＜10年（4分）；\n10年≤经营年限（5分）")}
          ${scoreFillCell("operationYearsScore")}
          ${scoreRemarkCell("operationYearsRemark")}
        </tr>
        <tr>
          <td>企业所在行业</td>
          <td>7%</td>
          ${scoreRuleCell("重点发展行业：汽车、机械、电子、材料、通讯、环保、航空、医疗设备、高端装备等先进制造类行业（7分）；\n限制性行业：“两高一剩”的产业（钢铁、造纸、电解铝、平板玻璃等）营业额排名在该行业5名之后的或《产业结构调整指导目录（2022年修订）》中限制类部分（3分）；\n禁止性行业：《产业结构调整指导目录（2022年修订）》中淘汰类部分（0分）；\n允许类行业：“两高一剩”的产业（钢铁、造纸、电解铝、平板玻璃等）营业额排名行业前5的；除上述3类行业之外（5分）")}
          ${scoreFillCell("industryScore")}
          ${scoreRemarkCell("industryRemark")}
        </tr>
        <tr>
          <td>企业所在区域</td>
          <td>5%</td>
          ${scoreRuleCell("光伏项目优先选择公司战略核心区域（长三角、大湾区）的项目（5分）；\n以及除上述地区以外的全国GDP排名前100的地级市区内的项目（4分）；\n除上述两类区域外，市域范围内已有我司投资项目或距已投项目直线距离50km以内的（3分）；\n其他地区（1分）")}
          ${scoreFillCell("regionScore")}
          ${scoreRemarkCell("regionRemark")}
        </tr>
        <tr class="score-total">
          <td colspan="3">得分</td>
          <td>30%</td>
          ${scoreFillCell("enterpriseBasicTotalScore", "score-total-fill")}
          ${scoreRemarkCell("enterpriseBasicTotalRemark", "score-total-fill")}
        </tr>
        <tr>
          <td class="score-level">企业资信情况</td>
          <td>企业风险等级</td>
          <td>10%</td>
          ${scoreRuleCell("企查查评价为高风险及中高风险的（0分）；\n企查查评价为中风险的（5分）；\n企查查评价为低风险和较低风险的（10分）")}
          ${scoreFillCell("qccRiskScore")}
          ${scoreRemarkCell("qccRiskRemark")}
        </tr>
        <tr class="score-total">
          <td colspan="3">得分</td>
          <td>10%</td>
          ${scoreFillCell("creditTotalScore", "score-total-fill")}
          ${scoreRemarkCell("creditTotalRemark", "score-total-fill")}
        </tr>
      </tbody>
    </table>
    ${renderTemplateFooter()}
  `;
}

function renderOperatingScoreAppendixSlide(page) {
  return `
    ${renderTemplateHeader(page)}
    <table class="ppt-template-score-table is-score-page-two">
      <colgroup>
        <col class="score-col-level" />
        <col class="score-col-metric" />
        <col class="score-col-weight" />
        <col class="score-col-rule" />
        <col class="score-col-value" />
        <col class="score-col-note" />
      </colgroup>
      <tbody>
        <tr>
          <td class="score-level score-level-note" rowspan="4">企业经营能力（数据取三年均值）<br />（注：若企业性质为A类客户无法提供财报的该分数为20分；B类客户或上市辅导期不能提供财报的该分数为15分；其他情况不提供财报的该分数为0分）</td>
          <td>盈利能力</td>
          <td>7%</td>
          ${scoreRuleCell("净利润≤0（0分）；\n0＜净利润≤500万（1分）；\n500＜净利润≤1000万元（3分）；\n1000万元＜净利润≤3000万元（5分）；                         净利润＞3000万元（7分）")}
          ${scoreFillCell("profitabilityScore")}
          ${scoreRemarkCell("profitabilityRemark")}
        </tr>
        <tr>
          <td>负债水平</td>
          <td>5%</td>
          ${scoreRuleCell("资产负债率＞70%（1分）；\n50%＜资产负债率≤70%（3分）；\n资产负债率≤50%（5分）；")}
          ${scoreFillCell("liabilityLevelScore")}
          ${scoreRemarkCell("liabilityLevelRemark")}
        </tr>
        <tr>
          <td>净资产规模</td>
          <td>5%</td>
          ${scoreRuleCell("0＜净资产＜5000万（2分）；                  5000万≤净资产＜1亿（3分）；\n1亿≤净资产＜5亿（4分）；                         净资产≥5亿（5分）")}
          ${scoreFillCell("netAssetScaleScore")}
          ${scoreRemarkCell("netAssetScaleRemark")}
        </tr>
        <tr>
          <td>资产流动性</td>
          <td>8%</td>
          ${scoreRuleCell("0＜流比（流动资产/流动负债）≤1（3分）；                    1＜流比≤2（6分）；\n流比＞2（8分）")}
          ${scoreFillCell("assetLiquidityScore")}
          ${scoreRemarkCell("assetLiquidityRemark")}
        </tr>
        <tr class="score-total">
          <td colspan="3">得分</td>
          <td>25%</td>
          ${scoreFillCell("operationAbilityTotalScore", "score-total-fill")}
          ${scoreRemarkCell("operationAbilityTotalRemark", "score-total-fill")}
        </tr>
        <tr>
          <td class="score-level" rowspan="2">电站合规性</td>
          <td>产证</td>
          <td>6%</td>
          ${scoreRuleCell("需提供产证包括：土地证、房产证或建筑三证一书；\n证件齐全（6分）；\n证件不齐（2分）")}
          ${scoreFillCell("certificateScore")}
          ${scoreRemarkCell("certificateRemark")}
        </tr>
        <tr>
          <td>屋顶年限</td>
          <td>4%</td>
          ${scoreRuleCell("彩钢瓦屋顶建成5年以内（3分）；超过5年（2分）；水泥屋顶（4分）")}
          ${scoreFillCell("roofAgeScore")}
          ${scoreRemarkCell("roofAgeRemark")}
        </tr>
        <tr class="score-total">
          <td colspan="3">得分</td>
          <td>10%</td>
          ${scoreFillCell("complianceTotalScore", "score-total-fill")}
          ${scoreRemarkCell("complianceTotalRemark", "score-total-fill")}
        </tr>
        <tr>
          <td class="score-level" rowspan="3">电站收益情况</td>
          <td>消纳</td>
          <td>10%</td>
          ${scoreRuleCell("一般项目：\n消纳≤50%（0分）；\n50＜消纳＜70%（3分）；                         70%≤消纳＜80%（6分）；                         80%≤消纳＜90%（8分）；\n消纳≥90%（10分）；\n不上网项目：\n消纳≤70%（0分）；\n70%＜消纳＜90%（3分）；\n消纳≥90%（6分）")}
          ${scoreFillCell("consumptionScore")}
          ${scoreRemarkCell("consumptionRemark")}
        </tr>
        <tr>
          <td>收益率</td>
          <td>8%</td>
          ${scoreRuleCell("收益率＜7%（2分）；\n3MW以上项目7%≤收益率＜7.7%，3MW以下项目7%≤收益率＜8.2%（4分）；\n3MW以上项目7.7%≤收益率＜9.2%，3MW以下项目8.2%≤收益率＜9.2%（6分）；\n收益率≥9.2%（8分）")}
          ${scoreFillCell("returnRateScore")}
          ${scoreRemarkCell("returnRateRemark")}
        </tr>
        <tr>
          <td>安全与环保</td>
          <td>7%</td>
          ${scoreRuleCell("三年个自然年内，发生过安全事故，造成人员伤亡和直接经济损失的；三年个自然年内，企业排放污染性物质，受到环保处罚导致停产的；存在一项即得0分，没有得满分")}
          ${scoreFillCell("safetyEnvironmentScore")}
          ${scoreRemarkCell("safetyEnvironmentRemark")}
        </tr>
        <tr class="score-total">
          <td colspan="3">得分</td>
          <td>25%</td>
          ${scoreFillCell("stationRevenueTotalScore", "score-total-fill")}
          ${scoreRemarkCell("stationRevenueTotalRemark", "score-total-fill")}
        </tr>
        <tr class="score-total score-grand-total">
          <td colspan="4">得分合计</td>
          ${scoreFillCell("totalScore", "score-total-fill")}
          <td></td>
        </tr>
      </tbody>
    </table>
    ${renderTemplateFooter()}
  `;
}

function generationCell(year, keySuffix, fallbackKey) {
  if (year === 1 && fallbackKey) return previewText(fallbackKey, fallbackKey);
  return manualPreviewText(`generationYear${year}${keySuffix}`);
}

function renderGenerationForecastRows(start, end) {
  return Array.from({ length: end - start + 1 }, (_, index) => {
    const year = start + index;
    return `
      <tr>
        <td>${year}</td>
        <td>${generationCell(year, "Power", "annualGeneration")}</td>
        <td>${generationCell(year, "Revenue", "annualRevenue")}</td>
      </tr>
    `;
  }).join("");
}

function renderGenerationForecastSlide(page) {
  // TRACE[PPT-SCORE-006]: 发电量表按 PDF 第 23 页左右双表排布，空白年度保留人工/测算模型填充位。
  return `
    ${renderTemplateHeader(page)}
    <div class="ppt-template-generation-grid">
      <table class="ppt-template-generation-table">
        <thead><tr><th>年度</th><th>发电量（万度）</th><th>发电收益（万元）</th></tr></thead>
        <tbody>${renderGenerationForecastRows(1, 13)}</tbody>
      </table>
      <table class="ppt-template-generation-table">
        <thead><tr><th>年度</th><th>发电量（万度）</th><th>发电收益（万元）</th></tr></thead>
        <tbody>
          ${renderGenerationForecastRows(14, 25)}
          <tr class="generation-summary"><td>合计</td><td>${manualPreviewText("generationTotalPower")}</td><td>${manualPreviewText("generationTotalRevenue")}</td></tr>
          <tr class="generation-summary"><td>年均</td><td>${manualPreviewText("generationAveragePower")}</td><td>${manualPreviewText("generationAverageRevenue")}</td></tr>
        </tbody>
      </table>
    </div>
    ${renderTemplateFooter()}
  `;
}

function renderCreditInfoSlide(page) {
  return `
    ${renderTemplateHeader(page)}
    <div class="ppt-credit-asset-layout">
      ${renderProjectAssetGallery("slide24")}
    </div>
    ${renderTemplateFooter()}
  `;
}

function renderFinanceAnalysisSlide(page) {
  const rows = ["2025", "2024", "2023"];
  const metrics = [
    ["总资产", "totalAssets"],
    ["净资产", "netAssets"],
    ["营业收入", "operatingRevenue"],
    ["净利润", "netProfit"],
    ["货币资金", "cashFunds"],
    ["净利率", "netProfitRate"],
    ["ROE", "roe"],
    ["流动比率", "currentRatio"],
    ["速动比率", "quickRatio"],
    ["负债率", "debtRatio"]
  ];
  return `
    ${renderTemplateHeader(page)}
    <table class="ppt-finance-table">
      <thead>
        <tr>
          <th>年份</th>
          ${metrics.map(([label]) => `<th>${escapeHtml(label)}</th>`).join("")}
        </tr>
      </thead>
      <tbody>
        ${rows.map((year) => `
          <tr>
            <td>${year}</td>
            ${metrics.map(([, key]) => `<td>${previewText(`${key}${year}`, `${key}${year}`)}</td>`).join("")}
          </tr>
        `).join("")}
      </tbody>
    </table>
    <div class="ppt-finance-summary">
      ${previewLine("盈利能力分析", "profitabilityAnalysis")}
      ${previewLine("经营效率与现金流状况", "operationCashflowAnalysis")}
      ${previewLine("资产负债情况", "assetDebtAnalysis")}
      ${previewLine("结论", "financeSummary")}
    </div>
    ${renderTemplateFooter()}
  `;
}

function renderUserIntroSlide(page) {
  return `
    ${renderTemplateHeader(page)}
    <div class="ppt-user-intro-layout">
      <section class="intro-block intro-company">
        <h4>01 用电企业简介</h4>
        <p>${previewText("userCompany", "用电企业名称")}</p>
      </section>
      <section class="intro-block intro-capacity">
        <h4>02 产线及产能</h4>
        <p>${previewText("productionCapacity", "产线及产能")}</p>
      </section>
      <section class="intro-block intro-customers">
        <h4>03 主要客户</h4>
        <p>${previewText("majorCustomers", "主要客户")}</p>
      </section>
      <section class="intro-block intro-mode">
        <h4>04 工作模式</h4>
        <p>${previewText("workMode", "工作模式")}</p>
      </section>
      <aside class="ppt-qcc-snapshot">
        <div>实际控制人：<b>${previewText("legalPerson", "法人代表")}</b></div>
        <div class="qcc-tree">
          <span>${previewText("userCompany", "用电企业名称")}</span>
          <span>${previewText("projectCompany", "项目公司名称")}</span>
          <span>${previewText("shareholderRatio", "股东名称及持股比例")}</span>
        </div>
      </aside>
    </div>
    ${renderTemplateFooter()}
  `;
}

function renderCreditRiskSlide(page) {
  return `
    ${renderTemplateHeader(page)}
    <div class="ppt-credit-risk-layout">
      <section class="credit-copy">
        <h4>□ 企业资信与司法风险：</h4>
        <ul>
          <li>工商状态：${previewText("qccRiskLevel", "企业风险等级")}，${previewText("qccRisk", "企业资信与司法风险")}</li>
          <li>司法记录：${previewText("executionRecord", "被执行记录")}，${previewText("equityPledge", "股权质押情况")}，${previewText("movableMortgage", "动产抵押情况")}</li>
          <li>股东背景：${previewText("shareholderRatio", "股东名称及持股比例")}</li>
        </ul>
        <p class="credit-conclusion">结论：${previewText("qccConclusion", "资信结论")}</p>
        <h4>□ 政策合规性风险：</h4>
        <ul>
          <li>${previewText("policyComplianceRisk", "政策合规性风险")}</li>
        </ul>
        <p class="credit-conclusion">结论：${previewText("returnConclusion", "收益率达标结论")}</p>
      </section>
      <aside class="credit-risk-panel">
        <div class="credit-panel-head">准入建议：<b>正常准入</b></div>
        <div class="risk-pyramid">
          <span>高风险</span>
          <i></i><i></i><i></i><strong>低风险</strong>
        </div>
        <p>风险等级：<b>${previewText("qccRiskLevel", "企业风险等级")}</b></p>
      </aside>
    </div>
    ${renderTemplateFooter()}
  `;
}

function renderBasicOverviewSlide(page) {
  return `
    ${renderTemplateHeader(page)}
    <div class="ppt-overview-layout">
      <section class="ppt-overview-card primary">
        <h4>01 项目概要</h4>
        ${previewLine("项目名称", "projectName")}
        ${previewLine("项目编号", "projectCode")}
        ${previewLine("项目自评分", "selfScore")}
        ${previewLine("项目经理", "manager")}
        ${previewLine("项目类型", "projectType")}
        ${previewLine("项目规模（MW）", "capacity")}
        ${previewLine("开发方式", "developMode")}
        ${previewLine("运营年限（年）", "operationYears")}
        ${previewLine("预算总投资（万元）", "investment")}
        ${previewLine("全投资税后IRR", "irr")}
      </section>
      <section class="ppt-overview-card">
        <h4>02 消纳、电价、接入</h4>
        ${previewLine("消纳比例", "consumptionRatio")}
        ${previewLine("脱硫标杆电价", "desulfurPrice")}
        ${previewLine("电价折扣", "priceDiscount")}
        ${previewLine("企业用电电价", "powerPrice")}
        ${previewLine("接入电压等级（kV）", "accessVoltage")}
      </section>
      <section class="ppt-overview-card">
        <h4>03 用电方信息</h4>
        ${previewLine("用电企业名称", "userCompany")}
        ${previewLine("用电企业性质", "userNature")}
        ${previewLine("注册资本金（万元）", "userRegisterCapital")}
        ${previewLine("所处行业", "userIndustry")}
      </section>
      <section class="ppt-overview-card">
        <h4>04 项目公司</h4>
        ${previewLine("项目公司名称", "projectCompany")}
        ${previewLine("注册资本金（万元）", "projectRegisterCapital")}
        ${previewLine("法人代表", "legalPerson")}
        ${previewLine("股东名称及持股比例", "shareholderRatio")}
      </section>
      <section class="ppt-overview-card">
        <h4>05 屋顶情况</h4>
        ${previewLine("产权方名称", "roofOwner")}
        ${previewLine("租赁面积", "roofLeaseArea")}
        ${previewLine("租赁金额", "roofRent")}
      </section>
    </div>
    ${renderTemplateFooter()}
  `;
}

function manualRiskRows() {
  // TRACE[PPT-TEMPLATE-NEW-010]: 风险量表只保留固定表头，正文所有单元格都改为人工填写字段。
  // 这页不能再从合规/商务/收益等系统字段自动拼表，避免预览内容和人工评审口径冲突。
  return Array.from({ length: 6 }, (_, index) => {
    const rowNo = index + 1;
    return `
      <tr>
        <td>${previewText(`riskCategory${rowNo}`, `风险类别${rowNo}`)}</td>
        <td>${previewText(`riskPoint${rowNo}`, `风险点${rowNo}`)}</td>
        <td>${previewText(`riskLevel${rowNo}`, `风险等级${rowNo}`)}</td>
        <td>${previewText(`riskNote${rowNo}`, `说明${rowNo}`)}</td>
      </tr>
    `;
  }).join("");
}

function renderRiskOverviewSlide(page) {
  return `
    ${renderTemplateHeader(page)}
    <div class="ppt-risk-layout">
      <section>
        <h4>项目评分表得分：${previewText("selfScore", "项目评分表得分")}</h4>
        ${previewLine("主要失分点", "scoreLoss")}
        <p class="risk-appendix-note">• 评分表详见附录</p>
      </section>
      <table class="ppt-risk-table">
        <thead><tr><th>风险类别</th><th>风险点</th><th>风险等级</th><th>说明</th></tr></thead>
        <tbody>${manualRiskRows()}</tbody>
      </table>
    </div>
    ${renderTemplateFooter()}
  `;
}

function renderNewTemplateHtmlSlide(page, fields) {
  // TRACE[PPT-TEMPLATE-NEW-009]: 新版预览必须使用 HTML 字段层，确保左侧字段输入后右侧可实时更新。
  // PDF 渲染图只保留为资产和版式参考，不再作为唯一可见内容。
  let body = "";
  if (page.id === "slide01") {
    body = `
      <div class="ppt-template-cover">
        <h3>${previewText("projectName", "项目名称")}<br />分布式光伏项目风控报告</h3>
        <p>${previewText("coverDate", "报告日期")} / ${previewText("businessDept", "编制部门")}</p>
      </div>
    `;
  } else if (page.id === "slide02") {
    body = renderMainDirectorySlide(page);
  } else if (page.id === "slide03") {
    body = renderUserIntroSlide(page);
  } else if (page.id === "slide04") {
    body = renderCreditRiskSlide(page);
  } else if (page.id === "slide05") {
    body = renderSiteSurveySlide(page);
  } else if (page.id === "slide06") {
    body = renderFinanceAnalysisSlide(page);
  } else if (page.id === "slide07") {
    body = renderAcquisitionCreditInstructionSlide(page);
  } else if (page.id === "slide08") {
    body = renderComplianceSlide(page);
  } else if (page.id === "slide09") {
    body = renderBusinessRiskSlide(page);
  } else if (page.id === "slide10") {
    body = renderEmcTermsSlide(page);
  } else if (page.id === "slide11") {
    body = renderSensitivitySlide(page);
  } else if (page.id === "slide12") {
    body = renderPriorProjectSlide(page);
  } else if (page.id === "slide13") {
    body = renderRiskOverviewSlide(page);
  } else if (page.id === "slide14") {
    body = renderApprovalChangeSlide(page);
  } else if (page.id === "slide15") {
    body = renderStatementSlide(page, "advantage", "1. 企业与我司存在合作基础；\n2. 项目优势待人工补充。");
  } else if (page.id === "slide16") {
    body = renderStatementSlide(page, "riskMeasure", "1. 项目风险及措施待人工补充。");
  } else if (page.id === "slide17") {
    body = renderStatementSlide(page, "legalRiskMeasure", "该项目法务风险待合同与资料复核。");
  } else if (page.id === "slide18") {
    body = renderStatementSlide(page, "departmentOpinion", "部门评审意见待人工补充。");
  } else if (page.id === "slide19") {
    body = renderAppendixDirectorySlide(page);
  } else if (page.id === "slide20") {
    body = renderBasicOverviewSlide(page);
  } else if (page.id === "slide21") {
    body = renderManualTemplateOnlySlide(page, "评分表第一页保留 PPTX 模板，下载后由业务方人工维护。");
  } else if (page.id === "slide22") {
    body = renderManualTemplateOnlySlide(page, "评分表第二页保留 PPTX 模板，下载后由业务方人工维护。");
  } else if (page.id === "slide23") {
    body = renderGenerationForecastSlide(page);
  } else if (page.id === "slide24") {
    body = renderCreditInfoSlide(page);
  } else if (page.id === "slide25") {
    body = `
      <div class="ppt-template-thanks">
        <strong>THANKS</strong>
        <p>电话：0512-66609619<br />邮箱：Bm@zoomingne.com<br />地址：苏州工业园区旺墩路158号新能大厦15楼</p>
      </div>
    `;
  } else {
    body = `${renderTemplateHeader(page)}${renderHtmlTemplateGrid(page, fields)}${renderTemplateFooter()}`;
  }

  return `
    <div class="ppt-slide pptx-template-slide ppt-template-html-slide" data-ppt-template-html-slide="${escapeHtml(page.id)}">
      ${body}
    </div>
  `;
}

function renderPptxTemplateSlide(page) {
  // TRACE[PPT-CHAT-011]: 右侧预览统一使用真实 PPTX manifest。
  // 有渲染图时走底图+覆盖层；没有渲染图时才退回元素级渲染。
  const templateSlide = currentPptxTemplateSlide(page);
  if (!templateSlide) return "";
  if (templateSlide.image) return renderPptxImageBackedSlide(page, templateSlide);

  return `
    <div class="ppt-slide pptx-template-slide" data-pptx-template-slide="${escapeHtml(page.id)}">
      ${templateSlide.elements.map(renderPptxTemplateElement).join("")}
    </div>
  `;
}

function renderPptSlide(page, fields) {
  // TRACE[PPT-TEMPLATE-NEW-007]: 粗预览优先显示新版 PPTX 底图字段层；字段修改会实时反映到右侧预览。
  if (page.id === "slide07") return renderNewTemplateHtmlSlide(page, fields);
  if (["slide05", "slide24"].includes(page.id)) {
    // Use the same current-project assets as PPT export, never the template's example photo.
    return renderNewTemplateHtmlSlide(page, fields);
  }
  if (page.id === "slide19") {
    // TRACE[PPT-APPENDIX-001]: 当前渲染底图里的附录目录文字容易丢失，
    // 这里强制使用 HTML 版式复刻源 PPTX 的“目录 / 附录”页，避免右侧预览空白。
    return renderNewTemplateHtmlSlide(page, fields);
  }
  const templateSlide = renderPptxTemplateSlide(page);
  if (templateSlide) return templateSlide;

  if (page.id === "slide01") {
    return `
      <div class="ppt-slide ppt-cover-slide">
        <div class="ppt-cover-label">风险报告</div>
        <h3>${escapeHtml(fieldValue({ key: "projectName", label: "项目名称", method: "OA抓取" }))}</h3>
        <p>分布式光伏项目投资决策复核材料</p>
        <div class="ppt-cover-meta">
          <span>${escapeHtml(fieldValue({ key: "businessDept", label: "编制部门", method: "OA抓取" }))}</span>
          <span>${escapeHtml(fieldValue({ key: "coverDate", label: "报告日期", method: "人工填写" }))}</span>
        </div>
      </div>
    `;
  }

  if (page.id === "slide02") {
    return `
      <div class="ppt-slide ppt-directory-slide">
        <div class="ppt-slide-bars"><span>目录</span><strong>Contents</strong></div>
        <div class="ppt-directory-grid">
          ${pptPages.slice(2, 22).map((item) => `<div><b>${escapeHtml(item.index)}</b><span>${escapeHtml(item.name)}</span></div>`).join("")}
        </div>
      </div>
    `;
  }

  const groups = groupFields(fields);
  const groupEntries = Object.entries(groups);
  const firstGroup = groupEntries[0] || ["本页字段", fields];
  const sideGroups = groupEntries.slice(1, 5);
  const hasSideGroups = sideGroups.length > 0;
  const mainFields = firstGroup[1].slice(0, hasSideGroups ? 12 : 18);

  return `
    <div class="ppt-slide">
      <div class="ppt-slide-bars">
        <span>${escapeHtml(page.name)}</span>
        <strong>${escapeHtml(page.title)}</strong>
      </div>
      <div class="ppt-slide-body ${hasSideGroups ? "" : "single"}">
        <div class="ppt-slide-main">
          <h4>${escapeHtml(firstGroup[0])}</h4>
          ${mainFields.map((field) => `
            <p>
              <b>${escapeHtml(field.label)}：</b>
              <span data-ppt-bind="${escapeHtml(field.key)}">${escapeHtml(fieldValue(field) || "待人工补充")}</span>
            </p>
          `).join("")}
        </div>
        ${hasSideGroups ? `
          <div class="ppt-slide-side">
          ${sideGroups.map(([group, items], index) => `
            <div>
              <span>${String(index + 2).padStart(2, "0")}</span>
              <strong>${escapeHtml(group)}</strong>
              ${items.slice(0, 6).map((field) => `
                <p>
                  <b>${escapeHtml(field.label)}：</b>
                  <span data-ppt-bind="${escapeHtml(field.key)}">${escapeHtml(fieldValue(field) || "待人工补充")}</span>
                </p>
              `).join("")}
            </div>
          `).join("")}
          </div>
        ` : ""}
      </div>
      <div class="ppt-slide-footer"><i></i><i></i><i></i><i></i></div>
    </div>
  `;
}

function renderPptSlideFrame(page, fields) {
  // TRACE[PPT-CHAT-006]: PPT 预览按固定 16:9 画布渲染，再由 viewport 缩放，避免嵌入 chatbot 后被窄容器裁切。
  return `
    <div class="ppt-slide-viewport" data-ppt-slide-viewport>
      <div class="ppt-slide-scale" data-ppt-slide-scale>
        ${renderPptSlide(page, fields)}
      </div>
      <span class="ppt-slide-zoom" data-ppt-slide-zoom>适配预览</span>
    </div>
  `;
}

function refreshPptPreviewSlide(root = document) {
  // TRACE[PPT-TEMPLATE-NEW-007]: 字段编辑后刷新右侧预览窗口。
  // 新版模板用 PPTX 渲染底图 + 字段覆盖层，避免左侧字段更新后右侧仍停留在静态截图。
  const page = currentPptPage();
  const fields = pageFields(page);
  qsa("[data-ppt-slide-scale]", root).forEach((scaleLayer) => {
    scaleLayer.innerHTML = renderPptSlide(page, fields);
  });
  schedulePptSlidePreviewFit(root);
}

function renderPptPreviewZoomControls() {
  // TRACE[PPT-CHAT-006]: 让用户控制 PPT 预览缩放，避免只能被动接受过小的自动适配比例。
  return `
    <div class="ppt-preview-zoom-controls" data-ppt-zoom-controls>
      <button type="button" data-ppt-zoom-mode="fitWidth">适宽</button>
      <button type="button" data-ppt-zoom-mode="fitAll">全页</button>
      <button type="button" data-ppt-zoom-step="-0.1" aria-label="缩小预览">−</button>
      <input
        type="range"
        min="45"
        max="120"
        step="5"
        value="85"
        data-ppt-zoom-slider
        aria-label="PPT 预览缩放"
      />
      <button type="button" data-ppt-zoom-step="0.1" aria-label="放大预览">+</button>
      <b data-ppt-zoom-value>85%</b>
    </div>
  `;
}

function clampPptPreviewZoom(value) {
  if (!Number.isFinite(value)) return 0.85;
  return Math.min(1.2, Math.max(0.45, value));
}

function syncPptPreviewZoomControls(root, resolvedScale) {
  // TRACE[PPT-CHAT-006]: 缩放控件显示当前真实比例，并标记当前模式，便于用户知道自己处在哪种视图。
  const mode = demoState.pptPreviewZoomMode || "fitWidth";
  qsa("[data-ppt-zoom-controls]", root).forEach((controls) => {
    qsa("[data-ppt-zoom-mode]", controls).forEach((button) => {
      button.classList.toggle("active", button.dataset.pptZoomMode === mode);
    });

    const slider = qs("[data-ppt-zoom-slider]", controls);
    const value = qs("[data-ppt-zoom-value]", controls);
    const percent = Math.round(resolvedScale * 100);

    if (slider) slider.value = String(percent);
    if (value) value.textContent = `${percent}%`;
  });
}

function fitPptSlidePreviews(root = document) {
  // TRACE[PPT-CHAT-006]: 根据用户选择和面板尺寸计算缩放；默认适宽，用户可切全页或自定义。
  const baseWidth = 920;
  const baseHeight = 518;
  const previewPadding = 20;

  qsa("[data-ppt-slide-viewport]", root).forEach((viewport) => {
    const panel = viewport.closest(".ppt-preview-panel");
    const availableWidth = Math.max(280, (viewport.clientWidth || baseWidth) - previewPadding);
    const viewportHeight = Math.max(260, (viewport.clientHeight || baseHeight) - previewPadding);
    const fitWidthScale = Math.min(1, availableWidth / baseWidth);
    const fitAllScale = Math.min(1, availableWidth / baseWidth, viewportHeight / baseHeight);
    const mode = demoState.pptPreviewZoomMode || "fitWidth";
    const scale =
      mode === "fitAll"
        ? fitAllScale
        : mode === "custom"
          ? clampPptPreviewZoom(Number(demoState.pptPreviewZoom))
          : fitWidthScale;
    const normalizedScale = Number(scale.toFixed(3));
    const displayWidth = Math.ceil(baseWidth * normalizedScale);
    const displayHeight = Math.ceil(baseHeight * normalizedScale);
    const scaleLayer = qs("[data-ppt-slide-scale]", viewport);
    const zoom = qs("[data-ppt-slide-zoom]", viewport);

    viewport.style.setProperty("--ppt-preview-scale", String(normalizedScale));
    demoState.pptPreviewResolvedZoom = normalizedScale;

    if (scaleLayer) {
      scaleLayer.style.width = `${displayWidth + previewPadding}px`;
      scaleLayer.style.height = `${displayHeight + previewPadding}px`;
    }

    if (zoom) {
      zoom.textContent =
        mode === "fitAll"
          ? `全页 ${Math.round(normalizedScale * 100)}%`
          : mode === "fitWidth"
            ? `适宽 ${Math.round(normalizedScale * 100)}%`
            : `自定义 ${Math.round(normalizedScale * 100)}%`;
    }

    syncPptPreviewZoomControls(panel || root, normalizedScale);
  });
}

function schedulePptSlidePreviewFit(root = document) {
  // TRACE[PPT-CHAT-006]: PPT 预览初次插入 DOM 时，grid/iframe 宽度可能下一帧才稳定；连续重算保证按真实窗口适宽。
  fitPptSlidePreviews(root);
  if (typeof requestAnimationFrame !== "function") return;

  requestAnimationFrame(() => {
    fitPptSlidePreviews(root);
    requestAnimationFrame(() => fitPptSlidePreviews(root));
  });
}

function observePptSlidePreviewSize(root = document) {
  // TRACE[PPT-CHAT-006]: 只观察 PPT 预览窗口本身，窗口变宽/变窄时重算 slide 缩放，不影响外部 chatbot 页面。
  if (typeof ResizeObserver !== "function") return;

  if (!pptPreviewResizeObserver) {
    pptPreviewResizeObserver = new ResizeObserver((entries) => {
      entries.forEach((entry) => {
        const scope = entry.target.closest(".ppt-preview-panel") || entry.target;
        schedulePptSlidePreviewFit(scope);
      });
    });
  }

  qsa("[data-ppt-slide-viewport]", root).forEach((viewport) => {
    if (pptPreviewResizeTargets.has(viewport)) return;
    pptPreviewResizeTargets.add(viewport);
    pptPreviewResizeObserver.observe(viewport);
  });
}

function renderCompletionModule() {
  const stats = pptCompletionStats();
  return `
    <section class="ppt-completion-module" data-completion-percent="${stats.fieldPercent}">
      <div class="ppt-completion-donut" style="--done: 0;" aria-label="完成度 ${stats.fieldPercent}%">
        <strong data-completion-value>0%</strong>
      </div>
      <div class="ppt-completion-list">
        <div>
          <span>完成度</span>
          <strong>${stats.confirmedPages}/${stats.totalPages} 页</strong>
        </div>
      </div>
    </section>
  `;
}

function renderSentinelModule(fields) {
  const allFields = allPptFieldItems();
  const allIssues = fieldIssueItems(allFields);
  const visibleIssues = allIssues.slice(0, 3);
  const issuePageCount = new Set(allIssues.map((item) => item.pageId)).size;
  return `
    <section class="sentinel-module" data-sentinel-module>
      <div class="sentinel-head">
        <div>
          <span>哨兵：字段监控系统</span>
          <strong>空缺字段诊断</strong>
        </div>
        <b>${allIssues.length} 项</b>
      </div>
      <div class="sentinel-checks">
        <div>
          <span>空缺字段</span>
          <strong>${allIssues.length}</strong>
        </div>
        <div>
          <span>涉及页数</span>
          <strong>${issuePageCount}</strong>
        </div>
      </div>
      <div class="sentinel-issues">
        ${visibleIssues.length
          ? visibleIssues.map((item) => `
              <article>
                <b>第 ${escapeHtml(item.pageIndex)} 页 · ${escapeHtml(item.pageName)}</b>
                <span>空缺字段：${escapeHtml(item.label)}</span>
                <em>${escapeHtml(item.issueReason)}</em>
              </article>
            `).join("")
          : `<article class="ok">
              <b>未发现空缺字段</b>
              <span>暂无需要补充的字段</span>
              <em>可以进入最终报告生成。</em>
            </article>`}
      </div>
    </section>
  `;
}

function refreshSentinelModule() {
  const sentinel = qs("[data-sentinel-module]");
  if (!sentinel) return;
  sentinel.outerHTML = renderSentinelModule(pageFields(currentPptPage()));
  schedulePptSlidePreviewFit();
}

function animateCompletionModules(root = document) {
  const modules = qsa(".ppt-completion-module", root);
  if (!modules.length) return;

  const reduceMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
  const target = Number(modules[0].dataset.completionPercent || 0);
  const startValue = Number.isFinite(demoState.displayedCompletionPercent)
    ? demoState.displayedCompletionPercent
    : 0;

  if (demoState.completionAnimationFrame) {
    cancelAnimationFrame(demoState.completionAnimationFrame);
  }

  const setProgress = (value) => {
    const displayValue = Math.round(value);
    modules.forEach((module) => {
      const donut = qs(".ppt-completion-donut", module);
      const number = qs("[data-completion-value]", module);
      donut?.style.setProperty("--done", value.toFixed(2));
      if (number) number.textContent = `${displayValue}%`;
    });
    demoState.displayedCompletionPercent = value;
  };

  if (reduceMotion) {
    setProgress(target);
    return;
  }

  const duration = 820;
  const startTime = performance.now();
  const easeOut = (value) => 1 - Math.pow(1 - value, 3);

  const tick = (now) => {
    const progress = Math.min((now - startTime) / duration, 1);
    const eased = easeOut(progress);
    const current = startValue + (target - startValue) * eased;
    setProgress(current);

    if (progress < 1) {
      demoState.completionAnimationFrame = requestAnimationFrame(tick);
      return;
    }

    setProgress(target);
    demoState.completionAnimationFrame = null;
  };

  demoState.completionAnimationFrame = requestAnimationFrame(tick);
}

function pptPageFileTip(pageId) {
  const tips = {
    slide04: "准入图随企业信息带入；立项报告中的工商资信、执行查询截图在第24页预览。",
    slide05: "产权方名称通过产权文件补充；屋顶或厂区图片从当前立项报告提取，预览与导出使用同一批图片。",
    slide06: "请先在下方上传财务报告，核对并确认所属年度及字段。缺失项可点击“企查查导入”补充；只补空白，不覆盖财报或人工填写值。当前企查查使用样例数据。",
    slide09: "亏损判断需上传财务报告；财务及用电资料是否盖章须人工核验。",
    slide10: "下方EMC文件解析区生成10项合同条款及总结；对收益率的影响仅在本页人工填写，AI不会生成或覆盖。",
    slide12: "项目总结请在下方“后评价报告”上传，并填写对应前序项目编号。",
    slide20: "用电企业注册资本上传立项报告补充；产权方名称上传产权文件补充。",
    slide24: "从当前立项报告提取工商资信、执行查询截图，并标明来源页码；预览与导出使用同一批图片。",
  };
  return tips[pageId] || "";
}

function renderPptReview() {
  const page = currentPptPage();
  if (["slide05", "slide24"].includes(page.id)) void loadProjectAssetPreview();
  const fields = pageFields(page);
  const pageIndex = pptPages.findIndex((item) => item.id === page.id);
  const methodCounts = countMethods(fields);
  const isLastPage = pageIndex === pptPages.length - 1;
  const financialKeys = fields.map(field => field.key).filter(key => enterpriseFinancialKey(key) && !isMissingFieldValue(demoState[key]));
  const fileCount = financialKeys.filter(key => aiTrustedDocumentFieldKeys.has(key)).length;
  const interfaceCount = financialKeys.filter(key => !aiTrustedDocumentFieldKeys.has(key) && enterpriseSyncedFieldKeys.has(key) && demoState[key] === enterpriseLastAppliedValues.get(key)).length;
  return `
    <div class="ppt-review">
      <div class="ppt-review-toolbar">
        <div>
          <span>AI 初稿 · PPT逐页核对</span>
          <strong>${escapeHtml(page.title)}</strong>
          <small>依据新版 PPTX 模板做右侧粗预览，左侧字段为最终生成来源；后端 PPTX 模板需保持同版。</small>
        </div>
        <div class="ppt-nav">
          <button type="button" data-ppt-nav="prev">‹</button>
          <b>第 ${String(pageIndex + 1).padStart(2, "0")} / ${pptPages.length} 页</b>
          <button type="button" data-ppt-nav="next">›</button>
        </div>
      </div>
      <div class="ppt-page-tabs">${renderPageRail(page)}</div>
      <div class="ppt-review-grid">
        <section class="ppt-edit-panel${page.id === 'slide07' ? ' ppt-acquisition-edit-panel' : page.id === 'slide06' ? ' ppt-finance-edit-panel' : ''}">
          <div class="ppt-panel-title">
            <span>抓取内容核对</span>
            <strong>${escapeHtml(page.name)}</strong>
            <small>
              本页核对项 ${fields.length} 项：
              <i>OA ${methodCounts.oa || 0}</i>
              <i>PM ${methodCounts.pm || 0}</i>
              <i>人工 ${methodCounts.manual || 0}</i>
              <i>企查查 ${methodCounts.qcc || 0}</i>
              <i>鑫浦AI ${methodCounts.ai || 0}</i>
            </small>
          </div>
          ${page.id === "slide12" ? renderPriorProjectGate() : ""}
          ${pptPageFileTip(page.id) ? `<p class="ppt-page-file-tip">${escapeHtml(pptPageFileTip(page.id))}</p>` : ""}
          ${["slide05", "slide24"].includes(page.id) ? `<button type="button" class="ppt-report-ai-button" data-project-assets-refresh ${projectAssetPreview.status === "loading" ? "disabled" : ""}>${projectAssetPreview.status === "loading" ? "正在读取图片…" : "刷新立项报告图片"}</button>` : ""}
          ${page.id === "slide06" ? `<button type="button" class="ppt-report-ai-button" data-financial-import ${enterpriseLoadStatus === "loading" ? "disabled" : ""}>${enterpriseLoadStatus === "loading" ? "企业信息查询中…" : "企查查导入（仅补空白）"}</button>${financialImportMessage ? `<p class="ppt-page-file-tip" role="status">${escapeHtml(financialImportMessage)}</p>` : ""}` : ""}
          ${['slide04','slide06','slide10'].includes(page.id) ? `<button type="button" class="ppt-report-ai-button" data-report-ai-kind="${({slide04:'CREDIT',slide06:'FINANCE',slide10:'EMC'})[page.id]}">${page.id === 'slide10' ? 'AI整理合同摘录' : 'AI生成分析'}</button>` : ''}
          ${page.id === 'slide07' ? `<div class="ppt-acquisition-actions"><p>${demoState.debtAcquisitionStatus === '是' ? '第1项由人工填写；第2、3项根据已有调查字段生成，生成后可修改。' : '选择“是”后填写三项调查内容。'}</p>${demoState.debtAcquisitionStatus === '是' ? `<button type="button" class="ppt-report-ai-button" data-report-ai-kind="ACQUISITION" ${reportAiDraftRequests.has(String(demoState.projectCode || '').trim() + ':ACQUISITION') ? 'disabled' : ''}>${reportAiDraftRequests.has(String(demoState.projectCode || '').trim() + ':ACQUISITION') ? 'AI总结中…' : 'AI总结第2、3项'}</button>` : ''}</div>` : ''}
          ${renderPptDocumentUploadCard()}
          <fieldset class="ppt-field-list ppt-fieldset" ${page.id === "slide12" && (currentPriorGridSession().status !== "has" || currentPriorGridSession().busy) ? "disabled" : ""}>
            ${fields.map(pptFieldControl).join("")}
          </fieldset>
          <button class="ppt-confirm" type="button">
            ${isLastPage ? "完成核对" : "下一页"}
          </button>
        </section>
        <section class="ppt-preview-panel">
          <div class="ppt-preview-head">
            <div class="ppt-preview-title">预览 · ${escapeHtml(page.index)} ${escapeHtml(page.name)}
              ${page.id === "slide06" ? `<small class="ppt-financial-sources">文件解析 ${fileCount} 项 · 接口补充 ${interfaceCount} 项${interfaceCount && enterpriseIsMock ? "（样例）" : ""}</small>` : ""}
            </div>
            ${renderPptPreviewZoomControls()}
            ${renderCompletionModule()}
          </div>
          ${renderPptSlideFrame(page, fields)}
          <div class="ppt-preview-monitor">
            ${renderSentinelModule(fields)}
          </div>
        </section>
      </div>
    </div>
  `;
}

function cleanPptDownloadName(fileName) {
  const name = String(fileName || '投前报告.pptx').split(/[\\/]/).pop();
  return name.replace(/_(?:端到端测试稿|风控报告)_\d{14}_[a-z0-9-]+(?=\.pptx$)/i, '');
}

async function downloadGeneratedPpt(href, fileName, cachedBlob) {
  const url = new URL(href, window.location.href);
  const backend = new URL(graphqlEndpoint(), window.location.href);
  if (url.origin !== backend.origin || !/^\/outputs\/ppt-report\/[^/]+\.pptx$/.test(url.pathname)) {
    throw new Error("报告下载地址无效，请重新生成。");
  }
  let blob = cachedBlob;
  if (!blob) {
    const response = await (globalThis.__PPT_REPORT_FETCH || fetch)(url.href, {headers:embedAuthHeaders()});
    if (response.status === 401) throw new Error("登录已过期，请重新登录后下载。");
    if (!response.ok) throw new Error(`报告下载失败（${response.status}），请重试。`);
    blob = await response.blob();
  }
  if (await blob.slice(0, 2).text() !== "PK") throw new Error("下载内容不是有效的PPT文件，请重新生成。");
  const objectUrl = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = objectUrl;
  link.download = cleanPptDownloadName(fileName);
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(objectUrl), 60000);
  return blob;
}

function renderOutput(target, source = "文档生成流程", generatedFile = null) {
  const label = currentDocLabel();
  const sampleFile =
    generatedFile ||
    (demoState.docType === "ppt"
      ? {
          href: "./files/分布式光伏风控报告_苏州欧莱_样例.pptx",
          text: "下载/打开样例PPT",
          note: "当前未连接后端或后端生成失败，先展示静态样例文件。"
        }
      : {
          href: "#",
          text: "下载文件",
          note: "Excel 样例下载稍后接入。"
        });
  const fileLinkAttrs =
    demoState.docType === "ppt"
      ? `href="${escapeHtml(sampleFile.href)}"${generatedFile ? ` data-generated-ppt-download` : ` target="_blank" rel="noopener" download`}`
      : `href="#" onclick="return false;" aria-disabled="true"`;
  const fileLinkClass = demoState.docType === "ppt" ? "file-link" : "file-link is-disabled";

  const summaryCurrent = hasCurrentDeepSeekAiDraft();
  const rawSummaryScore = summaryCurrent ? String(demoState.summaryScore || "").trim() : "待更新";
  const parsedSummaryScore = Number(rawSummaryScore);
  const hasSummaryScore = rawSummaryScore !== "" && Number.isFinite(parsedSummaryScore);
  const summaryScore = hasSummaryScore
    ? Math.max(0, Math.min(100, Math.round(parsedSummaryScore)))
    : 0;
  const summaryScoreLabel = hasSummaryScore ? String(summaryScore) : rawSummaryScore || "待生成";

  const decisionSummary =
    (summaryCurrent ? demoState.decisionSummary : "预览内容已变化，请重新生成本轮分析。") ||
    "待 鑫浦大模型 生成本项目决策摘要。";

  const riskHighlights =
    (summaryCurrent ? demoState.riskHighlights : "预览内容已变化，请重新生成本轮分析。") ||
    "待 鑫浦大模型 生成本项目主要风险。";

  const aiRecommendation =
    (summaryCurrent ? demoState.aiRecommendation : "预览内容已变化，请重新生成本轮分析。") ||
    "待 鑫浦大模型 生成本项目后续建议。";

  target.innerHTML = `
    <div class="output-item">
      <div>
        <strong>${escapeHtml(label.file)}</strong>
        <span>${escapeHtml(source)}已完成，${escapeHtml(label.summary)}${escapeHtml(sampleFile.note)}</span>
      </div>
      <a class="${fileLinkClass}" ${fileLinkAttrs}>${escapeHtml(sampleFile.text)}</a>
    </div>

    <section class="ai-summary-module">
      <div class="summary-head">
        <div>
          <span>鑫浦AI 总结</span>
          <h3>项目辅助决策分析</h3>
        </div>
        <small>鑫浦大模型</small>
      </div>

      <div class="summary-grid">
        <div class="summary-card center">
          <div class="summary-donut" style="--score: ${summaryScore};">
            <strong>${escapeHtml(summaryScoreLabel)}</strong>
            <span>综合评估</span>
          </div>
        </div>

        <div class="summary-card">
          <strong>决策摘要</strong>
          <p>${escapeHtml(decisionSummary)}</p>
        </div>

        <div class="summary-card">
          <strong>主要风险</strong>
          <p>${escapeHtml(riskHighlights)}</p>
        </div>

        <div class="summary-card wide">
          <strong>后续建议</strong>
          <p>${escapeHtml(aiRecommendation)}</p>
        </div>
      </div>
    </section>
  `;
  const download = target.querySelector("[data-generated-ppt-download]");
  let cachedPptBlob;
  if (download) download.addEventListener("click", async event => {
    event.preventDefault();
    if (download.dataset.downloading) return;
    download.dataset.downloading = "true";
    download.textContent = "正在下载…";
    try {
      cachedPptBlob = await downloadGeneratedPpt(sampleFile.href, sampleFile.fileName, cachedPptBlob);
      download.textContent = "再次保存测试PPT";
      download.title = "文件已获取，浏览器已开始保存。";
    } catch (error) {
      download.textContent = "重试下载";
      download.title = error.message || "下载失败，请重试。";
      let status = target.querySelector("[data-ppt-download-status]");
      if (!status) {
        status = document.createElement("p");
        status.dataset.pptDownloadStatus = "true";
        status.setAttribute("role", "status");
        download.after(status);
      }
      status.textContent = download.title;
    } finally {
      delete download.dataset.downloading;
    }
  });
}

function thinkingMarkup(title, steps) {
  return `
    <div class="thinking-card">
      <div class="thinking-head">
        <span class="thinking-dot"></span>
        <strong>${escapeHtml(title)}</strong>
      </div>
      <div class="thinking-steps">
        ${steps.map((step) => `<span>${escapeHtml(step)}</span>`).join("")}
      </div>
    </div>
  `;
}

function showInlineThinking(button, title, steps, done) {
  if (button.disabled) return;
  button.disabled = true;
  const actions = button.closest(".actions") || button.parentElement;
  const oldThinking = actions.parentElement?.querySelector(".thinking-card");
  if (oldThinking) oldThinking.remove();
  actions.insertAdjacentHTML("afterend", thinkingMarkup(title, steps));
  const thinking = actions.nextElementSibling;
  setTimeout(async () => {
    try {
      await done();
    } finally {
      thinking?.remove();
      button.disabled = false;
    }
  }, THINKING_DELAY_MS);
}

function showTargetThinking(target, title, steps, done) {
  target.innerHTML = thinkingMarkup(title, steps);
  setTimeout(async () => {
    try {
      await done();
    } catch (error) {
      target.innerHTML = `
        <div class="output-item">
          <div>
            <strong>生成失败</strong>
            <span>${escapeHtml(error.message || String(error))}</span>
          </div>
        </div>
      `;
    }
  }, THINKING_DELAY_MS);
}

function setupDocButtons(root = document) {
  qsa("[data-doc-mode]", root).forEach((button) => {
    if (button.dataset.boundDocMode) return;
    button.dataset.boundDocMode = "true";
    button.addEventListener("click", () => updateDocMode(button.dataset.docMode));
  });
  updateDocMode(demoState.docType);
}

function updateProjectAutofill(container = document) {
  const fields = {
    projectCode: demoState.projectCode,
    address: demoState.address,
    roofArea: demoState.roofArea,
    capacity: demoState.capacity || "-"
  };

  Object.entries(fields).forEach(([key, value]) => {
    qsa(`[data-field='${key}']`, container).forEach((input) => {
      input.value = value;
    });
  });
}

function refreshProjectTemplate(control) {
  const template = control.closest("[data-input-template]");
  if (template) {
    renderInputTemplate(template);
    setupProjectSelects(template);
    setupDraftButtons(template);
    updateProjectAutofill(template);
  } else {
    updateProjectAutofill(document);
  }

  const draftBlock = qs("[data-after-draft]");
  if (draftBlock && !draftBlock.classList.contains("is-hidden")) {
    renderDraftPanels();
  }
}

function setupProjectSearchResultButtons(root = document) {
  qsa("[data-project-search-option]", root).forEach((button) => {
    if (button.dataset.boundProjectSearchOption) return;
    button.dataset.boundProjectSearchOption = "true";
    button.addEventListener("click", () => {
      const projectId = button.dataset.projectSearchOption;
      const project = PROJECT_OPTIONS.find((item) => item.id === projectId || item.projectCode === projectId);
      // TRACE[PPT-FE-OA-SEARCH-006]: 选中结果后，搜索框要展示完整项目名；结果列表收起，避免“仍停留在搜索词”的 UX 误导。
      demoState.projectSearchKeyword = project?.name || "";
      ++projectSearchRequestSeq;
      if (projectSearchTimer) window.clearTimeout(projectSearchTimer);
      demoState.projectSearchResultsVisible = false;
      renderProjectSearchResultsInto();
      void handleProjectSelectionChange(projectId);
    });
  });
}

function setupProjectSelects(root = document) {
  qsa("[data-project-search]", root).forEach((input) => {
    if (input.dataset.boundProjectSearch) return;
    input.dataset.boundProjectSearch = "true";
    const open = () => {
      if (demoState.projectSearchResultsVisible && demoState.oaProjectListLoadStatus !== "error") return;
      if (projectSearchTimer) window.clearTimeout(projectSearchTimer);
      void runProjectKeywordSearch(input.value.trim());
    };
    input.addEventListener("focus", open);
    input.addEventListener("click", open);
    input.addEventListener("keydown", event => {
      if (event.key !== "Escape") return;
      ++projectSearchRequestSeq;
      if (projectSearchTimer) window.clearTimeout(projectSearchTimer);
      demoState.projectSearchResultsVisible = false;
      renderProjectSearchResultsInto();
    });
    input.addEventListener("input", () => {
      const keyword = input.value.trim();
      demoState.projectSearchKeyword = keyword;
      ++projectSearchRequestSeq;
      demoState.projectSearchResultsVisible = true;
      demoState.oaProjectListLoadStatus = "loading";
      renderProjectSearchResultsInto();
      if (projectSearchTimer) window.clearTimeout(projectSearchTimer);
      projectSearchTimer = window.setTimeout(() => {
        void runProjectKeywordSearch(keyword);
      }, 260);
    });
  });

  if (!window.__projectSearchOutsideBound) {
    window.__projectSearchOutsideBound = true;
    document.addEventListener("pointerdown", event => {
      if (event.target.closest(".project-select-card") || !demoState.projectSearchResultsVisible) return;
      ++projectSearchRequestSeq;
      if (projectSearchTimer) window.clearTimeout(projectSearchTimer);
      demoState.projectSearchResultsVisible = false;
      renderProjectSearchResultsInto();
    });
  }

  setupProjectSearchResultButtons(root);

  qsa("[data-project-native-select]", root).forEach((select) => {
    if (select.dataset.boundNativeProjectSelect) return;
    select.dataset.boundNativeProjectSelect = "true";
    select.addEventListener("change", () => {
      void handleProjectSelectionChange(select.value);
    });
  });

  qsa("[data-project-picker]", root).forEach((picker) => {
    if (picker.dataset.boundProjectPicker) return;
    picker.dataset.boundProjectPicker = "true";
    const toggleButton = qs("[data-project-picker-button]", picker);

    toggleButton?.addEventListener("click", (event) => {
      event.stopPropagation();
      qsa("[data-project-picker].is-open").forEach((openPicker) => {
        if (openPicker === picker) return;
        openPicker.classList.remove("is-open");
        qs("[data-project-picker-button]", openPicker)?.setAttribute("aria-expanded", "false");
      });

      const isOpen = picker.classList.toggle("is-open");
      toggleButton.setAttribute("aria-expanded", String(isOpen));
    });

    qsa("[data-project-option]", picker).forEach((option) => {
      option.addEventListener("click", (event) => {
        event.stopPropagation();
        void handleProjectSelectionChange(option.dataset.projectOption);
      });
    });
  });

  if (!document.body.dataset.boundProjectPickerClose) {
    document.body.dataset.boundProjectPickerClose = "true";
    document.addEventListener("click", (event) => {
      if (event.target.closest("[data-project-picker]")) return;
      qsa("[data-project-picker].is-open").forEach((picker) => {
        picker.classList.remove("is-open");
        qs("[data-project-picker-button]", picker)?.setAttribute("aria-expanded", "false");
      });
    });
  }
}

function setupDraftButtons(root = document) {
  qsa("[data-ai-draft]", root).forEach((button) => {
    if (button.dataset.boundAiDraft) return;
    button.dataset.boundAiDraft = "true";
    button.addEventListener("click", () => {
      readForm(button.closest("main") || document);
      showInlineThinking(button, "智能体思维流", ["同步 OA 标准字段", "读取输入模板", "匹配文档字段", "正在推理生成 鑫浦AI总结 字段"], async () => {
        await ensureCurrentOaPptProjectLoaded({ refresh: false });
        await applyAiDraft();
        refreshProjectTemplates();
        renderDraftPanels();
        qsa("[data-after-draft]").forEach((node) => node.classList.remove("is-hidden"));
      });
    });
  });
}

function setupGenerateButtons(root = document) {
  qsa("[data-final-generate]", root).forEach((button) => {
    if (button.dataset.boundGenerate) return;
    button.dataset.boundGenerate = "true";
    button.addEventListener("click", () => {
      readForm(button.closest("main") || document);
      const target = qs(button.dataset.finalGenerate);
      if (!target) return;
      showTargetThinking(target, "智能体思维流", ["同步本项目 OA 字段", "生成本项目 鑫浦大模型总结", "写入风控报告模板"], async () => {
        await ensureCurrentOaPptProjectLoaded({ refresh: false });
        // Analyze the exact current preview; do not regenerate or confirm page fields.
        if (demoState.oaProjectLoadSource?.provider === 'oa-pg+pm-mysql-live') {
          clearTimeout(businessRiskTimer);
          await refreshBusinessRiskEvaluation();
        }
        await generateCurrentPreviewSummary();
        refreshProjectTemplates();
        renderDraftPanels();
        qsa("[data-after-draft]").forEach((node) => node.classList.remove("is-hidden"));

        return requestPptGeneration().then((generatedFile) => {
          renderOutput(target, button.dataset.source || "文档生成流程", generatedFile);
          if (generatedFile?.href) {
            // TRACE[PPT-IFR-005]: PPT 生成成功后，把下载信息回传给外部大模型窗口。
            postEmbedMessage("PPT_REPORT_GENERATED", {
              downloadUrl: generatedFile.href,
              fileName: generatedFile.fileName || generatedFile.text || "风控报告.pptx"
            });
          } else {
            // TRACE[PPT-IFR-005]: PPT 生成失败时也显式通知父窗口，便于客户系统记录失败状态。
            postEmbedMessage("PPT_REPORT_ERROR", {
              message: "后端未返回真实 PPT 下载地址，页面已展示静态样例。"
            });
          }
        });
      });
    });
  });
}

const reportAiDraftRequests = new Map();
const acquisitionSummaryKeys = ['acquisitionLitigationAnalysis', 'acquisitionPledgeAnalysis'];
function acquisitionDraftInput() {
  return { debtAcquisitionStatus: String(demoState.debtAcquisitionStatus || '').trim(), ...pickTrustedFields(['projectCompanyLitigation', 'pledgeFreezeStatus', 'equityPledge', 'executionRecord', 'noDishonestExecution']) };
}
const creditDraftSourceKeys = [
  'userCompany', 'projectCompany', 'shareholderRatio', 'legalPerson', 'userIndustry',
  'userNature', 'address', 'city', 'capacity', 'irr', 'consumptionRatio', 'gridMode',
  'productionCapacity', 'majorCustomers', 'workMode', 'userPaidUpCapital',
  'equityPledge', 'executionRecord', 'movableMortgage', 'noDishonestExecution',
  'businessStatus', 'operationAbnormal', 'seriousIllegal', 'manualRiskDecisionsJson'
];
function reportDraftInput(kind) {
  if (kind === 'ACQUISITION') return acquisitionDraftInput();
  if (kind === 'CREDIT') return pickTrustedFields(creditDraftSourceKeys);
  return {};
}
const emcTemplateFieldKeys = ["tariffTerm", "priceChangeTerm", "roofRentTerm", "consumptionTerm", "waterproofTerm", "constructionDeadline", "delayPenalty", "carbonAssetTerm", "dismantlingTerm", "gridPriceShareTerm"];
function reportDraftOutputKeys(kind) {
  if (kind === 'EMC') return emcTemplateFieldKeys;
  if (kind === 'ACQUISITION') return acquisitionSummaryKeys;
  if (kind === 'CREDIT') return ['creditRiskConclusion', 'shareholderBackground', 'policyComplianceRisk'];
  return [];
}
function setAcquisitionStatus(value) {
  demoState.debtAcquisitionStatus = value;
  userEditedPptFieldKeys.add('debtAcquisitionStatus');
  if (value !== '是') reportAiDraftRequests.delete(String(demoState.projectCode || '').trim() + ':ACQUISITION');
  renderDraftPanels();
}

async function generateReportAiDraft(button) {
  const projectCode = String(demoState.projectCode || "").trim();
  const kind = button.dataset.reportAiKind;
  if (!projectCode || (kind === 'ACQUISITION' && demoState.debtAcquisitionStatus !== '是')) return;
  const requestKey = projectCode + ':' + kind;
  if (reportAiDraftRequests.has(requestKey)) return;
  const outputKeys = reportDraftOutputKeys(kind);
  const request = { input: JSON.stringify(reportDraftInput(kind)), outputs: Object.fromEntries(outputKeys.map(key => [key, demoState[key]])) };
  reportAiDraftRequests.set(requestKey, request);
  button.disabled = true;
  button.textContent = "AI生成中…";
  try {
    const endpoint = new URL(graphqlEndpoint(), window.location.href);
    const url = new URL(`/api/projects/${encodeURIComponent(projectCode)}/ppt-report/ai-draft`, endpoint);
    const response = await (globalThis.__PPT_REPORT_FETCH || fetch)(url, { method: "POST", headers: { ...embedAuthHeaders(), "Content-Type": "application/json" }, body: JSON.stringify({kind, ...(['CREDIT', 'ACQUISITION'].includes(kind) ? {fields: reportDraftInput(kind)} : {})}) });
    const envelope = await response.json();
    const result = envelope.data || envelope;
    if (!response.ok || result.projectCode !== projectCode || !result.fields) throw new Error(envelope.errorMessage || "AI生成失败，请重试");
    if (demoState.projectCode !== projectCode || reportAiDraftRequests.get(requestKey) !== request) return;
    if (kind === 'ACQUISITION' && demoState.debtAcquisitionStatus !== '是') return;
    if (outputKeys.length && request.input !== JSON.stringify(reportDraftInput(kind))) throw new Error('分析依据已变化，请重新生成。');
    if (outputKeys.length) {
      result.fields = Object.fromEntries(Object.entries(result.fields).filter(([key, value]) => outputKeys.includes(key) && typeof value === 'string' && demoState[key] === request.outputs[key]));
    }
    Object.entries(result.fields).forEach(([key,value]) => { demoState[key] = value; aiGeneratedPptFieldKeys.add(key); });
    demoState.reportAiDraftFieldKeysJson = JSON.stringify([...new Set([...JSON.parse(demoState.reportAiDraftFieldKeysJson || "[]"), ...Object.keys(result.fields)])]);
    const sources = JSON.parse(demoState.reportAiDraftProvenanceJson || "{}");
    sources[kind] = { provider: result.provider, model: result.model, inputHash: result.inputHash, reviewStatus: "PENDING" };
    demoState.reportAiDraftProvenanceJson = JSON.stringify(sources);
    reportAiDraftRequests.delete(requestKey);
    renderDraftPanels();
  } catch (error) { button.textContent = error.message || "AI生成失败，请重试"; }
  finally {
    if (reportAiDraftRequests.get(requestKey) === request) reportAiDraftRequests.delete(requestKey);
    button.disabled = false;
  }
}

function setupPptReviewEvents() {
  if (document.body.dataset.boundPptReview) return;
  document.body.dataset.boundPptReview = "true";
  document.addEventListener("click", handlePriorGridClick);
  document.addEventListener("change", handlePriorGridChange);
  document.addEventListener("input", event => { if (event.target.matches?.("[data-prior-grid-keyword]")) currentPriorGridSession().keyword = event.target.value; });
  document.addEventListener("click", event => {
    if (event.target.closest?.("[data-project-assets-refresh]")) {
      void loadProjectAssetPreview(true);
      renderDraftPanels();
    }
    if (event.target.closest?.("[data-financial-import]")) {
      void loadEnterpriseInformation({ financialOnly: true }).catch(() => {});
      return;
    }
    const button = event.target.closest?.("[data-report-ai-kind]");
    if (button) generateReportAiDraft(button);
  });
  document.addEventListener("change", (event) => {
    const gate = event.target.closest?.('[data-ppt-field="debtAcquisitionStatus"]');
    if (gate) { if (demoState.debtAcquisitionStatus !== gate.value) setAcquisitionStatus(gate.value); return; }
    const uploadInput = event.target.closest?.("[data-ppt-document-upload]");
    if (!uploadInput) return;
    // TRACE[PPT-DOC-028]: 文件选择后立即进入解析链路，完成后重绘字段区和右侧 PPT 粗预览。
    handlePptDocumentUpload(uploadInput);
  });
  document.addEventListener("input", (event) => {
    const zoomSlider = event.target.closest("[data-ppt-zoom-slider]");
    if (zoomSlider) {
      // TRACE[PPT-CHAT-006]: 用户拖动滑杆后进入自定义缩放模式，保留用户主动选择。
      demoState.pptPreviewZoomMode = "custom";
      demoState.pptPreviewZoom = clampPptPreviewZoom(Number(zoomSlider.value) / 100);
      schedulePptSlidePreviewFit();
      return;
    }

    const field = event.target.closest("[data-ppt-field]");
    if (!field) return;
    const key = field.dataset.pptField;
    if (key === 'debtAcquisitionStatus') { setAcquisitionStatus(field.value); return; }
    const shouldInvalidateAiDraft =
      key !== "originalShareholderRisk" &&
      !AI_DRAFT_META_KEYS.includes(key) &&
      !AI_DECISION_FIELD_KEYS.includes(key) &&
      !aiDraftFields().some((aiField) => aiField.key === key);
    if (shouldInvalidateAiDraft) {
      clearAiDraftState();
    }
    demoState[key] = field.value;
    userEditedPptFieldKeys.add(key);
    if (/^fkxz(?:[1-9]|10)$/.test(key)) {
      const manual = JSON.parse(demoState.manualRiskDecisionsJson || '{}');
      if (['触发', '不触发'].includes(field.value.trim())) manual[key] = field.value.trim();
      else delete manual[key];
      demoState.manualRiskDecisionsJson = JSON.stringify(manual);
      userEditedPptFieldKeys.add('manualRiskDecisionsJson');
      scheduleBusinessRiskEvaluation();
    }
    qsa(`[data-ppt-bind="${CSS.escape(key)}"]`).forEach((node) => {
      node.textContent = field.value || "—";
    });
    // TRACE[PPT-TEMPLATE-NEW-007]: 输入时同步字段 JSON，并重绘右侧 HTML 预览层；最终 PPTX 仍以后端模板写入为准。
    refreshPptPreviewSlide();
    refreshSentinelModule();
    invalidateRenderedPreviewSummary();
  });
  document.addEventListener("click", (event) => {
    const zoomModeButton = event.target.closest("[data-ppt-zoom-mode]");
    if (zoomModeButton) {
      // TRACE[PPT-CHAT-006]: 用户可在“适宽”和“全页”之间切换，解决自动缩放太小且不可控的问题。
      demoState.pptPreviewZoomMode = zoomModeButton.dataset.pptZoomMode || "fitWidth";
      schedulePptSlidePreviewFit();
      return;
    }

    const zoomStepButton = event.target.closest("[data-ppt-zoom-step]");
    if (zoomStepButton) {
      // TRACE[PPT-CHAT-006]: 加减按钮基于当前实际缩放继续调整，方便用户看细节。
      const current = Number(demoState.pptPreviewResolvedZoom || demoState.pptPreviewZoom || 0.85);
      const delta = Number(zoomStepButton.dataset.pptZoomStep || 0);
      demoState.pptPreviewZoomMode = "custom";
      demoState.pptPreviewZoom = clampPptPreviewZoom(current + delta);
      schedulePptSlidePreviewFit();
      return;
    }

    const navButton = event.target.closest("[data-ppt-nav]");
    if (navButton) {
      const pageIndex = pptPages.findIndex((item) => item.id === demoState.pptPage);
      const delta = navButton.dataset.pptNav === "next" ? 1 : -1;
      const nextIndex = (pageIndex + delta + pptPages.length) % pptPages.length;
      demoState.pptPage = pptPages[nextIndex].id;
      renderDraftPanels();
      return;
    }
    const pageButton = event.target.closest("[data-ppt-page]");
    if (pageButton) {
      demoState.pptPage = pageButton.dataset.pptPage;
      renderDraftPanels();
      return;
    }
    const confirmButton = event.target.closest(".ppt-confirm");
    if (confirmButton) {
      const pageIndex = pptPages.findIndex((item) => item.id === demoState.pptPage);
      demoState.confirmedPages = { ...(demoState.confirmedPages || {}), [demoState.pptPage]: true };
      if (pageIndex >= 0 && pageIndex < pptPages.length - 1) {
        demoState.pptPage = pptPages[pageIndex + 1].id;
      }
      renderDraftPanels();
    }
  });

  if (!document.body.dataset.boundPptPreviewResize) {
    // TRACE[PPT-CHAT-006]: iframe 或浏览器尺寸变化后重新适配 PPT 预览缩放。
    document.body.dataset.boundPptPreviewResize = "true";
    window.addEventListener("resize", () => schedulePptSlidePreviewFit());
  }
}

function setupSchemeOneChat() {
  const sendButton = qs("[data-chat-send]");
  const input = qs("[data-chat-input]");
  const messages = qs("[data-chat-messages]");
  if (!sendButton || !input || !messages || sendButton.dataset.boundChatSend) return;
  sendButton.dataset.boundChatSend = "true";
  sendButton.addEventListener("click", () => {
    const text = input.value.trim() || "生成苏州欧莱项目风控报告";
    messages.insertAdjacentHTML("beforeend", `<div class="message user">${escapeHtml(text)}</div>`);
    messages.insertAdjacentHTML("beforeend", `
      <div class="message agent">
        已识别为文档生成任务。请先选择已有项目名称，系统会自动带出项目编号、地址、屋顶面积和装机容量。
        <div class="inline-form" data-input-template></div>
      </div>
    `);
    input.value = "";
    renderInputTemplate(messages);
    setupDocButtons(messages);
    setupProjectSelects(messages);
    setupDraftButtons(messages);
    messages.scrollTop = messages.scrollHeight;
  });
}

function setupPage() {
  window.__REPORT_SESSION_RESET?.();
  // Start with blank business fields on every page entry; OA data is fetched only after explicit selection.
  const keep = new Set(['docType','pptPage','pptPreviewZoomMode','oaProjectLoadStatus','oaProjectListLoadStatus','aiDraftStatus']);
  for (const key of Object.keys(demoState)) if (typeof demoState[key] === 'string' && !keep.has(key)) demoState[key] = '';
  demoState.benchmarkReturn = "7.7%";
  demoState.confirmedPages = {};
  userEditedPptFieldKeys.clear(); aiTrustedDocumentFieldKeys.clear(); aiGeneratedPptFieldKeys.clear();

  // 每次 React 路由重新挂载 legacy 页面时都会调用 setupPage，因此 READY 由 React 入口负责发送一次。
  loadPptxTemplatePreview();
  renderInputTemplate();
  renderDraftPanels();
  setupDocButtons();
  setupProjectSelects();
  setupDraftButtons();
  setupGenerateButtons();
  setupPptReviewEvents();
  setupSchemeOneChat();
  // TRACE[PPT-FE-OA-SEARCH-005]: 页面启动不预加载项目；输入关键词后才实时查询后端业务视图。
}

// File parser confirmation is scoped to the currently selected report project.
window.__PPT_REPORT_FILE_WORKSPACE = {
  priorDefaultProjectCode: priorPostReportDefaultCode,
  priorProjectCodes: confirmedPriorCodes,
  syncAssetSource: syncProjectAssetSource,
  subscribeAssets: subscribeProjectAssets,
  refreshAssets: () => loadProjectAssetPreview(true),
  context: () => ({ projectCode: demoState.projectCode || "", projectName: demoState.projectName || "", userCompany: demoState.userCompany || "", city: demoState.city || "", roofArea: demoState.roofArea || "", capacity: demoState.capacity || "" }),
  apply: (projectCode, fields, page, selectedFinancialYears) => {
    if (!projectCode || projectCode !== demoState.projectCode) return false;
    if (fields.priorPostEvalItemsJson && !applyPriorReportItems(fields.priorPostEvalItemsJson)) return false;
    const allowed = new Set(["userRegisterCapital", "roofOwner", "profitabilityAnalysis", "operationCashflowAnalysis", "assetDebtAnalysis", "financeSummary", "fkxz4", ...emcTemplateFieldKeys, "emcBusinessSummary", "contractTerm", "contractKeyClauses", "priorPostEval"]);
    const metricPrefixes = QCC_FINANCIAL_METRICS.map(([key]) => key);
    const entries = Object.entries(fields).filter(([key, value]) => typeof value === "string" && value.trim() && (allowed.has(key) || metricPrefixes.some(prefix => new RegExp(`^${prefix}(19|20)\\d{2}$`).test(key))));
    if (!entries.length) return false;
    const suppliedYears = selectedFinancialYears === undefined ? null : selectedFinancialYears;
    if (suppliedYears !== null && (!Array.isArray(suppliedYears) || suppliedYears.length < 1 || suppliedYears.length > 3 || new Set(suppliedYears).size !== suppliedYears.length || suppliedYears.some(year => !Number.isInteger(year) || year < 1902 || year > 2099))) return false;
    const financialYears = (suppliedYears ?? [...new Set(entries.filter(([key]) => metricPrefixes.some(prefix => new RegExp(`^${prefix}(19|20)\\d{2}$`).test(key))).map(([key]) => Number(key.slice(-4))))]).map(String).sort().reverse();
    if (financialYears.length > 3) return false;
    if (financialYears.length) {
      // Replace only the chosen report years; never infer intervening years or retain demo amounts.
      QCC_FINANCIAL_YEARS.splice(0, QCC_FINANCIAL_YEARS.length, ...financialYears);
      financialYears.forEach(year => QCC_FINANCIAL_METRICS.forEach(([prefix]) => {
        const key = `${prefix}${year}`;
        // Keep prior confirmed/manual values. An absent file value remains eligible for supplementation.
        if ((aiTrustedDocumentFieldKeys.has(key) || userEditedPptFieldKeys.has(key)) && !enterpriseSyncedFieldKeys.has(key)) return;
        demoState[key] = "";
        aiTrustedDocumentFieldKeys.delete(key);
        userEditedPptFieldKeys.delete(key);
        enterpriseSyncedFieldKeys.delete(key);
        enterpriseLastAppliedValues.delete(key);
      }));
      clearUnverifiedFinancialAnalyses();
    }
    demoState.confirmedPages = { ...(demoState.confirmedPages || {}), [`slide${String(page).padStart(2, "0")}`]: false };
    entries.forEach(([key, value]) => { demoState[key] = value; aiTrustedDocumentFieldKeys.add(key); userEditedPptFieldKeys.add(key); enterpriseSyncedFieldKeys.delete(key); enterpriseLastAppliedValues.delete(key); });
    if (financialYears.length) {
      pptSlideFields.slide06 = [...qccFinancialFieldDefinitions(), ...pptSlideFields.slide06.filter(field => !metricPrefixes.some(prefix => field.key.startsWith(prefix) && /\d{4}$/.test(field.key)))];
      PPTX_TABLE_CELL_FIELD_BINDINGS.slide06 = qccFinancialCellBindings();
    }
    // Page 10 is populated only by its explicit template fields. Raw paragraphs and
    // the overall summary must never be guessed into table rows by label regexes.
    if (fields.priorPostEvalItemsJson) syncPriorPostEvaluation(currentPriorGridSession());
    demoState.pptPage = `slide${String(page).padStart(2, "0")}`;
    renderDraftPanels();
    scheduleBusinessRiskEvaluation();
    return true;
  },
  supplementFinancial: () => loadEnterpriseInformation({ financialOnly: true }),
  preview: (page) => {
    demoState.pptPage = `slide${String(page).padStart(2, "0")}`;
    qsa("[data-after-draft]").forEach(node => node.classList.remove("is-hidden"));
    renderDraftPanels();
    qs("[data-ai-draft-preview]")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }
};

window.__PPT_REPORT_SETUP_PAGE = setupPage;
window.__PPT_REPORT_LEGACY_SCRIPT_LOADED = true;

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", setupPage, { once: true });
} else {
  setupPage();
}
