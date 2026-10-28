// src/features/load-oa-ppt-project/index.ts

// TRACE[PPT-FE-OA-001]: “项目下拉选择 -> GraphQL pptOaProject(projectCode) -> 前端字段面板刷新”的框架化入口。
export type { OaPptProjectResult, OaPptProjectSource, OaPptScoreLossDetail } from './load-oa-ppt-project';
export { loadOaPptProject } from './load-oa-ppt-project';
