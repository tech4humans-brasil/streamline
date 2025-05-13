import Http, { HttpHandler } from "../../../middlewares/http";
import res from "../../../utils/apiResponse";
import FilterQueryBuilder, {
  WhereEnum,
} from "../../../utils/filterQueryBuilder";
import ScheduleRepository from "../../../repositories/Schedule";

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

  const scheduleRepository = new ScheduleRepository(conn);

  const where = filterQueryBuilder.build(filter);

  const schedules = await scheduleRepository.find({
    where,
    select: {
      _id: 1,
      name: 1,
      expression: 1,
      active: 1,
    },
    skip: (page - 1) * limit,
    limit,
  });

  const total = await scheduleRepository.count({ where });
  const totalPages = Math.ceil(total / limit);

  return res.success({
    schedules,
    pagination: {
      page: Number(page),
      total,
      totalPages,
      count: schedules.length + (page - 1) * limit,
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
    name: "ScheduleList",
    permission: "schedule.read",
    options: {
      methods: ["GET"],
      route: "schedules",
    },
  });
