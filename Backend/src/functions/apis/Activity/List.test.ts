import { handler } from "./List";
import ActivityRepository from "../../../repositories/Activity";
import UserRepository from "../../../repositories/User";
import FormRepository from "../../../repositories/Form";
import res from "../../../utils/apiResponse";

jest.mock("../../../repositories/Activity");
jest.mock("../../../repositories/User");
jest.mock("../../../repositories/Form");

describe("List", () => {
  let conn;
  let req;
  let context;

  beforeEach(() => {
    conn = {
      model: () => ({
        findOne: jest.fn(),
        findById: jest.fn(),
      }),
    };
    req = {
      query: {
        page: 1,
        limit: 10,
        name: "Activity Name",
        status: "active",
        protocol: "12345",
        finished: false,
        user: "userId",
        form: "formId",
      },
      user: {
        roles: ["admin"],
        institute: {
          _id: "instituteId",
        },
      },
    };
    context = {};
  });

  it("should return 200 when activities are successfully listed", async () => {
    const activities = [
      {
        name: "Activity Name",
        protocol: "12345",
        status: "active",
        users: ["userId"],
        finished_at: null,
      },
    ];
    ActivityRepository.prototype.find.mockResolvedValue(activities);
    ActivityRepository.prototype.count.mockResolvedValue(1);

    const result = await handler(conn, req, context);

    expect(result).toEqual(
      res.success({
        activities,
        pagination: {
          page: 1,
          total: 1,
          totalPages: 1,
          count: 1,
        },
      })
    );
  });

  it("should return 200 when no activities are found", async () => {
    ActivityRepository.prototype.find.mockResolvedValue([]);
    ActivityRepository.prototype.count.mockResolvedValue(0);

    const result = await handler(conn, req, context);

    expect(result).toEqual(
      res.success({
        activities: [],
        pagination: {
          page: 1,
          total: 0,
          totalPages: 0,
          count: 0,
        },
      })
    );
  });

  it("should return 200 when user is not admin and activities are successfully listed", async () => {
    req.user.roles = ["user"];
    const activities = [
      {
        name: "Activity Name",
        protocol: "12345",
        status: "active",
        users: ["userId"],
        finished_at: null,
      },
    ];
    const visibilities = [{ _id: "formId" }];
    FormRepository.prototype.find.mockResolvedValue(visibilities);
    ActivityRepository.prototype.find.mockResolvedValue(activities);
    ActivityRepository.prototype.count.mockResolvedValue(1);

    const result = await handler(conn, req, context);

    expect(result).toEqual(
      res.success({
        activities,
        pagination: {
          page: 1,
          total: 1,
          totalPages: 1,
          count: 1,
        },
      })
    );
  });
});
