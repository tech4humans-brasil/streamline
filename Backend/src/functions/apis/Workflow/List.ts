import Http, { HttpHandler } from "../../../middlewares/http";
import res from "../../../utils/apiResponse";
import WorkflowRepository from "../../../repositories/Workflow";
import FilterQueryBuilder, {
  WhereEnum,
} from "../../../utils/filterQueryBuilder";
import { applyActiveProjectsFilter } from "../../../utils/activeProjectsFilter";

interface Query {
  page?: number;
  limit?: number;
  project?: string;
}

const filterQueryBuilder = new FilterQueryBuilder({
  project: { type: WhereEnum.EQUAL, alias: "project" },
});

const handler: HttpHandler = async (conn, req, context) => {
  const { page = 1, limit = 20, ...filter } = req.query as Query;
  const workflowRepository = new WorkflowRepository(conn);

  const initialWhere = filterQueryBuilder.build(filter);
  const { where } = await applyActiveProjectsFilter(conn, initialWhere);

  const [total, workflows] = await Promise.all([
    workflowRepository.count({ where }),
    workflowRepository.find({
      skip: (page - 1) * limit,
      limit,
      where,
      populate: [{
        path: 'project',
        select: { active: 1 },
      }] as any,
      select: {
        _id: 1,
        name: 1,
        active: 1,
      },
    }),
  ]);

  const totalPages = Math.ceil(total / limit);

  return res.success({
    workflows,
    pagination: {
      page: Number(page),
      total,
      totalPages,
      count: workflows.length,
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
        project: schema.string().required(),
      })
  }))
  .configure({
    name: "WorkflowList",
    permission: "workflow.read",
    options: {
      methods: ["GET"],
      route: "workflows",
    },
  });
