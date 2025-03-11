import { handler } from "./Create";

beforeEach(() => {
  process.env.JWT_SECRET = "mocked_jwt_secret"; // Ensure this is set
});

describe("Email/Create", () => {
  it("should return 201", async () => {
    const conn = {
      model: () => ({
        create: async (a) => ({
          save: () => a,
        }),
      }),
    };
    const req = {
      body: {
        slug: "slug",
        subject: "subject",
        htmlTemplate: "htmlTemplate",
      },
    };
    const context = {};

    const result = await handler(conn as any, req as any, context as any);

    expect(result.status).toEqual(201);
  });

  it("should return 400 when error", async () => {
    const conn = {
      model: () => ({
        create: async () => new Error(),
      }),
    };
    const req = {
      body: {
        slug: "slug",
        subject: "subject",
        htmlTemplate: "htmlTemplate",
      },
    };
    const context = {};

    const result = await handler(conn as any, req as any, context as any);

    expect(result.status).toEqual(400);
  });
});
