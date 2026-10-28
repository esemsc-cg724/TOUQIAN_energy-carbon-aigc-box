# 投前风控报告前端

当前投前平台前端的私有代码归档，首次整理于 2026-10-28。

## 目录

- `frontend/`：React + TypeScript 源工程、公共页面脚本、样式、模板预览资源与检查工具。
- `deploy/frontend-live/`：从服务器当前运行目录读取的前端文件快照，包含当前生效的 HTML、编译脚本及静态资源。
- `deploy/live-manifest.json`：线上快照各文件的 SHA-256，可用于核对和恢复。
- `docs/snapshot-status.md`：源码与线上快照的关系、验证结果、归档范围。

## 本地开发

```bash
cd frontend
npm ci
cp env/.env.development.example env/.env.development.local
npm run dev
```

按实际环境填写 `DEV_API_PROXY_TARGET`；账号与认证由后端提供，不在仓库内保存。

```bash
npm run build
npm run preview
```

当前入口为 `/ppt-risk-report/chatbot-embed`，需要有效的后端登录会话。`/api`、`/graphql`、`/outputs/ppt-report` 必须指向配套后端。

## 当前功能

项目查询与选择、PPT 逐页编辑/预览、企业信息查询、文件解析复核、财务年份选择、前序项目自动候选检查、PM 并网抓取、后评价报告按前序项目编号关联。

前序项目检查不会把名称相似、同城市、空查询或接口失败自动认定为有/无前序项目。关系证据不足时显示待确认；确认后的报告绑定与 PM 状态共同决定可填写的项目范围。

## 使用线上快照

`deploy/frontend-live/` 用于保存当前线上版本，不能用它代替源码开发。它依赖配套后端与现有反向代理；本次提交不修改服务器、不新建公开站点。

此前线上存在直接修改编译文件的热更新。因此 `frontend/` 能构建，但重新构建的 React 包尚未证明与线上热更新包逐项一致。恢复当前线上界面时优先使用已保存的线上快照；后续发布前需对照 `docs/snapshot-status.md` 完成源码与热更新的一致性复核。

本仓库不包含数据库连接凭据、真实 `.env`、用户上传资料、测试业务报告、`node_modules`，或企查查样例业务图片。后端代码与服务不在本次归档范围内。

工程基础来源：AIGC Friendly Frontend。保留了源码中的原始注释与项目约定。
