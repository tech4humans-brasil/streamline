import { handler } from "./Update";
import ActivityRepository from "../../../repositories/Activity";
import res from "../../../utils/apiResponse";

jest.mock("../../../repositories/Activity");

describe("CommentUpdate", () => {
  let conn;
  let req;
  let context;

  beforeEach(() => {
    conn = {};
    req = {
      params: {
        id: "activityId",
        commentId: "commentId",
      },
      body: {
        content: "Updated comment content",
      },
      user: {
        id: "userId",
        name: "User Name",
        email: "user@example.com",
      },
    };
    context = {};
  });

  it("should return 200 with the updated comment", async () => {
    const comment = {
      _id: "commentId",
      content: "Original comment content",
      isEdited: false,
      viewed: [],
      toObject: jest.fn().mockReturnValue({
        _id: "commentId",
        content: "Updated comment content",
        isEdited: true,
        viewed: [],
      }),
    };
    const activity = {
      comments: [comment],
      save: jest.fn(),
    };
    ActivityRepository.prototype.findById.mockResolvedValue(activity);

    const result = await handler(conn, req, context);

    expect(result).toEqual(
      res.success({
        _id: "commentId",
        content: "Updated comment content",
        isEdited: true,
        viewed: [],
        user: {
          _id: "userId",
          name: "User Name",
          email: "user@example.com",
        },
      })
    );
    expect(activity.save).toHaveBeenCalled();
  });

  it("should return 404 when activity not found", async () => {
    ActivityRepository.prototype.findById.mockResolvedValue(null);

    const result = await handler(conn, req, context);

    expect(result).toEqual(res.notFound("Activity not found"));
  });

  it("should return 404 when comment not found", async () => {
    const activity = {
      comments: [],
      save: jest.fn(),
    };
    ActivityRepository.prototype.findById.mockResolvedValue(activity);

    const result = await handler(conn, req, context);

    expect(result).toEqual(res.notFound("Comment not found"));
  });
});
