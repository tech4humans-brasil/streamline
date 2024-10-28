import Http, { HttpHandler } from "../../../middlewares/http";
import res from "../../../utils/apiResponse";
import { IEquipment } from "../../../models/client/Equipment";
import EquipmentRepository from "../../../repositories/Equipment";

const handler: HttpHandler = async (conn, req) => {
  const data = req.body as IEquipment;

  const equipmentRepository = new EquipmentRepository(conn);

  // Disallows creating equipment with same type and same inventory number
  const equipmentExists = await equipmentRepository.findOne({
    where: {
      equipmentType: data.equipmentType,
      inventoryNumber: data.inventoryNumber
    }
  })

  if (equipmentExists) {
    return res.conflict("Equipment already exists");
  }

  const equipment = await equipmentRepository.create({ ...data });

  return res.created(equipment)
}

export default new Http(handler)
  .setSchemaValidator((schema) => ({
    body: schema.object().shape({
      inventoryNumber: schema
        .string()
        .matches(/^TECH-\d{2}$/)
        .required(),
      equipmentType: schema.string().required(),
    }),
  }))
  .configure({
    name: "EquipmentCreate",
    permission: "equipment.create",
    options: {
      methods: ["POST"],
      route: "equipment",
    },
  });