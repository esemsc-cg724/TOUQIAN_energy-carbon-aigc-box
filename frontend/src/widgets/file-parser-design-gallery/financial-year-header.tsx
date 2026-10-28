// src/widgets/file-parser-design-gallery/financial-year-header.tsx
import { useEffect, useState } from "react";
import { Input, Space, Typography } from "antd";

type Props = {
  year: number | null;
  label: string;
  disabled: boolean;
  onCommit: (year: number | null) => void;
};
export function FinancialYearHeader({
  year,
  label,
  disabled,
  onCommit,
}: Props) {
  const [draft, setDraft] = useState(year === null ? "" : String(year));
  useEffect(() => setDraft(year === null ? "" : String(year)), [year]);
  function commit() {
    const value = draft.trim();
    if (value === "" || /^(19|20)\d{2}$/.test(value))
      onCommit(value === "" ? null : Number(value));
    setDraft(year === null ? "" : String(year));
  }
  return (
    <Space size={4}>
      <Input
        aria-label={label}
        inputMode="numeric"
        maxLength={4}
        value={draft}
        disabled={disabled}
        placeholder="年份"
        style={{ width: 90 }}
        onChange={(event) => setDraft(event.target.value.replace(/\D/g, ""))}
        onBlur={commit}
        onPressEnter={(event) => event.currentTarget.blur()}
      />
      <Typography.Text>年</Typography.Text>
    </Space>
  );
}
