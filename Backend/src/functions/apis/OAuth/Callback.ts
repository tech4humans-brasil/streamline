import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import oidc from "../../../services/oidc";
import { OAuth2Client } from "google-auth-library";
import { connect, connectAdmin } from "../../../services/mongo";
import AdminClient from "../../../models/admin/Client";
import UserRepository from "../../../repositories/User";
import { IUserProviders, IUserRoles } from "../../../models/client/User";
import InstituteRepository from "../../../repositories/Institute";
import * as bcrypt from "bcrypt";

const googleClient = new OAuth2Client();

interface GoogleUserToken {
  sub: string;
  jti: string;
  hd?: string;
  email: string;
  email_verified?: boolean;
  name: string;
  picture?: string;
}

interface OIDCParams {
  clientId: string;
  redirectUri: string;
  scope: string;
  state?: string;
  nonce?: string;
}

async function handler(
  request: HttpRequest,
  context: InvocationContext
): Promise<HttpResponseInit> {
  try {
    const body = await request.json() as {
      credential: string;
      client_id: string;
      acronym: string;
      oidc: string;
    };

    const { credential, client_id, acronym, oidc: oidcEncoded } = body;

    if (!credential || !client_id || !acronym || !oidcEncoded) {
      return errorResponse("invalid_request", "Missing required parameters");
    }

    let oidcParams: OIDCParams;
    try {
      oidcParams = JSON.parse(Buffer.from(oidcEncoded, "base64url").toString());
    } catch {
      return errorResponse("invalid_request", "Invalid OIDC parameters");
    }

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

    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: client_id,
    });

    const payload: GoogleUserToken = ticket.getPayload() as unknown as GoogleUserToken;

    const adminConn = await connectAdmin();
    const clientAdmin = await new AdminClient(adminConn).model().findOne({ acronym });

    if (!clientAdmin) {
      return redirectError(
        oidcParams.redirectUri,
        "access_denied",
        "Invalid tenant",
        oidcParams.state
      );
    }

    const conn = connect(clientAdmin.acronym);
    const userRepository = new UserRepository(conn);

    // Find or create user
    let user = await userRepository.findOne({
      where: { email: payload.email },
    });

    if (user && !user.active) {
      return redirectError(
        oidcParams.redirectUri,
        "access_denied",
        "User account is disabled",
        oidcParams.state
      );
    }

    if (!user) {
      const institute = await new InstituteRepository(conn).findOne({
        where: { acronym },
      });

      user = await userRepository.create({
        email: payload.email,
        name: payload.name,
        roles: [IUserRoles.student],
        active: true,
        providers: [IUserProviders.google],
        password: await bcrypt.hash(payload.jti, 10),
      });

      if (institute) {
        user.institutes.push(institute);
      }
    }

    user.last_login = new Date();
    await user.save();

    // Generate authorization code with validated scopes
    const code = await oidc.generateAuthorizationCode({
      clientId: oidcParams.clientId,
      userId: user._id.toString(),
      userEmail: user.email,
      userName: user.name,
      userSlug: acronym,
      redirectUri: oidcParams.redirectUri,
      scope: validatedScopes.join(" "),
      nonce: oidcParams.nonce,
      state: oidcParams.state,
    });

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
    context.error("OIDC Callback error:", error);
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
    status: 200,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      status: 200,
      message: "OK",
      data: {
        redirect_uri: url.toString(),
      },
    }),
  };
}

app.http("OAuthCallback", {
  methods: ["POST"],
  route: "oauth/callback",
  handler,
  authLevel: "anonymous",
});

export default handler;
