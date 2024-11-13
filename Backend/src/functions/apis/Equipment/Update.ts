import Http, { HttpHandler } from "../../../middlewares/http";
import res from "../../../utils/apiResponse";
import { IEquipment, IEquipmentStatus, IEquipmentSituation } from "../../../models/client/Equipment";
import EquipmentRepository from "../../../repositories/Equipment";

interface DtoEquipment {
  formName?: string;
  inventoryNumber?: string;
  equipmentType?: string;
  brandName?: string;
  status?: IEquipmentStatus;
  situation?: IEquipmentSituation;
  modelDescription?: string;
  serialNumber?: string;
  additionalNotes?: string;
}

const handler: HttpHandler = async (conn, req) => {
  const { id } = req.params;
  const { ...equipmentData } = req.body as DtoEquipment;

  const equipmentRepository = new EquipmentRepository(conn);

  const updatedEquipment = await equipmentRepository.findByIdAndUpdate({
    id,
    data: {
      ...equipmentData
    },
  });

  if (!updatedEquipment) {
    return res.notFound("Equipment not found");
  }

  return res.success(updatedEquipment);
}

export default new Http(handler)
  .setSchemaValidator((schema) => ({
    body: schema.object().shape({
      formName: schema.string().optional().min(3).max(255),
      inventoryNumber: schema.string().optional().min(3).max(255),
      equipmentType: schema.string().optional().min(3).max(255),
      brandName: schema.string().optional().min(3).max(255),
      status: schema.string().optional().oneOf(["allocated", "available", "discarded", "office"]),
      situation: schema.string().optional().oneOf(["new", "used", "broken", "damaged", "lost", "discarded"]),
      modelDescription: schema.string().optional().max(255),
      serialNumber: schema.string().optional().min(3).max(255),
      additionalNotes: schema.string().optional().max(255),
    }),
    params: schema.object().shape({
      id: schema.string().required(),
    })    
  }))
  .configure({
    name: "EquipmentUpdate",
    permission: "equipment.update",
    options: {
      methods: ["PUT"],
      route: "equipment/{id}",
    },
  });