import Http, { HttpHandler } from "../../../middlewares/http";
import res from "../../../utils/apiResponse";
import { IActivityStepStatus } from "../../../models/client/Activity";
import ActivityRepository from "../../../repositories/Activity";

export const handler: HttpHandler = async (conn, req) => {
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
      updatedAt: 1,
      status: 1,
      users: 1,
      "interactions.form": 1,
      "interactions.answers": 1,
    },
    // Sem sort no Cosmos: $elemMatch em interactions + order by falha (índice composto / path excluído).
    // A ordenação final é feita em memória em `combined.sort` abaixo.
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
      updatedAt: 1,
      status: 1,
      users: 1,
      "interactions.form": 1,
      "interactions.canAddParticipants": 1,
      "interactions.permissionAddParticipants": 1,
      "interactions.answers": 1,
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

      const { status: ticketStatus, ...rest } = activity.toObject();
      return {
        ...rest,
        form: interaction.form,
        answerStatus: myAnswer.status,
        ticketStatus,
      };
    })
    .filter((activity) => activity !== null);

  const participantsPlain = pendingSelectedParticipants.map((activity) => {
    const interaction = activity.interactions.find(
      (i) =>
        i.canAddParticipants &&
        i.permissionAddParticipants?.some((id) => id.toString() === req.user.id) &&
        i.answers.length === 0
    );
    const { status: ticketStatus, ...rest } = activity.toObject();
    return {
      ...rest,
      form: interaction?.form,
      answerStatus: IActivityStepStatus.idle,
      ticketStatus,
    };
  });

  const combined = [...myPendingActivities, ...participantsPlain].sort((a, b) => {
    const ta = new Date(a.updatedAt ?? 0).getTime();
    const tb = new Date(b.updatedAt ?? 0).getTime();
    return tb - ta;
  });

  return res.success(combined);
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
