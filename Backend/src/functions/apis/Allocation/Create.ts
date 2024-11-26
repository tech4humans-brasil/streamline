import Http, { HttpHandler } from "../../../middlewares/http";
import res from "../../../utils/apiResponse";
import { IAllocation } from "../../../models/client/Allocation";
import { IEquipmentStatus } from "../../../models/client/Equipment";
import AllocationRepository from "../../../repositories/Allocation";
import EquipmentRepository from "../../../repositories/Equipment";
import UserRepository from "../../../repositories/User";

interface IBody {
  user: string;
  equipments: string[];
  startDate: string;
  endDate?: string;
  loanTermUrl?: string;
  returnNotes?: string;
  additionalNotes?: string;
}

const handler: HttpHandler = async (conn, req) => {
  const allocationData = req.body as IBody;
  const allocationRepository = new AllocationRepository(conn);
  const equipmentRepository = new EquipmentRepository(conn);
  const userRepository = new UserRepository(conn);

  // Check if any equipment of the list is not in any active allocation
  const existingAllocations = await allocationRepository.find({
    where: {
      equipments: { $in: allocationData.equipments },
      endDate: { $exists: false },
    },
  });

  console.log(existingAllocations);

  if (existingAllocations.length > 0) {
    return res.conflict("One or more equipments are already allocated");
  }

  const user = await userRepository.findById({
    id: allocationData.user,
    select: { password: 0, __v: 0 },
  });

  const allocation = await allocationRepository.create({
    user,
    equipments: allocationData.equipments,
    startDate: new Date(allocationData.startDate),
    endDate: allocationData.endDate ? new Date(allocationData.endDate) : null,
    loanTermUrl: allocationData.loanTermUrl,
    returnNotes: allocationData.returnNotes,
    additionalNotes: allocationData.additionalNotes,
  });

  const updatedResult = await equipmentRepository.updateMany({
    where: { _id: { $in: allocationData.equipments } },
    data: {
      status: IEquipmentStatus.allocated,
      currentAllocation: allocation,
    },
  });

  if (updatedResult.modifiedCount !== allocationData.equipments.length) {
    return res.notFound("One or more equipments could not be found");
  }
  await allocation.save();

  return res.created(allocation);
};

export default new Http(handler)
  .setSchemaValidator((schema) => ({
    body: schema.object().shape({
      user: schema.string().required(),
      equipments: schema.array(schema.string()).required(),
      startDate: schema.date().required(),
      endDate: schema.date().optional().default(null).nullable(),
      loanTermUrl: schema.string().optional().default(null).nullable(),
      returnNotes: schema.string().optional().default(null).nullable(),
      additionalNotes: schema.string().optional().default(null).nullable(),
    }),
  }))
  .configure({
    name: "AllocationCreate",
    permission: "allocation.create",
    options: {
      methods: ["POST"],
      route: "allocation",
    },
  });
