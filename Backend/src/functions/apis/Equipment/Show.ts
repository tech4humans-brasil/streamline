import Http, { HttpHandler } from "../../../middlewares/http";
import res from "../../../utils/apiResponse";
import { IEquipment } from "../../../models/client/Equipment";
import EquipmentRepository from "../../../repositories/Equipment";

const handler: HttpHandler = async (conn, req) => {
  const { id } = req.params as { id: string };

  const equipmentRepository = new EquipmentRepository(conn);

  const equipment = await equipmentRepository.findById({ id });

  if (!equipment) {
    return res.notFound("Equipment not found");
  }

  return res.success(equipment);
}

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
        route: "equipment/{id}",
      },
  })