import Http, { HttpHandler } from "../../../middlewares/http";
import res from "../../../utils/apiResponse";
import User from "../../../models/client/User";
import ActivityRepository from "../../../repositories/Activity";
import { WhereEnum } from "../../../utils/filterQueryBuilder";
import FilterQueryBuilder from "../../../utils/filterQueryBuilder";

interface Query {
  page?: number;
  limit?: number;
}

const filterQueryBuilder = new FilterQueryBuilder({
  finished: { type: WhereEnum.CUSTOM, alias: "finished_at" },
  user: { type: WhereEnum.EQUAL, alias: "users._id" },
  automatic: { type: WhereEnum.BOOLEAN, alias: "automatic" },
  form: { type: WhereEnum.ARRAY, alias: "form" },
  search: { type: WhereEnum.ILIKE, alias: "description" },
},
  {
    finished: (value: string) => {
      if (value === "all") return undefined;
      if (value === "true") return { $ne: null };
      if (value === "false") return { $eq: null };
      return undefined;
    },
  }
);

export const handler: HttpHandler = async (conn, req) => {
  const { page = 1, limit = 10, ...filters } = req.query as Query;

  const activityRepository = new ActivityRepository(conn);

  const user = await new User(conn).model().findById(req.user.id);

  const where = filterQueryBuilder.build({
    ...filters,
    user: user._id.toString(),
  });

  const activities = await activityRepository.find({
    where,
    select: {
      name: 1,
      description: 1,
      protocol: 1,
      state: 1,
      status: 1,
      createdAt: 1,
      finished_at: 1,
    },
    populate: [
      {
        path: "form",
        select: {
          name: 1,
          slug: 1,
        },
      },
    ],
    limit: limit,
    skip: (page - 1) * limit,
    sort: {
      createdAt: -1,
    },
  });

  const total = await activityRepository.count({ where });
  const totalPages = Math.ceil(total / limit);

  return res.success({
    activities,
    pagination: {
      count: activities.length + (page - 1) * limit,
      total,
      totalPages,
      page: Number(page),
      limit: Number(limit),
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
        finished: schema.string().oneOf(["all", "true", "false"]).default("all"),
        form: schema.array(schema.string()).default([]),
        search: schema.string().optional(),
      })
      .optional(),
  }))
  .configure({
    name: "DashboardMyActivities",
    permission: "activity.read",
    options: {
      methods: ["GET"],
      route: "dashboard/my-activities",
    },
  });
