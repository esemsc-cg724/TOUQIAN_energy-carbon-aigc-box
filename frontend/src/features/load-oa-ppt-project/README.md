# load-oa-ppt-project

## 目的

这个 feature 是 AIGC 前端框架里的正式入口，用于“项目下拉选择后读取后端 `pptOaProject(projectCode)`”。

它负责：

1. 接收前端选中的 `projectCode`。
2. 调用后端 GraphQL：`pptOaProject(projectCode)`。
3. 返回后端统一 JSON：`fields`、`scoreLossDetails`、`source`、`warnings`。
4. 保证前端 feature 不直接访问数据库、不拼 SQL。

TRACE[PPT-FE-OA-README-001]: 这里不直接读数据库；前端只通过 GraphQL 读取后端统一 JSON。

## 当前调用

```ts
import { loadOaPptProject } from '@/features/load-oa-ppt-project';

const result = await loadOaPptProject('ZNE-2022-0278');
```

## 与 legacy 页面关系

当前 PPT 页面主体仍在 `public/ppt-report/document-generation-prototypes.js`，所以运行时先通过
`public/ppt-report/ppt-oa-project-client.js` 过渡接入。

后续 React 化时，页面应直接调用本 feature，删除 public 桥接脚本中的重复 GraphQL 查询。

## 后续事项

- 项目列表已由 `src/features/load-oa-ppt-projects` 和 public 桥接脚本的 `loadProjects` 负责。
- 本 feature 只负责选中项目后的详情读取：`pptOaProject(projectCode)`。
- 正式部署时继续复用这个 feature，只需要后端 adapter 从本地 PG 切到甲方 SQL Server。
