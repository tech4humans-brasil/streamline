import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "streamline_dashboard_last_seen";

function readLastSeen(): Date | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const d = new Date(raw);
    return Number.isNaN(d.getTime()) ? null : d;
  } catch {
    return null;
  }
}

function writeLastSeen(date: Date) {
  try {
    localStorage.setItem(STORAGE_KEY, date.toISOString());
  } catch {
    /* ignore quota / private mode */
  }
}

export function useDashboardLastSeen() {
  const [lastSeenAt, setLastSeenAt] = useState<Date | null>(() => readLastSeen());

  const markAllSeen = useCallback(() => {
    const now = new Date();
    writeLastSeen(now);
    setLastSeenAt(now);
  }, []);

  const isNewSinceLastSeen = useCallback(
    (updatedAt: string | Date | undefined | null) => {
      if (!lastSeenAt || !updatedAt) return false;
      return new Date(updatedAt).getTime() > lastSeenAt.getTime();
    },
    [lastSeenAt]
  );

  useEffect(() => {
    return () => {
      writeLastSeen(new Date());
    };
  }, []);

  return { lastSeenAt, markAllSeen, isNewSinceLastSeen };
}
