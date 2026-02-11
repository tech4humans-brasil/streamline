import * as jwt from "jsonwebtoken";
import * as crypto from "crypto";
import * as bcrypt from "bcrypt";

export interface JWK {
  kty: string;
  alg?: string;
  use?: string;
  kid?: string;
  [key: string]: string | undefined;
}

export interface JWTPayload {
  iss?: string;
  sub?: string;
  aud?: string | string[];
  iat?: number;
  exp?: number;
  nbf?: number;
  jti?: string;
  [key: string]: unknown;
}

import { connectAdmin } from "./mongo";
import OIDCClient, { IOIDCClient } from "../models/admin/OIDCClient";
import OIDCAuthorizationCode, { IOIDCAuthorizationCode } from "../models/admin/OIDCAuthorizationCode";
import OIDCRefreshToken, { IOIDCRefreshToken } from "../models/admin/OIDCRefreshToken";

const ISSUER_URL = process.env.OIDC_ISSUER_URL || "http://localhost:7071";
const ACCESS_TOKEN_EXPIRY = 3600;
const ID_TOKEN_EXPIRY = 3600;
const REFRESH_TOKEN_EXPIRY = 30 * 24 * 3600;
const AUTH_CODE_EXPIRY = 10 * 60 * 1000;

const ENV_PRIVATE_KEY = process.env.OIDC_PRIVATE_KEY;
const ENV_PUBLIC_KEY = process.env.OIDC_PUBLIC_KEY;
const ENV_KEY_ID = process.env.OIDC_KEY_ID || "oidc-key-1";

let cachedKeyPair: {
  kid: string;
  privateKey: crypto.KeyObject;
  publicKey: crypto.KeyObject;
} | null = null;

async function getSigningKey(): Promise<{
  kid: string;
  privateKey: crypto.KeyObject;
  publicKey: crypto.KeyObject;
}> {
  // Return cached key if available
  if (cachedKeyPair) {
    return cachedKeyPair;
  }

  if (!ENV_PRIVATE_KEY || !ENV_PUBLIC_KEY) {
    throw new Error(
      "OIDC signing keys not configured. Set OIDC_PRIVATE_KEY and OIDC_PUBLIC_KEY environment variables. " +
      "Generate keys using: npx ts-node src/scripts/generate-oidc-keys.ts"
    );
  }

  const privateKeyPem = ENV_PRIVATE_KEY.replace(/\\n/g, "\n");
  const publicKeyPem = ENV_PUBLIC_KEY.replace(/\\n/g, "\n");

  const privateKey = crypto.createPrivateKey(privateKeyPem);
  const publicKey = crypto.createPublicKey(publicKeyPem);

  cachedKeyPair = {
    kid: ENV_KEY_ID,
    privateKey,
    publicKey,
  };

  console.log(`OIDC signing key loaded from environment variables (kid: ${ENV_KEY_ID})`);
  return cachedKeyPair;
}

export async function getPublicKeys(): Promise<JWK[]> {
  if (!ENV_PUBLIC_KEY) {
    throw new Error(
      "OIDC public key not configured. Set OIDC_PUBLIC_KEY environment variable. " +
      "Generate keys using: npx ts-node src/scripts/generate-oidc-keys.ts"
    );
  }

  const publicKeyPem = ENV_PUBLIC_KEY.replace(/\\n/g, "\n");
  const publicKey = crypto.createPublicKey(publicKeyPem);
  const jwk = publicKey.export({ format: "jwk" }) as JWK;

  return [{
    ...jwk,
    kid: ENV_KEY_ID,
    alg: "RS256",
    use: "sig",
  }];
}

