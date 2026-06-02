import FilterQueryBuilder, {
  WhereEnum,
} from "./filterQueryBuilder";
import {
  buildActivityCreatorFilter,
  buildActivityNameFilter,
} from "./activityListFilters";

describe("activity list filters", () => {
  describe("buildActivityNameFilter", () => {
    it("returns exact match for a single name", () => {
      expect(buildActivityNameFilter("Ticket A")).toBe("Ticket A");
    });

    it("returns $in for comma-separated names", () => {
      expect(buildActivityNameFilter("A, B")).toEqual({ $in: ["A", "B"] });
    });
  });

  describe("buildActivityCreatorFilter", () => {
    it("returns ILIKE regex for a single creator", () => {
      expect(buildActivityCreatorFilter("Ana")).toEqual({
        $regex: "Ana",
        $options: "i",
      });
    });

    it("returns $in for comma-separated creators", () => {
      expect(buildActivityCreatorFilter("Ana, Maria")).toEqual({
        $in: ["Ana", "Maria"],
      });
    });
  });

  it("wires creator through FilterQueryBuilder on users.name", () => {
    const builder = new FilterQueryBuilder(
      {
        creator: { type: WhereEnum.CUSTOM, alias: "users.name" },
      },
      { creator: buildActivityCreatorFilter }
    );

    expect(builder.build({ creator: "Ana, Maria" })).toEqual({
      "users.name": { $in: ["Ana", "Maria"] },
    });
  });
});
