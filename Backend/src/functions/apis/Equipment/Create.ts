import Http, { HttpHandler } from "../../../middlewares/http";
import res from "../../../utils/apiResponse";
import { IEquipment, IEquipmentStatus } from "../../../models/client/Equipment";
import EquipmentRepository from "../../../repositories/Equipment";

const handler: HttpHandler = async (conn, req) => {
  const data = req.body as IEquipment;

  const equipmentRepository = new EquipmentRepository(conn);

  // Disallows creating equipment with same type and same inventory number
  const equipmentExists = await equipmentRepository.findOne({
    where: {
      equipmentType: data.equipmentType,
      inventoryNumber: data.inventoryNumber,
    },
  });

  if (equipmentExists) {
    return res.conflict("Equipment already exists");
  }

  const equipment = await equipmentRepository.create({
    ...data,
    inventoryNumber: data.inventoryNumber.toLocaleUpperCase().trim(),
    status: IEquipmentStatus.available,
  });

  return res.created(equipment);
};

export default new Http(handler)
  .setSchemaValidator((schema) => ({
    body: schema.object().shape({
      inventoryNumber: schema.string().required().min(1).max(255),
      equipmentType: schema.string().required().min(1).max(255),
      invoice: schema
        .object()
        .shape({
          name: schema.string(),
          url: schema.string(),
          mimeType: schema.string(),
          size: schema.string(),
          containerName: schema.string(),
        })
        .optional()
        .default(null)
        .nullable(),
      brandName: schema.string().optional().default(null).nullable().min(1).max(100),
      status: schema
        .string()
        .optional()
        .default("available")
        .oneOf(["allocated", "available", "discarded", "office"]),
      situation: schema
        .string()
        .optional()
        .default("new")
        .oneOf(["new", "used", "broken", "damaged", "lost", "discarded"]),
      modelDescription: schema.string().optional().default(null).nullable().max(512),
      serialNumber: schema.string().optional().default(null).nullable().min(1).max(100),
      additionalNotes: schema.string().optional().default(null).nullable().max(255),
    }),
  }))
  .configure({
    name: "EquipmentCreate",
    permission: "equipment.create",
    options: {
      methods: ["POST"],
      route: "equipments",
    },
  });
