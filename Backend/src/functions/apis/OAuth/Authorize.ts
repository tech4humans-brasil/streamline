import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import oidc from "../../../services/oidc";

const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:3000";

async function handler(
  request: HttpRequest,
  context: InvocationContext
): Promise<HttpResponseInit> {
  try {
    // Extract query parameters
    const clientId = request.query.get("client_id");
    const redirectUri = request.query.get("redirect_uri");
    const responseType = request.query.get("response_type");
    const scope = request.query.get("scope") || "openid profile email";
    const state = request.query.get("state");
    const nonce = request.query.get("nonce");
    const slug = request.query.get("slug");

    // Validate required parameters
    if (!clientId) {
      return errorResponse("invalid_request", "Missing client_id parameter");
    }

    if (!redirectUri) {
      return errorResponse("invalid_request", "Missing redirect_uri parameter");
    }

    if (!responseType) {
      return errorResponse("invalid_request", "Missing response_type parameter");
    }

    if (!slug) {
      return errorResponse("invalid_request", "Missing slug parameter (tenant identifier)");
    }

    if (responseType !== "code") {
      return redirectError(redirectUri, "unsupported_response_type", "Only 'code' response_type is supported", state);
    }

    if (!scope.includes("openid")) {
      return redirectError(redirectUri, "invalid_scope", "Scope must include 'openid'", state);
    }

    const validation = await oidc.validateClient(clientId, undefined, redirectUri);
    if (!validation.valid || !validation.client) {
      return errorResponse("invalid_client", validation.error ?? "Invalid client");
    }

    if (!oidc.isSlugAllowedForClient(validation.client, slug)) {
      return redirectError(
        redirectUri,
        "access_denied",
        "This application is not allowed for this tenant",
        state
      );
    }

    const oidcParams = Buffer.from(
      JSON.stringify({
        clientId,
        redirectUri,
        scope,
        state,
        nonce,
      })
    ).toString("base64url");

    const loginUrl = new URL(`${FRONTEND_URL}/oauth/login`);
    loginUrl.searchParams.set("oidc", oidcParams);
    loginUrl.searchParams.set("slug", slug);

    return {
      status: 302,
      headers: {
        Location: loginUrl.toString(),
        "Cache-Control": "no-store",
      },
    };
  } catch (error) {
    context.error("Authorization error:", error);
    return errorResponse("server_error", "Internal server error");
  }
}

function errorResponse(error: string, description: string): HttpResponseInit {
  return {
    status: 400,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      error,
      error_description: description,
    }),
  };
}

function redirectError(
  redirectUri: string,
  error: string,
  description: string,
  state?: string
): HttpResponseInit {
  const url = new URL(redirectUri);
  url.searchParams.set("error", error);
  url.searchParams.set("error_description", description);
  if (state) {
    url.searchParams.set("state", state);
  }

  return {
    status: 302,
    headers: {
      Location: url.toString(),
      "Cache-Control": "no-store",
    },
  };
}

app.http("OAuthAuthorize", {
  methods: ["GET"],
  route: "oauth/authorize",
  handler,
  authLevel: "anonymous",
});

export default handler;
