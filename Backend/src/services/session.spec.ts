import { KeycloakIdentity } from "./authenticate";

const identity: KeycloakIdentity = {
  sub: "399a7c25-56ab-45ff-9a0c-0ea0d931a00a",
  email: "anderson.silveira@tech4h.com.br",
  emailVerified: true,
  name: "Anderson Silveira",
  picture: null,
  realmRoles: ["mcp-admin", "rh-admin"],
  clientRoles: [],
};

type FakeUser = {
  _id: { toString: () => string };
  name: string;
  email: string;
  matriculation?: string;
  roles: string[];
  institutes: unknown[];
  tutorials: string[];
  active: boolean;
  photo_url: unknown;
  keycloak_sub?: string | null;
  save: jest.Mock;
};

const makeUser = (over: Partial<FakeUser> = {}): FakeUser => ({
  _id: { toString: () => "665f1c0de0000000000000a1" },
  name: "Anderson Silveira",
  email: identity.email,
  matriculation: "2020123",
  roles: ["admin"],
  institutes: [],
  tutorials: ["intro"],
  active: true,
  photo_url: null,
  keycloak_sub: null,
  save: jest.fn().mockResolvedValue(undefined),
  ...over,
});

// Estado controlado pelos testes
let adminClient: { acronym: string } | null = { acronym: "t4h" };
let userBySub: FakeUser | null = null;
let userByEmail: FakeUser | null = null;
let created: FakeUser | null = null;
const createMock = jest.fn();

jest.mock("./mongo", () => ({
  connectAdmin: jest.fn().mockResolvedValue({}),
  connect: jest.fn().mockReturnValue({ name: "streamline-t4h" }),
  default: {},
}));

jest.mock("../models/admin/Client", () => ({
  __esModule: true,
  default: class {
    model() {
      return { findOne: async () => adminClient };
    }
  },
}));

jest.mock("../repositories/User", () => ({
  __esModule: true,
  default: class {
    async findOne({ where }: { where: Record<string, unknown> }) {
      if ("keycloak_sub" in where) return userBySub;
      if ("email" in where) return userByEmail;
      return null;
    }
    async create(data: Record<string, unknown>) {
      createMock(data);
      created = makeUser({
        roles: data.roles as string[],
        keycloak_sub: data.keycloak_sub as string,
        institutes: [],
        tutorials: [],
        matriculation: undefined,
      });
      return created;
    }
    async findByIdAndUpdate() {
      return null;
    }
  },
}));

jest.mock("../repositories/Institute", () => ({
  __esModule: true,
  default: class {
    async findOne() {
      return { name: "Tech4Humans", acronym: "t4h" };
    }
  },
}));

jest.mock("./upload", () => ({
  __esModule: true,
  default: class {
    async updateSas(file: unknown) {
      return file;
    }
  },
}));

jest.mock("./permissions", () => ({
  Permissions: {
    getPermissionsByRoles: (roles: string[]) =>
      roles.flatMap((r) => [`${r}.read`, `${r}.write`]),
  },
}));

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { buildSession } = require("./session") as typeof import("./session");

beforeEach(() => {
  adminClient = { acronym: "t4h" };
  userBySub = null;
  userByEmail = null;
  created = null;
  createMock.mockClear();
});

describe("buildSession", () => {
  it("monta a sessão do usuário já correlacionado", async () => {
    userBySub = makeUser({ keycloak_sub: identity.sub });

    const session = await buildSession(identity, "t4h");

    expect(session.id).toBe("665f1c0de0000000000000a1");
    expect(session.email).toBe(identity.email);
    expect(session.slug).toBe("t4h");
    expect(session.client).toBe("streamline-t4h");
    expect(session.matriculation).toBe("2020123");
    expect(session.tutorials).toEqual(["intro"]);
  });

  it("deriva permissions das roles locais, não das realm roles", async () => {
    userBySub = makeUser({ roles: ["admin"] });

    const session = await buildSession(identity, "t4h");

    // GV-1689 é quem move a autorização para o Keycloak. Aqui as realm roles
    // são expostas ao lado, sem virar permissão.
    expect(session.roles).toEqual(["admin"]);
    expect(session.permissions).toEqual(["admin.read", "admin.write"]);
    expect(session.realmRoles).toEqual(["mcp-admin", "rh-admin"]);
  });

  it("correlaciona por e-mail no primeiro login e grava o sub", async () => {
    const existing = makeUser({ keycloak_sub: null });
    userByEmail = existing;

    const session = await buildSession(identity, "t4h");

    expect(existing.keycloak_sub).toBe(identity.sub);
    expect(existing.save).toHaveBeenCalled();
    expect(session.email).toBe(identity.email);
  });

  it("provisiona usuário novo com o papel inicial e o sub", async () => {
    const session = await buildSession(identity, "t4h");

    expect(createMock).toHaveBeenCalledTimes(1);
    const data = createMock.mock.calls[0][0];
    expect(data.email).toBe(identity.email);
    expect(data.roles).toEqual(["student"]);
    expect(data.keycloak_sub).toBe(identity.sub);
    expect(data.password).toBeDefined();
    expect(session.roles).toEqual(["student"]);
  });

  it("recusa usuário inativo mesmo com token válido", async () => {
    userBySub = makeUser({ active: false });

    await expect(buildSession(identity, "t4h")).rejects.toMatchObject({
      status: 404,
    });
  });

  it("recusa tenant inexistente", async () => {
    adminClient = null;
    userBySub = makeUser();

    await expect(buildSession(identity, "nao-existe")).rejects.toMatchObject({
      status: 404,
    });
  });

  it("recusa quando o header de tenant não vem", async () => {
    userBySub = makeUser();

    await expect(buildSession(identity, "")).rejects.toMatchObject({
      status: 400,
    });
  });

  it("não regenera o SAS da foto sem withPhotoSas", async () => {
    const photo = { url: "https://blob/x", name: "x" };
    userBySub = makeUser({ photo_url: photo });

    const session = await buildSession(identity, "t4h");

    expect(session.photo_url).toBe(photo);
  });
});
