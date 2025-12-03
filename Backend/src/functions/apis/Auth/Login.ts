import Http, { HttpHandler } from "../../../middlewares/http";
import res from "../../../utils/apiResponse";
import * as bcrypt from "bcrypt";
import jwt from "../../../services/jwt";
import { connect, connectAdmin } from "../../../services/mongo";
import AdminClient from "../../../models/admin/Client";
import UserRepository from "../../../repositories/User";
import { sendEmail } from "../../../services/email";
import emailTemplate from "../../../utils/emailTemplate";
import { RecaptchaService } from "../../../services/recaptcha";

interface Body {
  email: string;
  password: string;
  acronym: string;
  captchaToken?: string;
}

const recaptchaService = new RecaptchaService();

export const handler: HttpHandler = async (_, req, context) => {
  const { email, password, acronym, captchaToken } = req.body as Body;

  const isCaptchaValid = await recaptchaService.verify({
    token: captchaToken,
    recaptchaAction: "login",
  });

  if (!isCaptchaValid) {
    return res.unauthorized("Captcha token is invalid");
  }

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
  user.forgotPassword.code_attempts = 0;
  user.forgotPassword.code_expiration = null;

  await user.save();

  const contentCss = `
    body {
      font-family: Arial, sans-serif;
      background-color: #f8f9fa;
      color: #333;
      padding: 20px;
      margin: 0;
    }

    .container {
      background-color: #fff;
      padding: 30px;
      border-radius: 10px;
      max-width: 500px;
      margin: auto;
      box-shadow: 0 4px 12px rgba(0,0,0,0.1);
    }

    .title {
      font-size: 20px;
      font-weight: 600;
      margin-bottom: 10px;
    }

    .message {
      font-size: 16px;
      margin-bottom: 20px;
      line-height: 1.5;
    }

    .code-box {
      display: flex;
      justify-content: center;
      align-items: center;
      background-color: #f1f3f5;
      padding: 15px 30px;
      border-radius: 8px;
      font-size: 28px;
      font-weight: bold;
      color: #2c2c2c;
      letter-spacing: 4px;
      margin-bottom: 30px;
    }

    .footer {
      font-size: 14px;
      color: #6c757d;
      text-align: center;
    }
  `;

  const content = `
    <div class="container">
      <p class="title">Olá, ${user.name}!</p>
      <p class="message">
        Aqui está o seu código de verificação. Use-o para continuar o processo:
      </p>

      <div class="code-box">${verificationCode}</div>

      <p class="footer">
        Se você não solicitou este código, por favor, ignore este e-mail.
      </p>
    </div>
  `;


  const { html, css } = await emailTemplate({
    content,
    contentCss: contentCss,
    slug: client.acronym,
  });

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
      captchaToken: schema.string().optional(),
    }),
  }))
  .configure({
    name: "AuthLogin",
    options: {
      methods: ["POST"],
      route: "auth/login",
    },
  });
