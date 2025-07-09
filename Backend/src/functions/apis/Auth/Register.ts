import Http, { HttpHandler } from "../../../middlewares/http";
import res from "../../../utils/apiResponse";
import * as bcrypt from "bcrypt";
import { connect, connectAdmin } from "../../../services/mongo";
import AdminClient from "../../../models/admin/Client";
import UserRepository from "../../../repositories/User";
import { IUserRoles, IUserProviders } from "../../../models/client/User";
import InstituteRepository from "../../../repositories/Institute";
import { sendEmail } from "../../../services/email";
import emailTemplate from "../../../utils/emailTemplate";
import jwt from "../../../services/jwt";

interface Body {
  name: string;
  email: string;
  password: string;
  acronym: string;
}

export const handler: HttpHandler = async (_, req, context) => {
  const { name, email, password, acronym } = req.body as Body;

  const adminConn = await connectAdmin();

  const client = await new AdminClient(adminConn).model().findOne({
    acronym,
  });

  if (!client) {
    return res.notFound("Client not found");
  }

  if (!client.config?.externalUsers?.allow) {
    return res.badRequest("External users are not allowed");
  }

  const conn = connect(client.acronym);
  const userRepository = new UserRepository(conn);

  const existingUser = await userRepository.findOne({
    where: {
      email,
    },
  });

  if (existingUser) {
    return res.badRequest("User already exists with this email");
  }

  const instituteRepository = new InstituteRepository(conn);
  const institute = await instituteRepository.findOne({
    where: {
      acronym,
    },
  });

  if (!institute) {
    return res.badRequest("Institute not found");
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await userRepository.create({
    name,
    email,
    password: hashedPassword,
    roles: [IUserRoles.external],
    providers: [IUserProviders.self],
    isExternal: true,
    active: true,
  });

  user.institutes.push(institute);
  const verificationCode = Math.floor(
    100000 + Math.random() * 900000
  ).toString();
  user.twoStepVerification.code = verificationCode;
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
    <p>Olá, ${user.name}!</p>
    <p>Seu cadastro foi realizado com sucesso em nosso sistema!</p>
    <p class="message">
        Aqui está o seu código de verificação. Use-o para continuar o processo:
      </p>
    <div class="code-box">${verificationCode}</div>
    <p>Aqui estão algumas informações importantes:</p>
    <ul>
        <li>O domínio de sua conta é: ${client.acronym}</li>
        <li>Você pode fazer login em: <a href="${client.domains?.[0] ?? process.env.FRONTEND_URL}">Acessar o sistema</a></li>
        <li>Seu email de acesso: ${user.email}</li>
    </ul>
  `;

  const { html, css } = await emailTemplate({
    content,
    contentCss,
    slug: client.acronym,
  });

  await sendEmail(
    user.email,
    `${client.name} | Bem-vindo ao Streamline`,
    html,
    css
  );

  const token = await jwt.signResetPassword({
    id: user._id,
    client: conn.name,
    email: user.email,
  });

  return res.created({
    token,
    message: "Verification code sent to your email",
  });
};

export default new Http(handler)
  .setPublic()
  .setSchemaValidator((schema) => ({
    body: schema.object().shape({
      name: schema.string().required().min(3, "Name must have at least 3 characters").max(255),
      email: schema.string().required().email("Invalid email format"),
      password: schema.string().required().min(6, "Password must have at least 6 characters").max(255),
      acronym: schema.string().required().min(2, "Acronym must have at least 2 characters"),
    }),
  }))
  .configure({
    name: "AuthRegister",
    options: {
      methods: ["POST"],
      route: "auth/register",
    },
  }); 