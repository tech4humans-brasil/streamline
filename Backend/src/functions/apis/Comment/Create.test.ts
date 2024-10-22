import { handler } from "./Create";
import ActivityRepository from "../../../repositories/Activity";
import res from "../../../utils/apiResponse";

jest.mock("../../../repositories/Activity");

describe("CommentCreate", () => {
  let conn;
  let req;
  let context;

  beforeEach(() => {
    conn = {};
    req = {
      params: {
        id: "activityId",
      },
      body: {
        content: "This is a comment",
      },
      user: {
        id: "userId",
        name: "User Name",
        email: "user@example.com",
        matriculation: "12345",
        institute: "Institute Name",
      },
    };
    context = {};
  });

  it("should return 201 with the created comment", async () => {
    const comment = {
      comments: [
        {
          user: {
            _id: "userId",
            name: "User Name",
            email: "user@example.com",
            matriculation: "12345",
            institute: "Institute Name",
          },
          content: "This is a comment",
        },
      ],
      save: jest.fn(),
    };
    ActivityRepository.prototype.findByIdAndUpdate.mockResolvedValue(comment);

    const result = await handler(conn, req, context);

    expect(result).toEqual(res.created(comment.comments[0]));
    expect(comment.save).toHaveBeenCalled();
  });

  it("should return 404 when user not found", async () => {
    req.user = null;

    const result = await handler(conn, req, context);

    expect(result).toEqual(res.notFound("User not found"));
  });
});
