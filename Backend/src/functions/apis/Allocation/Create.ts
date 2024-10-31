import Http, { HttpHandler } from "../../../middlewares/http";
import res from "../../../utils/apiResponse";
import { IAllocation } from "../../../models/client/Allocation";
import { IEquipment } from "../../../models/client/Equipment";
import AllocationRepository from "../../../repositories/Allocation";
import EquipmentRepository from "../../../repositories/Equipment";

const handler: HttpHandler = async (conn, req) => {
  const allocationData = req.body as IAllocation;
  const allocationRepository = new AllocationRepository(conn);
  const equipmentRepository = new EquipmentRepository(conn);

  const allocation = await allocationRepository.create(allocationData);

  allocation.save();

  // Updating information of the allocation in the equipment as well
  for (const equipmentId of allocationData.equipments) {
    const equipment = await equipmentRepository.findById({
      id: equipmentId
    })

    if (!equipment) {
      return res.notFound("Equipment not found");
    }

    await equipmentRepository.findByIdAndUpdate({
      id: equipmentId,
      data: {
        currentAllocation: allocationData
      }
    })
  }

  return res.created(allocation);
};

export default new Http(handler)
  .setSchemaValidator((schema) => ({
    body: schema.object().shape({
      user: schema.object().shape({
        _id: schema.string().required(),
        name: schema.string().required().min(3).max(255),
        email: schema.string().required().email(),
        roles: schema
        .array(schema.mixed().oneOf(["admin", "student", "teacher"]))
        .required(),
      }),
      equipments: schema.array().required(),
      startDate: schema.date().required(),
      endDate: schema.date().optional().nullable(),
    })
  }))
  .configure({
    name: "AllocationCreate",
    permission: "allocation.create",
    options: {
      methods: ["POST"],
      route: "allocation",
    },
  })