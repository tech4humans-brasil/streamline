import Http, { HttpHandler } from "../../../middlewares/http";
import res from "../../../utils/apiResponse";
import UserRepository from "../../../repositories/User";
import FilterQueryBuilder, {
  WhereEnum,
} from "../../../utils/filterQueryBuilder";

interface Query {
  page?: number;
  limit?: number;
  name?: string;
  matriculation?: string;
  active?: boolean;
  isExternal?: boolean;
  institute?: string;
}

const filterQueryBuilder = new FilterQueryBuilder({
  name: WhereEnum.ILIKE,
  matriculation: WhereEnum.EQUAL,
  active: WhereEnum.BOOLEAN,
  isExternal: WhereEnum.BOOLEAN,
  institute: { type: WhereEnum.ILIKE, alias: "institute._id" },
});

const handler: HttpHandler = async (conn, req) => {
  const { page = 1, limit = 10, ...filters } = req.query as Query;

  const userRepository = new UserRepository(conn);

  const where = filterQueryBuilder.build(filters);

  const users = await userRepository.find({
    select: {
      name: 1,
      email: 1,
      roles: 1,
      active: 1,
      isExternal: 1,
      matriculation: 1,
      institutes: 1,
    },
    skip: (page - 1) * limit,
    where,
    limit,
  });

  const total = await userRepository.count({ where });

  const totalPages = Math.ceil(total / limit);

  return res.success({
    users,
    pagination: {
      page: Number(page),
      total,
      totalPages,
      count: users.length + (page - 1) * limit,
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
        name: schema.string().min(3).max(255).optional().default(undefined),
        matriculation: schema
          .string()
          .min(3)
          .max(255)
          .optional()
          .default(undefined),
        active: schema.boolean().optional(),
        isExternal: schema.boolean().optional(),
        institute: schema.string().min(3).max(255).optional(),
      })
      .optional(),
  }))
  .configure({
    name: "UsersList",
    permission: "user.read",
    options: {
      methods: ["GET"],
      route: "users",
    },
  });
