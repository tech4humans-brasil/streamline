import { generateKeyPairSync } from "crypto";
import * as jwt from "jsonwebtoken";

const ISSUER = "https://id.techforhumans.com.br/realms/t4h";
const AUDIENCE = "streamline-dev";
const KID = "test-kid";

const { privateKey, publicKey } = generateKeyPairSync("rsa", {
  modulusLength: 2048,
  publicKeyEncoding: { type: "spki", format: "pem" },
  privateKeyEncoding: { type: "pkcs8", format: "pem" },
});

const other = generateKeyPairSync("rsa", {
  modulusLength: 2048,
  publicKeyEncoding: { type: "spki", format: "pem" },
  privateKeyEncoding: { type: "pkcs8", format: "pem" },
});

type JwksBehaviour = "ok" | "unknown-kid" | "unavailable";
let jwksBehaviour: JwksBehaviour = "ok";

jest.mock("jwks-rsa", () => ({
  JwksClient: class {
    async getSigningKey(kid: string) {
      if (jwksBehaviour === "unavailable") {
        throw Object.assign(new Error("connect ETIMEDOUT"), {
          name: "JwksError",
        });
      }
      if (jwksBehaviour === "unknown-kid" || kid !== KID) {
        throw Object.assign(new Error("Unable to find a signing key"), {
          name: "SigningKeyNotFoundError",
        });
      }
      return { getPublicKey: () => publicKey };
    }
  },
}));

const signKeycloak = (
  payload: Record<string, unknown> = {},
  options: jwt.SignOptions = {},
  key: string = privateKey
) =>
  jwt.sign(
    {
      sub: "e2b1c0de-0000-4000-8000-000000000001",
      iss: ISSUER,
      azp: AUDIENCE,
      email: "anderson.silveira@tech4h.com.br",
      email_verified: true,
      name: "Anderson Silveira",
      realm_access: { roles: ["basic"] },
      ...payload,
    },
    key,
    { algorithm: "RS256", keyid: KID, expiresIn: "5m", ...options }
  );

const bearer = (token: string) => ({ authorization: `Bearer ${token}` });

const loadAuth = (mode: "both" | "keycloak") => {
  jest.resetModules();
  process.env.AUTH_MODE = mode;
  process.env.KEYCLOAK_ISSUER = ISSUER;
  process.env.KEYCLOAK_AUDIENCE = AUDIENCE;
  process.env.JWT_SECRET = "jest";
  process.env.JWT_RESET_PASSWORD_SECRET = "jest-reset";
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  return require("./authenticate") as typeof import("./authenticate");
};

const expectStatus = async (promise: Promise<unknown>, status: number) => {
  await expect(promise).rejects.toMatchObject({ status });
};

beforeEach(() => {
  jwksBehaviour = "ok";
});

describe("authenticate - token do Keycloak", () => {
  it("aceita token válido e expõe as realm roles", async () => {
    const { authenticate } = loadAuth("both");

    const result = await authenticate(bearer(signKeycloak()));

    expect(result.kind).toBe("keycloak");
    if (result.kind !== "keycloak") throw new Error("kind inesperado");
    expect(result.identity.sub).toBe("e2b1c0de-0000-4000-8000-000000000001");
    expect(result.identity.email).toBe("anderson.silveira@tech4h.com.br");
    expect(result.identity.emailVerified).toBe(true);
    expect(result.identity.realmRoles).toEqual(["basic"]);
  });

  it("aceita quando o client está em aud e não em azp", async () => {
    const { authenticate } = loadAuth("both");

    const token = signKeycloak({ azp: "outro-client", aud: [AUDIENCE] });

    await expect(authenticate(bearer(token))).resolves.toMatchObject({
      kind: "keycloak",
    });
  });

  it("recusa token expirado", async () => {
    const { authenticate } = loadAuth("both");

    const token = signKeycloak({}, { expiresIn: "-1m" });

    await expectStatus(authenticate(bearer(token)), 401);
  });

  it("recusa assinatura de outra chave", async () => {
    const { authenticate } = loadAuth("both");

    const token = signKeycloak({}, {}, other.privateKey);

    await expectStatus(authenticate(bearer(token)), 401);
  });

  it("recusa issuer diferente do realm esperado", async () => {
    const { authenticate } = loadAuth("both");

    const token = signKeycloak({ iss: "https://id.exemplo.com/realms/outro" });

    await expectStatus(authenticate(bearer(token)), 401);
  });

  it("recusa token emitido para outra aplicação do mesmo realm", async () => {
    const { authenticate } = loadAuth("both");

    const token = signKeycloak({ azp: "webapp", aud: ["account"] });

    await expectStatus(authenticate(bearer(token)), 401);
  });

  it("recusa kid desconhecido", async () => {
    const { authenticate } = loadAuth("both");
    jwksBehaviour = "unknown-kid";

    await expectStatus(authenticate(bearer(signKeycloak())), 401);
  });

  it("devolve 503 quando o JWKS está indisponível, sem liberar acesso", async () => {
    const { authenticate } = loadAuth("both");
    jwksBehaviour = "unavailable";

    await expectStatus(authenticate(bearer(signKeycloak())), 503);
  });

  it("recusa token sem kid no header", async () => {
    const { authenticate } = loadAuth("both");

    const token = jwt.sign({ sub: "x", iss: ISSUER }, privateKey, {
      algorithm: "RS256",
      expiresIn: "5m",
    });

    await expectStatus(authenticate(bearer(token)), 401);
  });
});

