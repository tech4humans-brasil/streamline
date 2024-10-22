import { handler } from "./MyPendingEvaluations";
import ActivityRepository from "../../../repositories/Activity";
import { IActivityStepStatus } from "../../../models/client/Activity";
import res from "../../../utils/apiResponse";

jest.mock("../../../repositories/Activity");
jest.mock("../../../utils/apiResponse");

describe("MyPendingEvaluations API handler", () => {
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
    res.success.mockClear();
    res.notFound.mockClear();
  });

  it("should return my pending evaluations", async () => {
    const mockPendingActivities = [
      {
        _id: "activity1",
        name: "Activity One",
        description: "Description One",
        protocol: "12345",
        users: [
          {
            _id: "user1",
            name: "User One",
            matriculation: "12345",
          },
        ],
        evaluations: [
          {
            form: "form1",
            answers: [
              {
                user: {
                  _id: "user1",
                },
                status: IActivityStepStatus.idle,
              },
            ],
          },
        ],
      },
    ];

    ActivityRepository.prototype.find.mockResolvedValue(mockPendingActivities);

    await handler(mockConn, mockReq, mockRes);

    expect(ActivityRepository.prototype.find).toHaveBeenCalledWith({
      where: {
        evaluations: {
          $elemMatch: {
            "answers.user._id": mockReq.user.id,
            "answers.status": IActivityStepStatus.idle,
          },
        },
      },
      select: {
        _id: 1,
        name: 1,
        description: 1,
        protocol: 1,
        users: 1,
        "evaluations.form": 1,
        "evaluations.answers": 1,
      },
    });

    expect(res.success).toHaveBeenCalledWith([
      {
        _id: "activity1",
        name: "Activity One",
        description: "Description One",
        protocol: "12345",
        users: [
          {
            _id: "user1",
            name: "User One",
            matriculation: "12345",
          },
        ],
        form: "form1",
        status: IActivityStepStatus.idle,
      },
    ]);
  });

  it("should return an empty array if no pending evaluations are found", async () => {
    ActivityRepository.prototype.find.mockResolvedValue([]);

    await handler(mockConn, mockReq, mockRes);

    expect(ActivityRepository.prototype.find).toHaveBeenCalledWith({
      where: {
        evaluations: {
          $elemMatch: {
            "answers.user._id": mockReq.user.id,
            "answers.status": IActivityStepStatus.idle,
          },
        },
      },
      select: {
        _id: 1,
        name: 1,
        description: 1,
        protocol: 1,
        users: 1,
        "evaluations.form": 1,
        "evaluations.answers": 1,
      },
    });

    expect(res.success).toHaveBeenCalledWith([]);
  });

  it("should handle errors", async () => {
    const mockError = new Error("Database error");
    ActivityRepository.prototype.find.mockRejectedValue(mockError);

    await handler(mockConn, mockReq, mockRes);

    expect(res.notFound).toHaveBeenCalledWith("Error retrieving pending evaluations");
  });
});
