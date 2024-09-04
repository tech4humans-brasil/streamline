import Http, { HttpHandler } from "../../../middlewares/http";
import res from "../../../utils/apiResponse";
import { IStatus } from "../../../models/client/Status";
import StatusRepository from "../../../repositories/Status";

const handler: HttpHandler = async (conn, req) => {
  const { name, type, project } = req.body as IStatus;

  const statusRepository = new StatusRepository(conn);

  const status = await statusRepository.create({
    name,
    type,
    project,
  });

  status.save();

  return res.created(status);
};

export default new Http(handler)
  .setSchemaValidator((schema) => ({
    body: schema.object().shape({
      name: schema.string().required().min(3).max(255),
      type: schema.string().required().oneOf(["progress", "done", "canceled"]),
    }),
  }))
  .configure({
    name: "StatusCreate",
    permission: "status.create",
    options: {
      methods: ["POST"],
      route: "status",
    },
  });
