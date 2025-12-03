import Http, { HttpHandler } from "../../../middlewares/http";
import res from "../../../utils/apiResponse";
import jwt from "../../../services/jwt";
import { connect, connectAdmin } from "../../../services/mongo";
import AdminClient from "../../../models/admin/Client";
import UserRepository from "../../../repositories/User";
import { sendEmail } from "../../../services/email";
import emailTemplate from "../../../utils/emailTemplate";
import { RecaptchaService } from "../../../services/recaptcha";

interface Body {
  email: string;
  acronym: string;
  captchaToken?: string;
}

const recaptchaService = new RecaptchaService();

export const handler: HttpHandler = async (_, req, context) => {
  const { email, acronym, captchaToken } = req.body as Body;
  const isAdmin = context.functionName === "AdminForgotPassword";

  if (!isAdmin) {
    const isCaptchaValid = await recaptchaService.verify({
      token: captchaToken,
      recaptchaAction: "forgot_password",
    });

    if (!isCaptchaValid) {
      return res.unauthorized("Captcha token is invalid");
    }
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
      email,
    },
  });

  if (!user) {
    return res.success({
      success: true,
    });
  }

  if (!isAdmin) {
    if (user.forgotPassword.code_expiration && user.forgotPassword.code_expiration > new Date()) {
      if (user.forgotPassword.code_attempts >= 3) {
        return res.forbidden("Too many code attempts");
      }

      user.forgotPassword.code_attempts++;
      await user.save();
    } else {
      user.forgotPassword.code_expiration = new Date(Date.now() + 10 * 10 * 1000);
      user.forgotPassword.code_attempts = 0;
      await user.save();
    }
  }

  const token = await jwt.signResetPassword({
    id: user._id,
    client: conn.name,
  });

  const content = `<p>Olá, ${user.name}!</p>
    <p>Recebemos uma solicitação para restaurar sua senha de acesso em nosso site.</p>
    <p>Ela ocorreu em ${new Date().toLocaleString()}.</p>
    <p>Se você reconhece essa ação, clique no botão abaixo para prosseguir:</p>
    <div class="button-container">
        <a href="${process.env.FRONTEND_URL
    }/auth/alter-password/${token}" class="button">REDEFINIR SENHA</a>
    </div>
 `;

  const { html, css } = await emailTemplate({
    content,
    slug: conn.name,
  });

  await sendEmail(email, "Streamline | Redefinição de senha", html, css);

  return res.success({
    success: true,
  });
};

export default new Http(handler)
  .setPublic()
  .setSchemaValidator((schema) => ({
    body: schema.object().shape({
      email: schema.string().email().required(),
      acronym: schema.string().required(),
      captchaToken: schema.string().required(),
    }),
  }))
  .configure({
    name: "AuthForgotPassword",
    options: {
      methods: ["POST"],
      route: "auth/forgot-password",
    },
  });

new Http(handler)
  .setSchemaValidator((schema) => ({
    body: schema.object().shape({
      email: schema.string().email().required(),
      acronym: schema.string().required(),
    }),
  }))
  .configure({
    name: "AdminForgotPassword",
    options: {
      methods: ["POST"],
      route: "auth/forgot-password/admin",
    },
  });
