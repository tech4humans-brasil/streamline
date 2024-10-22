import { handler } from "./ForgotPassword";
import jwt from "../../../services/jwt";
import { sendEmail } from "../../../services/email";
import UserRepository from "../../../repositories/User";
import res from "../../../utils/apiResponse";

jest.mock("../../../services/jwt", () => ({
  signResetPassword: jest.fn(() => "resetToken"),
}));

jest.mock("../../../services/email", () => ({
  sendEmail: jest.fn(),
}));

describe("ForgotPassword", () => {
  let conn;
  let req;
  let context;

  beforeEach(() => {
    conn = {
      model: () => ({
        findOne: jest.fn(),
      }),
    };
    req = {
      body: {
        email: "user@example.com",
        acronym: "clientAcronym",
      },
    };
    context = {};
  });

  it("should return 404 when client not found", async () => {
    conn.model().findOne.mockResolvedValue(null);

    const result = await handler(conn, req, context);

    expect(result).toEqual(res.notFound("User or password not found"));
  });

  it("should return 404 when user not found", async () => {
    const client = {
      acronym: "clientAcronym",
    };
    conn.model().findOne.mockResolvedValue(client);

    const userRepository = new UserRepository(conn);
    jest.spyOn(userRepository, "findOne").mockResolvedValue(null);

    const result = await handler(conn, req, context);

    expect(result).toEqual(res.notFound("User or password not found"));
  });

  it("should return 200 when password reset email is successfully sent", async () => {
    const client = {
      acronym: "clientAcronym",
    };
    conn.model().findOne.mockResolvedValue(client);

    const user = {
      _id: "userId",
      name: "John Doe",
      email: "user@example.com",
    };
    const userRepository = new UserRepository(conn);
    jest.spyOn(userRepository, "findOne").mockResolvedValue(user);

    const result = await handler(conn, req, context);

    expect(result).toEqual(res.success({ success: true }));
    expect(jwt.signResetPassword).toHaveBeenCalledWith({
      id: user._id,
      client: conn.name,
    });
    expect(sendEmail).toHaveBeenCalledWith(
      "user@example.com",
      "Streamline | Redefinição de senha",
      expect.any(String),
      expect.any(String)
    );
  });

  it("should return 500 when email sending fails", async () => {
    const client = {
      acronym: "clientAcronym",
    };
    conn.model().findOne.mockResolvedValue(client);

    const user = {
      _id: "userId",
      name: "John Doe",
      email: "user@example.com",
    };
    const userRepository = new UserRepository(conn);
    jest.spyOn(userRepository, "findOne").mockResolvedValue(user);

    sendEmail.mockRejectedValue(new Error("Email sending failed"));

    const result = await handler(conn, req, context);

    expect(result).toEqual(res.error(500, {}, "Email sending failed"));
  });
});
