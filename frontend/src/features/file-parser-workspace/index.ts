// src/features/file-parser-workspace/index.ts
import {
  ANALYSES,
  blank,
  displayValue,
  identity,
  sortedFinancialYears,
  type Evidence,
  type Field,
  type Fields,
} from "@/entities/file-parser";

export { applyRecordedScanFailures, recordScanFailure } from "./scan-failure";

type RawCurrent = {
  normalizedValue: unknown;
  fieldId: string;
  revision: number;
  selectedParserResultId: string | null;
  status: string;
  reviewStatus: string;
  evidence: Evidence[];
};
type FieldResponse = {
  groups: {
    documentSlotCode: string;
    subjectKey: string;
    periodKey: string;
    file?: { fileId: string; status: string; version?: number } | null;
    fields: {
      fieldCode: string;
      state: string;
      current: RawCurrent | null;
      candidates?: {
        parserResultId: string;
        normalizedValue: unknown;
        status: string;
      }[];
    }[];
  }[];
};
type DerivationResponse = {
  runs: {
    kind: string;
    status?: string;
    subjectKey?: string;
    stale: boolean;
    inputSnapshot: unknown;
    candidates: {
      candidateId: string;
      expectedRevision: number;
      fieldCode: string;
      periodKey: string;
      subjectKey: string;
      normalizedValue: unknown;
      reviewStatus: string;
      status: string;
      evidenceSnapshot?: unknown;
    }[];
  }[];
};
export type RemoteFile = {
  fileId: string;
  version?: number;
  originalName: string;
  status: string;
  errorMessage: string | null;
};
export type DocumentResponse = {
  availableFinancialYears?: number[];
  slots: {
    documentSlotCode: string;
    periodKey: string;
    file: RemoteFile | null;
    files?: RemoteFile[];
  }[];
};

