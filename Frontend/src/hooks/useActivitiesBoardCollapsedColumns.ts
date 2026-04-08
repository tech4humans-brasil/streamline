import { useCallback, useEffect, useState } from "react";

function storageKey(project: string) {
  return `streamline.activitiesBoard.collapsedColumns.${project}`;
}

function parseStored(raw: string | null): string[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((x): x is string => typeof x === "string");
  } catch {
    return [];
  }
}

export function useActivitiesBoardCollapsedColumns(project: string) {
  const [collapsedIds, setCollapsedIds] = useState<string[]>(() =>
    parseStored(
      typeof window !== "undefined"
        ? localStorage.getItem(storageKey(project))
        : null
    )
  );

  useEffect(() => {
    setCollapsedIds(parseStored(localStorage.getItem(storageKey(project))));
  }, [project]);

  const persist = useCallback(
    (next: string[]) => {
      localStorage.setItem(storageKey(project), JSON.stringify(next));
      setCollapsedIds(next);
    },
    [project]
  );

  const isCollapsed = useCallback(
    (statusId: string) => collapsedIds.includes(statusId),
    [collapsedIds]
  );

  const toggle = useCallback(
    (statusId: string) => {
      const set = new Set(collapsedIds);
      if (set.has(statusId)) set.delete(statusId);
      else set.add(statusId);
      persist([...set]);
    },
    [collapsedIds, persist]
  );

  const expandAll = useCallback(() => persist([]), [persist]);

  const collapseAll = useCallback(
    (statusIds: string[]) => persist([...new Set(statusIds)]),
    [persist]
  );

  return {
    collapsedIds,
    isCollapsed,
    toggle,
    expandAll,
    collapseAll,
  };
}
