import Http, { HttpHandler } from "../../../middlewares/http";
import res from "../../../utils/apiResponse";
import { IEquipmentStatus } from "../../../models/client/Equipment";
import EquipmentRepository from "../../../repositories/Equipment";
import UserRepository from "../../../repositories/User";

interface IBody {
  equipment: string;
  startDate: string;
}

const handler: HttpHandler = async (conn, req) => {
  const allocationData = req.body as IBody;
  const equipmentRepository = new EquipmentRepository(conn);
  const userRepository = new UserRepository(conn);
  const { userId } = req.params;

  const { equipment } = allocationData;
  const existingAllocations = await equipmentRepository.findOne({
    where: { _id: equipment, status: IEquipmentStatus.available },
  });

  if (!existingAllocations) {
    return res.badRequest("Equipment is not available");
  }

  const user = await userRepository.findById({ id: userId });

  if (!user) {
    return res.badRequest("User not found");
  }

  user.allocations.push({
    equipment: allocationData.equipment,
    startDate: allocationData.startDate
      ? new Date(allocationData.startDate)
      : new Date(),
  });

  existingAllocations.status = IEquipmentStatus.allocated;
  existingAllocations.allocations.push({
    allocation: user.allocations[user.allocations.length - 1]._id,
    user: user.toObject(),
    startDate: new Date(allocationData.startDate),
    createdBy: {
      _id: req.user.id,
      name: req.user.name,
      email: req.user.email,
      matriculation: req.user.matriculation,
    },
  });

  await user.save();
  await existingAllocations.save();

  return res.created(user.allocations[user.allocations.length - 1]);
};

export default new Http(handler)
  .setSchemaValidator((schema) => ({
    body: schema.object().shape({
      equipment: schema.string().required(),
      startDate: schema.date().required(),
    }),
  }))
  .configure({
    name: "AllocationCreate",
    permission: "allocation.create",
    options: {
      methods: ["POST"],
      route: "user/{userId}/allocation",
    },
  });
