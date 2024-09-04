import Http, { HttpHandler } from "../../../middlewares/http";
import res from "../../../utils/apiResponse";
import ProjectRepository from "../../../repositories/Project";
import { IProject } from "../../../models/client/Project";

const handler: HttpHandler = async (conn, req) => {
  const { name, description } = req.body as IProject;

  const projectRepository = new ProjectRepository(conn);

  const permissions: IProject["permissions"] = [
    {
      type: "user",
      user: req.user.id,
      institute: null,
      role: ["view", "update", "delete"],
      isOwner: true,
    },
  ];

  const project = await projectRepository.create({
    name,
    description,
    permissions,
  });

  await project.save();

  return res.created(project);
};

export default new Http(handler)
  .setSchemaValidator((schema) => ({
    body: schema.object().shape({
      name: schema.string().required().min(3).max(255),
      description: schema.string().optional().max(255),
    }),
  }))
  .configure({
    name: "ProjectCreate",
    permission: "project.create",
    options: {
      methods: ["POST"],
      route: "projects",
    },
  });
