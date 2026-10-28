// public/ppt-report/ppt-rule-evaluation-client.js

(function registerPptRuleEvaluationClient() {
  const QUERY = `
    query PptReportRuleEvaluation($projectCode: String!) {
      pptReportRuleEvaluation(projectCode: $projectCode) {
        ok
        projectCode
        ruleSetVersion
        evaluatedAt
        rules
        pageGates
        source
        warnings
      }
    }
  `;

  async function loadEvaluation(options = {}) {
    const projectCode = String(options.projectCode || "").trim();
    if (!projectCode) throw new Error("projectCode 不能为空。");
    const response = await fetch(options.endpoint || "/graphql", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(options.headers && typeof options.headers === "object" ? options.headers : {})
      },
      body: JSON.stringify({ query: QUERY, variables: { projectCode } })
    });
    const payload = await response.json().catch(() => null);
    if (!response.ok) throw new Error(`规则判断请求失败：${response.status}`);
    if (payload?.errors?.length) {
      throw new Error(payload.errors[0]?.message || "规则判断 GraphQL 返回异常。");
    }
    const result = payload?.data?.pptReportRuleEvaluation;
    if (!result || typeof result !== "object") {
      throw new Error("pptReportRuleEvaluation 未返回有效数据。");
    }
    return result;
  }

  window.PptRuleEvaluationClient = { loadEvaluation };
  window.__PPT_RULE_EVALUATION_CLIENT_LOADED = true;
})();
