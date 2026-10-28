// src/entities/file-parser/financial-years.spec.ts
import { describe, expect, it } from "vitest";
import {
  addFinancialYears,
  duplicateFinancialYears,
  financialYearsFromName,
  initialFinancialColumns,
  removeFinancialColumn,
  type FinancialPeriods,
  reportYearSelection,
  selectedFileYears,
  sortedFinancialYears,
} from "./index";

describe("financial year matching", () => {
  it("removes an extra blank column and permits removing the last remaining column", () => {
    const before: FinancialPeriods = {
      columns: [...initialFinancialColumns(), { key: "extra", year: null }],
      reportYears: [],
      reportChoiceTouched: false,
      excludedYears: [],
    };
    let next = removeFinancialColumn(before, "extra");
    expect(next.columns).toHaveLength(3);
    expect(next.excludedYears).toEqual([]);
    for (const column of [...next.columns])
      next = removeFinancialColumn(next, column.key);
    expect(next.columns).toEqual([]);
    expect(before.columns).toHaveLength(4);
  });
  it("removes a populated year from the view and report selection without substituting another year", () => {
    const before: FinancialPeriods = {
      columns: addFinancialYears(initialFinancialColumns(), [2025, 2023, 2021]),
      reportYears: [2025, 2023],
      reportChoiceTouched: false,
      excludedYears: [],
    };
    const next = removeFinancialColumn(
      before,
      before.columns.find((column) => column.year === 2023)!.key,
    );
    expect(next.columns.map((column) => column.year)).toEqual([2025, 2021]);
    expect(next.reportYears).toEqual([2025]);
    expect(next.excludedYears).toEqual([2023]);
    expect(next.reportChoiceTouched).toBe(true);
    expect(removeFinancialColumn(next, "missing-key")).toBe(next);
  });
  it("starts with blank headers and keeps non-consecutive years exactly as provided", () => {
    expect(
      initialFinancialColumns().every((column) => column.year === null),
    ).toBe(true);
    const columns = addFinancialYears(
      initialFinancialColumns(),
      [2021, 2025, 2023],
    );
    expect(columns.map((column) => column.year)).toEqual([2025, 2023, 2021]);
    expect(sortedFinancialYears([2025, 2021, 2023, 2025])).toEqual([
      2025, 2023, 2021,
    ]);
  });
  it("does not guess a year for an unnamed report or a year embedded in a long account number", () => {
    expect(financialYearsFromName("财务资料.pdf")).toEqual([]);
    expect(financialYearsFromName("附件120251234.pdf")).toEqual([]);
    expect(financialYearsFromName("2025年度报告2025修订.pdf")).toEqual([2025]);
  });
  it("offers every year mentioned in a multi-year filename for explicit user review", () => {
    expect(financialYearsFromName("2025、2023、2021财务报表.xlsx")).toEqual([
      2025, 2023, 2021,
    ]);
  });
  it("adds older years without replacing the existing columns or filling gaps", () => {
    const before = addFinancialYears(
      initialFinancialColumns(),
      [2025, 2023, 2021],
    );
    const after = addFinancialYears(before, [2018]);
    expect(after.map((column) => column.year)).toEqual([
      2025, 2023, 2021, 2018,
    ]);
    expect(after[0]?.key).toBe(before[0]?.key);
  });
  it("flags only periods shared by different files and adopts the chosen source for each year", () => {
    const files = [
      { id: "a", years: [2025, 2023] },
      { id: "b", years: [2023, 2021] },
    ];
    const duplicates = duplicateFinancialYears(files);
    expect(duplicates).toEqual([2023]);
    expect(selectedFileYears(files[0]!, duplicates, {})).toEqual([2025]);
    expect(selectedFileYears(files[0]!, duplicates, { "2023": "b" })).toEqual([
      2025,
    ]);
    expect(selectedFileYears(files[1]!, duplicates, { "2023": "b" })).toEqual([
      2023, 2021,
    ]);
    expect(duplicateFinancialYears([{ years: [2025, 2025] }])).toEqual([]);
  });
  it("retains a report-year choice rather than replacing it with the latest consecutive years", () => {
    expect(reportYearSelection([2021, 2018], [2025, 2023, 2021, 2018])).toEqual(
      [2021, 2018],
    );
    expect(reportYearSelection([], [2025, 2023, 2021, 2018])).toEqual([
      2025, 2023, 2021,
    ]);
  });
});
