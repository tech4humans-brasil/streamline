import { handler } from "./Delete";
import ActivityRepository from "../../../repositories/Activity";
import res from "../../../utils/apiResponse";

jest.mock("../../../repositories/Activity");

describe("Delete", () => {
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
      params: {
        id: "activityId",
      },
    };
    context = {};
  });

  it("should return 404 when activity not found", async () => {
    ActivityRepository.prototype.findById.mockResolvedValue(null);

    const result = await handler(conn, req, context);

    expect(result).toEqual(res.notFound("Activity not found"));
  });

  it("should return 400 when activity is not finished", async () => {
    const activity = {
      workflows: [
        {
          steps: [
            { status: "inProgress" },
          ],
        },
      ],
    };
    ActivityRepository.prototype.findById.mockResolvedValue(activity);

    const result = await handler(conn, req, context);

    expect(result).toEqual(res.badRequest("Activity is not finished"));
  });

  it("should return 200 when activity is successfully deleted", async () => {
    const activity = {
      workflows: [
        {
          steps: [
            { status: "finished" },
          ],
        },
      ],
    };
    ActivityRepository.prototype.findById.mockResolvedValue(activity);
    ActivityRepository.prototype.delete.mockResolvedValue(activity);

    const result = await handler(conn, req, context);

    expect(result).toEqual(res.success(activity));
  });
});
