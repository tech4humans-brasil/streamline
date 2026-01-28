import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import oidc from "../../../services/oidc";
import jwtService from "../../../services/jwt";

interface OIDCParams {
  clientId: string;
  redirectUri: string;
  scope: string;
  state?: string;
  nonce?: string;
}

interface JwtPayload {
  id: string;
  name: string;
  email: string;
  slug: string;
}

/**
 * Exchanges an existing Streamline session token for an OIDC authorization code.
 * This allows users who are already logged in to authorize OIDC clients without re-authenticating.
 */
async function handler(
  request: HttpRequest,
  context: InvocationContext
): Promise<HttpResponseInit> {
  try {
    // Extract authorization header
    const authHeader = request.headers.get("authorization");
    if (!authHeader) {
      return errorResponse("unauthorized", "Missing authorization header", 401);
    }

    // Verify the existing session token
    let user: JwtPayload;
    try {
      user = jwtService.verify<JwtPayload>({ authorization: authHeader });
    } catch {
      return errorResponse("unauthorized", "Invalid or expired session token", 401);
    }

    const body = await request.json() as { oidc: string };
    const { oidc: oidcEncoded } = body;

    if (!oidcEncoded) {
      return errorResponse("invalid_request", "Missing OIDC parameters");
    }

    let oidcParams: OIDCParams;
    try {
      oidcParams = JSON.parse(Buffer.from(oidcEncoded, "base64url").toString());
    } catch {
      return errorResponse("invalid_request", "Invalid OIDC parameters");
    }

    // Validate the OIDC client
    const clientValidation = await oidc.validateClient(
      oidcParams.clientId,
      undefined,
      oidcParams.redirectUri
    );
    if (!clientValidation.valid || !clientValidation.client) {
      return errorResponse("invalid_client", clientValidation.error || "Invalid client");
    }

    // Validate and filter scopes against client's allowed scopes
    const requestedScopes = oidcParams.scope.split(" ").filter(Boolean);
    const allowedScopes = clientValidation.client.scopes || ["openid", "profile", "email"];
    const validatedScopes = requestedScopes.filter(scope => allowedScopes.includes(scope));

    // Ensure at least 'openid' scope is present (required for OIDC)
    if (!validatedScopes.includes("openid")) {
      return errorResponse("invalid_scope", "Scope must include 'openid'");
    }

    // Generate authorization code using the session user info with validated scopes
    const code = await oidc.generateAuthorizationCode({
      clientId: oidcParams.clientId,
      userId: user.id,
      userEmail: user.email,
      userName: user.name,
      userSlug: user.slug,
      redirectUri: oidcParams.redirectUri,
      scope: validatedScopes.join(" "),
      nonce: oidcParams.nonce,
      state: oidcParams.state,
    });

    // Build redirect URL with authorization code
    const redirectUrl = new URL(oidcParams.redirectUri);
    redirectUrl.searchParams.set("code", code);
    if (oidcParams.state) {
      redirectUrl.searchParams.set("state", oidcParams.state);
    }

    return {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-store",
      },
      body: JSON.stringify({
        status: 200,
        message: "OK",
        data: {
          redirect_uri: redirectUrl.toString(),
        },
      }),
    };
  } catch (error) {
    context.error("OIDC AuthorizeSession error:", error);
    return errorResponse("server_error", "Internal server error", 500);
  }
}

function errorResponse(error: string, description: string, status = 400): HttpResponseInit {
  return {
    status,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      error,
      error_description: description,
    }),
  };
}

app.http("OAuthAuthorizeSession", {
  methods: ["POST"],
  route: "oauth/authorize-session",
  handler,
  authLevel: "anonymous",
});

export default handler;
