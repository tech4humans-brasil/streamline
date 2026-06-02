import Http, { HttpHandler } from "../../../middlewares/http";
import res from "../../../utils/apiResponse";
import ActivityRepository from "../../../repositories/Activity";
import FilterQueryBuilder, {
  WhereEnum,
} from "../../../utils/filterQueryBuilder";
import { IFormType } from "../../../models/client/Form";
import {
  ACTIVITY_SORT_BY_VALUES,
  sortActivitiesInMemory,
  type ActivitySortBy,
} from "../../../utils/activityListSort";
import { applyActivityListVisibility } from "../../../use-cases/ActivityListVisibility";
import {
  buildActivityCreatorFilter,
  buildActivityNameFilter,
} from "../../../utils/activityListFilters";

interface Query {
  page?: number;
  limit?: number;
  name?: string;
  protocol?: string;
  status?: string;
  creator?: string;
  finished_at?: boolean;
  user?: string;
  assignee?: string;
  form?: string;
  project?: string;
  formType?: IFormType;
  sortBy?: string;
  sortDir?: string;
}

const filterQueryBuilder = new FilterQueryBuilder(
  {
    name: { type: WhereEnum.CUSTOM, alias: "name" },
    status: {
      type: WhereEnum.ILIKE,
      alias: "status.name",
    },
    protocol: WhereEnum.ILIKE,
    creator: { type: WhereEnum.CUSTOM, alias: "users.name" },
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
    name: buildActivityNameFilter,
    creator: buildActivityCreatorFilter,
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

const listSelect = {
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
};

const handler: HttpHandler = async (conn, req) => {
  const {
    page = 1,
    limit = 10,
    project,
    formType,
    sortBy = "createdAt",
    sortDir = "desc",
    ...filters
  } = req.query as Query;

  const visibility = await applyActivityListVisibility(
    conn,
    req,
    filters,
    project,
    formType
  );

  if (visibility === "empty") {
    return res.success(emptyList(page));
  }

  const activityRepository = new ActivityRepository(conn);
  const where = filterQueryBuilder.build(filters) as Record<string, unknown>;
  const sortDirection = sortDir === "asc" ? "asc" : "desc";
  const sortField = sortBy as ActivitySortBy;

  // Cosmos DB (Mongo API): sort na query falha sem índice composto (ex.: form + name).
  // Ordenação sempre em memória — mesmo padrão que dashboard/my-activities e Status/List.
  const allMatching = await activityRepository.find({
    where,
    select: listSelect,
  });

  const sorted = sortActivitiesInMemory(allMatching, sortField, sortDirection);
  const total = sorted.length;
  const totalPages = total === 0 ? 0 : Math.ceil(total / limit);
  const start = (page - 1) * limit;
  const activities = sorted.slice(start, start + limit);

  return res.success({
    activities,
    pagination: {
      page: Number(page),
      total,
      totalPages,
      count: activities.length + start,
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
        name: schema.string().max(2000).optional().default(undefined),
        status: schema.string().min(3).max(255).optional().default(undefined),
        protocol: schema.string().min(3).max(255).optional().default(undefined),
        creator: schema.string().min(3).max(255).optional().default(undefined),
        finished: schema
          .string()
          .oneOf(["true", "false"])
          .optional()
          .default(undefined),
        project: schema.string().optional().default(undefined),
        assignee: schema.string().optional().default(undefined),
        formType: schema.mixed().oneOf(formTypeValues).optional(),
        sortBy: schema
          .string()
          .oneOf([...ACTIVITY_SORT_BY_VALUES])
          .optional()
          .default("createdAt"),
        sortDir: schema
          .string()
          .oneOf(["asc", "desc"])
          .optional()
          .default("desc"),
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