function object(value: unknown): Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}
export class ParserApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}
export async function request<T>(
  project: string,
  suffix: string,
  token: string | null,
  signal?: AbortSignal,
  body?: BodyInit,
): Promise<T> {
  const isJson = typeof body === "string";
  const response = await fetch(
    `/api/projects/${encodeURIComponent(project)}/${suffix}`,
    {
      method: body === undefined ? "GET" : "POST",
      body,
      signal,
      headers: {
        ...(token ? { authorization: `Bearer ${token}` } : {}),
        ...(isJson ? { "content-type": "application/json" } : {}),
      },
    },
  );
  const json: unknown = await response.json().catch(() => null);
  const envelope = object(json);
  if (!response.ok || envelope.success === false) {
    const nested = object(envelope.data);
    const reason =
      envelope.errorMessage ??
      envelope.message ??
      nested.errorMessage ??
      nested.message;
    const message =
      response.status === 401
        ? "请先登录平台，再使用文件解析和服务器保存。"
        : response.status === 404 && typeof reason !== "string"
          ? "当前后端尚未开通项目资料接口，需要升级解析服务；可先人工核对填写。"
          : typeof reason === "string"
            ? reason
            : `服务请求失败（${response.status}）`;
    throw new ParserApiError(message, response.status);
  }
  return (envelope.success === true ? envelope.data : json) as T;
}
function snapshotEvidence(value: unknown): Evidence[] {
  const snapshot = object(value);
  if (Array.isArray(snapshot.documentEvidence))
    return snapshot.documentEvidence
      .map((item) => {
        const e = object(item);
        return {
          sourceFileName:
            typeof e.sourceFileName === "string" ? e.sourceFileName : null,
          page: typeof e.page === "number" ? e.page : null,
          sourceText: typeof e.sourceText === "string" ? e.sourceText : "",
        };
      })
      .filter((e) => e.sourceText);
  if (typeof snapshot.summary === "string")
    return [
      {
        sourceFileName: null,
        page: typeof snapshot.page === "number" ? snapshot.page : null,
        sourceText: snapshot.summary,
      },
    ];
  return [];
}
export async function loadWorkspace(
  project: string,
  years: number[],
  token: string | null,
  signal: AbortSignal,
): Promise<{ fields: Fields; documents: DocumentResponse }> {
  let requestedYears = sortedFinancialYears(years);
  let documents = await request<DocumentResponse>(
    project,
    `documents?referenceYear=${requestedYears[0] ?? new Date().getFullYear() - 1}${requestedYears.length ? `&financialYears=${requestedYears.join(",")}` : ""}`,
    token,
    signal,
  );
  requestedYears = sortedFinancialYears([
    ...requestedYears,
    ...(documents.availableFinancialYears ?? []),
    ...documents.slots
      .filter(
        (slot) => slot.documentSlotCode === "FINANCIAL_REPORT" && slot.file,
      )
      .map((slot) => Number(slot.periodKey)),
  ]).slice(0, 10);
  if (
    (documents.availableFinancialYears ?? [])
      .slice(0, 10)
      .some(
        (year) =>
          !documents.slots.some(
            (slot) =>
              slot.documentSlotCode === "FINANCIAL_REPORT" &&
              slot.periodKey === String(year),
          ),
      )
  )
    documents = await request<DocumentResponse>(
      project,
      `documents?referenceYear=${requestedYears[0]}&financialYears=${requestedYears.join(",")}`,
      token,
      signal,
    );
  // Older API returns three consecutive periods per referenceYear. Cover the requested
  // periods with bounded reads, then discard extra periods rather than relabel them.
  const references: number[] = [];
  for (const year of requestedYears)
    if (
      !references.some(
        (reference) => reference >= year && reference - year <= 2,
      )
    )
      references.push(year);
  if (!references.length) references.push(new Date().getFullYear() - 1);
  const [directResponses, derived] = await Promise.all([
    Promise.all(
      references.map((reference) =>
        request<FieldResponse>(
          project,
          `document-fields?referenceYear=${reference}`,
          token,
          signal,
        ),
      ),
    ),
    request<DerivationResponse>(project, "document-derivations", token, signal),
  ]);
  const direct: FieldResponse = {
    groups: directResponses
      .flatMap((response) => response.groups)
      .filter(
        (group) =>
          group.documentSlotCode !== "FINANCIAL_REPORT" ||
          requestedYears.length === 0 ||
          requestedYears.includes(Number(group.periodKey)),
      ),
  };
  const fields: Fields = {};
  for (const group of direct.groups)
    for (const item of group.fields) {
      const file =
        group.file ??
        documents.slots.find(
          (slot) =>
            slot.documentSlotCode === group.documentSlotCode &&
            slot.periodKey === group.periodKey,
        )?.file;
      const scanSourceKey = file
        ? `${file.fileId}:${"version" in file ? file.version : ""}`
        : undefined;
      if (!item.current) {
        if (file && ["READY", "FAILED"].includes(file.status))
          fields[identity(item.fieldCode, group.periodKey, group.subjectKey)] =
            {
              ...blank(item.fieldCode, group.periodKey, group.subjectKey),
              scanSourceKey,
              scanFailure:
                file.status === "FAILED"
                  ? "文件解析失败。"
                  : "文件已解析，但未识别到该字段或所需计算依据。",
            };
        continue;
      }
      const c = item.current;
      const value = displayValue(c.normalizedValue);
      // Reprocessing replaces parser rows. Reuse a live candidate with the same
      // value instead of sending a deleted candidate ID back for confirmation.
      const candidate =
        item.candidates?.find(
          (entry) => entry.parserResultId === c.selectedParserResultId,
        ) ??
        item.candidates?.find(
          (entry) =>
            entry.status === "FOUND" &&
            displayValue(entry.normalizedValue) === value,
        );
      fields[identity(item.fieldCode, group.periodKey, group.subjectKey)] = {
        ...blank(item.fieldCode, group.periodKey, group.subjectKey),
        value,
        original: value,
        state:
          item.state === "CONFLICT" || c.status === "NEEDS_CONFIRMATION"
            ? "conflict"
            : c.reviewStatus === "CONFIRMED"
              ? "confirmed"
              : "parsed",
        persisted: c.reviewStatus === "CONFIRMED",
        scanSourceKey,
        scanFailure:
          item.state === "CONFLICT" || c.status === "NEEDS_CONFIRMATION"
            ? "字段存在冲突或校验未通过，请对照原件重新核对。"
            : ["FAILED", "MISSING", "NOT_FOUND", "ERROR"].includes(c.status) ||
                (!value.trim() && file?.status === "READY")
              ? "未获得可用的字段结果。"
              : c.reviewStatus !== "CONFIRMED" && file?.status === "FAILED"
                ? "文件解析失败。"
                : undefined,
        evidence: c.evidence ?? [],
        fieldId: c.fieldId,
        revision: c.revision,
        parserResultId:
          candidate?.parserResultId ?? c.selectedParserResultId ?? undefined,
      };
    }
  for (const run of derived.runs) {
    if (
      !run.candidates.length &&
      ["FAILED", "ERROR"].includes(run.status ?? "")
    ) {
      const codes =
        run.kind === "FINANCIAL_ANALYSIS"
          ? ANALYSES.map((item) => item.code)
          : run.kind === "EMC_SUMMARY"
            ? ["emcBusinessSummary"]
            : [];
      for (const code of codes) {
        const field = blank(code, "not_applicable", run.subjectKey ?? "");
        const key = identity(field.code, field.period, field.subject);
        if (!fields[key])
          fields[key] = {
            ...field,
            scanFailure: "分析生成失败，请重新核对资料。",
          };
      }
    }
    for (const item of run.candidates) {
      const period = item.periodKey ?? "not_applicable";
      const subject = item.subjectKey ?? "";
      const key = identity(item.fieldCode, period, subject);
      if (fields[key]) continue;
      const value = displayValue(item.normalizedValue);
      fields[key] = {
        ...blank(item.fieldCode, period, subject),
        value,
        original: value,
        state:
          run.stale || item.status === "NEEDS_CONFIRMATION"
            ? "conflict"
            : item.reviewStatus === "CONFIRMED"
              ? "confirmed"
              : "parsed",
        persisted: item.reviewStatus === "CONFIRMED",
        stale: run.stale,
        scanFailure: run.stale
          ? "分析所依据的资料已经变化，需要重新生成。"
          : item.status === "NEEDS_CONFIRMATION" ||
              ["FAILED", "ERROR"].includes(run.status ?? "") ||
              ["FAILED", "MISSING", "ERROR"].includes(item.status)
            ? "分析结果存在问题或依据不足，请重新核对。"
            : undefined,
        evidence: snapshotEvidence(item.evidenceSnapshot ?? run.inputSnapshot),
        candidateId: item.candidateId,
        revision: item.expectedRevision,
      };
    }
  }
  return { fields, documents };
}
export async function saveField(
  project: string,
  field: Field,
  token: string | null,
  signal: AbortSignal,
): Promise<Field | null> {
  if (field.scanFailure || field.value === "未扫描成功") return null;
  if (field.state === "confirmed" && field.persisted) return field;
  if (field.fieldId && field.revision !== undefined) {
    const manual = field.value !== field.original || !field.parserResultId;
    const result = await request<{ field: { revision: number } }>(
      project,
      `document-fields/${encodeURIComponent(field.fieldId)}/confirm`,
      token,
      signal,
      JSON.stringify({
        expectedRevision: field.revision,
        ...(manual
          ? {
              mode: "MANUAL_VALUE",
              normalizedValue: field.value,
              reason: "用户在文件资料解析区对照材料人工复核修改。",
            }
          : { mode: "PARSER_CANDIDATE", parserResultId: field.parserResultId }),
      }),
    );
    return {
      ...field,
      revision: result.field.revision,
      original: field.value,
      state: "confirmed",
      persisted: true,
    };
  }
  if (
    field.candidateId &&
    field.revision !== undefined &&
    field.value === field.original &&
    !field.stale
  ) {
    const result = await request<{ field: { revision: number } }>(
      project,
      `document-derivations/${encodeURIComponent(field.candidateId)}/confirm`,
      token,
      signal,
      JSON.stringify({ expectedRevision: field.revision }),
    );
    return {
      ...field,
      revision: result.field.revision,
      original: field.value,
      state: "confirmed",
      persisted: true,
    };
  }
  return null;
}

// Keep unsaved human input while adopting the server's current revision and provenance.
export function mergeWorkspaceFields(remote: Fields, local: Fields): Fields {
  const merged = { ...remote };
  for (const [key, field] of Object.entries(local)) {
    if (
      field.state !== "edited" &&
      !(field.state === "confirmed" && !field.persisted)
    )
      continue;
    const fresh = remote[key];
    merged[key] = fresh
      ? {
          ...fresh,
          value: field.value,
          state: "edited",
          persisted: false,
          scanFailure: field.scanFailure,
        }
      : field;
  }
  return merged;
}
