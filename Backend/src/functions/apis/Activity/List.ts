import Http, { HttpHandler } from "../../../middlewares/http";
import res from "../../../utils/apiResponse";
import ActivityRepository from "../../../repositories/Activity";
import FilterQueryBuilder, {
  WhereEnum,
} from "../../../utils/filterQueryBuilder";
import { IUserRoles } from "../../../models/client/User";
import FormRepository from "../../../repositories/Form";
import { IFormType } from "../../../models/client/Form";

interface Query {
  page?: number;
  limit?: number;
  name?: string;
  protocol?: string;
  status?: string;
  finished_at?: boolean;
  user?: string;
  assignee?: string;
  form?: string;
  project?: string;
  formType?: IFormType;
}

const filterQueryBuilder = new FilterQueryBuilder(
  {
    name: WhereEnum.ILIKE,
    status: {
      type: WhereEnum.ILIKE,
      alias: "status.name",
    },
    protocol: WhereEnum.ILIKE,
    finished: { type: WhereEnum.CUSTOM, alias: "finished_at" },
    user: {
      type: WhereEnum.EQUAL,
      alias: "users._id",
    },
    assignee: {
      type: WhereEnum.EQUAL,
      alias: "assignee._id",
    },
    form: WhereEnum.ARRAY,
  },
  {
    finished: (value: string) => ({
      ...(value === "true" && { $ne: null }),
      ...(value === "false" && { $eq: null }),
    }),
  }
);

const emptyList = (page: number) => ({
  activities: [],
  pagination: {
    page: Number(page),
    total: 0,
    totalPages: 0,
    count: 0,
  },
});

function intersectIds(visibility: string[], other: string[]): string[] {
  const otherSet = new Set(other.map(String));
  return visibility.filter((id) => otherSet.has(String(id)));
}

const handler: HttpHandler = async (conn, req) => {
  const {
    page = 1,
    limit = 10,
    project,
    formType,
    ...filters
  } = req.query as Query;

  const isAdmin = req.user.roles.includes(IUserRoles.admin);

  const activityRepository = new ActivityRepository(conn);
  const formRepository = new FormRepository(conn);

  let visibilityFormIds: string[] | null = null;

  if (!isAdmin) {
    const visibilities = await formRepository.find({
      select: {
        _id: 1,
      },
      where: {
        visibilities: {
          $in: req.user.institutes.map((institute) => institute._id),
        },
      },
    });

    if (!visibilities.length) {
      return res.success(emptyList(page));
    }

    visibilityFormIds = visibilities.map((v) => String(v._id));
  }

  if (project) {
    const formWhere: Record<string, unknown> = { project };
    if (formType) {
      formWhere.type = formType;
    }

    const projectForms = await formRepository.find({
      select: { _id: 1 },
      where: formWhere,
      limit: 5000,
    });

    const projectFormIds = projectForms.map((f) => String(f._id));

    if (!projectFormIds.length) {
      return res.success(emptyList(page));
    }

    if (!isAdmin && visibilityFormIds) {
      const crossed = intersectIds(visibilityFormIds, projectFormIds);
      if (!crossed.length) {
        return res.success(emptyList(page));
      }
      filters.form = crossed.join(",");
    } else if (isAdmin) {
      filters.form = projectFormIds.join(",");
    }
  } else if (!isAdmin && visibilityFormIds) {
    filters.form = visibilityFormIds.join(",");
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
      assignee: 1,
      finished_at: 1,
      description: 1,
      due_date: 1,
      createdAt: 1,
      "form_draft.fields": 1,
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

const formTypeValues = Object.values(IFormType);

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
          .transform((v) => Number(v))
          .max(200),
        name: schema.string().min(3).max(255).optional().default(undefined),
        status: schema.string().min(3).max(255).optional().default(undefined),
        protocol: schema.string().min(3).max(255).optional().default(undefined),
        finished: schema.boolean().optional().default(false),
        project: schema.string().optional().default(undefined),
        assignee: schema.string().optional().default(undefined),
        formType: schema.mixed().oneOf(formTypeValues).optional(),
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
