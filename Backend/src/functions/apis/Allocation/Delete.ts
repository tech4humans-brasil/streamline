import Http, { HttpHandler } from "../../../middlewares/http";
import res from "../../../utils/apiResponse";
import { IEquipmentStatus } from "../../../models/client/Equipment";
import AllocationRepository from "../../../repositories/Allocation";
import EquipmentRepository from "../../../repositories/Equipment";

const handler: HttpHandler = async (conn, req) => {
  const { id } = req.params;
  const allocationRepository = new AllocationRepository(conn);
  const equipmentRepository = new EquipmentRepository(conn);

  const allocation = await allocationRepository.findById({ id });

  if (!allocation) {
    return res.notFound("Allocation not found");
  }

  const updatedResult = await equipmentRepository.updateMany({
    where: { _id: { $in: allocation.equipments } },
    data: {
      status: IEquipmentStatus.available, 
      currentAllocation: null 
    } 
  });

  await allocationRepository.delete({ where: { _id: id } });

  
}

export default new Http(handler)
  .setSchemaValidator((schema) => ({
    params: schema.object({
      id: schema.string().required(),
    }),
  }))
  .configure({
    name: "AllocationDelete",
    permission: "allocation.delete",
    options: {
      methods: ["DELETE"],
      route: "allocation/{id}",
    },
  });