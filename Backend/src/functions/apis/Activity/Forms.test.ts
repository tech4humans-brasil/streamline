import { handler } from "./Forms";
import User from "../../../models/client/User";
import res from "../../../utils/apiResponse";

jest.mock("../../../models/client/User");

describe("Forms", () => {
  let conn;
  let req;
  let context;

  beforeEach(() => {
    conn = {
      model: () => ({
        find: jest.fn(),
      }),
    };
    req = {};
    context = {};
  });

  it("should return 200 when forms are successfully retrieved", async () => {
    const students = [
      { _id: "studentId1", name: "Student 1", matriculation: "12345" },
      { _id: "studentId2", name: "Student 2", matriculation: "67890" },
    ];
    const teachers = [
      { _id: "teacherId1", name: "Teacher 1", email: "teacher1@example.com" },
      { _id: "teacherId2", name: "Teacher 2", email: "teacher2@example.com" },
    ];

    User.prototype.model.mockReturnValue({
      find: jest.fn().mockResolvedValueOnce(students).mockResolvedValueOnce(teachers),
    });

    const result = await handler(conn, req, context);

    expect(result).toEqual(res.success({ students, teachers }));
  });

  it("should return 404 when no forms are found", async () => {
    User.prototype.model.mockReturnValue({
      find: jest.fn().mockResolvedValueOnce([]).mockResolvedValueOnce([]),
    });

    const result = await handler(conn, req, context);

    expect(result).toEqual(res.success({ students: [], teachers: [] }));
  });
});
