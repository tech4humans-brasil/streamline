import Http, { HttpHandler } from "../../../middlewares/http";
import res from "../../../utils/apiResponse";
import UserRepository from "../../../repositories/User";

const handler: HttpHandler = async (conn, req) => {
  const { id, userId } = req.params as { id: string; userId: string };
  const userRepository = new UserRepository(conn);

  const user = await userRepository.findById({
    id: userId,
    select: {
      allocations: 1,
    },
  });

  if (!user) {
    return res.notFound("User not found");
  }

  const allocation = user.allocations.id(id);

  if (!allocation) {
    return res.notFound("Allocation not found");
  }

  return res.success(allocation);
};

export default new Http(handler)
  .setSchemaValidator((schema) => ({
    params: schema.object({
      id: schema.string().required(),
    }),
  }))
  .configure({
    name: "UserAllocationsShow",
    permission: "user.read",
    options: {
      methods: ["GET"],
      route: "user/{userId}/allocation/{id}",
    },
  });
