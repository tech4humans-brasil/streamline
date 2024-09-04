import Http, { HttpHandler } from "../../../middlewares/http";
import res from "../../../utils/apiResponse";
import WorkflowRepository from "../../../repositories/Workflow";
import FilterQueryBuilder, {
  WhereEnum,
} from "../../../utils/filterQueryBuilder";

interface Query {
  page?: number;
  limit?: number;
  project?: string;
}

const filterQueryBuilder = new FilterQueryBuilder({
  project: { type: WhereEnum.EQUAL, alias: "project" },
});

const handler: HttpHandler = async (conn, req, context) => {
  const { page = 1, limit = 10, ...filter } = req.query as Query;
  const workflowRepository = new WorkflowRepository(conn);

  const where = filterQueryBuilder.build(filter);

  const workflows = await workflowRepository.find({
    skip: (page - 1) * limit,
    limit,
    where,
    select: {
      _id: 1,
      name: 1,
      active: 1,
    },
  });

  const total = await workflowRepository.count({ where });
  const totalPages = Math.ceil(total / limit);

  return res.success({
    workflows,
    pagination: {
      page: Number(page),
      total,
      totalPages,
      count: workflows.length + (page - 1) * limit,
    },
  });
};

export default new Http(handler)
  .setSchemaValidator((schema) => ({
    query: schema
      .object({
        page: schema
          .number()
          .optional()
          .transform((v) => Number(v))
          .default(1)
          .min(1),
        limit: schema
          .number()
          .optional()
          .transform((v) => Number(v)),
        project: schema.string().optional(),
      })
      .optional(),
  }))
  .configure({
    name: "WorkflowList",
    permission: "workflow.read",
    options: {
      methods: ["GET"],
      route: "workflows",
    },
  });
