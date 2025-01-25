import Http, { HttpHandler } from "../../../middlewares/http";
import res from "../../../utils/apiResponse";
import { connectAdmin } from "../../../services/mongo";
import AdminRepository from "../../../repositories/Admin";
import { FileUploaded } from "../../../services/upload";

interface Body {
  name: string;
  acronym: string;
  logo: FileUploaded;
  config: {
    domain: string;
    emailSender: string;
    sendgrid: {
      apiKey: string;
    };
    google: {
      clientId: string;
    };
  };
}

export const handler: HttpHandler = async (_, req) => {
  const { name, config, logo } = req.body as Body;

  const adminConn = await connectAdmin();
  const clientModel = new AdminRepository(adminConn);

  const client = await clientModel.findOne({
    where: { acronym: req.user.slug },
  });

  if (!client) {
    return res.notFound("Instance not found");
  }

  if (name) client.name = name;
  if (config) {
    client.config = config;
  }

  if (logo) {
    client.logo = logo;
  }

  await client.save();

  return res.success(client);
};

export default new Http(handler)
  .setSchemaValidator((schema) => ({
    body: schema.object().shape({
      name: schema.string().optional(),
      acronym: schema.string().optional(),
      config: schema
        .object()
        .shape({
          domain: schema.string().nullable(),
          emailSender: schema.string().nullable(),
          sendgrid: schema
            .object()
            .shape({
              apiKey: schema.string().nullable(),
            })
            .nullable(),
          google: schema
            .object()
            .shape({
              clientId: schema.string().nullable(),
              clientSecret: schema.string().nullable(),
              redirectUri: schema.string().nullable(),
            })
            .nullable(),
        })
        .optional(),
    }),
  }))
  .configure({
    name: "InstanceUpdate",
    options: {
      methods: ["PUT"],
      route: "instance",
    },
  });
