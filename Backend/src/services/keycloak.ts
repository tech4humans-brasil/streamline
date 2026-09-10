import * as jwt from "jsonwebtoken";
import { JwksClient } from "jwks-rsa";

const ISSUER = (process.env.KEYCLOAK_ISSUER || "").replace(/\/+$/, "");
const AUDIENCE = process.env.KEYCLOAK_AUDIENCE || "";
const JWKS_URI =
  process.env.KEYCLOAK_JWKS_URI ||
  (ISSUER ? `${ISSUER}/protocol/openid-connect/certs` : "");

// O realm t4h anuncia HS256 entre os algoritmos suportados. Aceitar o algoritmo
// que o token declara permitiria assinar um HS256 usando a chave pública do JWKS
// como segredo. A lista abaixo é fixa e nunca vem do token.
const ALLOWED_ALGORITHMS: jwt.Algorithm[] = ["RS256"];

const CLOCK_TOLERANCE_SECONDS = 5;

export interface KeycloakClaims {
  sub: string;
  email?: string;
  email_verified?: boolean;
  name?: string;
  preferred_username?: string;
  picture?: string;
  azp?: string;
  iss: string;
  aud?: string | string[];
  exp: number;
  iat: number;
  realm_access?: { roles?: string[] };
  resource_access?: Record<string, { roles?: string[] }>;
}

export class KeycloakConfigError extends Error {}

const unauthorized = (message: string) => ({ status: 401, message });

let client: JwksClient | null = null;

export const isConfigured = () => Boolean(ISSUER && JWKS_URI);

const getClient = (): JwksClient => {
  if (!isConfigured()) {
    throw new KeycloakConfigError(
      "KEYCLOAK_ISSUER is not defined; cannot validate Keycloak tokens"
    );
  }

  if (!client) {
    client = new JwksClient({
      jwksUri: JWKS_URI,
      cache: true,
      cacheMaxEntries: 5,
      cacheMaxAge: 10 * 60 * 1000,
      rateLimit: true,
      jwksRequestsPerMinute: 10,
      timeout: 10000,
    });
  }

  return client;
};

const getSigningKey = async (kid: string): Promise<string> => {
  try {
    const key = await getClient().getSigningKey(kid);
    return key.getPublicKey();
  } catch (error) {
    // Chave desconhecida é recusa. Indisponibilidade do JWKS é 503, nunca
    // liberação: sem chave não há como afirmar que o token é legítimo.
    const code = (error as { name?: string })?.name;
    if (code === "SigningKeyNotFoundError") {
      throw unauthorized("Unauthorized");
    }
    console.error("Failed to fetch Keycloak signing key", error);
    throw {
      status: 503,
      message: "Identity provider unavailable",
    };
  }
};

const assertAudience = (claims: KeycloakClaims) => {
  if (!AUDIENCE) {
    return;
  }

  const aud = claims.aud;
  const inAudience = Array.isArray(aud)
    ? aud.includes(AUDIENCE)
    : aud === AUDIENCE;

  // O Keycloak só coloca o client em `aud` quando existe um audience mapper.
  // Sem ele o client aparece em `azp`. Os dois identificam a parte para quem o
  // token foi emitido, então qualquer um dos dois serve — mas um deles precisa
  // bater, senão um token emitido para outra aplicação do mesmo realm passaria.
  if (!inAudience && claims.azp !== AUDIENCE) {
    throw unauthorized("Unauthorized");
  }
};

export const isKeycloakToken = (token: string): boolean => {
  const decoded = jwt.decode(token, { complete: true });
  const alg = decoded?.header?.alg;
  return typeof alg === "string" && ALLOWED_ALGORITHMS.includes(alg as jwt.Algorithm);
};

export const verifyToken = async (token: string): Promise<KeycloakClaims> => {
  const decoded = jwt.decode(token, { complete: true });

  if (!decoded?.header?.kid) {
    throw unauthorized("Unauthorized");
  }

  if (!ALLOWED_ALGORITHMS.includes(decoded.header.alg as jwt.Algorithm)) {
    throw unauthorized("Unauthorized");
  }

  const publicKey = await getSigningKey(decoded.header.kid);

  let claims: KeycloakClaims;
  try {
    claims = jwt.verify(token, publicKey, {
      algorithms: ALLOWED_ALGORITHMS,
      issuer: ISSUER,
      clockTolerance: CLOCK_TOLERANCE_SECONDS,
    }) as KeycloakClaims;
  } catch {
    throw unauthorized("Unauthorized");
  }

  assertAudience(claims);

  if (!claims.sub) {
    throw unauthorized("Unauthorized");
  }

  return claims;
};

export const getRealmRoles = (claims: KeycloakClaims): string[] =>
  claims.realm_access?.roles ?? [];

export const getClientRoles = (
  claims: KeycloakClaims,
  clientId: string
): string[] => claims.resource_access?.[clientId]?.roles ?? [];

export default {
  isConfigured,
  isKeycloakToken,
  verifyToken,
  getRealmRoles,
  getClientRoles,
};
