import Http, { HttpHandler } from "../../../middlewares/http";
import res from "../../../utils/apiResponse";
import EquipmentRepository from "../../../repositories/Equipment";
import BlobUploader from "../../../services/upload";

const handler: HttpHandler = async (conn, req) => {
  const { id } = req.params as { id: string };

  const equipmentRepository = new EquipmentRepository(conn);

  const equipment = await equipmentRepository.findById({ id });

  const blobUploader = new BlobUploader(req.user.id);

  if (!equipment) {
    return res.notFound("Equipment not found");
  }

  if (equipment.invoice) {
    await blobUploader.updateSas(equipment.invoice);
  }

  return res.success(equipment);
};

export default new Http(handler)
  .setSchemaValidator((schema) => ({
    params: schema.object({
      id: schema.string().required(),
    }),
  }))
  .configure({
    name: "EquipmentShow",
    permission: "equipment.read",
    options: {
      methods: ["GET"],
      route: "equipments/{id}",
    },
  });
