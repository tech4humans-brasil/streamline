import Http, { HttpHandler } from "../../../middlewares/http";
import res from "../../../utils/apiResponse";
import WorkflowRepository from "../../../repositories/Workflow";
import ProjectRepository from "../../../repositories/Project";
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
  const { page = 1, limit = 20, ...filter } = req.query as Query;
  const workflowRepository = new WorkflowRepository(conn);
  const projectRepository = new ProjectRepository(conn);

  const activeProjects = await projectRepository.find({
    where: { active: { $ne: false } },
    select: { _id: 1 },
  });
  const activeProjectIds = activeProjects.map(p => p._id.toString());

  const where = filterQueryBuilder.build(filter);

  // Ajusta a lógica de filtro de projeto
  if (where.project) {
    // Se o usuário filtrou um projeto, checamos se ele está ativo
    const projectFilter = String(where.project);
    if (!activeProjectIds.includes(projectFilter)) {
      // Se o projeto filtrado não está ativo, forçamos um resultado vazio
      where.project = { $in: [] };
    }
  } else {
    // Se o usuário não filtrou projeto, mostramos todos os de projetos ativos
    where.project = { $in: activeProjectIds };
  }

  // Executa count e find em PARALELO (Mais rápido)
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
