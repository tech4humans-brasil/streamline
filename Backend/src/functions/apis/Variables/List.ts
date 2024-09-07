import Http, { HttpHandler } from "../../../middlewares/http";
import res from "../../../utils/apiResponse";
import ProjectRepository from "../../../repositories/Project";

const handler: HttpHandler = async (conn, req, context) => {
  const projectRepository = new ProjectRepository(conn);

  const { id } = req.params;

  const project = (
    await projectRepository.findById({
      id,
      select: {
        variables: 1,
      },
    })
  ).toObject();

  if (!project) {
    return res.notFound("Project not found");
  }

  const variables = project.variables.map((variable) => ({
    _id: variable._id,
    name: variable.name,
    value: variable.type === "secret" ? null : variable.value,
    type: variable.type,
  }));

  return res.success({ variables });
};

export default new Http(handler)
  .setSchemaValidator((schema) => ({
    params: schema.object().shape({
      id: schema.string().required(),
    }),
  }))
  .configure({
    name: "ProjectVariablesList",
    permission: "project.read",
    options: {
      methods: ["GET"],
      route: "projects/{id}/variables",
    },
  });
