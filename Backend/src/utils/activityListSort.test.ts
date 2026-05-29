import {
  sortActivitiesInMemory,
  type ActivitySortItem,
} from "./activityListSort";

describe("sortActivitiesInMemory", () => {
  const base = { createdAt: "2026-01-01" };

  it("sorts by name ascending", () => {
    const input: ActivitySortItem[] = [
      { ...base, name: "Zeta" },
      { ...base, name: "Alpha" },
    ];
    const sorted = sortActivitiesInMemory(input, "name", "asc");
    expect(sorted.map((a) => a.name)).toEqual(["Alpha", "Zeta"]);
  });

  it("sorts by creator using user names", () => {
    const input: ActivitySortItem[] = [
      { ...base, users: [{ name: "Maria" }] },
      { ...base, users: [{ name: "Ana" }] },
    ];
    const sorted = sortActivitiesInMemory(input, "creator", "asc");
    expect(sorted[0].users?.[0]?.name).toBe("Ana");
  });

  it("sorts by status name", () => {
    const input: ActivitySortItem[] = [
      { ...base, status: { name: "Done" } },
      { ...base, status: { name: "Open" } },
    ];
    const sorted = sortActivitiesInMemory(input, "status", "desc");
    expect(sorted.map((a) => a.status?.name)).toEqual(["Open", "Done"]);
  });
});
