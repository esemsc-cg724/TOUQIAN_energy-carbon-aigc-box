// src/features/request-ai-report-fields/infrastructure/request-ai-report-fields.graphql.ts

import type { EnergyProjectSnapshot } from '@/entities/energy-project';
import type { PptReportFields } from '@/entities/ppt-report';

import { executeGraphQL } from '@/shared/graphql';

type DraftPptReportFieldsData = {
  draftPptReportFields: {
    fields: PptReportFields;
    mock: boolean;
    ok: boolean;
    provider: string;
  };
};

const DRAFT_PPT_REPORT_FIELDS_MUTATION = `
  mutation DraftPptReportFields($input: DraftPptReportFieldsInput!) {
    draftPptReportFields(input: $input) {
      ok
      provider
      mock
      fields
    }
  }
`;

/**
 * 请求后端生成 PPT 字段草稿。
 *
 * 当前后端先使用本地 mock 规则；后续接入 LangGraph 时，前端仍然调用同一个 feature。
 */
export async function requestAiReportFields(input: {
  project: EnergyProjectSnapshot;
  seedFields: PptReportFields;
}) {
  const data = await executeGraphQL<
    DraftPptReportFieldsData,
    { input: { project: EnergyProjectSnapshot; seedFields: PptReportFields } }
  >(
    DRAFT_PPT_REPORT_FIELDS_MUTATION,
    {
      input,
    },
    {
      // 当前产品壳的 auth feature 尚未接入；PPT 模块先按公开演示入口运行。
      authMode: 'none',
    },
  );

  return data.draftPptReportFields;
}
