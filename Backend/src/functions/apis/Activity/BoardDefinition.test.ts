import { handler } from "./BoardDefinition";
import ActivityRepository from "../../../repositories/Activity";
import User from "../../../models/client/User";
import res from "../../../utils/apiResponse";

jest.mock("../../../repositories/Activity");
jest.mock("../../../models/client/User");

describe("BoardDefinition", () => {
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
        evaluation_id: "evaluationId",
      },
      body: {
        users: [
          { _id: "userId1", isExternal: false, email: "user1@example.com" },
          { _id: "userId2", isExternal: true, email: "user2@example.com" },
        ],
      },
    };
    context = {};
  });

  it("should return 404 when activity not found", async () => {
    ActivityRepository.prototype.findById.mockResolvedValue(null);

    const result = await handler(conn, req, context);

    expect(result).toEqual(res.notFound("Atividade não encontrada"));
  });

  it("should return 404 when evaluation not found", async () => {
    const activity = {
      evaluations: {
        id: jest.fn(() => null),
      },
    };
    ActivityRepository.prototype.findById.mockResolvedValue(activity);

    const result = await handler(conn, req, context);

    expect(result).toEqual(res.notFound("Avaliação não encontrada"));
  });

  it("should return 200 when board definition is successfully retrieved", async () => {
    const evaluation = {
      answers: [],
      not_defined_board: true,
    };
    const activity = {
      evaluations: {
        id: jest.fn(() => evaluation),
      },
      save: jest.fn(),
    };
    ActivityRepository.prototype.findById.mockResolvedValue(activity);

    const externalUser = {
      _id: "externalUserId",
      toObject: jest.fn(() => ({ _id: "externalUserId" })),
    };
    User.prototype.model.mockReturnValue({
      findOne: jest.fn().mockResolvedValue(externalUser),
      findById: jest.fn().mockResolvedValue({
        _id: "userId1",
        toObject: jest.fn(() => ({ _id: "userId1" })),
      }),
      create: jest.fn().mockResolvedValue(externalUser),
    });

    const result = await handler(conn, req, context);

    expect(result).toEqual(res.success(activity));
    expect(activity.save).toHaveBeenCalled();
    expect(evaluation.not_defined_board).toBe(false);
    expect(evaluation.answers).toHaveLength(2);
  });
});
