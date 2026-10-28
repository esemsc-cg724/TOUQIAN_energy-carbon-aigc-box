// src/features/load-oa-ppt-projects/infrastructure/load-oa-ppt-projects.graphql.ts

import { executeGraphQL } from '@/shared/graphql';

export type OaPptProjectListItem = Readonly<{
  address?: string;
  capacity?: string;
  city?: string;
  investment?: string;
  irr?: string;
  projectCode: string;
  projectName: string;
}>;

export type OaPptProjectListResult = Readonly<{
  items: readonly OaPptProjectListItem[];
  ok: boolean;
  source: Readonly<Record<string, unknown>>;
  total: number;
  warnings: readonly string[];
}>;

type LoadOaPptProjectsVariables = Readonly<{
  keyword?: string;
  limit?: number;
}>;

type LoadOaPptProjectsData = {
  pptOaProjects: OaPptProjectListResult;
};

const LOAD_OA_PPT_PROJECTS_QUERY = `
  query LoadOaPptProjects($keyword: String, $limit: Int) {
    pptOaProjects(keyword: $keyword, limit: $limit) {
      ok
      items
      source
      total
      warnings
    }
  }
`;

/**
 * TRACE[PPT-FE-OA-LIST-001]: 读取后端标准业务层项目列表。
 *
 * 这个 feature 只关心 GraphQL 契约，不关心底层是本地 PG 模拟业务库，
 * 还是未来甲方服务器上的 SQL Server adapter。
 */
export async function loadOaPptProjects(
  variables: LoadOaPptProjectsVariables = {},
): Promise<OaPptProjectListResult> {
  const data = await executeGraphQL<LoadOaPptProjectsData, LoadOaPptProjectsVariables>(
    LOAD_OA_PPT_PROJECTS_QUERY,
    variables,
    {
      // TRACE[PPT-FE-OA-LIST-002]: 当前 iframe 本地演示无登录态；正式接入客户系统后再接鉴权。
      authMode: 'none',
    },
  );

  return data.pptOaProjects;
}
