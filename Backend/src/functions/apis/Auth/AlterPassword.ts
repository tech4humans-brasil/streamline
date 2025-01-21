import Http, { HttpHandler } from "../../../middlewares/http";
import res from "../../../utils/apiResponse";
import jwt from "../../../services/jwt";
import * as bcrypt from "bcrypt";
import { connect } from "../../../services/mongo";
import UserRepository from "../../../repositories/User";

interface Body {
  password: string;
}

export type Token = {
  id: string;
  client: string;
};

export const handler: HttpHandler = async (_, req, context) => {
  const { password } = req.body as Body;

  const token: Token = jwt.verifyResetPassword(req.headers);

  const conn = connect(token.client);
  const userRepository = new UserRepository(conn);

  const user = await userRepository.findById({ id: token.id });

  if (!user) {
    return res.notFound("User or password not found");
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  user.password = hashedPassword;

  user.save();

  return res.success({
    id: user._id,
    name: user.name,
  });
};

export default new Http(handler)
  .setPublic()
  .setSchemaValidator((schema) => ({
    body: schema.object().shape({
      password: schema.string().required(),
      confirmPassword: schema
        .string()
        .required()
        .oneOf([schema.ref("password")]),
    }),
  }))
  .configure({
    name: "AuthAlterPassword",
    options: {
      methods: ["POST"],
      route: "auth/alter-password",
    },
  });
