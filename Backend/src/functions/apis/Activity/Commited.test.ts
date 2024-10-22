import { handler } from "./Commited";
import ActivityRepository from "../../../repositories/Activity";
import UserRepository from "../../../repositories/User";
import WorkflowDraftRepository from "../../../repositories/WorkflowDraft";
import FormRepository from "../../../repositories/Form";
import res from "../../../utils/apiResponse";
import sendNextQueue from "../../../utils/sendNextQueue";

jest.mock("../../../repositories/Activity");
jest.mock("../../../repositories/User");
jest.mock("../../../repositories/WorkflowDraft");
jest.mock("../../../repositories/Form");
jest.mock("../../../utils/sendNextQueue");

describe("Commited", () => {
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
      body: {
        name: "Activity Name",
        description: "Activity Description",
        users: ["userId1", "userId2"],
      },
    };
    context = {};
  });

  it("should return 404 when activity not found", async () => {
    ActivityRepository.prototype.findById.mockResolvedValue(null);

    const result = await handler(conn, req, context);

    expect(result).toEqual(res.error(404, {}, "Activity not found"));
  });

  it("should return 400 when user id is invalid", async () => {
    const activity = {
      name: "Activity Name",
      description: "Activity Description",
      users: [],
      state: "draft",
    };
    ActivityRepository.prototype.findById.mockResolvedValue(activity);
    UserRepository.prototype.find.mockResolvedValue([]);

    const result = await handler(conn, req, context);

    expect(result).toEqual(res.error(400, {}, "Invalid user id"));
  });

  it("should return 200 when activity is successfully committed", async () => {
    const activity = {
      name: "Activity Name",
      description: "Activity Description",
      users: [],
      state: "draft",
      form: "formId",
      workflows: [],
      save: jest.fn(),
    };
    const user = {
      _id: "userId1",
      toObject: jest.fn(() => ({ _id: "userId1" })),
    };
    const form = {
      workflow: "workflowId",
    };
    const workflowDraft = {
      steps: [{ id: "start", _id: "stepId" }],
    };
    ActivityRepository.prototype.findById.mockResolvedValue(activity);
    UserRepository.prototype.find.mockResolvedValue([user]);
    FormRepository.prototype.findById.mockResolvedValue(form);
    WorkflowDraftRepository.prototype.findById.mockResolvedValue(workflowDraft);
    sendNextQueue.mockResolvedValue();

    const result = await handler(conn, req, context);

    expect(result).toEqual(res.success(activity));
    expect(activity.save).toHaveBeenCalled();
    expect(activity.state).toBe("processing");
    expect(activity.workflows).toHaveLength(1);
    expect(activity.workflows[0].steps).toHaveLength(1);
    expect(activity.workflows[0].steps[0].status).toBe("finished");
  });
});
