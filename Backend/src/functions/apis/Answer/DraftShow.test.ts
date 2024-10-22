import { Connection } from "mongoose";
import AnswerRepository from "../../../repositories/Answer";
import { mockRequest, mockResponse } from "../../../utils/testHelpers";
import handler from "./DraftShow";

jest.mock("../../../repositories/Answer");

describe("DraftShow API handler", () => {
  let conn: Connection;
  let req: any;
  let res: any;

  beforeEach(() => {
    conn = {} as Connection;
    req = mockRequest();
    res = mockResponse();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should return a successful draft retrieval", async () => {
    const mockAnswer = { id: "1", data: "mockData" };
    AnswerRepository.prototype.findOne = jest.fn().mockResolvedValue(mockAnswer);

    req.params = { form_id: "form1", activity_id: "activity1" };
    req.user = { id: "user1" };

    await handler(conn, req, res);

    expect(AnswerRepository.prototype.findOne).toHaveBeenCalledWith({
      where: {
        user: "user1",
        form: "form1",
        submitted: false,
        activity: "activity1",
      },
    });
    expect(res.success).toHaveBeenCalledWith(mockAnswer);
  });

  it("should return draft not found", async () => {
    AnswerRepository.prototype.findOne = jest.fn().mockResolvedValue(null);

    req.params = { form_id: "form1", activity_id: "activity1" };
    req.user = { id: "user1" };

    await handler(conn, req, res);

    expect(AnswerRepository.prototype.findOne).toHaveBeenCalledWith({
      where: {
        user: "user1",
        form: "form1",
        submitted: false,
        activity: "activity1",
      },
    });
    expect(res.success).toHaveBeenCalledWith(null);
  });
});
