import Http, { HttpHandler } from "../../../middlewares/http";
import res from "../../../utils/apiResponse";
import * as bcrypt from "bcrypt";
import jwt from "../../../services/jwt";
import { connect, connectAdmin } from "../../../services/mongo";
import AdminClient from "../../../models/admin/Client";
import UserRepository from "../../../repositories/User";
import { sendEmail } from "../../../services/email";
import emailTemplate from "../../../utils/emailTemplate";

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

  const verificationCode = Math.floor(
    100000 + Math.random() * 900000
  ).toString();
  user.twoStepVerification.code = verificationCode;
  await user.save();

  await user.save();

  const content = `
    <p>Olá, ${user.name}!</p>
    <p>Seu código de verificação é:</p>
    
    <div class="code">
      <span>${verificationCode}</span>
    </div>

    <p>Se você não solicitou este código, por favor, ignore este e-mail.</p>
`;

  const contentCss = `
    .code {
      display: flex;
      width: 100%;
      flex: 1;
      justify-content: center;
      align-items: center;
      font-size: 24px;
      font-weight: bold;
      color: #000;
      padding: 10px;
      margin: 10px 0;
    }

    .code span {
      font-size: 24px;
      font-weight: bold;
      color: #000;
      text-align: center;
      background-color: #f5f5f5;
    }
  `;

  const { html, css } = emailTemplate(content, contentCss);

  await sendEmail(user.email, "Your verification code", html, css);

  const token = await jwt.signResetPassword({
    id: user._id,
    client: conn.name,
    email: user.email,
  });

  return res.success({
    token,
    message: "Verification code sent to your email",
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
