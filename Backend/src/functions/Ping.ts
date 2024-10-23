import { app, HttpRequest, HttpResponseInit } from "@azure/functions";
import res from "../utils/apiResponse";

export async function Pong(request: HttpRequest): Promise<HttpResponseInit> {
  const name = request.query.get("name") || (await request.text()) || "world";

  return res.success({ message: `Hello, ${name}!` });
}

app.http("Ping", {
  route: "ping",
  methods: ["GET", "POST"],
  authLevel: "anonymous",
  handler: Pong,
});
