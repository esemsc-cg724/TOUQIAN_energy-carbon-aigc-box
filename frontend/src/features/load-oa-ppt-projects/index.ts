// src/features/load-oa-ppt-projects/index.ts

// TRACE[PPT-FE-OA-LIST-003]: “项目下拉框 -> GraphQL pptOaProjects -> 选择后复用 pptOaProject”的框架化入口。
export type { OaPptProjectListItem, OaPptProjectListResult } from './load-oa-ppt-projects';
export { loadOaPptProjects } from './load-oa-ppt-projects';
