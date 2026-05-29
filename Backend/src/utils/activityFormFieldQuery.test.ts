import {
  DEPLOY_DATE_FIELD_ID,
  getDeployDateValueFromActivity,
  parseDeployDateForSort,
  sortActivitiesByDeployDate,
} from "./activityFormFieldQuery";

describe("getDeployDateValueFromActivity", () => {
  it("reads diadeploy from embedded fields", () => {
    expect(
      getDeployDateValueFromActivity({
        form_draft: {
          fields: [
            { id: "other", value: "x" },
            { id: DEPLOY_DATE_FIELD_ID, value: "2026-05-27" },
          ],
        },
      })
    ).toBe("2026-05-27");
  });

  it("returns null when field missing or empty", () => {
    expect(getDeployDateValueFromActivity({ form_draft: { fields: [] } })).toBeNull();
    expect(
      getDeployDateValueFromActivity({
        form_draft: { fields: [{ id: DEPLOY_DATE_FIELD_ID, value: "" }] },
      })
    ).toBeNull();
  });
});

describe("parseDeployDateForSort", () => {
  it("parses ISO dates", () => {
    const ts = parseDeployDateForSort("2026-05-27T12:00:00.000Z", "desc");
    expect(ts).toBe(Date.parse("2026-05-27T12:00:00.000Z"));
  });

  it("puts nulls last for desc and asc", () => {
    const valid = parseDeployDateForSort("2026-05-27", "desc");
    const nilDesc = parseDeployDateForSort(null, "desc");
    const nilAsc = parseDeployDateForSort(null, "asc");
    expect(nilDesc).toBeLessThan(valid);
    expect(nilAsc).toBeGreaterThan(valid);
  });
});

describe("sortActivitiesByDeployDate", () => {
  const mk = (deploy: string | null, createdAt: string) => ({
    form_draft: deploy
      ? { fields: [{ id: DEPLOY_DATE_FIELD_ID, value: deploy }] }
      : { fields: [] },
    createdAt,
  });

  it("sorts by deploy date descending", () => {
    const input = [
      mk("2026-05-01", "2026-05-03"),
      mk("2026-05-20", "2026-05-01"),
      mk("2026-05-10", "2026-05-02"),
    ];
    const sorted = sortActivitiesByDeployDate(input, "desc");
    expect(sorted.map((a) => getDeployDateValueFromActivity(a))).toEqual([
      "2026-05-20",
      "2026-05-10",
      "2026-05-01",
    ]);
  });
});
