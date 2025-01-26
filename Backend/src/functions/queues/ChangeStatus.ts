import QueueWrapper, {
  GenericMessage,
  QueueWrapperHandler,
} from "../../middlewares/queue";
import { IChangeStatus, NodeTypes } from "../../models/client/WorkflowDraft";
import ActivityRepository from "../../repositories/Activity";
import StatusRepository from "../../repositories/Status";
import { sendEmail } from "../../services/email";
import emailTemplate from "../../utils/emailTemplate";
import sendNextQueue from "../../utils/sendNextQueue";

interface TMessage extends GenericMessage {}

const handler: QueueWrapperHandler<TMessage> = async (
  conn,
  messageQueue,
  context
) => {
  try {
    const { activity_id, activity_step_id, activity_workflow_id, client } =
      messageQueue;

    const activityRepository = new ActivityRepository(conn);
    const statusRepository = new StatusRepository(conn);

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

    const { data } = step as { data: IChangeStatus };

    if (!data) {
      throw new Error("Data not found");
    }

    const { status_id } = data;

    const status = await statusRepository.findById({ id: status_id });

    if (!status) {
      throw new Error("Status not found");
    }

    const lastStatus = activity.status;
    activity.status = status;

    await sendNextQueue({
      conn,
      activity,
      context,
    });

    await activity.save();

    const content = `
    <p>Olá, ${activity.users.at(0).name}!</p>
    <p>A atividade "${activity.name}" mudou de status para "${status.name}".</p>
    <p>Anteriormente, o status era "${lastStatus.name}".</p>
    <p>Para mais informações, acesse o sistema.</p>
    <a href="${process.env.FRONTEND_URL}/portal/atividades/${
      activity._id
    }">Acessar o painel</a>
`;

    const { html, css } = await emailTemplate({
      content,
      slug: client,
    });

    await sendEmail(
      activity.users.map((user) => user.email),
      `[${activity.protocol}] - Sua atividade mudou de status!`,
      html,
      css
    );
  } catch (err) {
    console.error(err);
    throw err;
  }
};

export default new QueueWrapper<TMessage>(handler).configure({
  name: "WorkChangeStatus",
  options: {
    queueName: NodeTypes.ChangeStatus,
  },
});
