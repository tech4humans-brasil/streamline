import Http, { HttpHandler } from "../../../middlewares/http";
import res from "../../../utils/apiResponse";
import { IAllocation } from "../../../models/client/Allocation";
import AllocationRepository from "../../../repositories/Allocation";

const handler: HttpHandler = async (conn, req) => {
  const { id } = req.params;
  const allocationRepository = new AllocationRepository(conn);

  const allocation = await allocationRepository.findById({
    id,
    select: {
        __v: 0,
    },
  });

  if (!allocation) {
    return res.notFound("Allocation not found");
  }

  return res.success(allocation);
};

export default new Http(handler)
  .setSchemaValidator((schema) => ({
    params: schema.object({
      id: schema.string().matches(/^[0-9a-fA-F]{24}$/).required(),
    }),
  }))
  .configure({
    name: "AllocationShow",
    permission: "allocation.read",
    options: {
      methods: ["GET"],
      route: "allocation/{id}",
    },
  })