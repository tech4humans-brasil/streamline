import Http, { HttpHandler } from "../../../middlewares/http";
import res from "../../../utils/apiResponse";
import { connect } from "../../../services/mongo";
import UserRepository from "../../../repositories/User";
import jwt from "../../../services/jwt";
import { Permissions } from "../../../services/permissions";

interface Body {
  verificationCode: string;
  token: string;
}

interface Token {
  id: string;
  client: string;
}

export const handler: HttpHandler = async (_, req) => {
  const { verificationCode, } = req.body as Body;

  const { client: acronym, id } = jwt.verifyResetPassword(req.headers) as Token;

  if (!id || !acronym) {
    return res.badRequest("Invalid token");
  }

  const conn = connect(acronym);
  const userRepository = new UserRepository(conn);

  const user = await userRepository.findById({ id });

  const { code } = user.twoStepVerification;

  if (!user || code !== verificationCode) {
    return res.badRequest("Invalid verification code");
  }

  user.twoStepVerification.code = null;

  user.last_login = new Date();
  await user.save();

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
      verificationCode: schema.string().required(),
      token: schema.string().required(),
    }),
  }))
  .configure({
    name: "TwoStepValidator",
    options: {
      methods: ["POST"],
      route: "auth/two-step-validate",
    },
  });
