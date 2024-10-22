import { handler } from "./MyActivities";
import ActivityRepository from "../../../repositories/Activity";
import User from "../../../models/client/User";
import res from "../../../utils/apiResponse";

jest.mock("../../../repositories/Activity");
jest.mock("../../../models/client/User");
jest.mock("../../../utils/apiResponse");

describe("MyActivities API handler", () => {
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
      user: {
        id: "user1",
      },
    };
    mockRes = {
      success: jest.fn(),
      notFound: jest.fn(),
    };

    ActivityRepository.mockClear();
    User.mockClear();
    res.success.mockClear();
    res.notFound.mockClear();
  });

  it("should return my activities and finished activities", async () => {
    const mockUser = {
      _id: "user1",
    };

    const mockActivities = [
      {
        _id: "activity1",
        name: "Activity One",
        description: "Description One",
        protocol: "12345",
        state: "inProgress",
        createdAt: new Date(),
        form: {
          name: "Form One",
          slug: "form-one",
        },
      },
    ];

    const mockFinishedActivities = [
      {
        _id: "activity2",
        name: "Activity Two",
        description: "Description Two",
        protocol: "67890",
        finished_at: new Date(),
        createdAt: new Date(),
        form: {
          name: "Form Two",
          slug: "form-two",
        },
      },
    ];

    User.prototype.model.mockReturnValue({
      findById: jest.fn().mockResolvedValue(mockUser),
    });

    ActivityRepository.prototype.find
      .mockResolvedValueOnce(mockActivities)
      .mockResolvedValueOnce(mockFinishedActivities);

    await handler(mockConn, mockReq, mockRes);

    expect(ActivityRepository.prototype.find).toHaveBeenCalledWith({
      where: {
        "users._id": mockUser._id,
        finished_at: null,
      },
      select: {
        name: 1,
        description: 1,
        protocol: 1,
        state: 1,
        createdAt: 1,
      },
      populate: [
        {
          path: "form",
          select: {
            name: 1,
            slug: 1,
          },
        },
      ],
    });

    expect(ActivityRepository.prototype.find).toHaveBeenCalledWith({
      where: {
        "users._id": mockUser._id,
        finished_at: { $ne: null },
      },
      select: {
        name: 1,
        description: 1,
        protocol: 1,
        finished_at: 1,
        createdAt: 1,
      },
      populate: [
        {
          path: "form",
          select: {
            name: 1,
            slug: 1,
          },
        },
      ],
    });

    expect(res.success).toHaveBeenCalledWith({
      activities: mockActivities,
      finishedActivities: mockFinishedActivities,
    });
  });

  it("should return an empty array if no activities are found", async () => {
    const mockUser = {
      _id: "user1",
    };

    User.prototype.model.mockReturnValue({
      findById: jest.fn().mockResolvedValue(mockUser),
    });

    ActivityRepository.prototype.find.mockResolvedValue([]);

    await handler(mockConn, mockReq, mockRes);

    expect(ActivityRepository.prototype.find).toHaveBeenCalledWith({
      where: {
        "users._id": mockUser._id,
        finished_at: null,
      },
      select: {
        name: 1,
        description: 1,
        protocol: 1,
        state: 1,
        createdAt: 1,
      },
      populate: [
        {
          path: "form",
          select: {
            name: 1,
            slug: 1,
          },
        },
      ],
    });

    expect(ActivityRepository.prototype.find).toHaveBeenCalledWith({
      where: {
        "users._id": mockUser._id,
        finished_at: { $ne: null },
      },
      select: {
        name: 1,
        description: 1,
        protocol: 1,
        finished_at: 1,
        createdAt: 1,
      },
      populate: [
        {
          path: "form",
          select: {
            name: 1,
            slug: 1,
          },
        },
      ],
    });

    expect(res.success).toHaveBeenCalledWith({
      activities: [],
      finishedActivities: [],
    });
  });

  it("should handle errors", async () => {
    const mockError = new Error("Database error");
    ActivityRepository.prototype.find.mockRejectedValue(mockError);

    await handler(mockConn, mockReq, mockRes);

    expect(res.notFound).toHaveBeenCalledWith("Error retrieving activities");
  });
});
