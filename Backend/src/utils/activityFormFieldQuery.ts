/** Form field id for GMUD deploy date on creation forms. */
export const DEPLOY_DATE_FIELD_ID = "diadeploy";

type FormFieldLike = { id?: string; value?: unknown };

export type ActivityFormDraftLike = {
  form_draft?: { fields?: FormFieldLike[] } | null;
  createdAt?: string | Date | null;
};

export function getDeployDateValueFromActivity(
  activity: ActivityFormDraftLike
): string | null {
  const field = activity.form_draft?.fields?.find(
    (f) => f.id === DEPLOY_DATE_FIELD_ID
  );
  if (
    field?.value === null ||
    field?.value === undefined ||
    field?.value === ""
  ) {
    return null;
  }
  return String(field.value);
}

/** Sort key; null/invalid dates sort last in both directions. */
export function parseDeployDateForSort(
  value: string | null,
  sortDir: "asc" | "desc"
): number {
  if (!value) {
    return sortDir === "desc" ? Number.NEGATIVE_INFINITY : Number.POSITIVE_INFINITY;
  }
  const ts = Date.parse(value);
  if (Number.isNaN(ts)) {
    return sortDir === "desc" ? Number.NEGATIVE_INFINITY : Number.POSITIVE_INFINITY;
  }
  return ts;
}

export function sortActivitiesByDeployDate<T extends ActivityFormDraftLike>(
  activities: T[],
  sortDir: "asc" | "desc"
): T[] {
  const desc = sortDir === "desc";
  return [...activities].sort((a, b) => {
    const ta = parseDeployDateForSort(
      getDeployDateValueFromActivity(a),
      sortDir
    );
    const tb = parseDeployDateForSort(
      getDeployDateValueFromActivity(b),
      sortDir
    );
    if (ta !== tb) {
      return desc ? tb - ta : ta - tb;
    }
    const ca = new Date(a.createdAt ?? 0).getTime();
    const cb = new Date(b.createdAt ?? 0).getTime();
    return cb - ca;
  });
}
