import Http, { HttpHandler } from "../../../middlewares/http";
import res from "../../../utils/apiResponse";
import StatusRepository from "../../../repositories/Status";
import { StatusType } from "../../../models/client/Status";
import FilterQueryBuilder, {
  WhereEnum,
} from "../../../utils/filterQueryBuilder";

const statusTypeValues = Object.values(StatusType);

interface Query {
  page?: number;
  limit?: number;
  name?: string;
  /** Single type or comma-separated (e.g. done,canceled) */
  type?: string;
  project?: string;
}

const filterQueryBuilder = new FilterQueryBuilder({
  name: WhereEnum.ILIKE,
  type: WhereEnum.ARRAY,
  project: { type: WhereEnum.EQUAL, alias: "project" },
});

const handler: HttpHandler = async (conn, req) => {
  const { page = 1, limit = 20, ...filter } = req.query as Query;

  const statusRepository = new StatusRepository(conn);

  const where = filterQueryBuilder.build(filter);

  // Ordenação só em memória: Cosmos DB (Mongo API) falha sem índice composto
  // para sort { order, name } na query.
  const allMatching = await statusRepository.find({
    where,
  });

  const sorted = [...allMatching].sort((a, b) => {
    const oa = (a as { order?: number }).order ?? 0;
    const ob = (b as { order?: number }).order ?? 0;
    if (oa !== ob) return oa - ob;
    return String((a as { name?: string }).name ?? "").localeCompare(
      String((b as { name?: string }).name ?? "")
    );
  });

  const total = sorted.length;
  const totalPages = total === 0 ? 0 : Math.ceil(total / limit);
  const start = (page - 1) * limit;
  const statuses = sorted.slice(start, start + limit);

  return res.success({
    statuses,
    pagination: {
      page: Number(page),
      total,
      totalPages,
      count: statuses.length + (page - 1) * limit,
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
        name: schema.string().optional(),
        type: schema
          .string()
          .optional()
          .test(
            "status-type-filter",
            "Invalid type",
            (value) => {
              if (value == null || String(value).trim() === "") return true;
              const parts = String(value)
                .split(",")
                .map((p) => p.trim())
                .filter(Boolean);
              return parts.every((p) =>
                (statusTypeValues as readonly string[]).includes(p)
              );
            }
          ),
        project: schema.string().optional(),
      }),
  }))
  .configure({
    name: "StatusList",
    permission: "status.read",
    options: {
      methods: ["GET"],
      route: "statuses",
    },
  });
