const { OAuth2Client } = require("google-auth-library");
const client = new OAuth2Client();
import Http, { HttpHandler } from "../../../middlewares/http";
import res from "../../../utils/apiResponse";
import * as bcrypt from "bcrypt";
import jwt from "../../../services/jwt";
import { connect, connectAdmin } from "../../../services/mongo";
import AdminClient from "../../../models/admin/Client";
import UserRepository from "../../../repositories/User";
import { Permissions } from "../../../services/permissions";
import { IUserProviders, IUserRoles } from "../../../models/client/User";
import InstituteRepository from "../../../repositories/Institute";

interface Body {
  credential: string;
  client_id: string;
}

interface GoogleUserToken {
  hd: string;
  email: string;
  email_verified: boolean;
  name: string;
  jti: string;
}

export const handler: HttpHandler = async (_, req, context) => {
  const { credential, client_id } = req.body as Body;

  const ticket = await client.verifyIdToken({
    idToken: credential,
    audience: client_id,
  });

  const adminConn = await connectAdmin();

  const payload: GoogleUserToken = ticket.getPayload();

  const acronym = payload.hd.split(".")[0];

  const clientAdmin = await new AdminClient(adminConn).model().findOne({
    acronym,
  });

  if (!clientAdmin) {
    return res.notFound("User or password not found");
  }

  const conn = connect(clientAdmin.acronym);

  const userRepository = new UserRepository(conn);

  const email = payload.email;

  let user = await userRepository.findOne({
    where: {
      email,
    },
  });

  if (!user) {
    const institute = await new InstituteRepository(conn).findOne({
      where: {
        acronym,
      },
    });

    user = await userRepository.create({
      email,
      name: payload.name,
      roles: [IUserRoles.student],
      active: true,
      institute: institute.toObject(),
      providers: [IUserProviders.google],
      password: await bcrypt.hash(payload.jti, 10),
    });
  }

  const permissions = Permissions.getPermissionsByRoles(user.roles);

  const token = await jwt.sign({
    id: user._id,
    name: user.name,
    matriculation: user.matriculation,
    email: user.email,
    roles: user.roles,
    institute: user.institute,
    slug: acronym,
    client: conn.name,
    tutorials: user.tutorials,
    permissions,
  });

  return res.success({
    token,
  });
};

export default new Http(handler)
  .setPublic()
  .setSchemaValidator((schema) => ({
    body: schema.object().shape({
      credential: schema.string().required(),
      client_id: schema.string().required(),
    }),
  }))
  .configure({
    name: "AuthLoginGoogle",
    options: {
      methods: ["POST"],
      route: "auth/google",
    },
  });
