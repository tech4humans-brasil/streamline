import { handler } from "./AlterPassword";
import * as bcrypt from "bcrypt";
import jwt from "../../../services/jwt";
import UserRepository from "../../../repositories/User";
import res from "../../../utils/apiResponse";

jest.mock("bcrypt", () => ({
  hash: jest.fn(() => "hashedPassword"),
}));

jest.mock("../../../services/jwt", () => ({
  verifyResetPassword: jest.fn(() => ({ id: "userId", client: "clientId" })),
}));

describe("AlterPassword", () => {
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
      body: {
        password: "newPassword",
      },
      headers: {
        authorization: "Bearer token",
      },
    };
    context = {};
  });

  it("should return 404 when user not found", async () => {
    conn.model().findById.mockResolvedValue(null);

    const result = await handler(conn, req, context);

    expect(result).toEqual(res.notFound("User or password not found"));
  });

  it("should return 200 when password is successfully changed", async () => {
    const user = {
      _id: "userId",
      name: "John Doe",
      password: "oldPassword",
      save: jest.fn(),
    };
    conn.model().findById.mockResolvedValue(user);

    const result = await handler(conn, req, context);

    expect(result).toEqual(
      res.success({
        id: user._id,
        name: user.name,
      })
    );
    expect(bcrypt.hash).toHaveBeenCalledWith("newPassword", 10);
    expect(user.password).toBe("hashedPassword");
    expect(user.save).toHaveBeenCalled();
  });
});
