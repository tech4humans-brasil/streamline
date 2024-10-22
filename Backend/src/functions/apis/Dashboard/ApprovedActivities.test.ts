import { handler } from "./ApprovedActivities";
import ActivityRepository from "../../../repositories/Activity";
import { IActivityState } from "../../../models/client/Activity";
import res from "../../../utils/apiResponse";

jest.mock("../../../repositories/Activity");
jest.mock("../../../utils/apiResponse");

describe("ApprovedActivities API handler", () => {
  let mockConn;
  let mockReq;
  let mockRes;

  beforeEach(() => {
    mockConn = {};
    mockReq = {
      query: {
        page: 1,
        limit: 10,
      },
    };
    mockRes = {
      success: jest.fn(),
      notFound: jest.fn(),
    };

    ActivityRepository.mockClear();
    res.success.mockClear();
    res.notFound.mockClear();
  });

  it("should return approved activities", async () => {
    const mockActivities = [
      {
        _id: "activity1",
        state: IActivityState.committed,
        users: [
          {
            _id: "user1",
            name: "User One",
            matriculation: "12345",
          },
        ],
      },
    ];

    ActivityRepository.prototype.find.mockResolvedValue(mockActivities);

    await handler(mockConn, mockReq, mockRes);

    expect(ActivityRepository.prototype.find).toHaveBeenCalledWith({
      where: { state: IActivityState.committed },
      populate: [
        {
          path: "users",
          select: {
            _id: 1,
            name: 1,
            matriculation: 1,
          },
        },
      ],
    });

    expect(res.success).toHaveBeenCalledWith({
      activities: mockActivities,
    });
  });

  it("should return an empty array if no approved activities are found", async () => {
    ActivityRepository.prototype.find.mockResolvedValue([]);

    await handler(mockConn, mockReq, mockRes);

    expect(ActivityRepository.prototype.find).toHaveBeenCalledWith({
      where: { state: IActivityState.committed },
      populate: [
        {
          path: "users",
          select: {
            _id: 1,
            name: 1,
            matriculation: 1,
          },
        },
      ],
    });

    expect(res.success).toHaveBeenCalledWith({
      activities: [],
    });
  });

  it("should handle errors", async () => {
    const mockError = new Error("Database error");
    ActivityRepository.prototype.find.mockRejectedValue(mockError);

    await handler(mockConn, mockReq, mockRes);

    expect(res.notFound).toHaveBeenCalledWith("Error retrieving approved activities");
  });
});
