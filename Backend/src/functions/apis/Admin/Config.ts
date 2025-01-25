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
    where: { "config.domain": host },
    select: {
      name: 1,
      acronym: 1,
      logo: 1,
      config: {
        google: {
          clientId: 1,
        },
      },
    },
  });

  if (!client) {
    return res.notFound("Instance not found");
  }

  if (client.logo) {
    const blobUploader = new BlobUploader(client.acronym);

    await blobUploader.updateSas(client.logo);
  }

  await client.save();

  return res.success(client);
};

export default new Http(handler).setPublic().configure({
  name: "InstanceConfig",
  options: {
    methods: ["GET"],
    route: "config",
  },
});
