import Http, { HttpHandler } from "../../../middlewares/http";
import res from "../../../utils/apiResponse";
import ProjectRepository from "../../../repositories/Project";
import FormRepository from "../../../repositories/Form";
import WorkflowRepository from "../../../repositories/Workflow";
import { IProject } from "../../../models/client/Project";

const handler: HttpHandler = async (conn, req) => {
  const { id } = req.params;
  const { name, description, active } = req.body as IProject;

  const projectRepository = new ProjectRepository(conn);

  // If project is being deactivated, use a transaction to ensure atomicity
  if (active === false) {
    const session = await conn.startSession();
    
    try {
      let updatedProject: IProject | null = null;

      await session.withTransaction(async () => {
        // Update the project within the transaction
        updatedProject = await projectRepository.findByIdAndUpdate(
          {
            id,
            data: { name, description, active: false },
          },
          { session }
        );

        if (!updatedProject) {
          throw new Error("Project not found");
        }

        // Cascade deactivation to related forms and workflows
        const formRepository = new FormRepository(conn);
        const workflowRepository = new WorkflowRepository(conn);

        await Promise.all([
          formRepository.updateMany(
            {
              where: { project: id },
              data: { active: false },
            },
            { session }
          ),
          workflowRepository.updateMany(
            {
              where: { project: id },
              data: { active: false },
            },
            { session }
          ),
        ]);
      });

      if (!updatedProject) {
        return res.notFound("Project not found");
      }

      return res.success(updatedProject);
    } finally {
      await session.endSession();
    }
  }

  // For other updates (not deactivation), proceed without transaction
  const updateProject = await projectRepository.findByIdAndUpdate({
    id,
    data: { name, description, active },
  });

  if (!updateProject) {
    return res.notFound("Project not found");
  }

  return res.success(updateProject);
};

export default new Http(handler)
  .setSchemaValidator((schema) => ({
    body: schema.object().shape({
      name: schema.string().optional().min(3).max(255),
      description: schema.string().optional().max(255),
      active: schema.boolean().optional(),
    }),
    params: schema.object().shape({
      id: schema.string().required(),
    }),
  }))
  .configure({
    name: "ProjectUpdate",
    permission: "project.update",
    options: {
      methods: ["PUT"],
      route: "projects/{id}",
    },
  });
