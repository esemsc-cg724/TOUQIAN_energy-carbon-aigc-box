// src/widgets/file-parser-design-gallery/index.tsx
import { useEffect, useRef, useState } from "react";
import {
  Alert,
  Button,
  Card,
  Col,
  Input,
  Modal,
  Row,
  Select,
  Space,
  Table,
  Tabs,
  Tag,
  Typography,
  Upload,
  theme,
} from "antd";
import { InboxOutlined } from "@ant-design/icons";
import { getAccessToken, getAuthSession } from "@/features/auth";
import {
  loadWorkspace,
  mergeWorkspaceFields,
  request,
  saveField,
  applyRecordedScanFailures,
  recordScanFailure,
  type DocumentResponse,
} from "@/features/file-parser-workspace";
import {
  ANALYSES,
  CATEGORIES,
  METRICS,
  findField,
  identity,
  addFinancialYears,
  duplicateFinancialYears,
  financialYearsFromName,
  initialFinancialColumns,
  removeFinancialColumn,
  MAX_FINANCIAL_YEARS,
  MAX_REPORT_YEARS,
  reportYearSelection,
  sortedFinancialYears,
  selectedFileYears,
  validFinancialYear,
  type FinancialPeriods,
  toReportFields,
  validateFile,
  type Category,
  type Field,
  type Fields,
} from "@/entities/file-parser";

import { InitiationAssets, type InitiationAssetSnapshot } from "./initiation-assets";
import { FinancialYearHeader } from "./financial-year-header";
import "./index.css";

type ReportContext = {
  projectCode: string;
  projectName: string;
  userCompany: string;
  city?: string;
  roofArea?: string;
  capacity?: string;
};
declare global {
  interface Window {
    __PPT_REPORT_FILE_WORKSPACE?: {
      context: () => ReportContext;
      priorDefaultProjectCode?: () => string;
      priorProjectCodes?: () => string[];
      apply: (
        project: string,
        fields: Record<string, string>,
        page: number,
        financialYears?: number[],
      ) => boolean;
      preview: (page: number) => void;
      syncAssetSource: (project: string, signature: string) => void;
      subscribeAssets?: (listener: (snapshot: InitiationAssetSnapshot) => void) => () => void;
      refreshAssets?: () => Promise<void>;
      supplementFinancial: () => Promise<{ applied: number; isMock: boolean }>;
    };
  }
}
type Queued = {
  id: string;
  file: File;
  category: Category;
  years: number[];
  yearsConfirmed: boolean;
  uploadedYears: number[];
  priorProject: string;
  state: "waiting" | "uploading" | "submitted" | "failed";
  error?: string;
};
const EMPTY_DOCUMENTS: DocumentResponse = { slots: [] };
const EMPTY_CONTEXT: ReportContext = {
  projectCode: "",
  projectName: "",
  userCompany: "",
};
const fileStatus: Record<string, string> = {
  STORED: "排队中",
  QUEUED: "排队中",
  PROCESSING: "解析中",
  READY: "解析完成",
  FAILED: "解析失败",
};

