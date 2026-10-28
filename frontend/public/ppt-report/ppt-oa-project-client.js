// public/ppt-report/ppt-oa-project-client.js

/**
 * TRACE[PPT-PUBLIC-OA-001]: legacy iframe 页面使用的浏览器端 OA 项目读取桥接脚本。
 *
 * 这个文件只负责两件事：
 * 1. 调用 pptOaProjects(keyword, limit) 读取项目下拉列表；
 * 2. 按 projectCode 调用 pptOaProject(projectCode) 读取单项目详情。
 *
 * 两个接口都把后端标准业务层返回的 JSON 原样交给页面。
 * 它不直接操作 DOM，也不访问数据库，避免把 OA/业务库细节泄漏到前端页面。
 */
(function registerPptOaProjectClient() {
  const PPT_OA_PROJECTS_QUERY = `
    query PptOaProjects($keyword: String, $limit: Int) {
      pptOaProjects(keyword: $keyword, limit: $limit) {
        ok
        items
        source
        total
        warnings
      }
    }
  `;

  const PPT_OA_PROJECT_QUERY = `
    query PptOaProject($projectCode: String!) {
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

  function normalizeHeaders(headers) {
    return {
      "Content-Type": "application/json",
      ...(headers && typeof headers === "object" ? headers : {})
    };
  }

  function readGraphQLErrorMessage(payload) {
    const firstMessage = payload?.errors?.find?.((item) => item?.message)?.message;
    return firstMessage || "GraphQL 返回异常。";
  }

  async function postGraphQL(endpoint, headers, query, variables) {
    const response = await (globalThis.__PPT_REPORT_FETCH || fetch)(endpoint, {
      method: "POST",
      headers: normalizeHeaders(headers),
      body: JSON.stringify({
        query,
        variables
      })
    });

    const payload = await response.json().catch(() => null);
    if (!response.ok) {
      throw new Error(`GraphQL 请求失败：${response.status}`);
    }
    if (payload?.errors?.length) {
      throw new Error(readGraphQLErrorMessage(payload));
    }
    return payload?.data;
  }

  async function loadProjects(options = {}) {
    const endpoint = options.endpoint || "/graphql";
    const keyword = typeof options.keyword === "string" ? options.keyword.trim() : undefined;
    const limit = Number.isFinite(Number(options.limit)) ? Number(options.limit) : undefined;
    const data = await postGraphQL(endpoint, options.headers, PPT_OA_PROJECTS_QUERY, {
      keyword: keyword || undefined,
      limit
    });
    const result = data?.pptOaProjects;
    if (!result || typeof result !== "object") {
      throw new Error("pptOaProjects 未返回有效数据。");
    }
    return result;
  }

  async function loadProject(options = {}) {
    const projectCode = String(options.projectCode || "").trim();
    if (!projectCode) {
      throw new Error("projectCode 不能为空。");
    }

    const endpoint = options.endpoint || "/graphql";
    const data = await postGraphQL(endpoint, options.headers, PPT_OA_PROJECT_QUERY, { projectCode });
    const result = data?.pptOaProject;
    if (!result || typeof result !== "object") {
      throw new Error("pptOaProject 未返回有效数据。");
    }

    return result;
  }

  window.PptOaProjectClient = {
    loadProjects,
    loadProject
  };
  window.__PPT_OA_PROJECT_CLIENT_LOADED = true;
})();
