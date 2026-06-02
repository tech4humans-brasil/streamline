export function parseCommaSeparatedFilterValues(value: string): string[] {
  return value
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

export function buildActivityNameFilter(value: string) {
  const names = parseCommaSeparatedFilterValues(value);
  if (!names.length) return undefined;
  if (names.length === 1) return names[0];
  return { $in: names };
}

/** Single value: partial match (ILIKE). Multiple comma-separated: exact `$in` on `users.name`. */
export function buildActivityCreatorFilter(value: string) {
  const names = parseCommaSeparatedFilterValues(value);
  if (!names.length) return undefined;
  if (names.length === 1) {
    return { $regex: names[0], $options: "i" };
  }
  return { $in: names };
}
