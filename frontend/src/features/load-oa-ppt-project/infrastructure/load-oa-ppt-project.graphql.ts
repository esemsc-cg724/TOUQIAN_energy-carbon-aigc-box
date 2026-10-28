// src/features/load-oa-ppt-project/infrastructure/load-oa-ppt-project.graphql.ts

import { executeGraphQL } from '@/shared/graphql';

export type OaPptProjectSource = Readonly<Record<string, unknown>> | null;

export type OaPptScoreLossDetail = Readonly<Record<string, string | undefined>>;

export type OaPptProjectResult = Readonly<{
  fields: Readonly<Record<string, string>>;
  found: boolean;
  ok: boolean;
  projectCode: string;
  scoreLossDetails: readonly OaPptScoreLossDetail[];
  source: OaPptProjectSource;
  warnings: readonly string[];
}>;

type LoadOaPptProjectData = {
  pptOaProject: OaPptProjectResult;
};

const LOAD_OA_PPT_PROJECT_QUERY = `
  query LoadOaPptProject($projectCode: String!) {
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
`;

/**
 * TRACE[PPT-FE-OA-002]: 按项目编号读取后端标准业务层字段。
 *
 * 前端 feature 只调用 GraphQL，不拼 SQL，也不关心底层是本地 PG 的 ppt_business，
 * 还是未来客户服务器上的 SQL Server adapter。
 */
export async function loadOaPptProject(projectCode: string): Promise<OaPptProjectResult> {
  const data = await executeGraphQL<LoadOaPptProjectData, { projectCode: string }>(
    LOAD_OA_PPT_PROJECT_QUERY,
    {
      projectCode,
    },
    {
      // TRACE[PPT-FE-OA-004]: 当前 PPT iframe 是本地演示入口；正式嵌入客户系统后再接大盒子鉴权。
      authMode: 'none',
    },
  );

  return data.pptOaProject;
}
