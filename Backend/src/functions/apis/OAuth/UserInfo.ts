import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import oidc from "../../../services/oidc";

async function handler(
  request: HttpRequest,
  context: InvocationContext
): Promise<HttpResponseInit> {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return {
        status: 401,
        headers: {
          "WWW-Authenticate": 'Bearer error="invalid_token"',
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          error: "invalid_token",
          error_description: "Missing or invalid Authorization header",
        }),
      };
    }

    const token = authHeader.slice(7);

    const verification = await oidc.verifyAccessToken(token);
    if (!verification.valid) {
      return {
        status: 401,
        headers: {
          "WWW-Authenticate": `Bearer error="invalid_token", error_description="${verification.error}"`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          error: "invalid_token",
          error_description: verification.error,
        }),
      };
    }

    const payload = verification.payload;
    const scope = (payload.scope as string) || "openid";

    const response: Record<string, unknown> = {
      sub: payload.sub,
    };

    if (scope.includes("profile")) {
      response.name = payload.name;
    }

    if (scope.includes("email")) {
      response.email = payload.email;
    }

    return {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-store",
      },
      body: JSON.stringify(response),
    };
  } catch (error) {
    context.error("UserInfo error:", error);
    return {
      status: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        error: "server_error",
        error_description: "Internal server error",
      }),
    };
  }
}

app.http("OAuthUserInfo", {
  methods: ["GET"],
  route: "oauth/userinfo",
  handler,
  authLevel: "anonymous",
});

export default handler;
