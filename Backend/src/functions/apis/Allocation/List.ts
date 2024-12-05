import Http, { HttpHandler } from "../../../middlewares/http";
import res from "../../../utils/apiResponse";
import UserRepository from "../../../repositories/User";

const handler: HttpHandler = async (conn, req) => {
  const { userId } = req.params as { userId: string };
  const userRepository = new UserRepository(conn);

  const user = await userRepository.findById({
    id: userId,
    select: {
      _id: 1,
      name: 1,
      email: 1,
      allocations: 1,
    },
    populate: [
      {
        path: "allocations.equipment",
        select: {
          formName: 1,
          inventoryNumber: 1,
          status: 1,
          situation: 1,
        },
      },
    ],
  });

  if (!user) {
    return res.notFound("User not found");
  }

  return res.success(user);
};

export default new Http(handler)
  .setSchemaValidator((schema) => ({
    params: schema.object({
      userId: schema.string().required(),
    }),
  }))
  .configure({
    name: "UserAllocationsList",
    permission: "user.read",
    options: {
      methods: ["GET"],
      route: "user/{userId}/allocation",
    },
  });
