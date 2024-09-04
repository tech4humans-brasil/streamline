import Http, { HttpHandler } from "../../../middlewares/http";
import res from "../../../utils/apiResponse";
import { IEmail } from "../../../models/client/Email";
import EmailRepository from "../../../repositories/Email";

export const handler: HttpHandler = async (conn, req) => {
  const { slug, htmlTemplate, subject, cssTemplate, project } =
    req.body as IEmail;
  const emailRepository = new EmailRepository(conn);

  const email = await emailRepository.create({
    slug,
    subject,
    htmlTemplate,
    cssTemplate,
    project,
  });

  if (email instanceof Error) {
    return res.badRequest(email.message);
  }

  email.save();

  return res.created(email);
};

export default new Http(handler)
  .setSchemaValidator((schema) => ({
    body: schema.object().shape({
      slug: schema
        .string()
        .matches(/^[A-Za-z]+([A-za-z0-9]+)+(-[A-Za-z0-9]+)*$/)
        .min(3)
        .max(50)
        .required(),
      subject: schema.string().required().min(3),
      htmlTemplate: schema.string().required().min(3),
    }),
  }))
  .configure({
    name: "EmailCreate",
    permission: "email.create",
    options: {
      methods: ["POST"],
      route: "email",
    },
  });
