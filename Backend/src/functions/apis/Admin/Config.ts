import Http, { HttpHandler } from "../../../middlewares/http";
import res from "../../../utils/apiResponse";
import { connectAdmin } from "../../../services/mongo";
import AdminRepository from "../../../repositories/Admin";
import BlobUploader from "../../../services/upload";

type Params = {
  slug?: string | null;
};

export const handler: HttpHandler = async (_, req) => {
  const adminConn = await connectAdmin();
  const clientModel = new AdminRepository(adminConn);

  const { slug } = req.query as Params;

  const where = !!slug ? {
    acronym: slug,
  } : {
    principal: true,
  };

  const client = await clientModel.findOne({
    where,
    select: {
      name: 1,
      acronym: 1,
      logo: 1,
      icon: 1,
      config: 1,
    },
  });

  const slugs = await clientModel.find({
    select: {
      acronym: 1,
    },
  });

  if (!client) {
    return res.notFound("Instance not found");
  }

  const blobUploader = new BlobUploader(client.acronym);
  if (client.logo) {
    await blobUploader.updateSas(client.logo);
  }

  if (client.icon) {
    await blobUploader.updateSas(client.icon);
  }

  await client.save();

  return res.success({
    ...client.toObject(),
    config: {
      google: {
        clientId: client.config.google.clientId,
      },
      externalUsers: {
        allow: client.config.externalUsers?.allow || false,
        redirect: client.config.externalUsers?.redirect || null,
      },
    },
    slugs: slugs.map((slug) => slug.acronym),
  });
};

export default new Http(handler).setPublic().configure({
  name: "InstanceConfig",
  options: {
    methods: ["GET"],
    route: "config",
  },
})
  .setSchemaValidator((schema) => ({
    query: schema.object().shape({
      slug: schema.string().optional().nullable().default(null),
    }),
  }));
