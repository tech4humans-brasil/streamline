import Http, { HttpHandler } from "../../../middlewares/http";
import res from "../../../utils/apiResponse";
import { IActivityStepStatus } from "../../../models/client/Activity";
import ActivityRepository from "../../../repositories/Activity";

interface Query {
  page?: number;
  limit?: number;
}

export const handler: HttpHandler = async (conn, req, context) => {
  const { page = 1, limit = 10 } = req.query as Query;

  const activityRepository = new ActivityRepository(conn);

  const pendingActivitiesPromisse = activityRepository.find({
    where: {
      interactions: {
        $elemMatch: {
          "answers.user._id": req.user.id,
          "answers.status": IActivityStepStatus.idle,
        },
      },
    },
    select: {
      _id: 1,
      name: 1,
      description: 1,
      protocol: 1,
      due_date: 1,
      users: 1,
      "interactions.form": 1,
      "interactions.answers": 1,
    },
    sort: {
      due_date: 1,
    },
  });

  const pendingSelectedParticipantsPromisse = activityRepository.find({
    where: {
      interactions: {
        $elemMatch: {
          "canAddParticipants": true,
          "permissionAddParticipants": {
            $in: [req.user.id],
          },
          answers: {
            $size: 0
          },
        },
      },
    },
    select: {
      _id: 1,
      name: 1,
      description: 1,
      protocol: 1,
      due_date: 1,
      users: 1,
    },
    sort: {
      due_date: 1,
    },
  });

  const [pendingActivities, pendingSelectedParticipants] = await Promise
    .all([pendingActivitiesPromisse, pendingSelectedParticipantsPromisse]);

  const myPendingActivities = pendingActivities
    .map((activity) => {
      const interaction = activity.interactions.find((interaction) =>
        interaction.answers.some(
          (answer) =>
            answer.user._id.toString() === req.user.id &&
            answer.status === IActivityStepStatus.idle
        )
      );

      if (!interaction) {
        return null;
      }

      const myAnswer = interaction.answers.find(
        (answer) =>
          answer.user._id.toString() === req.user.id &&
          answer.status === IActivityStepStatus.idle
      );

      return {
        ...activity.toObject(),
        form: interaction.form,
        status: myAnswer.status,
      };
    })
    .filter((activity) => activity !== null);

  return res.success([...myPendingActivities, ...pendingSelectedParticipants]);
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
      })
      .optional(),
  }))
  .configure({
    name: "DashboardPendingInteractions",
    permission: "activity.update",
    options: {
      methods: ["GET"],
      route: "dashboard/my-pending-interactions",
    },
  });
