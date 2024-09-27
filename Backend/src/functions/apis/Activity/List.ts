import Http, { HttpHandler } from "../../../middlewares/http";
import res from "../../../utils/apiResponse";
import ActivityRepository from "../../../repositories/Activity";
import FilterQueryBuilder, {
  WhereEnum,
} from "../../../utils/filterQueryBuilder";
import { IUserRoles } from "../../../models/client/User";
import FormRepository from "../../../repositories/Form";
import { ObjectId } from "mongoose";

interface Query {
  page?: number;
  limit?: number;
  name?: string;
  protocol?: string;
  status?: string;
  finished_at?: boolean;
  user?: string;
  form?: string;
}

const filterQueryBuilder = new FilterQueryBuilder(
  {
    name: WhereEnum.ILIKE,
    status: {
      type: WhereEnum.ILIKE,
      alias: "status.name",
    },
    protocol: WhereEnum.ILIKE,
    finished_at: WhereEnum.CUSTOM,
    user: {
      type: WhereEnum.EQUAL,
      alias: "users._id",
    },
    form: WhereEnum.ARRAY,
  },
  {
    finished_at: (value) => ({
      $ne: value === "true" ? null : undefined,
    }),
  }
);

const handler: HttpHandler = async (conn, req) => {
  const { page = 1, limit = 10, ...filters } = req.query as Query;
  const isAdmin = req.user.roles.includes(IUserRoles.admin);

  const activityRepository = new ActivityRepository(conn);
  const formRepository = new FormRepository(conn);

  if (!isAdmin) {
    const visibilities = await formRepository.find({
      select: {
        _id: 1,
      },
      where: {
        visibilities: {
          $in: [req.user.institute._id],
        },
      },
    });

    if (visibilities.length > 0) {
      filters.form = visibilities.map((v) => v._id).join(",");
    }
  }

  const where = filterQueryBuilder.build(filters);

  const activities = await activityRepository.find({
    skip: (page - 1) * limit,
    where,
    limit,
    select: {
      name: 1,
      protocol: 1,
      status: 1,
      users: 1,
      finished_at: 1,
    },
    sort: {
      createdAt: -1,
    },
  });

  const total = await activityRepository.count({ where });
  const totalPages = Math.ceil(total / limit);

  return res.success({
    activities,
    pagination: {
      page: Number(page),
      total,
      totalPages,
      count: activities.length + (page - 1) * limit,
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
        status: schema.string().min(3).max(255).optional().default(undefined),
        protocol: schema.string().min(3).max(255).optional().default(undefined),
        finished: schema.boolean().optional().default(false),
      })
      .optional(),
  }))
  .configure({
    name: "ActivityList",
    permission: "activity.view",
    options: {
      methods: ["GET"],
      route: "activities",
    },
  });
