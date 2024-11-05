import Http, { HttpHandler } from "../../../middlewares/http";
import res from "../../../utils/apiResponse";
import ProjectRepository from "../../../repositories/Project";
import { IVariable } from "../../../models/client/Project";
import { encrypt } from "../../../utils/crypto";

const handler: HttpHandler = async (conn, req) => {
  const { id } = req.params;
  const { variables } = req.body as { variables: IVariable[] };

  const projectRepository = new ProjectRepository(conn);

  const project = await projectRepository.findById({
    id,
    select: {
      variables: 1,
    },
  });

  if (!project) {
    return res.notFound("Project not found");
  }

  for (const variable of variables) {
    const exist = project.variables.id(variable._id);

    if (exist) {
      exist.name = variable.name ?? exist.name;
      exist.value =
        variable.type === "secret" && variable.value
          ? encrypt(variable.value)
          : exist.value;
      exist.type = variable.type ?? exist.type;
    } else {
      project.variables.push({
        ...variable,
        value:
          variable.type === "secret" ? encrypt(variable.value) : variable.value,
      });
    }
  }

  //@ts-ignore
  project.variables = project.variables.filter((variable) =>
    variables.some((v) => v._id === variable._id.toString() || !v._id)
  );

  const updateProject = await project.save();

  return res.success(updateProject);
};

export default new Http(handler)
  .setSchemaValidator((schema) => ({
    body: schema.object().shape({
      variables: schema.array().of(
        schema.object().shape({
          name: schema.string().optional(),
          value: schema.string().optional().nullable(),
          type: schema.mixed().oneOf(["variable", "secret"]).optional(),
        })
      ),
    }),
    params: schema.object().shape({
      id: schema.string().required(),
    }),
  }))
  .configure({
    name: "ProjectVariablesUpdate",
    permission: "project.update",
    options: {
      methods: ["PUT"],
      route: "projects/{id}/variables",
    },
  });