export async function validateClient(
  clientId: string,
  clientSecret?: string,
  redirectUri?: string
): Promise<{ valid: boolean; client?: IOIDCClient; error?: string }> {
  const conn = await connectAdmin();
  const clientModel = new OIDCClient(conn).model();

  const client = await clientModel.findOne({ clientId, active: true });

  if (!client) {
    return { valid: false, error: "Invalid client_id" };
  }

  if (clientSecret !== undefined) {
    const secretValid = await bcrypt.compare(clientSecret, client.clientSecret);
    if (!secretValid) {
      return { valid: false, error: "Invalid client_secret" };
    }
  }

  if (redirectUri !== undefined) {
    if (!client.redirectUris.includes(redirectUri)) {
      return { valid: false, error: "Invalid redirect_uri" };
    }
  }

  return { valid: true, client };
}

export function isSlugAllowedForClient(client: IOIDCClient, slug: string): boolean {
  const allowed = client.allowedSlugs;
  return Array.isArray(allowed) && allowed.length > 0 && allowed.includes(slug);
}

export async function generateAuthorizationCode(params: {
  clientId: string;
  userId: string;
  userEmail: string;
  userName: string;
  userSlug: string;
  redirectUri: string;
  scope: string;
  nonce?: string;
  state?: string;
}): Promise<string> {
  const conn = await connectAdmin();
  const codeModel = new OIDCAuthorizationCode(conn).model();

  const code = crypto.randomBytes(32).toString("hex");

  await codeModel.create({
    code,
    clientId: params.clientId,
    userId: params.userId,
    userEmail: params.userEmail,
    userName: params.userName,
    userSlug: params.userSlug,
    redirectUri: params.redirectUri,
    scope: params.scope,
    nonce: params.nonce,
    state: params.state,
    used: false,
    expiresAt: new Date(Date.now() + AUTH_CODE_EXPIRY),
  });

  return code;
}

export async function validateAuthorizationCode(
  code: string,
  clientId: string,
  redirectUri: string
): Promise<{ valid: boolean; codeData?: IOIDCAuthorizationCode; error?: string }> {
  const conn = await connectAdmin();
  const codeModel = new OIDCAuthorizationCode(conn).model();

  const codeDoc = await codeModel.findOne({
    code,
    clientId,
    used: false,
    expiresAt: { $gt: new Date() },
  });

  if (!codeDoc) {
    return { valid: false, error: "Invalid or expired authorization code" };
  }

  if (codeDoc.redirectUri !== redirectUri) {
    return { valid: false, error: "redirect_uri mismatch" };
  }

  codeDoc.used = true;
  await codeDoc.save();

  return { valid: true, codeData: codeDoc };
}

export async function generateIdToken(params: {
  sub: string;
  email: string;
  name: string;
  aud: string;
  nonce?: string;
}): Promise<string> {
  const { kid, privateKey } = await getSigningKey();

  const idToken = jwt.sign(
    {
      sub: params.sub,
      email: params.email,
      name: params.name,
      nonce: params.nonce,
    },
    privateKey,
    {
      algorithm: "RS256",
      keyid: kid,
      issuer: ISSUER_URL,
      audience: params.aud,
      expiresIn: ID_TOKEN_EXPIRY,
    }
  );

  return idToken;
}

export async function generateAccessToken(params: {
  sub: string;
  email: string;
  name: string;
  slug: string;
  scope: string;
  aud: string;
}): Promise<string> {
  const { kid, privateKey } = await getSigningKey();

  const accessToken = jwt.sign(
    {
      sub: params.sub,
      email: params.email,
      name: params.name,
      slug: params.slug,
      scope: params.scope,
    },
    privateKey,
    {
      algorithm: "RS256",
      keyid: kid,
      issuer: ISSUER_URL,
      audience: params.aud,
      expiresIn: ACCESS_TOKEN_EXPIRY,
    }
  );

  return accessToken;
}

