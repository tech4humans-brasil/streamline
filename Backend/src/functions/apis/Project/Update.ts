import Http, { HttpHandler } from "../../../middlewares/http";
import res from "../../../utils/apiResponse";
import ProjectRepository from "../../../repositories/Project";
import { IProject } from "../../../models/client/Project";

const handler: HttpHandler = async (conn, req) => {
  const { id } = req.params;
  const { name, description } = req.body as IProject;

  const projectRepository = new ProjectRepository(conn);

  const updateProject = await projectRepository.findByIdAndUpdate({
    id,
    data: { name, description },
  });

  if (!updateProject) {
    return res.notFound("Status not found");
  }

  return res.success(updateProject);
};

export default new Http(handler)
  .setSchemaValidator((schema) => ({
    body: schema.object().shape({
      name: schema.string().optional().min(3).max(255),
      description: schema.string().optional().max(255),
    }),
    params: schema.object().shape({
      id: schema.string().required(),
    }),
  }))
  .configure({
    name: "projectUpdate",
    permission: "project.update",
    options: {
      methods: ["PUT"],
      route: "projects/{id}",
    },
  });
