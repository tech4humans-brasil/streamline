import type { IField } from "@interfaces/FormDraft";

function isFileValue(v: unknown): v is { url?: string; name?: string } {
  return (
    typeof v === "object" &&
    v !== null &&
    ("url" in v || "name" in v)
  );
}

function isUserPick(
  v: unknown
): v is { name?: string; email?: string; matriculation?: string } {
  return typeof v === "object" && v !== null && "name" in v;
}

export function formatBoardFieldValue(
  field: IField,
  tAttachment: string
): string {
  const { value, type } = field;

  if (value === null || value === undefined || value === "") {
    return "—";
  }

  const raw = value as unknown;
  if (Array.isArray(raw)) {
    return raw
      .map((v) =>
        typeof v === "object" && v !== null && "label" in v
          ? String((v as { label: string }).label)
          : String(v)
      )
      .join(", ");
  }

  if (type === "file" || type === "placeholder") {
    if (isFileValue(value)) {
      return value.name || value.url || tAttachment;
    }
    return tAttachment;
  }

  if (type === "checkbox") {
    const v = value as unknown;
    return v === true || v === "true" ? "✓" : "—";
  }

  if (type === "teacher" || type === "select") {
    if (isUserPick(value)) {
      return value.name || value.email || String(value);
    }
  }

  if (typeof value === "object" && value !== null) {
    if (isUserPick(value)) {
      return value.name || value.email || "—";
    }
    return JSON.stringify(value);
  }

  if (type === "date" || type === "time") {
    try {
      const d = new Date(String(value));
      if (!Number.isNaN(d.getTime())) {
        return d.toLocaleString();
      }
    } catch {
      /* fall through */
    }
  }

  return String(value);
}
