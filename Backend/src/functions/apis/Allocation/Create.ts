import Http, { HttpHandler } from "../../../middlewares/http";
import res from "../../../utils/apiResponse";
import { IAllocation } from "../../../models/client/Allocation";
import { IEquipmentStatus } from "../../../models/client/Equipment";
import AllocationRepository from "../../../repositories/Allocation";
import EquipmentRepository from "../../../repositories/Equipment";

const handler: HttpHandler = async (conn, req) => {
  const allocationData = req.body as IAllocation;
  const allocationRepository = new AllocationRepository(conn);
  const equipmentRepository = new EquipmentRepository(conn);

  // Check if any equipment of the list is not in any active allocation
  const existingAllocations = await allocationRepository.find({
    where: {
      equipments: { $in: allocationData.equipments },
      endDate: { $exists: false },
    }
  })

  console.log(existingAllocations);

  if (existingAllocations.length > 0) {
    return res.conflict("One or more equipments are already allocated");
  }

  const allocation = await allocationRepository.create(allocationData);
  allocation.save();

  const updatedResult = await equipmentRepository.updateMany({
    where: { _id: { $in: allocationData.equipments } },
    data: { 
      status: IEquipmentStatus.allocated,
      currentAllocation: allocation 
    } 
  });

  if (updatedResult.modifiedCount !== allocationData.equipments.length) {
    return res.notFound("One or more equipments could not be found");
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
      loanTermUrl: schema.string().optional().nullable(),
      returnNotes: schema.string().optional().nullable(),
      additionalNotes: schema.string().optional().nullable(),
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