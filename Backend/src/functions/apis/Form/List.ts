import Http, { HttpHandler } from "../../../middlewares/http";
import res from "../../../utils/apiResponse";
import { IFormType } from "../../../models/client/Form";
import FormRepository from "../../../repositories/Form";
import ProjectRepository from "../../../repositories/Project";
import FilterQueryBuilder, {
  WhereEnum,
} from "../../../utils/filterQueryBuilder";

interface Query {
  page?: number;
  limit?: number;
  type?: IFormType;
  active?: boolean;
  name?: string;
  slug?: string;
  project?: string;
}

const filterQueryBuilder = new FilterQueryBuilder({
  type: WhereEnum.ARRAY,
  active: WhereEnum.BOOLEAN,
  name: WhereEnum.ILIKE,
  slug: WhereEnum.ILIKE,
  project: { type: WhereEnum.EQUAL, alias: "project" },
});

const handler: HttpHandler = async (conn, req) => {
  const { page = 1, limit = 20, ...filters } = req.query as Query;

  const formRepository = new FormRepository(conn);
  const projectRepository = new ProjectRepository(conn);

  const activeProjects = await projectRepository.find({
    where: { active: { $ne: false } },
    select: { _id: 1 },
  });
  const activeProjectIds = activeProjects.map(p => p._id.toString());

  const where = filterQueryBuilder.build(filters);

  if (where.project) {
    const projectFilter = String(where.project);
    if (!activeProjectIds.includes(projectFilter)) {
      where.project = { $in: [] };
    }
  } else {
    where.project = { $in: activeProjectIds };
  }

  const [total, forms] = await Promise.all([
    formRepository.count({ where }),
    formRepository.find({
      skip: (page - 1) * limit,
      where,
      limit,
      populate: [{
        path: 'project',
        select: { active: 1 },
      }] as any,
      select: {
        name: 1,
        type: 1,
        active: 1,
        slug: 1,
      },
      sort: {
        type: 1,
      },
    }),
  ]);

  const totalPages = Math.ceil(total / limit);

  return res.success({
    forms,
    pagination: {
      page: Number(page),
      total,
      totalPages,
      count: forms.length,
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
        type: schema
          .array(schema.mixed().oneOf(Object.values(IFormType)))
          .optional(),
        active: schema.boolean().optional(),
        name: schema.string().min(3).max(255).optional().default(undefined),
        slug: schema.string().min(3).max(255).optional().default(undefined),
        project: schema.string().required(),
      }),
  }))
  .configure({
    name: "FormsList",
    permission: "form.read",
    options: {
      methods: ["GET"],
      route: "forms",
    },
  });
