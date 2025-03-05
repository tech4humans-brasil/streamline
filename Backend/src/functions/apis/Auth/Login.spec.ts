import { handler } from "./Login";
import * as bcrypt from "bcrypt";
import jwt from "../../../services/jwt";

jest.mock("bcrypt", () => ({
  compare: jest.fn((a, b) => a === b),
}));

jest.mock("../../../services/jwt", () => ({
  sign: jest.fn(() => "token"),
}));

beforeEach(() => {
  process.env.MONGO_URI = "mongodb://localhost:27017/test"; // Ensure this is set
  process.env.JWT_SECRET = "mocked_jwt_secret"; // Add this line
});

describe("Login", () => {
  it("should return 404 when user not found", async () => {
    const conn = {
      model: () => ({
        findOne: async () => null,
      }),
    };
    const req = {
      body: {
        cpf: "12345678901",
        password: "password",
      },
    };
    const context = {};

    const result = await handler(conn as any, req as any, context as any);

    expect(result.status).toEqual(404);
  });

  it("should return 401 when password is incorrect", async () => {
    const conn = {
      model: () => ({
        findOne: async () => ({
          cpf: "12345678901",
          password: "password",
        }),
      }),
    };
    const req = {
      body: {
        cpf: "12345678901",
        password: "password-error",
      },
    };
    const context = {};

    const result = await handler(conn as any, req as any, context as any);

    expect(result.status).toEqual(401);
  });

  it("should return 200 when user is found and password is correct", async () => {
    const conn = {
      model: () => ({
        findOne: async () => ({
          cpf: "12345678901",
          password: "password",
        }),
      }),
    };
    const req = {
      body: {
        cpf: "12345678901",
        password: "password",
      },
    };
    const context = {};

    const result = await handler(conn as any, req as any, context as any);

    expect(result.status).toEqual(200);
  });

  it("should return token when user is found and password is correct", async () => {
    const conn = {
      model: () => ({
        findOne: async () => ({
          cpf: "12345678901",
          password: "password",
        }),
      }),
    };
    const req = {
      body: {
        cpf: "12345678901",
        password: "password",
      },
    };
    const context = {};

    const result = await handler(conn as any, req as any, context as any);

    const body = result?.body ? JSON.parse(result.body.toString()) : {};

    expect(body.data.token).toEqual("token");
  });
});
