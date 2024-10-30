import Http, { HttpHandler } from "../../../middlewares/http";
import res from "../../../utils/apiResponse";
import { IAllocation } from "../../../models/client/Allocation";
import AllocationRepository from "../../../repositories/Allocation";

const handler: HttpHandler = async (conn, req) => {
  const data = req.body as IAllocation;
  const allocationRepository = new AllocationRepository(conn);

  const allocation = await allocationRepository.create(data);

  allocation.save();

  return res.created(allocation);
};

export default new Http(handler)
  .setSchemaValidator((schema) => ({
    body: schema.object().shape({
      user: schema.string().required(),
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