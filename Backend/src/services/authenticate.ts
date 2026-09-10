import jwtService, { getTokenFromHeaders } from "./jwt";
import keycloak, { KeycloakClaims } from "./keycloak";

export type AuthMode = "both" | "keycloak";

export const AUTH_MODE: AuthMode =
  process.env.AUTH_MODE === "keycloak" ? "keycloak" : "both";

const STREAMLINE_CLIENT_ID = process.env.KEYCLOAK_AUDIENCE || "";

export interface KeycloakIdentity {
  sub: string;
  email: string;
  emailVerified: boolean;
  name: string;
  picture: string | null;
  realmRoles: string[];
  clientRoles: string[];
}

export type AuthResult =
  | { kind: "legacy"; payload: Record<string, unknown> }
  | { kind: "keycloak"; identity: KeycloakIdentity; claims: KeycloakClaims };

const unauthorized = { status: 401, message: "Unauthorized" };

let modeLogged = false;

const logMode = () => {
  if (modeLogged) {
    return;
  }
  modeLogged = true;
  console.log(
    `[auth] mode=${AUTH_MODE} keycloak=${
      keycloak.isConfigured() ? "configured" : "not configured"
    }`
  );
};

const toIdentity = (claims: KeycloakClaims): KeycloakIdentity => ({
  sub: claims.sub,
  email: claims.email ?? "",
  emailVerified: claims.email_verified === true,
  name: claims.name ?? claims.preferred_username ?? "",
  picture: claims.picture ?? null,
  realmRoles: keycloak.getRealmRoles(claims),
  clientRoles: STREAMLINE_CLIENT_ID
    ? keycloak.getClientRoles(claims, STREAMLINE_CLIENT_ID)
    : [],
});

export const authenticate = async (
  headers: Record<string, string | string[] | undefined>
): Promise<AuthResult> => {
  logMode();

  const token = getTokenFromHeaders(headers);

  if (!token) {
    throw unauthorized;
  }

  // A rota é escolhida pelo algoritmo da assinatura, nunca por algo que o
  // cliente informe no corpo ou em header próprio. Cada validador fixa o seu
  // próprio conjunto de algoritmos, então um token não consegue trocar de via.
  if (keycloak.isKeycloakToken(token)) {
    if (!keycloak.isConfigured()) {
      throw unauthorized;
    }

    const claims = await keycloak.verifyToken(token);
    return { kind: "keycloak", identity: toIdentity(claims), claims };
  }

  if (AUTH_MODE === "keycloak") {
    throw unauthorized;
  }

  try {
    return {
      kind: "legacy",
      payload: jwtService.verify(headers),
    };
  } catch (error) {
    // Token malformado fazia o jsonwebtoken lançar JsonWebTokenError, que não
    // carrega `status` e terminava em 500. Credencial inválida é 401.
    // TokenExpiredError sobe intacto: o middleware tem resposta própria para
    // ele, com o instante da expiração, e o frontend depende disso.
    if ((error as Error)?.name === "TokenExpiredError") {
      throw error;
    }

    if ((error as { status?: number })?.status) {
      throw error;
    }

    throw unauthorized;
  }
};

export default { authenticate, AUTH_MODE };
