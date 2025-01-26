import Http, { HttpHandler } from "../../../middlewares/http";
import res from "../../../utils/apiResponse";
import { connectAdmin } from "../../../services/mongo";
import AdminRepository from "../../../repositories/Admin";
import BlobUploader from "../../../services/upload";

export const handler: HttpHandler = async (_, req) => {
  const adminConn = await connectAdmin();
  const clientModel = new AdminRepository(adminConn);

  const host = req.headers.origin;

  const client = await clientModel.findOne({
    where: {
      domains: {
        $elemMatch: {
          $eq: host,
        },
      },
    },
    select: {
      name: 1,
      acronym: 1,
      logo: 1,
      icon: 1,
      config: {
        google: {
          clientId: 1,
        },
      },
    },
  });

  const slugs = await clientModel.find({
    where: {
      domains: {
        $elemMatch: {
          $eq: host,
        },
      },
      principal: true,
    },
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
    slugs: slugs.map((slug) => slug.acronym),
  });
};

export default new Http(handler).setPublic().configure({
  name: "InstanceConfig",
  options: {
    methods: ["GET"],
    route: "config",
  },
});
