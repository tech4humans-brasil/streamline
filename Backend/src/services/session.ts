import { randomUUID } from "crypto";
import * as bcrypt from "bcrypt";
import { connect, connectAdmin } from "./mongo";
import AdminClient from "../models/admin/Client";
import UserRepository from "../repositories/User";
import InstituteRepository from "../repositories/Institute";
import { IUser, IUserProviders, IUserRoles } from "../models/client/User";
import { Permissions } from "./permissions";
// Só o tipo é importado de forma estática. O módulo `upload` puxa `file-type`,
// que é ESM, e arrastá-lo para a cadeia do middleware quebrava as suítes de
// endpoint no Jest. Ele também estoura no import quando a connection string do
// storage falta, o que não deveria ser exigência para autenticar.
import type { FileUploaded } from "./upload";
import { KeycloakIdentity } from "./authenticate";

// Papel inicial de usuário provisionado no primeiro acesso. Mantém o
// comportamento do LoginGoogle, que criava com `student`. Quem decide se o
// provisionamento automático continua existindo é o GV-1684.
const INITIAL_ROLE = IUserRoles.student;

const PHOTO_SAS_TTL_SECONDS = 86400 * 30;

export interface StreamlineSession {
  id: string;
  name: string;
  matriculation?: string;
  email: string;
  roles: IUserRoles[];
  institutes: unknown[];
  slug: string;
  client: string;
  tutorials: string[];
  permissions: string[];
  photo_url?: FileUploaded | null;
  realmRoles: string[];
}

const notFound = { status: 404, message: "User not found" };

const resolveTenant = async (acronym: string) => {
  if (!acronym) {
    throw { status: 400, message: "Missing tenant" };
  }

  const adminConn = await connectAdmin();
  const clientAdmin = await new AdminClient(adminConn).model().findOne({
    acronym,
  });

  if (!clientAdmin) {
    throw notFound;
  }

  return { conn: connect(clientAdmin.acronym), acronym: clientAdmin.acronym };
};

const provision = async (
  repository: UserRepository,
  instituteRepository: InstituteRepository,
  identity: KeycloakIdentity,
  acronym: string
): Promise<IUser> => {
  if (!identity.email) {
    throw notFound;
  }

  const user = await repository.create({
    email: identity.email,
    name: identity.name || identity.email,
    roles: [INITIAL_ROLE],
    active: true,
    providers: [IUserProviders.google],
    keycloak_sub: identity.sub,
    // O schema exige `password`. Valor aleatório e descartável: esta conta não
    // autentica localmente. O campo sai no GV-1692.
    password: await bcrypt.hash(randomUUID(), 10),
  });

  const institute = await instituteRepository.findOne({
    where: { acronym },
  });

  if (institute) {
    user.institutes.push(institute);
    await user.save();
  }

  console.log(`[session] provisioned ${identity.email} on ${acronym}`);

  return user;
};

const locate = async (
  repository: UserRepository,
  identity: KeycloakIdentity
): Promise<IUser | null> => {
  const bySub = await repository.findOne({
    where: { keycloak_sub: identity.sub },
  });

  if (bySub) {
    return bySub;
  }

  if (!identity.email) {
    return null;
  }

  // Primeiro login via Keycloak de um usuário que já existe: correlaciona por
  // e-mail e passa a carregar o `sub`. A partir daí o e-mail deixa de ser a
  // chave. Registrado em log para auditoria da migração.
  const byEmail = await repository.findOne({
    where: { email: identity.email },
  });

  if (byEmail) {
    byEmail.keycloak_sub = identity.sub;
    await byEmail.save();
    console.log(
      `[session] reconciled ${identity.email} -> sub ${identity.sub}`
    );
  }

  return byEmail;
};

export const buildSession = async (
  identity: KeycloakIdentity,
  acronym: string,
  options: { withPhotoSas?: boolean } = {}
): Promise<StreamlineSession> => {
  const { conn, acronym: slug } = await resolveTenant(acronym);

  const repository = new UserRepository(conn);

  let user = await locate(repository, identity);

  if (!user) {
    user = await provision(
      repository,
      new InstituteRepository(conn),
      identity,
      slug
    );
  }

  // A checagem de usuário inativo vivia dentro do LoginGoogle. Aqui ela vale
  // para todo request, não só para o login.
  if (!user.active) {
    throw notFound;
  }

  let photo = user.photo_url ?? null;

  // Regenerar o SAS custa uma chamada ao storage. Só vale no endpoint de
  // sessão, não nos 98 endpoints da aplicação.
  if (options.withPhotoSas && photo) {
    try {
      const { default: BlobUploader } = await import("./upload");
      photo = await new BlobUploader(user._id.toString()).updateSas(
        photo,
        PHOTO_SAS_TTL_SECONDS
      );
    } catch (error) {
      console.error("[session] failed to refresh photo sas", error);
    }
  }

  return {
    id: user._id.toString(),
    name: user.name,
    matriculation: user.matriculation,
    email: user.email,
    // As roles seguem vindo do registro local. Mover a autorização para
    // realm/client role do Keycloak é o GV-1689.
    roles: user.roles,
    institutes: user.institutes,
    slug,
    client: conn.name,
    tutorials: user.tutorials ?? [],
    permissions: Permissions.getPermissionsByRoles(user.roles),
    photo_url: photo,
    realmRoles: identity.realmRoles,
  };
};

export const touchLastLogin = async (
  acronym: string,
  userId: string
): Promise<void> => {
  try {
    const { conn } = await resolveTenant(acronym);
    await new UserRepository(conn).findByIdAndUpdate({
      id: userId,
      data: { last_login: new Date() },
    });
  } catch (error) {
    console.error("[session] failed to update last_login", error);
  }
};

export default { buildSession, touchLastLogin };
