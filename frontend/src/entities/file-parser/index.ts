// src/entities/file-parser/index.ts
export type Category = "initiation" | "property" | "financial" | "emc" | "post";
export const CATEGORIES = [
  {
    key: "initiation",
    label: "立项报告",
    slot: "PROJECT_INITIATION_REPORT",
    accept: ".pdf",
    page: 20,
  },
  {
    key: "property",
    label: "产权文件",
    slot: "PROPERTY_DOCUMENT",
    accept: ".pdf,.jpg,.jpeg,.png",
    page: 5,
  },
  {
    key: "financial",
    label: "财务报告",
    slot: "FINANCIAL_REPORT",
    accept: ".pdf,.xlsx",
    page: 6,
  },
  {
    key: "emc",
    label: "EMC合同及补充协议",
    slot: "EMC_CONTRACT",
    accept: ".pdf",
    page: 10,
  },
  {
    key: "post",
    label: "后评价报告",
    slot: "POST_INVESTMENT_EVALUATION",
    accept: ".pdf,.pptx",
    page: 12,
  },
] as const;
export const METRICS = [
  { code: "zzc", label: "总资产", unit: "万元", legacy: "totalAssets" },
  { code: "jzc", label: "净资产", unit: "万元", legacy: "netAssets" },
  { code: "yysr", label: "营业收入", unit: "万元", legacy: "operatingRevenue" },
  { code: "jlr", label: "净利润", unit: "万元", legacy: "netProfit" },
  { code: "hbzj", label: "货币资金", unit: "万元", legacy: "cashFunds" },
  { code: "jll", label: "净利率", unit: "%", legacy: "netProfitRate" },
  { code: "roe", label: "ROE", unit: "%", legacy: "roe" },
  { code: "ldbl", label: "流动比率", unit: "倍", legacy: "currentRatio" },
  { code: "sdbl", label: "速动比率", unit: "倍", legacy: "quickRatio" },
  { code: "fzl", label: "负债率", unit: "%", legacy: "debtRatio" },
] as const;
export const ANALYSES = [
  { code: "profitabilityAnalysis", label: "盈利能力分析" },
  { code: "operationCashflowAnalysis", label: "经营效率与现金流状况" },
  { code: "assetDebtAnalysis", label: "资产负债情况" },
  { code: "financeSummary", label: "财务及回款风险综合结论" },
  { code: "fkxz4", label: "亏损判断（第9页第4项）" },
] as const;
export type Evidence = {
  sourceFileName: string | null;
  page: number | null;
  sourceText: string;
};
export type Field = {
  code: string;
  period: string;
  subject: string;
  value: string;
  original: string;
  state: "missing" | "parsed" | "edited" | "confirmed" | "conflict";
  evidence: Evidence[];
  fieldId?: string;
  revision?: number;
  parserResultId?: string;
  candidateId?: string;
  stale?: boolean;
  persisted?: boolean;
  scanFailure?: string;
  scanSourceKey?: string;
};
export type Fields = Record<string, Field>;
export function identity(
  code: string,
  period = "not_applicable",
  subject = "",
) {
  return `${code}:${period}:${subject}`;
}
export function displayValue(value: unknown): string {
  if (Array.isArray(value)) return value.map(displayValue).join("\n");
  return typeof value === "string" || typeof value === "number"
    ? String(value)
    : "";
}
export function blank(
  code: string,
  period = "not_applicable",
  subject = "",
): Field {
  return {
    code,
    period,
    subject,
    value: "",
    original: "",
    state: "missing",
    evidence: [],
  };
}
export function findField(
  fields: Fields,
  code: string,
  period = "not_applicable",
  subject?: string,
): Field {
  return (
    Object.values(fields).find(
      (f) =>
        f.code === code &&
        f.period === period &&
        (subject === undefined || f.subject === subject),
    ) ?? blank(code, period, subject)
  );
}
export function validateFile(
  category: Category,
  file: Pick<File, "name" | "size">,
): string | null {
  const extensions = CATEGORIES.find((c) => c.key === category)!.accept.split(
    ",",
  );
  if (
    !extensions.some((extension) => file.name.toLowerCase().endsWith(extension))
  )
    return `文件格式不支持，请选择 ${extensions.join("、")}`;
  if (file.size === 0) return "不能上传空文件。";
  if (file.size > 50 * 1024 * 1024) return "单个文件不能超过50MB。";
  return null;
}
export function inferYear(name: string, fallback: number): number {
  const matches = [...name.matchAll(/(?:19|20)\d{2}/g)].map((m) =>
    Number(m[0]),
  );
  return matches.length === 1 ? matches[0]! : fallback;
}
export function toReportFields(
  fields: readonly Field[],
): Record<string, string> {
  const result: Record<string, string> = {};
  for (const field of fields) {
    if (
      field.scanFailure ||
      !field.value.trim() ||
      field.value === "未扫描成功"
    )
      continue;
    if (field.code === "zczbj") result.userRegisterCapital = field.value;
    else if (field.code === "wdcqf") result.roofOwner = field.value;
    else if (METRICS.some((m) => m.code === field.code)) {
      const metric = METRICS.find((m) => m.code === field.code)!;
      if (/^(?:19|20)\d{2}$/.test(field.period))
        result[`${metric.legacy}${field.period}`] = field.value;
    } else if (field.code === "fkxz4")
      result.fkxz4 =
        field.value === "MATCHED"
          ? "✓"
          : field.value === "NOT_MATCHED"
            ? "不符合"
            : field.value === "NEEDS_CONFIRMATION"
              ? "待确认"
              : field.value;
    else if (ANALYSES.some((a) => a.code === field.code))
      result[field.code] = field.value;
    else if (field.code === "emcBusinessSummary")
      result.emcBusinessSummary = field.value;
    else if (field.code === "contract_term") result.contractTerm = field.value;
    else if (field.code === "contract_key_clauses")
      result.contractKeyClauses = field.value;
  }
  return result;
}

