import {
  getDeployDateValueFromActivity,
  sortActivitiesByDeployDate,
} from "./activityFormFieldQuery";

export const ACTIVITY_SORT_BY_VALUES = [
  "createdAt",
  "diadeploy",
  "name",
  "protocol",
  "creator",
  "status",
] as const;

export type ActivitySortBy = (typeof ACTIVITY_SORT_BY_VALUES)[number];

export type ActivitySortItem = {
  name?: string;
  protocol?: string;
  status?: { name?: string };
  users?: { name?: string }[];
  createdAt?: string | Date | null;
  form_draft?: { fields?: { id?: string; value?: unknown }[] } | null;
};

function compareStrings(a: string | undefined, b: string | undefined): number {
  return String(a ?? "").localeCompare(String(b ?? ""), undefined, {
    sensitivity: "base",
  });
}

function creatorSortKey(activity: ActivitySortItem): string {
  const names =
    activity.users?.map((u) => u.name).filter(Boolean) ?? [];
  return [...names].sort((a, b) => a.localeCompare(b)).join(", ");
}

function tieBreakByCreatedAtDesc(a: ActivitySortItem, b: ActivitySortItem): number {
  return (
    new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime()
  );
}

export function sortActivitiesInMemory<T extends ActivitySortItem>(
  activities: T[],
  sortBy: ActivitySortBy,
  sortDir: "asc" | "desc"
): T[] {
  if (sortBy === "diadeploy") {
    return sortActivitiesByDeployDate(activities, sortDir);
  }

  const desc = sortDir === "desc";

  return [...activities].sort((a, b) => {
    let cmp = 0;

    switch (sortBy) {
      case "status":
        cmp = compareStrings(a.status?.name, b.status?.name);
        break;
      case "creator":
        cmp = compareStrings(creatorSortKey(a), creatorSortKey(b));
        break;
      case "name":
        cmp = compareStrings(a.name, b.name);
        break;
      case "protocol":
        cmp = compareStrings(a.protocol, b.protocol);
        break;
      case "createdAt":
        cmp =
          new Date(a.createdAt ?? 0).getTime() -
          new Date(b.createdAt ?? 0).getTime();
        break;
      default:
        cmp = 0;
    }

    if (cmp !== 0) {
      return desc ? -cmp : cmp;
    }

    return tieBreakByCreatedAtDesc(a, b);
  });
}
