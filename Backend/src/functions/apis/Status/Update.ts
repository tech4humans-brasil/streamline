import Http, { HttpHandler } from "../../../middlewares/http";
import res from "../../../utils/apiResponse";
import { IStatus } from "../../../models/client/Status";
import StatusRepository from "../../../repositories/Status";

const handler: HttpHandler = async (conn, req) => {
  const { id } = req.params;
  const { name, type, order } = req.body as IStatus & { order?: number };

  const statusRepository = new StatusRepository(conn);

  const data: Record<string, unknown> = {};
  if (name !== undefined) data.name = name;
  if (type !== undefined) data.type = type;
  if (order !== undefined && order !== null) data.order = Number(order);

  if (Object.keys(data).length === 0) {
    return res.badRequest("No fields to update");
  }

  const updateStatus = await statusRepository.findByIdAndUpdate({
    id,
    data,
  });

  if (!updateStatus) {
    return res.notFound("Status not found");
  }

  return res.success(updateStatus);
};

export default new Http(handler)
  .setSchemaValidator((schema) => ({
    body: schema.object().shape({
      name: schema.string().optional().min(3).max(255),
      type: schema.string().optional().oneOf(["progress", "done", "canceled"]),
      order: schema.number().optional(),
    }),
    params: schema.object().shape({
      id: schema.string().required(),
    }),
  }))
  .configure({
    name: "StatusUpdate",
    permission: "status.update",
    options: {
      methods: ["PUT"],
      route: "status/{id}",
    },
  });