export function FileParserDesignGallery() {
  const { token: colors } = theme.useToken();
  const [context, setContext] = useState<ReportContext>(EMPTY_CONTEXT);
  const [category, setCategory] = useState<Category>("financial");
  const [expanded, setExpanded] = useState(false);
  const [financialPeriods, setFinancialPeriods] = useState<FinancialPeriods>(
    () => ({
      columns: initialFinancialColumns(),
      reportYears: [],
      reportChoiceTouched: false,
      excludedYears: [],
    }),
  );
  const years = sortedFinancialYears(
    financialPeriods.columns.flatMap((column) =>
      column.year === null ? [] : [column.year],
    ),
  );
  const reportYears = financialPeriods.reportYears.filter((year) =>
    years.includes(year),
  );

  const [fields, setFields] = useState<Fields>({});
  const [queue, setQueue] = useState<Queued[]>([]);
  const financialQueue = queue.filter((item) => item.category === "financial");
  const duplicateYears = duplicateFinancialYears(financialQueue);
  const [yearSources, setYearSources] = useState<Record<string, string>>({});
  const unresolvedYears = duplicateYears.filter(
    (year) =>
      !financialQueue.some(
        (item) =>
          item.id === yearSources[String(year)] && item.years.includes(year),
      ),
  );
  function chosenYears(item: Queued) {
    return selectedFileYears(item, duplicateYears, yearSources);
  }
  const [documents, setDocuments] = useState<DocumentResponse>(EMPTY_DOCUMENTS);
  const [busy, setBusy] = useState(false);
  const [deriving, setDeriving] = useState<string | null>(null);
  const [deriveFeedback, setDeriveFeedback] = useState<{
    kind: string;
    message: string;
    failed: boolean;
  } | null>(null);
  const [notice, setNotice] = useState(
    "请选择类别，拖入资料后点击“开始解析”。结果需核对后填入报告。",
  );
  const [error, setError] = useState("");
  const [evidence, setEvidence] = useState<Field | null>(null);
  const [replaceApproved, setReplaceApproved] = useState(false);
  const scope = useRef({ project: "", epoch: 0 });
  const controller = useRef<AbortController | null>(null);
  const mounted = useRef(true);
  const currentCategory = CATEGORIES.find((c) => c.key === category)!;
  const authToken = () =>
    getAccessToken() ||
    (window.__PPT_REPORT_EMBED_CONTEXT?.token !== "dev-token"
      ? window.__PPT_REPORT_EMBED_CONTEXT?.token
      : null) ||
    null;
  const scanReviewScope = () =>
    `${getAuthSession()?.accountId ?? "session"}:${context.projectCode}`;

  useEffect(() => {
    mounted.current = true;
    const sync = () => {
      const next =
        window.__PPT_REPORT_FILE_WORKSPACE?.context() ?? EMPTY_CONTEXT;
      if (scope.current.project !== next.projectCode) {
        controller.current?.abort();
        scope.current = {
          project: next.projectCode,
          epoch: scope.current.epoch + 1,
        };
        setFinancialPeriods({
          columns: initialFinancialColumns(),
          reportYears: [],
          reportChoiceTouched: false,
          excludedYears: [],
        });
        setFields({});
        setQueue([]);
        setYearSources({});
        setDocuments(EMPTY_DOCUMENTS);
        setDeriving(null);
        setDeriveFeedback(null);
        setBusy(false);
        setError("");
        setEvidence(null);
        setReplaceApproved(false);
        setNotice(
          "请选择类别，拖入资料后点击“开始解析”。结果需核对后填入报告。",
        );
      }
      setContext(next);
    };
    sync();
    window.addEventListener("ppt-report:document-context", sync);
    return () => {
      mounted.current = false;
      controller.current?.abort();
      window.removeEventListener("ppt-report:document-context", sync);
    };
  }, []);

  function includeFinancialYears(values: number[]) {
    setFinancialPeriods((old) => {
      const columns = addFinancialYears(
        old.columns,
        values.filter((year) => !(old.excludedYears ?? []).includes(year)),
      );
      const available = columns.flatMap((column) =>
        column.year === null ? [] : [column.year],
      );
      return {
        ...old,
        columns,
        reportYears: old.reportChoiceTouched
          ? old.reportYears.filter((year) => available.includes(year))
          : sortedFinancialYears(available).slice(0, MAX_REPORT_YEARS),
      };
    });
  }
  function yearHasData(year: number) {
    return (
      Object.values(fields).some(
        (field) => field.period === String(year) && field.value.trim(),
      ) ||
      documents.slots.some(
        (slot) =>
          slot.documentSlotCode === "FINANCIAL_REPORT" &&
          slot.periodKey === String(year) &&
          slot.file,
      ) ||
      financialQueue.some((item) => item.uploadedYears.includes(year))
    );
  }
  function removeColumn(key: string) {
    const removed = financialPeriods.columns.find(
      (column) => column.key === key,
    );
    if (!removed || busy) return;
    setFinancialPeriods((old) => removeFinancialColumn(old, key));
    if (removed.year !== null) {
      setQueue((old) =>
        old.map((item) => {
          if (item.category !== "financial") return item;
          const remaining = item.years.filter((year) => year !== removed.year);
          return {
            ...item,
            years: remaining,
            yearsConfirmed: item.yearsConfirmed && remaining.length > 0,
          };
        }),
      );
      setYearSources((old) =>
        Object.fromEntries(
          Object.entries(old).filter(([year]) => year !== String(removed.year)),
        ),
      );
    }
    setError("");
    setReplaceApproved(false);
  }
  function setFileYears(id: string, values: string[]) {
    const numeric = values.map(Number);
    if (numeric.some((year) => !validFinancialYear(year))) {
      setError("请填写1902—2099之间的四位年份。");
      return;
    }
    if (
      sortedFinancialYears([...years, ...numeric]).length > MAX_FINANCIAL_YEARS
    ) {
      setError("最多核对10个年度的资料，报告可选择其中最多3年。");
      return;
    }
    setQueue((old) =>
      old.map((item) =>
        item.id === id
          ? {
              ...item,
              years: sortedFinancialYears(numeric),
              yearsConfirmed: numeric.length > 0,
            }
          : item,
      ),
    );
    const prior = financialQueue.find((item) => item.id === id);
    const removed = (prior?.years ?? []).filter(
      (year) =>
        !numeric.includes(year) &&
        !yearHasData(year) &&
        !financialQueue.some(
          (item) => item.id !== id && item.years.includes(year),
        ),
    );
    setFinancialPeriods((old) => {
      const columns = addFinancialYears(
        old.columns.map((column) =>
          column.year !== null && removed.includes(column.year)
            ? { ...column, year: null }
            : column,
        ),
        numeric,
      );
      const available = columns.flatMap((column) =>
        column.year === null ? [] : [column.year],
      );
      return {
        ...old,
        columns,
        excludedYears: (old.excludedYears ?? []).filter(
          (year) => !numeric.includes(year),
        ),
        reportYears: old.reportChoiceTouched
          ? old.reportYears.filter((year) => available.includes(year))
          : sortedFinancialYears(available).slice(0, MAX_REPORT_YEARS),
      };
    });
    setReplaceApproved(false);
    setError("");
  }
  function setColumnYear(key: string, nextYear: number | null) {
    const current = financialPeriods.columns.find(
      (column) => column.key === key,
    );
    if (!current) return;
    if (nextYear !== null && !validFinancialYear(nextYear)) {
      setError("请填写1902—2099之间的四位年份。");
      return;
    }
    if (
      nextYear !== null &&
      financialPeriods.columns.some(
        (column) => column.key !== key && column.year === nextYear,
      )
    ) {
      setError("这个年份已有数据列，请在该列核对，不要重复建立。");
      return;
    }
    if (
      current.year !== null &&
      yearHasData(current.year) &&
      current.year !== nextYear
    ) {
      setError(
        "已有数据的年度不能直接改标签。需要更正时，请重新上传并选择正确年度。",
      );
      return;
    }
    const oldYear = current.year;
    setFinancialPeriods((old) => {
      const columns = old.columns.map((column) =>
        column.key === key ? { ...column, year: nextYear } : column,
      );
      const available = columns.flatMap((column) =>
        column.year === null ? [] : [column.year],
      );
      return {
        ...old,
        columns,
        reportYears: old.reportChoiceTouched
          ? reportYearSelection(
              old.reportYears.map((year) =>
                year === oldYear && nextYear !== null ? nextYear : year,
              ),
              available,
            )
          : sortedFinancialYears(available).slice(0, MAX_REPORT_YEARS),
        excludedYears: (old.excludedYears ?? []).filter(
          (year) => year !== nextYear,
        ),
      };
    });
    if (oldYear !== null)
      setQueue((old) =>
        old.map((item) =>
          item.category === "financial" &&
          item.uploadedYears.length === 0 &&
          item.years.includes(oldYear)
            ? {
                ...item,
                years: sortedFinancialYears(
                  item.years.flatMap((year) =>
                    year === oldYear
                      ? nextYear === null
                        ? []
                        : [nextYear]
                      : [year],
                  ),
                ),
                yearsConfirmed: nextYear !== null,
              }
            : item,
        ),
      );
    setError("");
    setReplaceApproved(false);
  }
  function edit(field: Field, value: string) {
    if (value.trim())
      recordScanFailure(scanReviewScope(), {
        ...field,
        scanFailure: undefined,
      });
    setFields((old) => ({
      ...old,
      [identity(field.code, field.period, field.subject)]: {
        ...field,
        value,
        state: value.trim() ? "edited" : "missing",
        scanFailure: value.trim() ? undefined : field.scanFailure,
      },
    }));
  }
  function markScanFailed(field: Field) {
    const failed: Field = {
      ...field,
      state: "conflict",
      scanFailure: "人工核对发现取值或年份有误，标记为未扫描成功。",
    };
    const recorded = recordScanFailure(scanReviewScope(), failed);
    setFields((old) => ({
      ...old,
      [identity(field.code, field.period, field.subject)]: failed,
    }));
    setEvidence(null);
    setNotice(
      recorded
        ? "已标记未扫描成功，本浏览器刷新后仍保留。"
        : "已标记未扫描成功；浏览器未能保存标记，刷新后需重新核对。",
    );
  }
  function operation() {
    controller.current?.abort();
    const abort = new AbortController();
    controller.current = abort;
    const epoch = scope.current.epoch;
    return {
      signal: abort.signal,
      valid: () =>
        mounted.current &&
        !abort.signal.aborted &&
        epoch === scope.current.epoch,
    };
  }
  async function reload(signal: AbortSignal, valid: () => boolean) {
    const loaded = await loadWorkspace(
      context.projectCode,
      years,
      authToken(),
      signal,
    );
    if (valid()) {
      setDocuments(loaded.documents);
      // Replacing/reparsing the initiation report invalidates images from its previous version.
      const initiation = loaded.documents.slots.find(
        (slot) => slot.documentSlotCode === "PROJECT_INITIATION_REPORT",
      );
      window.__PPT_REPORT_FILE_WORKSPACE?.syncAssetSource(
        context.projectCode,
        JSON.stringify(initiation?.file ?? null),
      );
      const loadedYears = [
        ...loaded.documents.slots
          .filter(
            (slot) => slot.documentSlotCode === "FINANCIAL_REPORT" && slot.file,
          )
          .map((slot) => Number(slot.periodKey)),
        ...Object.values(loaded.fields)
          .filter(
            (field) =>
              METRICS.some((metric) => metric.code === field.code) &&
              field.value.trim(),
          )
          .map((field) => Number(field.period)),
      ];
      includeFinancialYears(loadedYears);
      setFields((old) =>
        mergeWorkspaceFields(
          applyRecordedScanFailures(scanReviewScope(), loaded.fields),
          old,
        ),
      );
    }
    return loaded;
  }
  async function refresh() {
    if (busy) return;
    const op = operation();
    setBusy(true);
    setError("");
    try {
      await reload(op.signal, op.valid);
      if (op.valid())
        setNotice("已读取当前项目资料与字段。黄色结果请对照来源复核。");
    } catch (e) {
      if (op.valid())
        setError(e instanceof Error ? e.message : "读取失败，请重试。");
    } finally {
      if (op.valid()) setBusy(false);
    }
  }
  // Replay server-confirmed document results; no upload, model call or new confirmation.
  async function financialDemo() {
    if (
      busy ||
      !import.meta.env.DEV ||
      !/^FILETEST-.*-YHX$/.test(context.projectCode)
    )
      return;
    const op = operation();
    setBusy(true);
    setError("");
    try {
      const loaded = await loadWorkspace(
        context.projectCode,
        [],
        authToken(),
        op.signal,
      );
      if (!op.valid()) return;
      const selected = Object.values(
        applyRecordedScanFailures(scanReviewScope(), loaded.fields),
      ).filter(
        (field) =>
          METRICS.some((metric) => metric.code === field.code) &&
          field.state === "confirmed" &&
          field.persisted &&
          !field.scanFailure &&
          field.evidence.length > 0 &&
          field.value.trim(),
      );
      const demoYears = sortedFinancialYears(
        selected.map((field) => Number(field.period)),
      ).slice(0, MAX_REPORT_YEARS);
      const selectedForReport = selected.filter((field) =>
        demoYears.includes(Number(field.period)),
      );
      if (!selectedForReport.length)
        throw new Error("当前项目没有已核对的财务解析结果。");
      const bridge = window.__PPT_REPORT_FILE_WORKSPACE;
      if (
        !bridge?.apply(
          context.projectCode,
          toReportFields(selectedForReport),
          6,
          demoYears,
        )
      )
        throw new Error("报告项目已变化，请重新选择。");
      setCategory("financial");
      setDocuments(loaded.documents);
      setFields(
        Object.fromEntries(
          selectedForReport.map((field) => [
            identity(field.code, field.period, field.subject),
            field,
          ]),
        ),
      );
      setFinancialPeriods({
        columns: demoYears.map((year) => ({ key: String(year), year })),
        reportYears: demoYears,
        reportChoiceTouched: true,
        excludedYears: [],
      });
      const result = await bridge.supplementFinancial();
      if (!op.valid()) return;
      setNotice(
        `文件解析${selectedForReport.length}项，接口补充${result.applied}项${result.isMock ? "（本地样例接口）" : ""}。`,
      );
      bridge.preview(6);
    } catch (e) {
      if (op.valid())
        setError(e instanceof Error ? e.message : "财务演示加载失败。");
    } finally {
      if (op.valid()) setBusy(false);
    }
  }
  async function parse() {
    if (!context.projectCode) {
      setError("请先选择项目。");
      return;
    }
    if (!authToken()) {
      setError(
        "请先登录平台，再上传资料并使用解析服务。人工核对填写可先在当前草稿中操作。",
      );
      return;
    }
    const pending = queue.filter(
      (q) =>
        q.category === category &&
        (q.state === "waiting" || q.state === "failed") &&
        (category !== "financial" ||
          (q.yearsConfirmed && chosenYears(q).length > 0)),
    );
    if (!pending.length) {
      setError(
        category === "financial"
          ? "请先为文件选择并确认报表年份，再开始解析。"
          : "请先拖入需要解析的文件。",
      );
      return;
    }
    if (category === "financial" && unresolvedYears.length) {
      setError(
        `${unresolvedYears.join("、")}年有多份文件，请先选择该年度采用的来源。`,
      );
      return;
    }
    const targets = pending.flatMap((item) =>
      category === "financial"
        ? chosenYears(item)
            .filter((year) => !item.uploadedYears.includes(year))
            .map((year) => ({ item, year }))
        : [{ item, year: 0 }],
    );
    if (
      category === "post" &&
      pending.some(
        (q) =>
          !q.priorProject.trim() ||
          q.priorProject.trim() === context.projectCode,
      )
    ) {
      setError("请填写每份后评价报告所属的前序项目编号，不能填当前项目编号。");
      return;
    }
    const op = operation();
    setBusy(true);
    setError("");
    try {
      // Read before upload: never silently replace an existing source file.
      const existing = await reload(op.signal, op.valid);
      const slotsToReplace = targets.filter(({ year }) =>
        existing.documents.slots.some(
          (s) =>
            s.documentSlotCode === currentCategory.slot &&
            s.periodKey ===
              (category === "financial" ? String(year) : "not_applicable") &&
            s.file,
        ),
      );
      if (
        category !== "property" &&
        slotsToReplace.length &&
        !replaceApproved
      ) {
        if (op.valid()) {
          setReplaceApproved(true);
          setError(
            "此类别已有资料。已保留原文件；如需替换，请再次点击“开始解析”。",
          );
        }
        return;
      }
      for (const { item, year } of targets) {
        if (!op.valid()) return;
        setQueue((old) =>
          old.map((q) =>
            q.id === item.id
              ? { ...q, state: "uploading", error: undefined }
              : q,
          ),
        );
        const form = new FormData();
        form.append("file", item.file);
        const suffix =
          category === "post"
            ? `document-derivations/post-investment/upload?priorProjectCode=${encodeURIComponent(item.priorProject.trim())}&replace=${replaceApproved}`
            : `documents/${currentCategory.slot}?periodKey=${category === "financial" ? year : "not_applicable"}&replace=${replaceApproved}&append=${category === "property"}`;
        try {
          await request(
            context.projectCode,
            suffix,
            authToken(),
            op.signal,
            form,
          );
          if (op.valid())
            setQueue((old) =>
              old.map((q) =>
                q.id === item.id
                  ? {
                      ...q,
                      uploadedYears:
                        category === "financial"
                          ? sortedFinancialYears([...q.uploadedYears, year])
                          : q.uploadedYears,
                      state:
                        category === "financial" &&
                        chosenYears(q).some(
                          (targetYear) =>
                            targetYear !== year &&
                            !q.uploadedYears.includes(targetYear),
                        )
                          ? "uploading"
                          : "submitted",
                    }
                  : q,
              ),
            );
        } catch (e) {
          if (op.valid())
            setQueue((old) =>
              old.map((q) =>
                q.id === item.id
                  ? {
                      ...q,
                      state: "failed",
                      error: e instanceof Error ? e.message : "上传失败",
                    }
                  : q,
              ),
            );
          throw e;
        }
      }
      setReplaceApproved(false);
      // Bounded polling. A slow worker stays visible and can be refreshed later.
      for (let attempt = 0; attempt < 20 && op.valid(); attempt++) {
        const loaded = await reload(op.signal, op.valid);
        if (
          !loaded.documents.slots
            .filter((slot) => slot.documentSlotCode === currentCategory.slot)
            .some((s) =>
              [s.file, ...(s.files ?? [])].some(
                (f) =>
                  f && ["QUEUED", "PROCESSING", "STORED"].includes(f.status),
              ),
            )
        )
          break;
        await new Promise<void>((resolve) => {
          const timer = window.setTimeout(resolve, 2000);
          op.signal.addEventListener(
            "abort",
            () => {
              window.clearTimeout(timer);
              resolve();
            },
            { once: true },
          );
        });
      }
      if (op.valid())
        setNotice(
          category === "post"
            ? "后评价报告已读取，请核对项目总结及来源后再确认填入。"
            : `资料已提交。解析完成后按年份核对字段。${category === "financial" && financialQueue.some((item) => !item.yearsConfirmed) ? "待确认年份的文件尚未上传，不会填入报告。" : "仍在解析中的资料可稍后刷新结果。"}`,
        );
    } catch (e) {
      if (op.valid())
        setError(e instanceof Error ? e.message : "解析失败，请重试。");
    } finally {
      if (op.valid()) setBusy(false);
    }
  }
  async function derive(kind: "finance" | "emc" | "post-investment/sync") {
    if (busy) return;
    if (!authToken()) {
      setError("请先登录平台，再使用解析和分析服务。");
      setDeriveFeedback({ kind, message: "请先登录平台，再使用解析和分析服务。", failed: true });
      return;
    }
    const op = operation();
    setBusy(true);
    setDeriving(kind);
    setDeriveFeedback(null);
    setError("");
    try {
      const result = await request<{
        items?: { status: string; errorCode?: string }[];
      }>(
        context.projectCode,
        `document-derivations/${kind}`,
        authToken(),
        op.signal,
        "{}",
      );
      await reload(op.signal, op.valid);
      if (op.valid()) {
        const failed =
          result.items?.filter((i) => i.status === "FAILED").length ?? 0;
        const message = failed
            ? `读取结束，有${failed}份后评价资料未能提取，请检查原文件。`
            : kind === "post-investment/sync"
              ? "已读取结果，请在右侧核对来源后确认。"
              : "分析已生成，请核对下方文字，再确认并填入报告。";
        setNotice(message);
        setDeriveFeedback({ kind, message, failed: failed > 0 });
      }
    } catch (e) {
      if (op.valid()) {
        const message = e instanceof Error ? e.message : "处理失败。";
        setError(message);
        setDeriveFeedback({ kind, message, failed: true });
      }
    } finally {
      if (op.valid()) {
        setBusy(false);
        setDeriving(null);
      }
    }
  }
  function analysisFeedback(kind: "finance" | "emc") {
    const feedback = deriveFeedback?.kind === kind ? deriveFeedback : null;
    return (
      <div aria-live="polite" style={{ marginBottom: 16 }}>
        <Typography.Paragraph type="secondary">
          {kind === "finance"
            ? "先核对上方财务数据，并点击下方“确认并填入报告”保存确认，再生成财务分析。黄色数据尚待核对；生成的分析文字也需再次核对确认。"
            : "先核对合同期限和关键条款，并点击下方“确认并填入报告”，再生成条款总结。"}
        </Typography.Paragraph>
        {deriving === kind && <Alert type="info" showIcon title="正在生成分析，请稍候，无需重复点击。" />}
        {feedback && <Alert type={feedback.failed ? "warning" : "success"} showIcon title={feedback.message} />}
      </div>
    );
  }
  function visibleFields(): Field[] {
    if (category === "initiation") return [findField(fields, "zczbj")];
    if (category === "property") return [findField(fields, "wdcqf")];
    if (category === "financial")
      return [
        ...METRICS.flatMap((m) =>
          years.map((y) => findField(fields, m.code, String(y))),
        ),
        ...ANALYSES.map((a) => findField(fields, a.code)),
      ];
    if (category === "emc")
      return [
        "contract_term",
        "contract_key_clauses",
        "emcBusinessSummary",
      ].map((c) => findField(fields, c));
    return Object.values(fields).filter(
      (f) => f.code === "postInvestmentProjectSummary",
    );
  }
  function applyConfirmed() {
    const selected=visibleFields().filter(field=>field.state === 'confirmed' && field.persisted && !field.stale && !field.scanFailure && field.value.trim());
    if(category === 'financial' && !reportYears.length) {setError('请选择填入报告的年度。');return;}
    const filtered=category === 'financial' ? selected.filter(field=>!METRICS.some(metric=>metric.code === field.code)||reportYears.includes(Number(field.period))) : selected;
    const report=toReportFields(filtered);
    if (category === 'post') report.priorPostEvalItemsJson = JSON.stringify(filtered.filter(f => f.code === 'postInvestmentProjectSummary').map(f => ({projectCode: f.subject.replace('prior_project:', ''), summary: f.value})));
    if(category === 'post') report.priorPostEval=filtered.map(field=>`${field.subject.replace('prior_project:','')}：${field.value}`).join('\n\n');
    const applied=window.__PPT_REPORT_FILE_WORKSPACE?.apply(context.projectCode,report,currentCategory.page,category === 'financial'?reportYears:undefined);
    if(applied) {setError('');setNotice(`已填入${Object.keys(report).length}项已确认字段；待核对结果保持原状态。`);}
    else setError('当前类别没有已确认的可填字段。');
  }
  async function confirm() {
    const selected = visibleFields().filter(
      (f) => !f.scanFailure && f.value.trim() && f.value !== "未扫描成功",
    );
    if (!selected.length) {
      setError("当前类别尚无可填写的字段，请先解析或人工填写。");
      return;
    }
    if (selected.some((f) => f.stale && f.value === f.original)) {
      setError("分析依据已经变化，请先重新生成分析，再核对确认。");
      return;
    }
    if (
      category === "financial" &&
      (!reportYears.length || reportYears.length > MAX_REPORT_YEARS)
    ) {
      setError("请先选择填入报告的年度（最多3年，可不连续）。");
      return;
    }
    if (
      category === "financial" &&
      reportYears.some(
        (year) =>
          unresolvedYears.includes(year) ||
          financialQueue.some(
            (item) =>
              chosenYears(item).includes(year) &&
              (!item.yearsConfirmed || !item.uploadedYears.includes(year)),
          ),
      )
    ) {
      setError("所选年度仍有待确认或待解析的文件，请先核对年份并完成解析。");
      return;
    }
    const report = toReportFields(
      category === "financial"
        ? selected.filter(
            (field) =>
              !METRICS.some((metric) => metric.code === field.code) ||
              reportYears.includes(Number(field.period)),
          )
        : selected,
    );
    if (category === "post") report.priorPostEvalItemsJson = JSON.stringify(selected.filter(f => f.code === "postInvestmentProjectSummary").map(f => ({ projectCode: f.subject.replace("prior_project:", ""), summary: f.value })));
    if (category === "post")
      report.priorPostEval = selected
        .filter((f) => f.code === "postInvestmentProjectSummary")
        .map((f) => `${f.subject.replace("prior_project:", "")}：${f.value}`)
        .join("\n\n");
    const op = operation();
    setBusy(true);
    setError("");
    setDeriveFeedback(null);
    let saved = 0;
    const savedFields: Fields = {};
    try {
      if (authToken())
        for (const field of selected) {
          if (!op.valid()) return;
          const stored = await saveField(
            context.projectCode,
            field,
            authToken(),
            op.signal,
          );
          if (stored) {
            saved++;
            savedFields[identity(field.code, field.period, field.subject)] =
              stored;
          }
        }
      if (!op.valid()) return;
      if (
        !window.__PPT_REPORT_FILE_WORKSPACE?.apply(
          context.projectCode,
          report,
          currentCategory.page,
          category === "financial" ? reportYears : undefined,
        )
      )
        throw new Error("报告项目已变化或报告尚未就绪，请刷新后重新核对。");
      setFields((old) => {
        const next = { ...old };
        for (const field of selected)
          next[identity(field.code, field.period, field.subject)] = savedFields[
            identity(field.code, field.period, field.subject)
          ] ?? { ...field, state: "confirmed", persisted: false };
        return next;
      });
      setNotice(
        `已将${Object.keys(report).length}项填入当前报告草稿。${saved === selected.length ? "字段已保存服务器。" : `其中${selected.length - saved}项仅保存在当前页面，关闭页面前请保存报告。`}`,
      );
    } catch (e) {
      if (op.valid()) {
        setFields((old) => ({ ...old, ...savedFields }));
        setError(e instanceof Error ? e.message : "确认失败。");
      }
    } finally {
      if (op.valid()) setBusy(false);
    }
  }
  function fieldInput(field: Field, label: string, multiline = false) {
    const warning =
      field.scanFailure || (field.value.trim() && field.state !== "confirmed");
    const style = warning ? { background: colors.colorWarningBg } : undefined;
    const value = field.scanFailure ? "" : field.value;
    const placeholder = field.scanFailure ? "未扫描成功" : "";
    return (
      <div
        style={{ marginBottom: 16 }}
        key={identity(field.code, field.period, field.subject)}
      >
        <Space wrap style={{ marginBottom: 6 }}>
          <Typography.Text strong>{label}</Typography.Text>
          {(!!field.evidence.length || !!field.scanFailure) && (
            <Button size="small" type="link" onClick={() => setEvidence(field)}>
              查看来源
            </Button>
          )}
        </Space>
        {field.code === "fkxz4" ? (
          <Select
            aria-label={label}
            value={value || undefined}
            placeholder={placeholder}
            status={field.scanFailure ? "warning" : undefined}
            disabled={busy}
            style={{ width: "100%" }}
            onChange={(value) => edit(field, value)}
            options={[
              { value: "MATCHED", label: "符合" },
              { value: "NOT_MATCHED", label: "不符合" },
              { value: "NEEDS_CONFIRMATION", label: "待确认" },
            ]}
          />
        ) : multiline ? (
          <Input.TextArea
            aria-label={label}
            value={value}
            placeholder={placeholder}
            title={field.scanFailure}
            status={field.scanFailure ? "warning" : undefined}
            onChange={(e) => edit(field, e.target.value)}
            autoSize={{ minRows: 3, maxRows: 12 }}
            disabled={busy}
            style={style}
          />
        ) : (
          <Input
            aria-label={label}
            value={value}
            placeholder={placeholder}
            title={field.scanFailure}
            status={field.scanFailure ? "warning" : undefined}
            onChange={(e) => edit(field, e.target.value)}
            disabled={busy}
            style={style}
          />
        )}
      </div>
    );
  }
  const postSummaries = Object.values(fields).filter(
    (f) => f.code === "postInvestmentProjectSummary",
  );
  const remoteFiles = documents.slots
    .filter((s) => s.documentSlotCode === currentCategory.slot)
    .flatMap((s) => (s.files?.length ? s.files : s.file ? [s.file] : []));
  return (
    <Card
      title="文件资料解析"
      size="small"
      className={`file-parser-supplement${expanded ? " is-expanded" : ""}`}
      extra={
        <Space>
          {import.meta.env.DEV &&
            /^FILETEST-.*-YHX$/.test(context.projectCode) && (
              <Button
                size="small"
                disabled={busy}
                onClick={() => void financialDemo()}
              >
                财务演示
              </Button>
            )}
          <Button size="small" onClick={() => setExpanded((value) => !value)}>
            {expanded ? "收起" : "展开"}
          </Button>
        </Space>
      }
    >
      <span
        role="status"
        style={{
          position: "absolute",
          width: 1,
          height: 1,
          padding: 0,
          margin: -1,
          overflow: "hidden",
          clipPath: "inset(50%)",
          whiteSpace: "nowrap",
        }}
      >
        {notice}
      </span>
      <Space orientation="vertical" size={16} style={{ width: "100%" }}>
        {error && (
          <Alert
            showIcon
            type="warning"
            title={error}
            closable
            onClose={() => setError("")}
          />
        )}
        <Tabs
          activeKey={category}
          onChange={(key) => {
            setCategory(key as Category);
            setDeriveFeedback(null);
            setError("");
            setReplaceApproved(false);
          }}
          items={CATEGORIES.map((c) => ({
            key: c.key,
            label: c.label,
            disabled: busy,
          }))}
        />
        <Row gutter={[20, 20]}>
          <Col xs={24} md={category === "financial" ? 8 : 9}>
            <Space orientation="vertical" size={12} style={{ width: "100%" }}>
              <Typography.Title level={5} style={{ margin: 0 }}>
                上传{currentCategory.label}
              </Typography.Title>
              <Upload.Dragger
                accept={currentCategory.accept}
                multiple={
                  category === "financial" ||
                  category === "property" ||
                  category === "post"
                }
                disabled={busy || !context.projectCode}
                showUploadList={false}
                beforeUpload={(file) => {
                  const reason = validateFile(category, file);
                  if (reason) {
                    setError(reason);
                    return Upload.LIST_IGNORE;
                  }
                  const nameYears =
                    category === "financial"
                      ? financialYearsFromName(file.name)
                      : [];
                  if (
                    sortedFinancialYears([...years, ...nameYears]).length >
                    MAX_FINANCIAL_YEARS
                  ) {
                    setError("最多核对10个年度的资料。");
                    return Upload.LIST_IGNORE;
                  }
                  includeFinancialYears(nameYears);
                  setQueue((old) => [
                    ...(category === "initiation" || category === "emc"
                      ? old.filter((q) => q.category !== category)
                      : old),
                    {
                      id: file.uid,
                      file,
                      category,
                      years:
                        category === "financial"
                          ? financialYearsFromName(file.name)
                          : [],
                      yearsConfirmed: false,
                      uploadedYears: [],
                      priorProject: category === "post" ? window.__PPT_REPORT_FILE_WORKSPACE?.priorDefaultProjectCode?.() || "" : "",
                      state: "waiting",
                    },
                  ]);
                  setError("");
                  setReplaceApproved(false);
                  return false;
                }}
              >
                <p>
                  <InboxOutlined
                    style={{ fontSize: 32, color: colors.colorPrimary }}
                  />
                </p>
                <p>选择文件</p>
              </Upload.Dragger>
              {category === "financial" &&
                duplicateYears.map((year) => (
                  <Card
                    key={year}
                    size="small"
                    style={{ background: colors.colorWarningBg }}
                  >
                    <Typography.Text strong>{year}年文件来源</Typography.Text>
                    <Select
                      aria-label={`${year}年采用的文件`}
                      style={{ width: "100%", marginTop: 8 }}
                      value={yearSources[String(year)] || undefined}
                      placeholder=""
                      disabled={busy}
                      options={financialQueue
                        .filter((item) => item.years.includes(year))
                        .map((item) => ({
                          value: item.id,
                          label: item.file.name,
                        }))}
                      onChange={(value) => {
                        setYearSources((old) => ({
                          ...old,
                          [String(year)]: value,
                        }));
                        setReplaceApproved(false);
                        setError("");
                      }}
                    />
                  </Card>
                ))}
              {queue
                .filter((q) => q.category === category)
                .map((q) => (
                  <Card size="small" key={q.id}>
                    <Typography.Text style={{ overflowWrap: "anywhere" }}>
                      {q.file.name}
                    </Typography.Text>
                    <div>
                      <Tag
                        color={
                          q.state === "failed"
                            ? "error"
                            : q.state === "submitted"
                              ? "processing"
                              : "default"
                        }
                      >
                        {
                          {
                            waiting: "待上传",
                            uploading: "上传中",
                            submitted: "已提交",
                            failed: "失败，可重试",
                          }[q.state]
                        }
                      </Tag>
                      <Button
                        size="small"
                        type="link"
                        disabled={busy}
                        onClick={() =>
                          setQueue((old) =>
                            old.filter((item) => item.id !== q.id),
                          )
                        }
                      >
                        移除
                      </Button>
                    </div>
                    {category === "financial" && (
                      <Space orientation="vertical" style={{ width: "100%" }}>
                        <Select
                          mode="tags"
                          aria-label={`${q.file.name}所属年度`}
                          style={{ width: "100%" }}
                          value={q.years.map(String)}
                          placeholder="所属年度"
                          disabled={busy || q.uploadedYears.length > 0}
                          options={years.map((year) => ({
                            value: String(year),
                            label: `${year}年`,
                          }))}
                          tokenSeparators={[",", "，"]}
                          onChange={(values) => setFileYears(q.id, values)}
                        />
                        <Tag
                          color={
                            q.years.some((year) =>
                              duplicateYears.includes(year),
                            )
                              ? "error"
                              : q.yearsConfirmed
                                ? "success"
                                : "warning"
                          }
                        >
                          {q.years.some((year) => duplicateYears.includes(year))
                            ? q.years.some((year) =>
                                unresolvedYears.includes(year),
                              )
                              ? "待选来源"
                              : chosenYears(q).length
                                ? "已选择年度来源"
                                : "此年度采用其他文件"
                            : q.yearsConfirmed
                              ? "年份已确认"
                              : q.years.length
                                ? "待确认"
                                : "待确认年份"}
                        </Tag>
                        {!q.yearsConfirmed && q.years.length > 0 && (
                          <Button
                            size="small"
                            disabled={busy}
                            onClick={() =>
                              setFileYears(q.id, q.years.map(String))
                            }
                          >
                            确认年份
                          </Button>
                        )}
                      </Space>
                    )}
                    {category === "post" && (
                      <Input
                        aria-label={`${q.file.name}前序项目编号`}
                        placeholder={window.__PPT_REPORT_FILE_WORKSPACE?.priorProjectCodes?.().join("、") || "前序项目编号"}
                        value={q.priorProject}
                        disabled={busy}
                        onChange={(e) =>
                          setQueue((old) =>
                            old.map((item) =>
                              item.id === q.id
                                ? { ...item, priorProject: e.target.value }
                                : item,
                            ),
                          )
                        }
                      />
                    )}
                    {q.error && (
                      <Typography.Text type="danger">{q.error}</Typography.Text>
                    )}
                  </Card>
                ))}
              {remoteFiles.map((f) => (
                <div key={f.fileId}>
                  <Tag
                    color={
                      f.status === "FAILED"
                        ? "error"
                        : f.status === "READY"
                          ? "success"
                          : "processing"
                    }
                  >
                    {fileStatus[f.status] ?? f.status}
                  </Tag>
                  <Typography.Text>{f.originalName}</Typography.Text>
                  {f.errorMessage && (
                    <Typography.Text type="danger">
                      {f.errorMessage}
                    </Typography.Text>
                  )}
                </div>
              ))}
              <Space wrap>
                <Button disabled={busy || !context.projectCode} onClick={applyConfirmed}>
                  填入已确认字段
                </Button>
                <Button
                  type="primary"
                  loading={busy}
                  onClick={() => void parse()}
                >
                  开始解析
                </Button>
                <Button
                  disabled={busy || !context.projectCode}
                  onClick={() => void refresh()}
                >
                  刷新结果
                </Button>
                {category === "post" && (
                  <Button
                    disabled={busy}
                    onClick={() => void derive("post-investment/sync")}
                  >
                    从OA读取
                  </Button>
                )}
              </Space>
            </Space>
          </Col>
          <Col xs={24} md={category === "financial" ? 16 : 15}>
            <Card size="small" title="字段预览与填写">
              {category === "initiation" && (
                <>
                  {fieldInput(findField(fields, "zczbj"), "用电企业注册资本（万元）")}
                  <InitiationAssets
                    projectCode={context.projectCode}
                    sourceFileId={documents.slots.find(slot => slot.documentSlotCode === "PROJECT_INITIATION_REPORT")?.file?.fileId}
                    sourceVersion={documents.slots.find(slot => slot.documentSlotCode === "PROJECT_INITIATION_REPORT")?.file?.version}
                    sourceFileName={documents.slots.find(slot => slot.documentSlotCode === "PROJECT_INITIATION_REPORT")?.file?.originalName}
                    parserStatus={documents.slots.find(slot => slot.documentSlotCode === "PROJECT_INITIATION_REPORT")?.file?.status}
                  />
                </>
              )}
              {category === "property" &&
                fieldInput(findField(fields, "wdcqf"), "屋顶产权方名称")}
              {category === "financial" && (
                <>
                  <Space wrap style={{ marginBottom: 12 }}>
                    <Typography.Text>填入报告的年度</Typography.Text>
                    <Select
                      mode="multiple"
                      aria-label="填入报告的年度"
                      value={reportYears}
                      maxCount={MAX_REPORT_YEARS}
                      placeholder=""
                      style={{ minWidth: 260 }}
                      disabled={busy}
                      options={years.map((year) => ({
                        value: year,
                        label: `${year}年`,
                      }))}
                      onChange={(value) =>
                        setFinancialPeriods((old) => ({
                          ...old,
                          reportYears: sortedFinancialYears(value),
                          reportChoiceTouched: true,
                        }))
                      }
                    />
                    <Button
                      size="small"
                      disabled={
                        busy ||
                        financialPeriods.columns.length >= MAX_FINANCIAL_YEARS
                      }
                      onClick={() =>
                        setFinancialPeriods((old) => ({
                          ...old,
                          columns: [
                            ...old.columns,
                            { key: crypto.randomUUID(), year: null },
                          ],
                        }))
                      }
                    >
                      添加年度
                    </Button>
                  </Space>
                  <Table
                    size="small"
                    pagination={false}
                    rowKey="code"
                    dataSource={[...METRICS]}
                    scroll={{
                      x: Math.max(
                        540,
                        128 + financialPeriods.columns.length * 128,
                      ),
                    }}
                    columns={[
                      {
                        title: "字段 / 单位",
                        dataIndex: "label",
                        width: 128,
                        render: (_, m: (typeof METRICS)[number]) => (
                          <Typography.Text style={{ fontSize: 13 }}>
                            {m.label}（{m.unit}）
                          </Typography.Text>
                        ),
                      },
                      ...[...financialPeriods.columns]
                        .sort((a, b) => (b.year ?? -1) - (a.year ?? -1))
                        .map((column, columnIndex) => ({
                          title: (
                            <Space orientation="vertical" size={4}>
                              <FinancialYearHeader
                                year={column.year}
                                label={`第${columnIndex + 1}列报表年份`}
                                disabled={
                                  busy ||
                                  (column.year !== null &&
                                    yearHasData(column.year))
                                }
                                onCommit={(year) =>
                                  setColumnYear(column.key, year)
                                }
                              />
                              <Button
                                size="small"
                                type="text"
                                danger
                                disabled={busy}
                                aria-label={
                                  column.year === null
                                    ? `移除第${columnIndex + 1}个空白年度列`
                                    : `移除${column.year}年度`
                                }
                                onClick={() => removeColumn(column.key)}
                              >
                                移除
                              </Button>
                              {column.year !== null &&
                                duplicateYears.includes(column.year) && (
                                  <Tag color="warning">待核对</Tag>
                                )}
                            </Space>
                          ),
                          key: column.key,
                          width: 128,
                          render: (_: unknown, m: (typeof METRICS)[number]) => {
                            const y = column.year;
                            const field = findField(fields, m.code, String(y));
                            return (
                              <Space orientation="vertical" size={0}>
                                <Input
                                  aria-label={
                                    y === null
                                      ? `待填写年份第${columnIndex + 1}列${m.label}`
                                      : `${y}年${m.label}`
                                  }
                                  value={
                                    y === null || field.scanFailure
                                      ? ""
                                      : field.value
                                  }
                                  placeholder={
                                    y !== null && field.scanFailure
                                      ? "未扫描成功"
                                      : ""
                                  }
                                  title={field.scanFailure}
                                  status={
                                    field.scanFailure ? "warning" : undefined
                                  }
                                  disabled={busy || y === null}
                                  onChange={(e) => edit(field, e.target.value)}
                                  style={
                                    field.scanFailure ||
                                    (field.value &&
                                      field.state !== "confirmed") ||
                                    (y !== null && duplicateYears.includes(y))
                                      ? { background: colors.colorWarningBg }
                                      : undefined
                                  }
                                />
                                {(!!field.evidence.length ||
                                  !!field.scanFailure) && (
                                  <Button
                                    size="small"
                                    type="link"
                                    onClick={() => setEvidence(field)}
                                  >
                                    来源
                                  </Button>
                                )}
                              </Space>
                            );
                          },
                        })),
                    ]}
                  />
                  <Space style={{ marginBlock: 16 }}>
                    <Button
                      disabled={busy}
                      loading={deriving === "finance"}
                      onClick={() => void derive("finance")}
                    >
                      生成财务分析
                    </Button>
                  </Space>
                  {analysisFeedback("finance")}
                  {ANALYSES.map((a) =>
                    fieldInput(findField(fields, a.code), a.label, true),
                  )}
                </>
              )}
              {category === "emc" && (
                <>
                  {fieldInput(
                    findField(fields, "contract_term"),
                    "合同期限",
                    true,
                  )}
                  {fieldInput(
                    findField(fields, "contract_key_clauses"),
                    "合同关键条款原文",
                    true,
                  )}
                  <Button
                    disabled={busy}
                    style={{ marginBottom: 16 }}
                    loading={deriving === "emc"}
                    onClick={() => void derive("emc")}
                  >
                    生成EMC商务条款总结
                  </Button>
                  {analysisFeedback("emc")}
                  {fieldInput(
                    findField(fields, "emcBusinessSummary"),
                    "EMC商务条款总结",
                    true,
                  )}
                </>
              )}
              {category === "post" &&
                (postSummaries.length ? (
                  postSummaries.map((f) => (
                    <div key={identity(f.code, f.period, f.subject)}>
                      {fieldInput(
                        f,
                        `${f.subject.replace("prior_project:", "")} · 项目总结`,
                        true,
                      )}
                    </div>
                  ))
                ) : (
                  <div style={{ marginBottom: 16 }}>
                    <Typography.Text strong>项目总结</Typography.Text>
                    <Input.TextArea
                      aria-label="项目总结"
                      placeholder={
                        remoteFiles.some((file) =>
                          ["READY", "FAILED"].includes(file.status),
                        )
                          ? "未扫描成功"
                          : ""
                      }
                      status={
                        remoteFiles.some((file) =>
                          ["READY", "FAILED"].includes(file.status),
                        )
                          ? "warning"
                          : undefined
                      }
                      disabled
                      rows={6}
                      style={{ marginTop: 6 }}
                    />
                  </div>
                ))}
              <Space wrap>
                <Button
                  type="primary"
                  disabled={busy || !context.projectCode}
                  onClick={() => void confirm()}
                >
                  确认并填入报告
                </Button>
                <Button
                  disabled={busy}
                  onClick={() =>
                    window.__PPT_REPORT_FILE_WORKSPACE?.preview(
                      currentCategory.page,
                    )
                  }
                >
                  查看报告对应页
                </Button>
              </Space>
            </Card>
          </Col>
        </Row>
      </Space>
      <Modal
        title="字段来源"
        open={!!evidence}
        onCancel={() => setEvidence(null)}
        footer={
          <Space>
            {!!evidence?.value.trim() && !evidence.scanFailure && (
              <Button onClick={() => evidence && markScanFailed(evidence)}>
                标记未扫描成功
              </Button>
            )}
            <Button onClick={() => setEvidence(null)}>关闭</Button>
          </Space>
        }
      >
        {evidence?.scanFailure && (
          <Typography.Paragraph type="warning">
            {evidence.scanFailure}
          </Typography.Paragraph>
        )}
        {evidence?.evidence.map((source, i) => (
          <div key={i}>
            <Typography.Paragraph strong>
              {source.sourceFileName || "来源材料"}
              {source.page !== null ? ` · 第${source.page}页` : ""}
            </Typography.Paragraph>
            <Typography.Paragraph style={{ whiteSpace: "pre-wrap" }}>
              {source.sourceText}
            </Typography.Paragraph>
          </div>
        ))}
      </Modal>
    </Card>
  );
}
