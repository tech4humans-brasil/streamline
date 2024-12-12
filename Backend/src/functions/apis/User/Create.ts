import Http, { HttpHandler } from "../../../middlewares/http";
import res from "../../../utils/apiResponse";
import * as bcrypt from "bcrypt";
import User, { IUser } from "../../../models/client/User";
import InstituteRepository from "../../../repositories/Institute";
import { sendEmail } from "../../../services/email";
import emailTemplate from "../../../utils/emailTemplate";
import jwt from "../../../services/jwt";

const handler: HttpHandler = async (conn, req, context) => {
  const data = req.body as IUser;

  const instituteRepository = new InstituteRepository(conn);

  const hasInstitute = await instituteRepository.find({
    where: {
      _id: {
        $in: data.institutes.map((institute) => institute?._id ?? institute),
      },
      active: true,
    },
  });

  if (!hasInstitute) {
    return res.badRequest("Institute not found");
  }

  const hasUser = await new User(conn).model().findOne({
    email: data.email,
  });

  if (hasUser) {
    return res.badRequest("User already exists");
  }

  const password = data.password ?? Math.random().toString(36).slice(-8);

  const hashedPassword = await bcrypt.hash(password, 10);

  const user: IUser = await new User(conn).model().create({
    ...data,
    password: hashedPassword,
    institutes: hasInstitute.map((institute) => institute.toObject()),
  });

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
        <li>O domínio de sua conta é: ${conn.name}</li>
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

  return res.created({
    name: user.name,
    email: user.email,
    matriculation: user.matriculation,
    roles: user.roles,
  });
};

export default new Http(handler)
  .setSchemaValidator((schema) => ({
    body: schema.object().shape({
      name: schema.string().required().min(3).max(255),
      password: schema.string().min(6).max(255).optional(),
      email: schema.string().required().email(),
      isExternal: schema.boolean().default(false),
      roles: schema
        .array(schema.mixed().oneOf(["admin", "student", "teacher", "equipment"]))
        .required(),
    }),
  }))
  .configure({
    name: "UserCreate",
    permission: "user.create",
    options: {
      methods: ["POST"],
      route: "user",
    },
  });