describe("authenticate - token real do realm t4h", () => {
  // Estrutura capturada do "Generated access token" do client streamline-dev
  // em 10/09/2026, via aba Avaliar do console. Serve de regressão: se a forma
  // do token mudar no realm, este teste quebra antes do ambiente.
  const REAL_CLAIMS = {
    iss: ISSUER,
    aud: ["streamline-dev", "mcp-clients", "account"],
    sub: "399a7c25-56ab-45ff-9a0c-0ea0d931a00a",
    typ: "Bearer",
    azp: "streamline-dev",
    acr: "1",
    realm_access: {
      roles: [
        "finops-user",
        "analytics-admin",
        "rh-admin",
        "sgr-admin",
        "default-roles-t4h",
        "offline_access",
        "uma_authorization",
        "mcp-admin",
      ],
    },
    resource_access: {
      account: { roles: ["manage-account", "view-profile"] },
    },
    scope: "openid mcp-audience email profile",
    email_verified: true,
    name: "Anderson Silveira",
    preferred_username: "anderson.silveira@tech4h.com.br",
    email: "anderson.silveira@tech4h.com.br",
  };

  it("aceita, mesmo com mcp-clients e account no aud", async () => {
    const { authenticate } = loadAuth("keycloak");

    const result = await authenticate(bearer(signKeycloak(REAL_CLAIMS)));

    expect(result.kind).toBe("keycloak");
    if (result.kind !== "keycloak") throw new Error("kind inesperado");
    expect(result.identity.sub).toBe(REAL_CLAIMS.sub);
    expect(result.identity.email).toBe(REAL_CLAIMS.email);
    expect(result.identity.emailVerified).toBe(true);
    expect(result.identity.realmRoles).toContain("mcp-admin");
    expect(result.identity.realmRoles).toHaveLength(8);
  });

  it("não encontra client role do streamline: resource_access só tem account", async () => {
    const { authenticate } = loadAuth("keycloak");

    const result = await authenticate(bearer(signKeycloak(REAL_CLAIMS)));

    if (result.kind !== "keycloak") throw new Error("kind inesperado");
    // Nenhuma client role foi criada ainda no client streamline-dev. Quando o
    // GV-1684 definir o modelo, é aqui que elas passam a aparecer.
    expect(result.identity.clientRoles).toEqual([]);
  });

  it("picture ausente vira null, sem quebrar a sessão", async () => {
    const { authenticate } = loadAuth("keycloak");

    const result = await authenticate(bearer(signKeycloak(REAL_CLAIMS)));

    if (result.kind !== "keycloak") throw new Error("kind inesperado");
    expect(result.identity.picture).toBeNull();
  });
});

describe("authenticate - confusão de algoritmo", () => {
  it("não aceita HS256 assinado com a chave pública do JWKS", async () => {
    const { authenticate } = loadAuth("keycloak");

    // Ataque clássico: o realm anuncia HS256, então o atacante assina um token
    // HS256 usando a chave pública (que é conhecida) como segredo. A rota do
    // Keycloak fixa RS256, então este token cai na via legada e é recusado
    // porque o modo é keycloak-only.
    const token = jwt.sign({ sub: "x", iss: ISSUER }, publicKey, {
      algorithm: "HS256",
      keyid: KID,
      expiresIn: "5m",
    });

    await expectStatus(authenticate(bearer(token)), 401);
  });
});

describe("authenticate - token legado", () => {
  it("aceita no modo both", async () => {
    const { authenticate } = loadAuth("both");

    const token = jwt.sign(
      { id: "1", email: "a@tech4h.com.br", permissions: [] },
      "jest",
      { expiresIn: "1d" }
    );

    const result = await authenticate(bearer(token));

    expect(result.kind).toBe("legacy");
  });

  it("recusa no modo keycloak", async () => {
    const { authenticate } = loadAuth("keycloak");

    const token = jwt.sign({ id: "1", permissions: [] }, "jest", {
      expiresIn: "1d",
    });

    await expectStatus(authenticate(bearer(token)), 401);
  });
});

describe("authenticate - sem credencial", () => {
  it("recusa quando não há header authorization", async () => {
    const { authenticate } = loadAuth("both");

    await expectStatus(authenticate({}), 401);
  });

  it("recusa token malformado com 401, não 500", async () => {
    const { authenticate } = loadAuth("both");

    await expectStatus(authenticate(bearer("abc")), 401);
  });

  it("deixa TokenExpiredError subir para o tratamento do middleware", async () => {
    const { authenticate } = loadAuth("both");

    const token = jwt.sign({ id: "1" }, "jest", { expiresIn: "-1m" });

    await expect(authenticate(bearer(token))).rejects.toMatchObject({
      name: "TokenExpiredError",
    });
  });
});
