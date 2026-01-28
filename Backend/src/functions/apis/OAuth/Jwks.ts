import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import oidc from "../../../services/oidc";

async function handler(
  request: HttpRequest,
  context: InvocationContext
): Promise<HttpResponseInit> {
  try {
    const keys = await oidc.getPublicKeys();

    return {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "max-age=3600",
      },
      body: JSON.stringify({ keys }, null, 2),
    };
  } catch (error) {
    context.error("JWKS error:", error);
    return {
      status: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error: "server_error" }),
    };
  }
}

app.http("OAuthJwks", {
  methods: ["GET"],
  route: "oauth/jwks",
  handler,
  authLevel: "anonymous",
});

export default handler;
