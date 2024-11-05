import Http, { HttpHandler } from "../../../middlewares/http";
import res from "../../../utils/apiResponse";
import * as bcrypt from "bcrypt";
import jwt from "../../../services/jwt";
import { connect, connectAdmin } from "../../../services/mongo";
import AdminClient from "../../../models/admin/Client";
import UserRepository from "../../../repositories/User";
import { Permissions } from "../../../services/permissions";

interface Body {
  email: string;
  password: string;
  acronym: string;
}
export const handler: HttpHandler = async (_, req, context) => {
  const { email, password, acronym } = req.body as Body;

  const adminConn = await connectAdmin();

  const client = await new AdminClient(adminConn).model().findOne({
    acronym,
  });

  if (!client) {
    return res.notFound("User or password not found");
  }

  const conn = connect(client.acronym);
  const userRepository = new UserRepository(conn);

  const user = await userRepository.findOne({
    where: {
      active: true,
      email,
    },
  });

  if (!user) {
    return res.notFound("User or password not found");
  }

  if (!(await bcrypt.compare(password, user.password))) {
    return res.unauthorized("User or password not found");
  }

  user.last_login = new Date();
  user.save();

  const permissions = Permissions.getPermissionsByRoles(user.roles);

  const token = await jwt.sign({
    id: user._id,
    name: user.name,
    matriculation: user.matriculation,
    email: user.email,
    roles: user.roles,
    institutes: user.institutes,
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
      password: schema.string().required(),
      email: schema.string().required(),
      acronym: schema.string().required(),
    }),
  }))
  .configure({
    name: "AuthLogin",
    options: {
      methods: ["POST"],
      route: "auth/login",
    },
  });
