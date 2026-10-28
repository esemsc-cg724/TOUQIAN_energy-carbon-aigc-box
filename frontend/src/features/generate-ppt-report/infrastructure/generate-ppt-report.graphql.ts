// src/features/generate-ppt-report/infrastructure/generate-ppt-report.graphql.ts

import type { EnergyProjectSnapshot } from '@/entities/energy-project';
import type { GeneratedPptReport, PptReportFields } from '@/entities/ppt-report';

import { executeGraphQL } from '@/shared/graphql';

type GeneratePptReportData = {
  generatePptReport: GeneratedPptReport & {
    ok: boolean;
    outputPath: string;
  };
};

const GENERATE_PPT_REPORT_MUTATION = `
  mutation GeneratePptReport($input: GeneratePptReportInput!) {
    generatePptReport(input: $input) {
      ok
      fileName
      downloadUrl
      outputPath
      bytes
    }
  }
`;

/**
 * 生成最终 PPTX 风控报告。
 *
 * 这里是前端正式 feature 的 GraphQL adapter；页面和 widget 不直接知道 GraphQL 字段细节。
 */
export async function generatePptReport(input: {
  fields: PptReportFields;
  project: EnergyProjectSnapshot;
}): Promise<GeneratedPptReport> {
  const data = await executeGraphQL<
    GeneratePptReportData,
    { input: { fields: PptReportFields; project: EnergyProjectSnapshot } }
  >(
    GENERATE_PPT_REPORT_MUTATION,
    {
      input,
    },
    {
      // 当前产品壳的 auth feature 尚未接入；PPT 模块先按公开演示入口运行。
      authMode: 'none',
    },
  );

  return data.generatePptReport;
}
