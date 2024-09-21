import Http, { HttpHandler } from "../../../middlewares/http";
import res from "../../../utils/apiResponse";
import Form, { IFormType } from "../../../models/client/Form";
import WorkflowRepository from "../../../repositories/Workflow";
import FilterQueryBuilder, {
  WhereEnum,
} from "../../../utils/filterQueryBuilder";
import ProjectRepository from "../../../repositories/Project";

const filterQueryBuilder = new FilterQueryBuilder({
  project: { type: WhereEnum.EQUAL, alias: "project" },
});

const handler: HttpHandler = async (conn, req) => {
  const filters = req.query as { project: string };

  const where = filterQueryBuilder.build(filters);

  const getWorkflows = new WorkflowRepository(conn).find({
    where: {
      ...where,
      active: true,
      published: { $exists: true },
    },
    select: {
      _id: 1,
      name: 1,
    },
  });

  const getFormsCreated = new Form(conn)
    .model()
    .find({
      ...where,
      type: IFormType.TimeTrigger,
      active: true,
      published: { $exists: true },
    })
    .select({
      _id: 1,
      name: 1,
    });

  const getProjects = new ProjectRepository(conn).find({});

  const [workflowsResponse, formsCreatedResponse, projectsResponse] =
    await Promise.all([getWorkflows, getFormsCreated, getProjects]);

  const workflows = workflowsResponse.map((workflow) => ({
    label: workflow.name,
    value: workflow._id,
  }));

  const forms = formsCreatedResponse.map((form) => ({
    value: form._id,
    label: form.name,
  }));

  const projects = projectsResponse.map((project) => ({
    value: project._id,
    label: project.name,
  }));

  return res.success({
    workflows,
    forms,
    projects,
  });
};

export default new Http(handler)
  .configure({
    name: "ScheduleForms",
    options: {
      methods: ["GET"],
      route: "schedules/forms",
    },
  })
  .setSchemaValidator((schema) => ({
    query: schema.object({
      project: schema.string().optional(),
    }),
  }));
