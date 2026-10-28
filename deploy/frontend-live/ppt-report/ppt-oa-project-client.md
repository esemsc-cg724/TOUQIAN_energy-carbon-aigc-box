# ppt-oa-project-client.js

## 目的

当前 PPT 预览页面主体仍在 `public/ppt-report/document-generation-prototypes.js`。

这个文件是当前 plain JS 页面使用的过渡桥接：

1. 页面加载时调用后端 `pptOaProjects`，读取项目下拉列表。
2. 项目下拉框选择项目。
3. 通过 `projectCode` 调用后端 `pptOaProject`。
4. 将返回 JSON 交给 `document-generation-prototypes.js`。
5. 由页面主脚本决定如何写回 `demoState`、刷新左侧字段和右侧预览。

TRACE[PPT-PUBLIC-OA-README-001]: 这个文件只是当前 plain JS 页面的过渡桥接；后续 React 化后，应迁移到 `src/features/load-oa-ppt-project`。

## 暴露对象

```js
window.PptOaProjectClient.loadProjects({
  endpoint: '/graphql',
  headers: { Authorization: 'Bearer dev-token' },
  limit: 50
});

window.PptOaProjectClient.loadProject({
  endpoint: '/graphql',
  headers: { Authorization: 'Bearer dev-token' },
  projectCode: 'ZNE-2022-0278'
});
```

## 边界

- 不操作 DOM。
- 不直接访问 PG、SQL Server 或任何数据库。
- 不转换字段语义，只返回 GraphQL 的原始结果。
- 页面主脚本直接使用后端标准字段名，例如 `consumptionRatio`。
