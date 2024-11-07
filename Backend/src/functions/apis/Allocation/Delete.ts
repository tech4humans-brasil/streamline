import Http, { HttpHandler } from "../../../middlewares/http";
import res from "../../../utils/apiResponse";
import AllocationRepository from "../../../repositories/Allocation";
import EquipmentRepository from "../../../repositories/Equipment";

const handler: HttpHandler = async (conn, req) => {
  const { id } = req.params;
  const allocationRepository = new AllocationRepository(conn);
  const equipmentRepository = new EquipmentRepository(conn);

  const allocation = await allocationRepository.findById({ id });

  // Updating information of the allocation in the equipments
  for (const equipmentId of allocation.equipments) {
    const equipment = await equipmentRepository.findById({
      id: equipmentId
    });

    if (equipment) {
      await equipmentRepository.findByIdAndUpdate({
        id: equipmentId,
        data: {
          currentAllocation: null
        }
      });
    }
  }

  if (!allocation) {
    return res.notFound("Allocation not found");
  }

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