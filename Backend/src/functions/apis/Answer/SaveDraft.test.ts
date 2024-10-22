import { Connection } from "mongoose";
import AnswerRepository from "../../../repositories/Answer";
import FormRepository from "../../../repositories/Form";
import FormDraftRepository from "../../../repositories/FormDraft";
import UserRepository from "../../../repositories/User";
import BlobUploader from "../../../services/upload";
import handler from "./SaveDraft";
import { mockRequest, mockResponse } from "../../../utils/testHelpers";

jest.mock("../../../repositories/Answer");
jest.mock("../../../repositories/Form");
jest.mock("../../../repositories/FormDraft");
jest.mock("../../../repositories/User");
jest.mock("../../../services/upload");

describe("SaveDraft API handler", () => {
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

  it("should save draft successfully", async () => {
    const mockForm = { _id: "form1", published: "formDraft1" };
    const mockFormDraft = { fields: [{ id: "field1", value: "value1" }] };
    const mockAnswer = { save: jest.fn() };

    FormRepository.prototype.findOpenForms = jest.fn().mockResolvedValue([mockForm]);
    FormDraftRepository.prototype.findById = jest.fn().mockResolvedValue(mockFormDraft);
    AnswerRepository.prototype.findOne = jest.fn().mockResolvedValue(null);
    AnswerRepository.prototype.create = jest.fn().mockResolvedValue(mockAnswer);

    req.params = { form_id: "form1" };
    req.user = { id: "user1" };
    req.body = { field1: "value1" };

    await handler(conn, req, res);

    expect(FormRepository.prototype.findOpenForms).toHaveBeenCalledWith({
      where: { _id: "form1" },
    });
    expect(FormDraftRepository.prototype.findById).toHaveBeenCalledWith({ id: "formDraft1" });
    expect(AnswerRepository.prototype.findOne).toHaveBeenCalledWith({
      where: {
        user: "user1",
        form: "form1",
        submitted: false,
        activity: null,
      },
    });
    expect(AnswerRepository.prototype.create).toHaveBeenCalledWith({
      user: "user1",
      activity: null,
      form: "form1",
      data: { field1: "value1" },
    });
    expect(res.created).toHaveBeenCalledWith({ field1: "value1" });
  });

  it("should return not found if form is not found", async () => {
    FormRepository.prototype.findOpenForms = jest.fn().mockResolvedValue([]);

    req.params = { form_id: "form1" };
    req.user = { id: "user1" };
    req.body = { field1: "value1" };

    await handler(conn, req, res);

    expect(FormRepository.prototype.findOpenForms).toHaveBeenCalledWith({
      where: { _id: "form1" },
    });
    expect(res.notFound).toHaveBeenCalledWith("Form not found");
  });

  it("should return not found if form draft is not found", async () => {
    const mockForm = { _id: "form1", published: "formDraft1" };

    FormRepository.prototype.findOpenForms = jest.fn().mockResolvedValue([mockForm]);
    FormDraftRepository.prototype.findById = jest.fn().mockResolvedValue(null);

    req.params = { form_id: "form1" };
    req.user = { id: "user1" };
    req.body = { field1: "value1" };

    await handler(conn, req, res);

    expect(FormRepository.prototype.findOpenForms).toHaveBeenCalledWith({
      where: { _id: "form1" },
    });
    expect(FormDraftRepository.prototype.findById).toHaveBeenCalledWith({ id: "formDraft1" });
    expect(res.notFound).toHaveBeenCalledWith("Form draft not found");
  });

  it("should update existing draft", async () => {
    const mockForm = { _id: "form1", published: "formDraft1" };
    const mockFormDraft = { fields: [{ id: "field1", value: "value1" }] };
    const mockAnswer = { save: jest.fn(), data: {} };

    FormRepository.prototype.findOpenForms = jest.fn().mockResolvedValue([mockForm]);
    FormDraftRepository.prototype.findById = jest.fn().mockResolvedValue(mockFormDraft);
    AnswerRepository.prototype.findOne = jest.fn().mockResolvedValue(mockAnswer);

    req.params = { form_id: "form1" };
    req.user = { id: "user1" };
    req.body = { field1: "value1" };

    await handler(conn, req, res);

    expect(FormRepository.prototype.findOpenForms).toHaveBeenCalledWith({
      where: { _id: "form1" },
    });
    expect(FormDraftRepository.prototype.findById).toHaveBeenCalledWith({ id: "formDraft1" });
    expect(AnswerRepository.prototype.findOne).toHaveBeenCalledWith({
      where: {
        user: "user1",
        form: "form1",
        submitted: false,
        activity: null,
      },
    });
    expect(mockAnswer.save).toHaveBeenCalled();
    expect(res.created).toHaveBeenCalledWith({ field1: "value1" });
  });
});
