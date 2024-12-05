import Http, { HttpHandler } from "../../../middlewares/http";
import res from "../../../utils/apiResponse";
import { IEquipmentStatus } from "../../../models/client/Equipment";
import EquipmentRepository from "../../../repositories/Equipment";
import UserRepository from "../../../repositories/User";

interface IBody {
  endDate: string;
}

const handler: HttpHandler = async (conn, req) => {
  const { userId, allocationId } = req.params;
  const equipmentRepository = new EquipmentRepository(conn);
  const userRepository = new UserRepository(conn);

  const user = await userRepository.findById({
    id: userId,
  });

  if (!user) {
    return res.badRequest("Allocation not found");
  }

  const allocation = user.allocations.id(allocationId);

  if (!allocation) {
    return res.badRequest("Allocation not found");
  }
  const endDate = new Date();

  console.log(endDate);

  allocation.endDate = endDate;

  const equipment = await equipmentRepository.findById({
    id: allocation.equipment,
  });

  if (equipment) {
    equipment.status = IEquipmentStatus.available;
    const equipmentAllocation = equipment.allocations.find(
      (alloc) => alloc.allocation.toString() === allocationId
    );
    if (equipmentAllocation) {
      equipmentAllocation.endDate = endDate;
    }
    await equipment.save();
  }

  await user.save();

  return res.success(allocation);
};

export default new Http(handler)
  .setSchemaValidator((schema) => ({
    body: schema.object().shape({
      endDate: schema.string().optional(),
    }),
  }))
  .configure({
    name: "AllocationUpdate",
    permission: "allocation.update",
    options: {
      methods: ["PUT"],
      route: "user/{userId}/allocation/{allocationId}",
    },
  });
