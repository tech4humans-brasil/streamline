import Http, { HttpHandler } from "../../../middlewares/http";
import res from "../../../utils/apiResponse";
import ActivityRepository from "../../../repositories/Activity";
import FilterQueryBuilder, {
  WhereEnum,
} from "../../../utils/filterQueryBuilder";
import FormRepository from "../../../repositories/Form";
import { ObjectId } from "mongoose";
import moment from 'moment';

interface Query {
  page?: number;
  limit?: number;
  name?: string;
  protocol?: string;
  status?: string;
  form?: string | ObjectId;
  date_type?: "createdAt" | "finished_at";
  start_date?: string;
  end_date?: string;
}

const filterQueryBuilder = new FilterQueryBuilder(
  {
    name: WhereEnum.ILIKE,
    status: {
      type: WhereEnum.ILIKE,
      alias: "status.name",
    },
    protocol: WhereEnum.ILIKE,
    createdAt: WhereEnum.CUSTOM,
    finished_at: WhereEnum.CUSTOM,
    form: {
      type: WhereEnum.EQUAL,
      alias: "form",
    },
  },
  {
    createdAt: (value) => ({
      $gte: new Date(value.split(",")[0]),
      $lte: value.split(",")[1] ? new Date(value.split(",")[1]) : new Date(),
    }),
    finished_at: (value) => ({
      $gte: value ? new Date(value.split(",")[0]) : null,
      $lte: value.split(",")[1] ? new Date(value.split(",")[1]) : new Date(),
    }),
  }
);

