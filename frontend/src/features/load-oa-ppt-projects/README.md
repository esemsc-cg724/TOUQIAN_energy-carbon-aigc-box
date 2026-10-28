# load-oa-ppt-projects

这个 feature 负责读取 PPT 风控报告的项目下拉列表。

## 当前流程

1. 前端页面加载时调用 GraphQL：`pptOaProjects(keyword, limit)`。
2. 后端当前从本地 PG 模拟业务库读取：
   - `ppt_business.oa_project_ppt_snapshot_v`
3. 前端把返回的 `items` 转成下拉框选项。
4. 用户选中项目后，继续复用已有 `pptOaProject(projectCode)` 拉取详情字段。

## 为什么单独建 feature

- `load-oa-ppt-projects`：读取项目列表，用于下拉框。
- `load-oa-ppt-project`：读取单个项目详情，用于填充左侧字段和右侧预览。

这样后续切换到甲方 SQL Server 时，前端不用改；只需要后端把 `pptOaProjects` 和 `pptOaProject` 的 adapter 换成 SQL Server 实现。

TRACE[PPT-FE-OA-LIST-README-001]: 这里记录下拉列表接口的迁移边界，避免把数据库表名散落到页面代码里。