export type FinancialColumn = { key: string; year: number | null };
export type FinancialPeriods = {
  columns: FinancialColumn[];
  reportYears: number[];
  reportChoiceTouched: boolean;
  excludedYears: number[];
};
export function removeFinancialColumn(
  periods: FinancialPeriods,
  key: string,
): FinancialPeriods {
  const removed = periods.columns.find((column) => column.key === key);
  if (!removed) return periods;
  return {
    ...periods,
    columns: periods.columns.filter((column) => column.key !== key),
    reportYears: periods.reportYears.filter((year) => year !== removed.year),
    reportChoiceTouched:
      removed.year === null ? periods.reportChoiceTouched : true,
    excludedYears:
      removed.year === null
        ? (periods.excludedYears ?? [])
        : sortedFinancialYears([
            ...(periods.excludedYears ?? []),
            removed.year,
          ]),
  };
}
export const MAX_FINANCIAL_YEARS = 10;
export const MAX_REPORT_YEARS = 3;
export function validFinancialYear(value: number | null): value is number {
  return (
    value !== null && Number.isInteger(value) && value >= 1902 && value <= 2099
  );
}
export function financialYearsFromName(name: string): number[] {
  return [
    ...new Set(
      [...name.matchAll(/(?<!\d)((?:19|20)\d{2})(?!\d)/g)]
        .map((match) => Number(match[1]))
        .filter(validFinancialYear),
    ),
  ].sort((a, b) => b - a);
}
export function sortedFinancialYears(years: readonly number[]): number[] {
  return [...new Set(years.filter(validFinancialYear))].sort((a, b) => b - a);
}
export function initialFinancialColumns(): FinancialColumn[] {
  return [0, 1, 2].map((index) => ({
    key: `financial-year-${index}`,
    year: null,
  }));
}
export function addFinancialYears(
  columns: readonly FinancialColumn[],
  years: readonly number[],
): FinancialColumn[] {
  const next = columns.map((column) => ({ ...column }));
  for (const year of sortedFinancialYears(years)) {
    if (next.some((column) => column.year === year)) continue;
    const empty = next.find((column) => column.year === null);
    if (empty) empty.year = year;
    else if (next.length < MAX_FINANCIAL_YEARS)
      next.push({ key: `financial-year-added-${year}`, year });
  }
  return next;
}
export function duplicateFinancialYears(
  files: readonly { years: readonly number[] }[],
): number[] {
  const counts = new Map<number, number>();
  for (const file of files)
    for (const year of new Set(file.years))
      counts.set(year, (counts.get(year) ?? 0) + 1);
  return sortedFinancialYears(
    [...counts].filter(([, count]) => count > 1).map(([year]) => year),
  );
}
export function reportYearSelection(
  previous: readonly number[],
  available: readonly number[],
): number[] {
  const retained = sortedFinancialYears(
    previous.filter((year) => available.includes(year)),
  );
  return retained.length
    ? retained.slice(0, MAX_REPORT_YEARS)
    : sortedFinancialYears(available).slice(0, MAX_REPORT_YEARS);
}
export function selectedFileYears(
  file: { id: string; years: readonly number[] },
  duplicates: readonly number[],
  choices: Readonly<Record<string, string>>,
): number[] {
  return file.years.filter(
    (year) => !duplicates.includes(year) || choices[String(year)] === file.id,
  );
}
