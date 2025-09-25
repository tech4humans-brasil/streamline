import QueueWrapper, {
  GenericMessage,
  QueueWrapperHandler,
} from "../../middlewares/queue";
import { IActivityStepStatus } from "../../models/client/Activity";
import { IInteraction, NodeTypes } from "../../models/client/WorkflowDraft";
import ActivityRepository from "../../repositories/Activity";
import FormRepository from "../../repositories/Form";
import UserRepository from "../../repositories/User";
import { sendEmail } from "../../services/email";
import Holiday from "../../services/holliday";
import InteractionHelper from "../../use-cases/InteractionHelper";
import emailTemplate from "../../utils/emailTemplate";

interface TMessage extends GenericMessage { }

const handler: QueueWrapperHandler<TMessage> = async (
  conn,
  messageQueue,
  context
) => {
  try {
    const { activity_id, activity_step_id, activity_workflow_id, client } =
      messageQueue;

    const activityRepository = new ActivityRepository(conn);
    const formRepository = new FormRepository(conn);
    const userRepository = new UserRepository(conn);

    const activity = await activityRepository.findById({ id: activity_id });

    if (!activity) {
      throw new Error("Activity not found");
    }

    const activityWorkflow = activity.workflows.find(
      (workflow) => workflow._id.toString() === activity_workflow_id
    );

    if (!activityWorkflow) {
      throw new Error("Workflow not found");
    }

    const {
      workflow_draft: { steps },
    } = activityWorkflow;

    const activityStep = activityWorkflow.steps.find(
      (step) => step._id.toString() === activity_step_id
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

    if (!data) {
      throw new Error("Data not found");
    }

    const {
      form_id,
      to,
      waitForOne = null,
      waitType = null,
      waitValue = null,
      canAddParticipants = false,
      permissionAddParticipants = [],
      sla_value = null,
      sla_unit = null,
    } = data;

    let destination: string[] = to.flatMap((t) => {
      if (t.includes("users")) {
        return activity.users.map((u) => u._id.toString());
      }

      return t;
    });

    const users = await userRepository.find({
      where: {
        $or: [
          {
            _id: { $in: destination },
            active: true,
          },
          {
            "institutes._id": {
              $in: destination,
              active: true,
            },
          },
        ],
      },
      select: {
        _id: 1,
        name: 1,
        email: 1,
        matriculation: 1,
        institute: 1,
      },
    });

    if (!users.length && !canAddParticipants) {
      throw new Error("Users not found");
    }

    const form = await formRepository.findById({ id: form_id });

    let interactionDueDate: Date | null = null;

    if (sla_value) {
      const slaCalculator = new Holiday();

      interactionDueDate = await slaCalculator.calculateDueDate(new Date(), sla_value, sla_unit);
    }

    const waitFor = InteractionHelper.calculateWaitFor(users.length, data);

    const permissionAddParticipantsResult = await (async () => {
      const usersP = await await userRepository.find({
        where: {
          $or: [
            {
              _id: { $in: permissionAddParticipants },
              active:true,
            },
            {
              "institutes._id": {
                $in: permissionAddParticipants,
                active: true,
              },
              active: true,
            },
          ],
        },
        select: {
          _id: 1,
          name: 1,
          email: 1,
          active: 1,
        },
      });

      return usersP;
    })();

    if (users.length === 0 && permissionAddParticipantsResult.length === 0) {
      throw new Error("Users to and permissionAddParticipants not found");
    }

    activity.interactions.push({
      activity_workflow_id,
      activity_step_id,
      form: form.toObject(),
      canAddParticipants,
      permissionAddParticipants: permissionAddParticipantsResult.map((u) => u._id.toString()),
      waitFor,
      dueDate: interactionDueDate,
      answers: users.map((u) => ({
        status: "idle",
        user: u,
        data: null,
      })),
      finished: false,
    });

    await activity.save();

    if (users.length > 0) {
      const content = `
        <p>Olá, ${users.map((u) => u.name).join(", ")}!</p>
        <p>O formulário "${form.name}" foi enviado para você.</p>
        <p>Acesse o painel para responder.</p> 
        ${interactionDueDate ? `<p>O prazo para responder é até ${interactionDueDate.toLocaleString("pt-BR")}.</p>` : ""}
        ${waitForOne
          ? "<p>Este formulário é necessário resposta de pelo menos um usuário.</p>"
          : "Este formulário é necessário resposta de todos os usuários."
        }
        <a href="${process.env.FRONTEND_URL}/portal">Acessar o painel</a>
      `;

      const { html, css } = await emailTemplate({ slug: client, content });

      await sendEmail(
        users.map((u) => u.email),
        `[${activity.protocol}] - Você possui uma nova pendência!`,
        html,
        css
      );
    }

    if (permissionAddParticipantsResult.length > 0 && canAddParticipants) {

      const content = `
        <p>Olá, ${permissionAddParticipantsResult.map((u) => u.name).join(", ")}!</p>
        <p>O formulário "${form.name}" está pendente para que você selecione os participantes.</p>
        <div class="button-container">
          <a class="button" href="${process.env.FRONTEND_URL}/portal/activity/${activity._id}">Acessar o ticket</a>
        </div>
      `;

      const { html, css } = await emailTemplate({ slug: client, content });

      await sendEmail(
        permissionAddParticipantsResult.map((u) => u.email),
        `[${activity.protocol}] - Você precisa selecionar os participantes!`,
        html,
        css
      );
    }

    activityStep.status = IActivityStepStatus.idle;

    await activity.save();
  } catch (err) {
    console.error(err);
    throw err;
  }
};

export default new QueueWrapper<TMessage>(handler).configure({
  name: "WorkInteraction",
  options: {
    queueName: NodeTypes.Interaction,
  },
});
