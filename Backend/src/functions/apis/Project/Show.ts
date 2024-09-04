import Http, { HttpHandler } from "../../../middlewares/http";
import res from "../../../utils/apiResponse";
import ProjectRepository from "../../../repositories/Project";

const handler: HttpHandler = async (conn, req) => {
  const { id } = req.params as { id: string };

  const projectRepository = new ProjectRepository(conn);

  const project = await projectRepository.findById({ id });

  if (!project) {
    return res.notFound("Project not found");
  }

  return res.success(project);
};

export default new Http(handler)
  .setSchemaValidator((schema) => ({
    params: schema.object({
      id: schema.string().required(),
    }),
  }))
  .configure({
    name: "ProjectShow",
    permission: "project.view",
    options: {
      methods: ["GET"],
      route: "projects/{id}",
    },
  });
