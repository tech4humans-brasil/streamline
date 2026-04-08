import { useCallback, useEffect, useState } from "react";

export type ActivitiesBoardCardFieldsSettings = {
  builtInKeys: string[];
  formFieldIds: string[];
};

export const ACTIVITIES_BOARD_BUILT_IN_KEYS = [
  "protocol",
  "assignee",
  "users",
  "description",
  "due_date",
  "createdAt",
] as const;

export type ActivitiesBoardBuiltInKey =
  (typeof ACTIVITIES_BOARD_BUILT_IN_KEYS)[number];

const DEFAULT_BUILT_IN: string[] = ["protocol"];

function storageKey(project: string) {
  return `streamline.activitiesBoard.cardFields.${project}`;
}

function parseStored(raw: string | null): ActivitiesBoardCardFieldsSettings {
  if (!raw) {
    return { builtInKeys: [...DEFAULT_BUILT_IN], formFieldIds: [] };
  }
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object") {
      return { builtInKeys: [...DEFAULT_BUILT_IN], formFieldIds: [] };
    }
    const o = parsed as Record<string, unknown>;
    return {
      builtInKeys: Array.isArray(o.builtInKeys)
        ? o.builtInKeys.filter((x): x is string => typeof x === "string")
        : [...DEFAULT_BUILT_IN],
      formFieldIds: Array.isArray(o.formFieldIds)
        ? o.formFieldIds.filter((x): x is string => typeof x === "string")
        : [],
    };
  } catch {
    return { builtInKeys: [...DEFAULT_BUILT_IN], formFieldIds: [] };
  }
}

export function useActivitiesBoardCardSettings(project: string) {
  const [settings, setSettings] = useState<ActivitiesBoardCardFieldsSettings>(
    () => parseStored(typeof window !== "undefined" ? localStorage.getItem(storageKey(project)) : null)
  );

  useEffect(() => {
    setSettings(parseStored(localStorage.getItem(storageKey(project))));
  }, [project]);

  const persist = useCallback(
    (next: ActivitiesBoardCardFieldsSettings) => {
      localStorage.setItem(storageKey(project), JSON.stringify(next));
      setSettings(next);
    },
    [project]
  );

  const toggleBuiltIn = useCallback(
    (key: string, enabled: boolean) => {
      const nextKeys = new Set(settings.builtInKeys);
      if (enabled) nextKeys.add(key);
      else nextKeys.delete(key);
      persist({
        ...settings,
        builtInKeys: [...nextKeys],
      });
    },
    [persist, settings]
  );

  const toggleFormField = useCallback(
    (fieldId: string, enabled: boolean) => {
      const next = new Set(settings.formFieldIds);
      if (enabled) next.add(fieldId);
      else next.delete(fieldId);
      persist({
        ...settings,
        formFieldIds: [...next],
      });
    },
    [persist, settings]
  );

  const reset = useCallback(() => {
    const next: ActivitiesBoardCardFieldsSettings = {
      builtInKeys: [...DEFAULT_BUILT_IN],
      formFieldIds: [],
    };
    persist(next);
  }, [persist]);

  return {
    builtInKeys: settings.builtInKeys,
    formFieldIds: settings.formFieldIds,
    toggleBuiltIn,
    toggleFormField,
    reset,
  };
}
