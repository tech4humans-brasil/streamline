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
import emailTemplate from "../../utils/emailTemplate";

interface TMessage extends GenericMessage {}

const handler: QueueWrapperHandler<TMessage> = async (
  conn,
  messageQueue,
  context
) => {
  try {
    const { activity_id, activity_step_id, activity_workflow_id } =
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
          },
          {
            "institutes._id": {
              $in: destination,
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

    if (!users.length) {
      throw new Error("Users not found");
    }

    const form = await formRepository.findById({ id: form_id });

    const waitFor = (() => {
      if (waitType === "any") {
        return 1;
      }

      if (waitType === "custom") {
        if (waitValue > users.length) {
          return users.length;
        }

        return waitValue;
      }

      if (waitType === "all") {
        return users.length;
      }

      if (waitForOne) {
        return 1;
      }

      return users.length;
    })();

    console.log("waitFor", waitFor, waitType, waitValue);

    activity.interactions.push({
      activity_workflow_id,
      activity_step_id,
      form: form.toObject(),
      waitFor,
      answers: users.map((u) => ({
        status: "idle",
        user: u,
        data: null,
      })),
      finished: false,
    });

    await activity.save();

    const content = `
    <p>Olá, ${users.map((u) => u.name).join(", ")}!</p>
    <p>O formulário "${form.name}" foi enviado para você.</p>
    <p>Acesse o painel para responder.</p> 
    ${
      waitForOne
        ? "<p>Este formulário é necessário resposta de pelo menos um usuário.</p>"
        : "Este formulário é necessário resposta de todos os usuários."
    }
    <a href="${process.env.FRONTEND_URL}/portal">Acessar o painel</a>
`;

    const { html, css } = emailTemplate(content);

    await sendEmail(
      users.map((u) => u.email),
      `[${activity.protocol}] - Você possui uma nova pendência!`,
      html,
      css
    );

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
