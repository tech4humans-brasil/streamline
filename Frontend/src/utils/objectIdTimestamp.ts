/**
 * MongoDB ObjectId embeds a 4-byte creation timestamp (seconds since Unix epoch).
 * Used to approximate step ordering when the API does not expose executedAt.
 */
export function objectIdToDate(id: string | undefined): Date | null {
  if (!id || typeof id !== "string" || id.length !== 24) return null;
  if (!/^[0-9a-fA-F]{24}$/.test(id)) return null;
  const seconds = parseInt(id.slice(0, 8), 16);
  if (Number.isNaN(seconds)) return null;
  return new Date(seconds * 1000);
}

export function sortKeyForActivityStep(
  stepId: string,
  activityCreatedAt: string | undefined,
  fallbackIndex: number
): number {
  const fromOid = objectIdToDate(stepId);
  if (fromOid) return fromOid.getTime();
  const base = activityCreatedAt
    ? new Date(activityCreatedAt).getTime()
    : 0;
  return base + fallbackIndex;
}
