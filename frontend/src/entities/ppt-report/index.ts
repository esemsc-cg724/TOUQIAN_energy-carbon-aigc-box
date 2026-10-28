// src/entities/ppt-report/index.ts

/**
 * PPT 风控报告字段模型。
 *
 * 这些字段来自 energy-carbon-ppt-minimal 的字段映射和方案三页面，
 * 现在收束为正式实体配置，供页面预览、字段编辑和后端生成共同使用。
 */
export type PptReportFields = Record<string, string>;

export type PptReportSlideField = {
  key: string;
  label: string;
  source: 'project' | 'ai' | 'manual' | 'qcc' | 'model';
  type?: 'text' | 'textarea';
};

export type PptReportSlide = {
  fields: PptReportSlideField[];
  id: string;
  index: string;
  title: string;
};

export type GeneratedPptReport = {
  bytes: number;
  downloadUrl: string;
  fileName: string;
};

export const PPT_REPORT_SLIDES: PptReportSlide[] = [
  {
    id: 'slide03',
    index: '03',
    title: '项目基本概况',
    fields: [
      { key: 'projectName', label: '项目名称', source: 'project' },
      { key: 'projectCode', label: '项目编号', source: 'project' },
      { key: 'capacity', label: '项目规模（MW）', source: 'project' },
      { key: 'investment', label: '预算总投资（万元）', source: 'project' },
      { key: 'irr', label: '全投资税后IRR', source: 'project' },
      { key: 'milestone', label: '项目里程碑', source: 'manual', type: 'textarea' },
    ],
  },
  {
    id: 'slide04',
    index: '04',
    title: '项目评分及企业资信',
    fields: [
      { key: 'selfScore', label: '项目评分表得分', source: 'manual' },
      { key: 'scoreLoss', label: '主要失分点', source: 'ai', type: 'textarea' },
      { key: 'qccRisk', label: '企查查风险事项明细', source: 'qcc', type: 'textarea' },
    ],
  },
  {
    id: 'slide08',
    index: '08',
    title: '财务分析',
    fields: [
      { key: 'financeSummary', label: '财务状况简要分析', source: 'ai', type: 'textarea' },
      { key: 'registerCapital', label: '注册资本金', source: 'qcc' },
      { key: 'qccRisk', label: '企业资信摘要', source: 'qcc', type: 'textarea' },
    ],
  },
  {
    id: 'slide09',
    index: '09',
    title: '行业研究',
    fields: [
      { key: 'industryOverview', label: '行业概览', source: 'ai', type: 'textarea' },
      { key: 'policyText', label: '支持政策说明', source: 'ai', type: 'textarea' },
    ],
  },
  {
    id: 'slide18',
    index: '18',
    title: '项目评审意见',
    fields: [
      { key: 'annualGeneration', label: '年均发电量', source: 'model' },
      { key: 'annualRevenue', label: '电费收入经济评价', source: 'model' },
      { key: 'riskMeasure', label: '项目风险及措施', source: 'ai', type: 'textarea' },
      { key: 'departmentOpinion', label: '部门评审意见', source: 'manual', type: 'textarea' },
    ],
  },
];

export const DEFAULT_PPT_REPORT_FIELDS: PptReportFields = {
  selfScore: '85',
  milestone: '商务合同签订、备案、电网接入意见办理中',
  qccRisk: '股权质押无、被执行记录无、纳税信用等级A级',
  registerCapital: '5000 万元',
  policyText: '拟补充项目所在地分布式光伏支持政策。',
};

export function getPptReportCompletion(fields: PptReportFields): number {
  const requiredKeys = new Set(PPT_REPORT_SLIDES.flatMap((slide) => slide.fields.map((field) => field.key)));
  const completedCount = Array.from(requiredKeys).filter((key) => fields[key]?.trim()).length;

  return Math.round((completedCount / Math.max(requiredKeys.size, 1)) * 100);
}