export async function generateRefreshToken(params: {
  userId: string;
  userEmail: string;
  userName: string;
  userSlug: string;
  clientId: string;
  scope: string;
}): Promise<string> {
  const conn = await connectAdmin();
  const refreshModel = new OIDCRefreshToken(conn).model();

  const token = crypto.randomBytes(48).toString("hex");

  const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

  await refreshModel.create({
    tokenHash,
    clientId: params.clientId,
    userId: params.userId,
    userEmail: params.userEmail,
    userName: params.userName,
    userSlug: params.userSlug,
    scope: params.scope,
    revoked: false,
    expiresAt: new Date(Date.now() + REFRESH_TOKEN_EXPIRY * 1000),
  });

  return token;
}

export async function validateRefreshToken(
  token: string,
  clientId: string
): Promise<{ valid: boolean; tokenData?: IOIDCRefreshToken; error?: string }> {
  const conn = await connectAdmin();
  const refreshModel = new OIDCRefreshToken(conn).model();

  const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

  const tokenDoc = await refreshModel.findOne({
    tokenHash,
    clientId,
    revoked: false,
    expiresAt: { $gt: new Date() },
  });

  if (!tokenDoc) {
    return { valid: false, error: "Invalid or expired refresh token" };
  }

  return { valid: true, tokenData: tokenDoc };
}

export async function revokeRefreshToken(token: string): Promise<boolean> {
  const conn = await connectAdmin();
  const refreshModel = new OIDCRefreshToken(conn).model();

  const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

  const result = await refreshModel.updateOne(
    { tokenHash },
    { revoked: true }
  );

  return result.modifiedCount > 0;
}

export async function verifyAccessToken(token: string): Promise<{
  valid: boolean;
  payload?: JWTPayload;
  error?: string;
}> {
  try {
    const { publicKey } = await getSigningKey();

    const payload = jwt.verify(token, publicKey, {
      issuer: ISSUER_URL,
    }) as JWTPayload;

    return { valid: true, payload };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return { valid: false, error: errorMessage };
  }
}

export async function registerClient(params: {
  clientId: string;
  clientSecret: string;
  name: string;
  description?: string;
  redirectUris: string[];
  scopes?: string[];
  allowedSlugs: string[];
}): Promise<IOIDCClient> {
  if (!params.allowedSlugs?.length) {
    throw new Error("allowedSlugs is required and must contain at least one slug");
  }

  const conn = await connectAdmin();
  const clientModel = new OIDCClient(conn).model();

  const hashedSecret = await bcrypt.hash(params.clientSecret, 10);

  const client = await clientModel.create({
    clientId: params.clientId,
    clientSecret: hashedSecret,
    name: params.name,
    description: params.description,
    redirectUris: params.redirectUris,
    scopes: params.scopes || ["openid", "profile", "email"],
    allowedSlugs: params.allowedSlugs,
    active: true,
  });

  return client;
}

export function getDiscoveryMetadata() {
  return {
    issuer: ISSUER_URL,
    authorization_endpoint: `${ISSUER_URL}/api/oauth/authorize`,
    token_endpoint: `${ISSUER_URL}/api/oauth/token`,
    userinfo_endpoint: `${ISSUER_URL}/api/oauth/userinfo`,
    jwks_uri: `${ISSUER_URL}/api/oauth/jwks`,
    response_types_supported: ["code"],
    grant_types_supported: ["authorization_code", "refresh_token"],
    subject_types_supported: ["public"],
    id_token_signing_alg_values_supported: ["RS256"],
    scopes_supported: ["openid", "profile", "email"],
    token_endpoint_auth_methods_supported: ["client_secret_post", "client_secret_basic"],
    claims_supported: ["sub", "iss", "aud", "exp", "iat", "nonce", "name", "email"],
  };
}

export default {
  getPublicKeys,
  validateClient,
  isSlugAllowedForClient,
  generateAuthorizationCode,
  validateAuthorizationCode,
  generateIdToken,
  generateAccessToken,
  generateRefreshToken,
  validateRefreshToken,
  revokeRefreshToken,
  verifyAccessToken,
  registerClient,
  getDiscoveryMetadata,
};
