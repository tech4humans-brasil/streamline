import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import oidc from "../../../services/oidc";

async function handler(
  request: HttpRequest,
  context: InvocationContext
): Promise<HttpResponseInit> {
  try {
    const bodyText = await request.text();
    const params = new URLSearchParams(bodyText);

    const grantType = params.get("grant_type");

    let clientId = params.get("client_id");
    let clientSecret = params.get("client_secret");

    const authHeader = request.headers.get("authorization");
    if (authHeader?.startsWith("Basic ")) {
      const credentials = Buffer.from(authHeader.slice(6), "base64").toString();
      const [id, secret] = credentials.split(":");
      clientId = clientId || id;
      clientSecret = clientSecret || secret;
    }

    if (!clientId || !clientSecret) {
      return tokenError("invalid_client", "Missing client credentials");
    }

    const clientValidation = await oidc.validateClient(clientId, clientSecret);
    if (!clientValidation.valid) {
      return tokenError("invalid_client", clientValidation.error);
    }

    if (grantType === "authorization_code") {
      return handleAuthorizationCodeGrant(params, clientId);
    } else if (grantType === "refresh_token") {
      return handleRefreshTokenGrant(params, clientId);
    } else {
      return tokenError("unsupported_grant_type", "Supported: authorization_code, refresh_token");
    }
  } catch (error) {
    context.error("Token error:", error);
    return tokenError("server_error", "Internal server error");
  }
}

async function handleAuthorizationCodeGrant(
  params: URLSearchParams,
  clientId: string
): Promise<HttpResponseInit> {
  const code = params.get("code");
  const redirectUri = params.get("redirect_uri");

  if (!code) {
    return tokenError("invalid_request", "Missing code parameter");
  }

  if (!redirectUri) {
    return tokenError("invalid_request", "Missing redirect_uri parameter");
  }

  const codeValidation = await oidc.validateAuthorizationCode(code, clientId, redirectUri);
  if (!codeValidation.valid) {
    return tokenError("invalid_grant", codeValidation.error);
  }

  const codeData = codeValidation.codeData;

  const [accessToken, idToken, refreshToken] = await Promise.all([
    oidc.generateAccessToken({
      sub: codeData.userId,
      email: codeData.userEmail,
      name: codeData.userName,
      slug: codeData.userSlug,
      scope: codeData.scope,
      aud: clientId,
    }),
    codeData.scope.includes("openid")
      ? oidc.generateIdToken({
          sub: codeData.userId,
          email: codeData.userEmail,
          name: codeData.userName,
          aud: clientId,
          nonce: codeData.nonce,
        })
      : null,
    oidc.generateRefreshToken({
      userId: codeData.userId,
      userEmail: codeData.userEmail,
      userName: codeData.userName,
      userSlug: codeData.userSlug,
      clientId,
      scope: codeData.scope,
    }),
  ]);

  const response: Record<string, unknown> = {
    access_token: accessToken,
    token_type: "Bearer",
    expires_in: 3600,
    refresh_token: refreshToken,
  };

  if (idToken) {
    response.id_token = idToken;
  }

  return {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
      Pragma: "no-cache",
    },
    body: JSON.stringify(response),
  };
}

async function handleRefreshTokenGrant(
  params: URLSearchParams,
  clientId: string
): Promise<HttpResponseInit> {
  const refreshToken = params.get("refresh_token");

  if (!refreshToken) {
    return tokenError("invalid_request", "Missing refresh_token parameter");
  }

  const tokenValidation = await oidc.validateRefreshToken(refreshToken, clientId);
  if (!tokenValidation.valid) {
    return tokenError("invalid_grant", tokenValidation.error);
  }

  const tokenData = tokenValidation.tokenData;

  const requestedScope = params.get("scope") || tokenData.scope;

  const [accessToken, idToken, newRefreshToken] = await Promise.all([
    oidc.generateAccessToken({
      sub: tokenData.userId,
      email: tokenData.userEmail,
      name: tokenData.userName,
      slug: tokenData.userSlug,
      scope: requestedScope,
      aud: clientId,
    }),
    requestedScope.includes("openid")
      ? oidc.generateIdToken({
          sub: tokenData.userId,
          email: tokenData.userEmail,
          name: tokenData.userName,
          aud: clientId,
        })
      : null,
    // Issue new refresh token (rotation)
    oidc.generateRefreshToken({
      userId: tokenData.userId,
      userEmail: tokenData.userEmail,
      userName: tokenData.userName,
      userSlug: tokenData.userSlug,
      clientId,
      scope: requestedScope,
    }),
  ]);

  await oidc.revokeRefreshToken(refreshToken);

  const response: Record<string, unknown> = {
    access_token: accessToken,
    token_type: "Bearer",
    expires_in: 3600,
    refresh_token: newRefreshToken,
  };

  if (idToken) {
    response.id_token = idToken;
  }

  return {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
      Pragma: "no-cache",
    },
    body: JSON.stringify(response),
  };
}

function tokenError(error: string, description: string): HttpResponseInit {
  return {
    status: 400,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
      Pragma: "no-cache",
    },
    body: JSON.stringify({
      error,
      error_description: description,
    }),
  };
}

app.http("OAuthToken", {
  methods: ["POST"],
  route: "oauth/token",
  handler,
  authLevel: "anonymous",
});

export default handler;
