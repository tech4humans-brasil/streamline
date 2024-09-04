import Http, { HttpHandler } from "../../../middlewares/http";
import res from "../../../utils/apiResponse";
import StatusRepository from "../../../repositories/Status";
import { StatusType } from "../../../models/client/Status";
import FilterQueryBuilder, {
  WhereEnum,
} from "../../../utils/filterQueryBuilder";

interface Query {
  page?: number;
  limit?: number;
  name?: string;
  type?: StatusType;
  project?: string;
}

const filterQueryBuilder = new FilterQueryBuilder({
  name: WhereEnum.ILIKE,
  type: WhereEnum.ARRAY,
  project: { type: WhereEnum.EQUAL, alias: "project" },
});

const handler: HttpHandler = async (conn, req, context) => {
  const { page = 1, limit = 10, ...filter } = req.query as Query;

  const statusRepository = new StatusRepository(conn);

  const where = filterQueryBuilder.build(filter);

  const statuses = await statusRepository.find({
    where,
    skip: (page - 1) * limit,
    limit,
  });

  const total = await statusRepository.count({ where });
  const totalPages = Math.ceil(total / limit);

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
        type: schema.mixed().oneOf(["active", "inactive"]).optional(),
        project: schema.string().optional(),
      })
      .optional(),
  }))
  .configure({
    name: "StatusList",
    permission: "status.create",
    options: {
      methods: ["GET"],
      route: "statuses",
    },
  });
