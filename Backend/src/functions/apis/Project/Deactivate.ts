import Http, { HttpHandler } from "../../../middlewares/http";
import res from "../../../utils/apiResponse";
import ProjectRepository from "../../../repositories/Project";
import FormRepository from "../../../repositories/Form";
import WorkflowRepository from "../../../repositories/Workflow";

const handler: HttpHandler = async (conn, req) => {
  const { id } = req.params;

  const projectRepository = new ProjectRepository(conn);
  const formRepository = new FormRepository(conn);
  const workflowRepository = new WorkflowRepository(conn);

  // Update project
  const updatedProject = await projectRepository.findByIdAndUpdate({
    id,
    data: { active: false },
  });

  if (!updatedProject) {
    return res.notFound("Project not found");
  }

  // Update related forms and workflows
  await Promise.all([
    formRepository.updateMany({
      where: { project: id },
      data: { active: false },
    }),
    workflowRepository.updateMany({
      where: { project: id },
      data: { active: false },
    }),
  ]);

  return res.success(updatedProject);
};

export default new Http(handler)
  .setSchemaValidator((schema) => ({
    params: schema.object().shape({
      id: schema.string().required(),
    }),
    body: schema.object().shape({}),
  }))
  .configure({
    name: "ProjectDeactivate",
    permission: "project.update",
    options: {
      methods: ["PUT"],
      route: "projects/{id}/deactivate",
    },
  });