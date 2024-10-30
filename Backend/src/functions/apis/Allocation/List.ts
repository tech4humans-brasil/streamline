import Http, { HttpHandler } from "../../../middlewares/http";
import res from "../../../utils/apiResponse";
import AllocationRepository from "../../../repositories/Allocation"; 
import FilterQueryBuilder, { WhereEnum } from "../../../utils/filterQueryBuilder";

interface Query {
  page?: number;
  limit?: number;
  name?: string;
  user?: string;
  startDate?: string;
}

const filterQueryBuilder = new FilterQueryBuilder(
  {
    name: {
      type: WhereEnum.ILIKE,
      alias: "user.name"
    },
    user: {
      type: WhereEnum.EQUAL,
      alias: "user._id"
    },
    startDate: WhereEnum.DATE
  }
);

const handler: HttpHandler = async (conn, req) => {
  const { page = 1, limit = 10, ...filters } = req.query as Query;

  const allocationRepository = new AllocationRepository(conn);

  const where = filterQueryBuilder.build(filters);

  const allocations = await allocationRepository.find({
    skip: (page - 1) * limit,
    where,
    limit,
    sort: {
      createdAt: -1,
    }
  });

  const total = await allocationRepository.count({ where });
  const totalPages = Math.ceil(total / limit);

  return res.success({
    allocations,
    pagination: {
      page: Number(page),
      total,
      totalPages,
      count: allocations.length + (page - 1) * limit,
    },
  });
}

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
        name: schema
          .string()
          .optional(),
        user: schema
          .string()
          .optional(),
        startDate: schema
          .string()
          .optional()
      })
  }))
  .configure({
    name: "AllocationList",
    permission: "allocation.view",
    options: {
      methods: ["GET"],
      route: "allocations",
    },
  });