import Http, { HttpHandler } from "../../../middlewares/http";
import res from "../../../utils/apiResponse";
import * as bcrypt from "bcrypt";
import { connect, connectAdmin } from "../../../services/mongo";
import AdminClient from "../../../models/admin/Client";
import UserRepository from "../../../repositories/User";
import { IUserRoles } from "../../../models/client/User";
import InstituteRepository from "../../../repositories/Institute";
import jwt from "../../../services/jwt";
import { sendEmail } from "../../../services/email";
import emailTemplate from "../../../utils/emailTemplate";
import { StatusType } from "../../../models/client/Status";

interface Body {
  name: string;
  acronym: string;
  email?: string;
}
export const handler: HttpHandler = async (_, req, context) => {
  const { name, acronym, email } = req.body as Body;

  const adminConn = await connectAdmin();

  const client = await new AdminClient(adminConn).model().findOne({
    acronym,
  });

  if (client) {
    return res.notFound("Instance already exists");
  }

  const instance = await new AdminClient(adminConn).model().create({
    acronym,
    name,
  });

  const conn = connect(instance.acronym);

  const instituteRepository = new InstituteRepository(conn);
  const userRepository = new UserRepository(conn);
  const password = await bcrypt.hash("admin", 10);

  const institute = await instituteRepository.create({
    name: acronym,
    acronym,
    active: true,
  });

  const user = await userRepository.create({
    name: "Admin",
    email: email || "admin@eduflow.tech",
    password,
    roles: [IUserRoles.admin],
    institute: institute,
  });

  await conn.model("Status").insertMany([
    {
      name: "Aprovado",
      type: StatusType.DONE,
    },
    {
      name: "Reprovado",
      type: StatusType.DONE,
    },
  ]);

  await instance.save();
  await user.save();

  const token = await jwt.signResetPassword({
    id: user._id,
    client: conn.name,
  });

  const content = `
    <p>Olá, ${user.name}!</p>
    <p>Seu cadastro foi realizado com sucesso em nosso site.</p>
    <p>Sua conta foi criada em ${new Date().toLocaleString()}.</p>
    <p>Aqui estão algumas informações importantes:</p>
    <ul>
        <li>O domínio de sua conta é: ${acronym}</li>
        <li>Defina sua senha aqui: <a href="${
          process.env.FRONTEND_URL
        }/auth/alter-password/${token}">Acessar o painel</a></li>
        <li>Verifique seu e-mail para mais instruções sobre como aproveitar ao máximo nossos serviços.</li>
    </ul>
`;

  const { html, css } = emailTemplate(content);

  await sendEmail(
    user.email,
    "Streamline | Cadastro realizado com sucesso",
    html,
    css
  );

  return res.success({
    instance,
    user,
  });
};

export default new Http(handler)
  .setPublic()
  .setSchemaValidator((schema) => ({
    body: schema.object().shape({
      name: schema.string().required(),
      acronym: schema
        .string()
        .matches(/^[a-z0-9_-]+$/)
        .required(),
      email: schema.string().email().optional(),
    }),
  }))
  .configure({
    name: "InstanceCreate",
    options: {
      methods: ["POST"],
      route: "instance",
    },
  });
