// src/shared/env/index.ts

export type AppEnv = 'dev' | 'test' | 'prod';

export function getAppEnv(): AppEnv {
  const configuredAppEnv = import.meta.env.VITE_APP_ENV;

  if (configuredAppEnv === 'dev' || configuredAppEnv === 'test' || configuredAppEnv === 'prod') {
    return configuredAppEnv;
  }

  return import.meta.env.DEV ? 'dev' : 'prod';
}

export function getGraphQLEndpoint() {
  const endpoint = import.meta.env.VITE_GRAPHQL_ENDPOINT;

  return typeof endpoint === 'string' && endpoint.trim() ? endpoint : '/graphql';
}

export function getPptDocumentParseEndpoint() {
  // TRACE[PPT-DOC-021]: 文件上传解析走 HTTP multipart，不走 GraphQL；
  // iframe 本地测试或客户部署时可通过 env 指向后端真实 API。
  const endpoint = import.meta.env.VITE_PPT_DOCUMENT_PARSE_ENDPOINT;

  return typeof endpoint === 'string' && endpoint.trim() ? endpoint : '/api/ppt-document/parse';
}

export function getHealthEndpoint() {
  const endpoint = import.meta.env.VITE_API_HEALTH_ENDPOINT;

  return typeof endpoint === 'string' && endpoint.trim() ? endpoint : null;
}
