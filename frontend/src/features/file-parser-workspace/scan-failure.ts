import { identity, type Field, type Fields } from "@/entities/file-parser";

type StorageAccess = Pick<Storage, "getItem" | "setItem">;
type FailureMark = { signature: string; reason: string };
const storageKey = (scope: string) => `file-parser.scan-failures.v1:${scope}`;
const signature = (field: Field) =>
  JSON.stringify([
    field.scanSourceKey,
    field.fieldId,
    field.revision,
    field.parserResultId,
    field.candidateId,
  ]);

function storage(): StorageAccess | undefined {
  try {
    return window.localStorage;
  } catch {
    return undefined;
  }
}
function read(
  scope: string,
  access?: StorageAccess,
): Record<string, FailureMark> {
  try {
    const value: unknown = JSON.parse(
      access?.getItem(storageKey(scope)) ?? "{}",
    );
    if (!value || typeof value !== "object" || Array.isArray(value)) return {};
    return Object.fromEntries(
      Object.entries(value).filter((entry): entry is [string, FailureMark] => {
        const mark: unknown = entry[1];
        return (
          !!mark &&
          typeof mark === "object" &&
          "signature" in mark &&
          typeof mark.signature === "string" &&
          "reason" in mark &&
          typeof mark.reason === "string"
        );
      }),
    );
  } catch {
    return {};
  }
}

// Store review marks only, never source values. A new source/candidate/revision
// automatically invalidates the old mark; scopes separate users and projects.
export function recordScanFailure(
  scope: string,
  field: Field,
  access = storage(),
): boolean {
  if (!access) return false;
  const marks = read(scope, access);
  const key = identity(field.code, field.period, field.subject);
  if (field.scanFailure)
    marks[key] = { signature: signature(field), reason: field.scanFailure };
  else delete marks[key];
  try {
    access.setItem(storageKey(scope), JSON.stringify(marks));
    return true;
  } catch {
    return false;
  }
}

export function applyRecordedScanFailures(
  scope: string,
  fields: Fields,
  access = storage(),
): Fields {
  const marks = read(scope, access);
  return Object.fromEntries(
    Object.entries(fields).map(([key, field]) => {
      const mark = marks[key];
      return [
        key,
        mark?.signature === signature(field)
          ? { ...field, scanFailure: mark.reason }
          : field,
      ];
    }),
  );
}
