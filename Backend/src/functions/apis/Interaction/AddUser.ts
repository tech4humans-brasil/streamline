import Http, { HttpHandler } from "../../../middlewares/http";
import res from "../../../utils/apiResponse";
import ActivityRepository from "../../../repositories/Activity";
import { IActivityStepStatus } from "../../../models/client/Activity";
import UserRepository from "../../../repositories/User";
import emailTemplate from "../../../utils/emailTemplate";
import { sendEmail } from "../../../services/email";
import { IInteraction } from "../../../models/client/WorkflowDraft";
import {
  extraOutputsInteractionProcess,
  sendToQueue,
} from "../../../utils/sbusOutputs";
import InteractionHelper from "../../../use-cases/InteractionHelper";

const handler: HttpHandler = async (conn, req, context) => {
  const { id, interactionId } = req.params as {
    id: string;
    interactionId: string;
  };

  const { users } = req.body as {
    users: { userId: string; observation: string }[];
  };

  const activityRepository = new ActivityRepository(conn);
  const userRepository = new UserRepository(conn);

  const activity = await activityRepository.findById({
    id,
  });

  if (!activity) {
    return res.notFound("Activity not found");
  }

  const interaction = activity.interactions.id(interactionId);

  if (!interaction) {
    return res.notFound("Interaction not found");
  }

  if (!users?.length) {
    interaction.canAddParticipants = false;

    InteractionHelper.processInteractionAnswers(
      interaction,
      activity,
      context,
      conn
    );

    await activity.save();

    return res.success(interaction);
  }

  const usersData = await userRepository.find({
    where: { _id: { $in: users.map((u) => u.userId) } },
    select: ["_id", "name", "email", "institutes"],
  });

  if (!interaction.answers.length) {
    interaction.permissionAddParticipants = usersData.map((u) =>
      u._id.toString()
    );
  }

  for (const { userId, observation } of users) {
    const user = usersData.find((u) => u._id.toString() === userId);

    const userInInteraction = interaction.answers.find(
      (answer) => answer.user._id.toString() === userId
    );

    if (userInInteraction) {
      continue;
    }

    interaction.answers.push({
      user: user,
      status: IActivityStepStatus.idle,
      observation: observation || "",
      data: null,
    });
  }

  const activityWorkflow = activity.workflows.find(
    (workflow) =>
      workflow._id.toString() === interaction.activity_workflow_id.toString()
  );

  if (!activityWorkflow) {
    throw new Error("Workflow not found");
  }

  const {
    workflow_draft: { steps },
  } = activityWorkflow;

  const activityStep = activityWorkflow.steps.find(
    (step) => step._id.toString() === interaction.activity_step_id.toString()
  );

  if (!activityStep) {
    throw new Error("Step not found");
  }

  const step = steps.find(
    (step) => step._id.toString() === activityStep.step.toString()
  );

  if (!step) {
    throw new Error("Step not found");
  }

  const { data } = step as { data: IInteraction };

  interaction.waitFor = InteractionHelper.calculateWaitFor(
    interaction.answers.length,
    data
  );

  await activity.save();

  const content = `
  <p>Olá, ${usersData.map((u) => u.name).join(", ")}</p>
  <p>O formulário "${interaction.form.name}" foi enviado para você.</p>
  <p>Acesse o painel para responder.</p> 
  ${
    interaction.waitForOne
      ? "<p>Este formulário é necessário resposta de pelo menos um usuário.</p>"
      : "Este formulário é necessário resposta de todos os usuários."
  }
  <a href="${process.env.FRONTEND_URL}/portal">Acessar o painel</a>
`;

  const { html, css } = emailTemplate(content);

  await sendEmail(
    usersData.map((u) => u.email),
    `[${activity.protocol}] - Você possui uma nova pendência!`,
    html,
    css
  );

  return res.success(interaction);
};

export default new Http(handler)
  .setSchemaValidator((schema) => ({
    params: schema.object({
      id: schema.string().required(),
      interactionId: schema.string().required(),
    }),
    body: schema.object().shape({
      users: schema.array(
        schema.object({
          userId: schema.string().required(),
          observation: schema.string().nullable(),
        })
      ),
    }),
  }))
  .configure({
    name: "ActivityAddUsersInInteraction",
    permission: "activity.read",
    options: {
      methods: ["PATCH"],
      route: "activity/{id}/interaction/{interactionId}/users",
      extraOutputs: [extraOutputsInteractionProcess],
    },
  });