const handler: HttpHandler = async (conn, req) => {
  const {
    page = 1,
    limit = 10,
    date_type,
    start_date,
    end_date,
    ...filters
  } = req.query as Query;

  if (filters?.form) {
    const formRepository = new FormRepository(conn);
    const form = await formRepository.findById({
      id: filters.form,
      select: {
        name: 1,
      },
    });

    if (!form) {
      return res.notFound("Form does not exist");
    }

    filters.form = form._id;
  }

  const activityRepository = new ActivityRepository(conn);
  const where = filterQueryBuilder.build({
    ...filters,
    form: filters.form?.toString(),
    ...(date_type &&
      start_date &&
      end_date && {
        [date_type]: `${start_date},${end_date}`,
      }),
  });

  console.log(where);

  // Updated status counts aggregation
  const statusCountsPromise = activityRepository.aggregate([
    { $match: where },
    { 
      $group: { 
        _id: "$status.name",
        // Count unique combinations of status name
        count: { $sum: 1 },
        // Collect all status IDs for reference if needed
        statusIds: { $addToSet: "$status._id" }
      } 
    },
    // Sort by count in descending order
    { $sort: { count: -1 } }
  ]);

  const formTypeCountsPromise = activityRepository.aggregate([
    { $match: where },
    {
      $lookup: {
        from: "forms",
        localField: "form",
        foreignField: "_id",
        as: "form",
      },
    },
    { $unwind: "$form" },
    { $group: { _id: "$form.name", count: { $sum: 1 } } },
  ]);

  const openActivitiesCountPromise = activityRepository.count({
    where: {
      ...where,
      finished_at: {
        $eq: null,
      },
    },
  });

  // Contagem de atividades fechadas (finished_at != null)
  const closedActivitiesCountPromise = activityRepository.count({
    where: {
      ...where,
      finished_at: { $ne: null },
    },
  });

  // New metrics
  const averageCompletionTimePromise = activityRepository.aggregate([
    {
      $match: {
        ...where,
        finished_at: { $ne: null },
      },
    },
    {
      $project: {
        completion_time: {
          $divide: [
            { $subtract: ["$finished_at", "$createdAt"] },
            1000 * 60 * 60 * 24, // Convert to days
          ],
        },
      },
    },
    {
      $group: {
        _id: null,
        averageTime: { $avg: "$completion_time" },
      },
    },
  ]);

  const deadlineMetricsPromise = activityRepository.aggregate([
    { $match: where },
    {
      $group: {
        _id: null,
        onTime: {
          $sum: {
            $cond: [
              {
                $and: [
                  { $ne: ["$due_date", null] },
                  { $gte: ["$finished_at", "$due_date"] },
                ],
              },
              1,
              0,
            ],
          },
        },
        delayed: {
          $sum: {
            $cond: [
              {
                $and: [
                  { $ne: ["$due_date", null] },
                  { $lt: ["$finished_at", "$due_date"] },
                ],
              },
              1,
              0,
            ],
          },
        },
        noDeadline: {
          $sum: { $cond: [{ $eq: ["$due_date", null] }, 1, 0] },
        },
      },
    },
  ]);

  // Last 6 months activities
  const sixMonthsAgo = moment().subtract(5, 'months').startOf('month').toDate();
  const endOfCurrentMonth = moment().endOf('month').toDate();

  const monthlyActivitiesPromise = activityRepository.aggregate([
    {
      $match: {
        ...where,
        createdAt: {
          $gte: sixMonthsAgo,
          $lte: endOfCurrentMonth,
        },
      },
    },
    {
      $group: {
        _id: {
          year: { $year: "$createdAt" },
          month: { $month: "$createdAt" },
        },
        count: { $sum: 1 },
      },
    },
    {
      $project: {
        _id: 0,
        month: {
          $concat: [
            { $toString: "$_id.year" },
            "-",
            {
              $cond: [
                { $lt: ["$_id.month", 10] },
                { $concat: ["0", { $toString: "$_id.month" }] },
                { $toString: "$_id.month" },
              ],
            },
          ],
        },
        count: 1,
      },
    },
    { $sort: { month: 1 } },
  ]);

  const topUsersPromise = activityRepository.aggregate([
    { $match: where },
    { $unwind: "$users" },
    {
      $group: {
        _id: "$users._id",
        userName: { $first: "$users.name" },
        count: { $sum: 1 },
      },
    },
    { $sort: { count: -1 } },
    { $limit: 10 },
    {
      $project: {
        userId: "$_id",
        userName: 1,
        count: 1,
        _id: 0,
      },
    },
  ]);

  const instituteDistributionPromise = activityRepository.aggregate([
    { $match: where },
    {
      $lookup: {
        from: "forms",
        localField: "form",
        foreignField: "_id",
        as: "form",
      },
    },
    { $unwind: "$form" },
    {
      $group: {
        _id: "$form._id",
        name: { $first: "$form.name" },
        count: { $sum: 1 },
      },
    },
    { $sort: { count: -1 } },
  ]);

  const [
    statusCounts,
    formTypeCounts,
    openActivitiesCount,
    closedActivitiesCount,
    averageCompletionTimeResult,
    deadlineMetricsResult,
    monthlyActivities,
    topUsers,
    instituteDistribution,
  ] = await Promise.all([
    statusCountsPromise,
    formTypeCountsPromise,
    openActivitiesCountPromise,
    closedActivitiesCountPromise,
    averageCompletionTimePromise,
    deadlineMetricsPromise,
    monthlyActivitiesPromise,
    topUsersPromise,
    instituteDistributionPromise,
  ]);

  const deadlineMetrics = deadlineMetricsResult[0] || {
    onTime: 0,
    delayed: 0,
    noDeadline: 0,
  };

  const total = await activityRepository.count({ where });
  const totalPages = Math.ceil(total / limit);

  return res.success({
    statusCounts,
    formTypeCounts,
    openActivitiesCount,
    closedActivitiesCount,
    averageCompletionTime: averageCompletionTimeResult[0]?.averageTime || 0,
    deadlineMetrics,
    monthlyActivities,
    topUsers,
    instituteDistribution,
  });
};

export default new Http(handler)
  .setSchemaValidator((schema) => ({
    query: schema
      .object({
        page: schema.number().optional().default(1).min(1),
        limit: schema.number().optional(),
        name: schema.string().min(3).max(255).optional(),
        status: schema.string().min(3).max(255).optional(),
        protocol: schema.string().min(3).max(255).optional(),
        form: schema.string().optional(),
        date_type: schema
          .mixed()
          .oneOf(["createdAt", "finished_at"])
          .optional(),
        start_date: schema.string().optional(),
        end_date: schema.string().optional(),
      })
      .optional(),
  }))
  .configure({
    name: "ActivityDashboard",
    permission: "activity.view",
    options: {
      methods: ["GET"],
      route: "activities/dashboard",
    },
  });
