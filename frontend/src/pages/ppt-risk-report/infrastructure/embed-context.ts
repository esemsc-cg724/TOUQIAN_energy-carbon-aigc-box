// src/pages/ppt-risk-report/infrastructure/embed-context.ts

export type PptReportEmbedContext = {
  readonly embedMode: boolean;
  readonly parentOrigin: string;
  readonly projectId: string;
  readonly sessionId: string;
  readonly token: string;
};

export function readPptReportEmbedContext(search = window.location.search): PptReportEmbedContext {
  // TRACE[PPT-IFR-001]: iframe 本地测试和正式接入都通过 URL 参数传上下文，避免页面依赖父系统的全局变量。
  const params = new URLSearchParams(search);

  return {
    embedMode: true,
    parentOrigin: params.get('parentOrigin') ?? '*',
    projectId: params.get('projectId') ?? 'ZNE-2024-SZ-028',
    sessionId: params.get('sessionId') ?? 'local-iframe-session',
    token: params.get('token') ?? 'dev-token',
  };
}
