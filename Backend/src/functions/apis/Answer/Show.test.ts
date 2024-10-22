import { handler } from "./Show";
import AnswerRepository from "../../../repositories/Answer";
import res from "../../../utils/apiResponse";

jest.mock("../../../repositories/Answer");

describe("Show", () => {
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
        id: "answerId",
      },
      user: {
        id: "userId",
      },
    };
    context = {};
  });

  it("should return 404 when answer not found", async () => {
    AnswerRepository.prototype.findById.mockResolvedValue(null);

    const result = await handler(conn, req, context);

    expect(result).toEqual(res.notFound("Answer not found"));
  });

  it("should return 200 when answer is successfully retrieved", async () => {
    const answer = {
      id: "answerId",
      data: "answerData",
    };
    AnswerRepository.prototype.findById.mockResolvedValue(answer);

    const result = await handler(conn, req, context);

    expect(result).toEqual(res.success(answer));
  });
});
