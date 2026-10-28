// src/features/file-parser-workspace/index.spec.ts
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  blank,
  findField,
  toReportFields,
  validateFile,
} from "@/entities/file-parser";
import {
  loadWorkspace,
  mergeWorkspaceFields,
  request,
  saveField,
  applyRecordedScanFailures,
  recordScanFailure,
} from "./index";

afterEach(() => vi.unstubAllGlobals());
describe("scan failure display and exclusion", () => {
  it("marks a failed analysis even when the service returned no candidates", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(
        async (url: string) =>
          new Response(
            JSON.stringify(
              url.includes("document-fields")
                ? { groups: [] }
                : url.includes("document-derivations")
                  ? {
                      runs: [
                        {
                          kind: "FINANCIAL_ANALYSIS",
                          status: "FAILED",
                          stale: false,
                          candidates: [],
                        },
                      ],
                    }
                  : { slots: [] },
            ),
          ),
      ),
    );
    const { fields } = await loadWorkspace(
      "P-1",
      [],
      "session",
      new AbortController().signal,
    );
    expect(Object.values(fields)).toHaveLength(5);
    expect(Object.values(fields).every((field) => !!field.scanFailure)).toBe(
      true,
    );
    expect(toReportFields(Object.values(fields))).toEqual({});
  });
  it("marks missing results only after an uploaded file is ready or failed", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(
        async (url: string) =>
          new Response(
            JSON.stringify(
              url.includes("document-fields")
                ? {
                    groups: ["READY", "FAILED", "PROCESSING", null].map(
                      (status, i) => ({
                        documentSlotCode: "PROJECT_INITIATION_REPORT",
                        subjectKey: `company-${i}`,
                        periodKey: "not_applicable",
                        file: status
                          ? { fileId: `f-${i}`, status, version: 1 }
                          : null,
                        fields: [
                          {
                            fieldCode: "zczbj",
                            state: "MISSING",
                            current: null,
                          },
                        ],
                      }),
                    ),
                  }
                : url.includes("document-derivations")
                  ? { runs: [] }
                  : { slots: [] },
            ),
          ),
      ),
    );
    const { fields } = await loadWorkspace(
      "P-1",
      [],
      "session",
      new AbortController().signal,
    );
    expect(Object.values(fields)).toHaveLength(2);
    expect(
      Object.values(fields).every((f) => !!f.scanFailure && f.value === ""),
    ).toBe(true);
  });

  it("keeps a conflicted source value for evidence while excluding it from save and report", async () => {
    const fetchMock = vi.fn(
      async (url: string) =>
        new Response(
          JSON.stringify(
            url.includes("document-fields")
              ? {
                  groups: [
                    {
                      documentSlotCode: "PROJECT_INITIATION_REPORT",
                      subjectKey: "user_company",
                      periodKey: "not_applicable",
                      fields: [
                        {
                          fieldCode: "zczbj",
                          state: "CONFLICT",
                          current: {
                            normalizedValue: "100",
                            fieldId: "field-1",
                            revision: 1,
                            selectedParserResultId: "parser-1",
                            status: "NEEDS_CONFIRMATION",
                            reviewStatus: "PENDING",
                            evidence: [],
                          },
                        },
                      ],
                    },
                  ],
                }
              : url.includes("document-derivations")
                ? { runs: [] }
                : { slots: [] },
          ),
        ),
    );
    vi.stubGlobal("fetch", fetchMock);
    const signal = new AbortController().signal;
    const loaded = await loadWorkspace("P-1", [], "session", signal);
    const field = Object.values(loaded.fields)[0];
    expect(field.value).toBe("100");
    expect(field.scanFailure).toBeTruthy();
    expect(toReportFields([field])).toEqual({});
    fetchMock.mockClear();
    expect(await saveField("P-1", field, "session", signal)).toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();
    expect(
      toReportFields([{ ...blank("zczbj"), value: "未扫描成功" }]),
    ).toEqual({});
  });

  it("does not label a valid unconfirmed value as a failed scan", () => {
    const field = {
      ...blank("zzc", "2024"),
      value: "100",
      state: "parsed" as const,
    };
    expect(toReportFields([field])).toEqual({ totalAssets2024: "100" });
  });

  it("restores manual failure marks for the same revision and isolates accounts, projects and new results", () => {
    const data = new Map<string, string>();
    const storage = {
      getItem: (key: string) => data.get(key) ?? null,
      setItem: (key: string, value: string) => {
        data.set(key, value);
      },
    };
    const field = {
      ...blank("ldbl", "2024"),
      value: "1.7472",
      original: "1.7472",
      fieldId: "id",
      revision: 1,
      parserResultId: "parser-1",
      scanSourceKey: "file-1:1",
    };
    const fields = { ["ldbl:2024:"]: field };
    recordScanFailure(
      "13:P-1",
      { ...field, scanFailure: "期初、期末取列有误" },
      storage,
    );
    expect(
      applyRecordedScanFailures("13:P-1", fields, storage)["ldbl:2024:"]
        .scanFailure,
    ).toBeTruthy();
    expect(
      applyRecordedScanFailures("14:P-1", fields, storage)["ldbl:2024:"]
        .scanFailure,
    ).toBeUndefined();
    expect(
      applyRecordedScanFailures("13:P-2", fields, storage)["ldbl:2024:"]
        .scanFailure,
    ).toBeUndefined();
    expect(
      applyRecordedScanFailures(
        "13:P-1",
        { ["ldbl:2024:"]: { ...field, parserResultId: "parser-2" } },
        storage,
      )["ldbl:2024:"].scanFailure,
    ).toBeUndefined();
    expect([...data.values()].join("")).not.toContain("1.7472");
    recordScanFailure("13:P-1", field, storage);
    expect(
      applyRecordedScanFailures("13:P-1", fields, storage)["ldbl:2024:"]
        .scanFailure,
    ).toBeUndefined();
  });

  it("allows a manually corrected value to replace a scan failure on refresh", () => {
    const remote = {
      x: {
        ...blank("ldbl", "2024"),
        value: "1.7472",
        scanFailure: "期初、期末取列有误",
      },
    };
    const local = {
      x: {
        ...remote.x,
        value: "1.9511",
        state: "edited" as const,
        scanFailure: undefined,
      },
    };
    const merged = mergeWorkspaceFields(remote, local);
    expect(merged.x.scanFailure).toBeUndefined();
    expect(toReportFields(Object.values(merged))).toEqual({
      currentRatio2024: "1.9511",
    });
  });
});
describe("file parsing workspace", () => {
  it("restores historical and nonconsecutive financial periods from server metadata on a fresh page", async () => {
    const fetchMock = vi.fn(
      async (url: string) =>
        new Response(
          JSON.stringify(
            url.includes("document-fields")
              ? { groups: [] }
              : url.includes("document-derivations")
                ? { runs: [] }
                : {
                    availableFinancialYears: [2023, 2021, 2018],
                    slots: [2023, 2021, 2018].map((year) => ({
                      documentSlotCode: "FINANCIAL_REPORT",
                      periodKey: String(year),
                      file: {
                        fileId: `f-${year}`,
                        originalName: `财务${year}.pdf`,
                        status: "PROCESSING",
                        errorMessage: null,
                      },
                    })),
                  },
          ),
        ),
    );
    vi.stubGlobal("fetch", fetchMock);
    const loaded = await loadWorkspace(
      "P-1",
      [],
      "normal-session",
      new AbortController().signal,
    );
    expect(loaded.documents.availableFinancialYears).toEqual([
      2023, 2021, 2018,
    ]);
    const fieldUrls = fetchMock.mock.calls
      .map(([url]) => url)
      .filter((url) => url.includes("document-fields"));
    expect(fieldUrls).toContain(
      "/api/projects/P-1/document-fields?referenceYear=2023",
    );
    expect(fieldUrls).toContain(
      "/api/projects/P-1/document-fields?referenceYear=2018",
    );
    expect(fieldUrls.some((url) => url.includes("referenceYear=2025"))).toBe(
      false,
    );
  });
  it("confirms the live equivalent candidate after a reparse replaced the original row", async () => {
    const signal = new AbortController().signal;
    const fetchMock = vi.fn(async (url: string, init?: RequestInit) => {
      if (init?.method === "POST") {
        expect(JSON.parse(init.body as string)).toEqual({
          expectedRevision: 3,
          mode: "PARSER_CANDIDATE",
          parserResultId: "parser-new",
        });
        return new Response(JSON.stringify({ field: { revision: 4 } }));
      }
      return new Response(
        JSON.stringify(
          url.includes("document-fields")
            ? {
                groups: [
                  {
                    documentSlotCode: "PROJECT_INITIATION_REPORT",
                    subjectKey: "user_company",
                    periodKey: "not_applicable",
                    fields: [
                      {
                        fieldCode: "zczbj",
                        state: "CURRENT",
                        current: {
                          normalizedValue: "100",
                          fieldId: "field-1",
                          revision: 3,
                          selectedParserResultId: "parser-deleted",
                          status: "FOUND",
                          reviewStatus: "PENDING",
                          evidence: [],
                        },
                        candidates: [
                          {
                            parserResultId: "other-value",
                            normalizedValue: "999",
                            status: "FOUND",
                          },
                          {
                            parserResultId: "parser-new",
                            normalizedValue: "100",
                            status: "FOUND",
                          },
                        ],
                      },
                    ],
                  },
                ],
              }
            : url.includes("document-derivations")
              ? { runs: [] }
              : { slots: [] },
        ),
      );
    });
    vi.stubGlobal("fetch", fetchMock);
    const loaded = await loadWorkspace("P-1", [], "session", signal);
    const field = Object.values(loaded.fields)[0];
    const saved = await saveField("P-1", field, "session", signal);
    expect(saved?.state).toBe("confirmed");
    expect(saved?.revision).toBe(4);
    expect(saved?.persisted).toBe(true);
  });
  it("keeps user-company capital and roof ownership separate from project-company fields", () => {
    expect(
      toReportFields([
        { ...blank("zczbj"), value: "10000" },
        { ...blank("wdcqf"), value: "甲公司" },
        { ...blank("zzc", "2025"), value: "18000" },
        { ...blank("projectCompanyCapital"), value: "999" },
      ]),
    ).toEqual({
      userRegisterCapital: "10000",
      roofOwner: "甲公司",
      totalAssets2025: "18000",
    });
  });
  it("does not fill empty values or unrelated fields into the report", () => {
    expect(
      toReportFields([
        { ...blank("wdcqf"), value: " " },
        { ...blank("zzc", "not_applicable"), value: "1" },
      ]),
    ).toEqual({});
    expect(findField({}, "zczbj").value).toBe("");
  });
  it("rejects a mismatched category, zero-byte file, and oversized upload", () => {
    expect(validateFile("post", { name: "report.docx", size: 100 })).toContain(
      "格式",
    );
    expect(validateFile("post", { name: "report.PDF", size: 100 })).toBeNull();
    expect(
      validateFile("initiation", { name: "report.pdf", size: 0 }),
    ).toContain("空文件");
    expect(
      validateFile("financial", {
        name: "report.xlsx",
        size: 51 * 1024 * 1024,
      }),
    ).toContain("50MB");
    expect(
      validateFile("property", { name: "owner.PNG", size: 100 }),
    ).toBeNull();
  });
  it("does not label unauthenticated or unsupported backend responses as successful extraction", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValueOnce(new Response("{}", { status: 401 }))
        .mockResolvedValueOnce(new Response("{}", { status: 404 })),
    );
    await expect(request("P-1", "documents", null)).rejects.toThrow("登录");
    await expect(request("P-1", "documents", null)).rejects.toThrow("尚未开通");
  });
  it("retains conflicts and evidence and carries cancellation to every workspace request", async () => {
    const abort = new AbortController();
    const fetchMock = vi.fn(async (url: string, init: RequestInit) => {
      expect(init.signal).toBe(abort.signal);
      return new Response(
        JSON.stringify(
          url.includes("document-fields")
            ? {
                groups: [
                  {
                    subjectKey: "user_company",
                    periodKey: "not_applicable",
                    fields: [
                      {
                        fieldCode: "zczbj",
                        state: "CONFLICT",
                        current: {
                          normalizedValue: "100",
                          fieldId: "field-1",
                          revision: 3,
                          selectedParserResultId: "parser-1",
                          status: "FOUND",
                          reviewStatus: "PENDING",
                          evidence: [
                            {
                              sourceFileName: "立项.pdf",
                              page: 9,
                              sourceText: "注册资本100万元",
                            },
                          ],
                        },
                      },
                    ],
                  },
                ],
              }
            : url.includes("document-derivations")
              ? { runs: [] }
              : { slots: [] },
        ),
      );
    });
    vi.stubGlobal("fetch", fetchMock);
    const loaded = await loadWorkspace(
      "P-1",
      [2025, 2024, 2023],
      "example-test-token",
      abort.signal,
    );
    const field = findField(loaded.fields, "zczbj");
    expect(field.state).toBe("conflict");
    expect(field.evidence[0]?.page).toBe(9);
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });
  it("preserves the new revision after server confirmation for a subsequent edit", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(
        new Response(JSON.stringify({ field: { revision: 4 } })),
      );
    vi.stubGlobal("fetch", fetchMock);
    const result = await saveField(
      "P-1",
      {
        ...blank("zczbj"),
        value: "123",
        original: "100",
        fieldId: "field-1",
        revision: 3,
        state: "edited",
      },
      "test-token",
      new AbortController().signal,
    );
    expect(result).toMatchObject({
      revision: 4,
      original: "123",
      persisted: true,
    });
    expect(JSON.parse(fetchMock.mock.calls[0]![1].body)).toMatchObject({
      expectedRevision: 3,
      mode: "MANUAL_VALUE",
      normalizedValue: "123",
    });
  });
  it("does not report a locally confirmed manual field as server-persisted", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    expect(
      await saveField(
        "P-1",
        {
          ...blank("wdcqf"),
          value: "甲公司",
          state: "confirmed",
          persisted: false,
        },
        "test-token",
        new AbortController().signal,
      ),
    ).toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();
  });
  it("keeps unsaved edits while refreshing revision and evidence for retry", () => {
    const remote = {
      capital: {
        ...blank("zczbj"),
        value: "100",
        original: "100",
        revision: 5,
        fieldId: "new-field",
        state: "parsed" as const,
      },
    };
    const local = {
      capital: {
        ...blank("zczbj"),
        value: "120",
        original: "90",
        revision: 4,
        state: "edited" as const,
      },
    };
    expect(mergeWorkspaceFields(remote, local).capital).toMatchObject({
      value: "120",
      original: "100",
      revision: 5,
      fieldId: "new-field",
      state: "edited",
      persisted: false,
    });
  });
  it("writes a readable confirmed loss-condition mark to the report", () => {
    expect(toReportFields([{ ...blank("fkxz4"), value: "MATCHED" }])).toEqual({
      fkxz4: "✓",
    });
    expect(
      toReportFields([{ ...blank("fkxz4"), value: "NOT_MATCHED" }]),
    ).toEqual({ fkxz4: "不符合" });
  });
  it("reads every selected non-consecutive period from an older three-period API without relabelling data", async () => {
    const refs: number[] = [];
    const fetchMock = vi.fn(async (url: string) => {
      if (url.includes("document-fields")) {
        const reference = Number(
          new URL(url, "http://local.test").searchParams.get("referenceYear"),
        );
        refs.push(reference);
        return new Response(
          JSON.stringify({
            groups: [reference, reference - 1, reference - 2].map((year) => ({
              documentSlotCode: "FINANCIAL_REPORT",
              subjectKey: "project_company",
              periodKey: String(year),
              fields: [
                {
                  fieldCode: "zzc",
                  state: "CURRENT",
                  current: {
                    normalizedValue: String(year * 100),
                    fieldId: `field-${year}`,
                    revision: 1,
                    selectedParserResultId: "p",
                    status: "FOUND",
                    reviewStatus: "PENDING",
                    evidence: [],
                  },
                },
              ],
            })),
          }),
        );
      }
      return new Response(
        JSON.stringify(
          url.includes("document-derivations") ? { runs: [] } : { slots: [] },
        ),
      );
    });
    vi.stubGlobal("fetch", fetchMock);
    const loaded = await loadWorkspace(
      "P-1",
      [2025, 2023, 2021],
      "test-token",
      new AbortController().signal,
    );
    expect(refs).toEqual([2025, 2021]);
    expect(findField(loaded.fields, "zzc", "2021").value).toBe("202100");
    expect(findField(loaded.fields, "zzc", "2023").value).toBe("202300");
    expect(findField(loaded.fields, "zzc", "2024").value).toBe("");
    expect(Object.keys(loaded.fields)).toHaveLength(3);
    expect(
      fetchMock.mock.calls.some(([url]) =>
        url.includes("financialYears=2025,2023,2021"),
      ),
    ).toBe(true);
  });
});
