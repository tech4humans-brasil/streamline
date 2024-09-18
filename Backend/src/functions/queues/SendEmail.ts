import QueueWrapper, {
  GenericMessage,
  QueueWrapperHandler,
} from "../../middlewares/queue";
import { ISendEmail, NodeTypes } from "../../models/client/WorkflowDraft";
import ActivityRepository from "../../repositories/Activity";
import EmailRepository from "../../repositories/Email";
import { sendEmail } from "../../services/email";
import replaceSmartValues from "../../utils/replaceSmartValues";
import sendNextQueue from "../../utils/sendNextQueue";

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
    const emailRepository = new EmailRepository(conn);

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

    const { data } = step as { data: ISendEmail };

    if (!data) {
      throw new Error("Data not found");
    }

    const { to, email_id, sender } = data;

    const email = await emailRepository.findById({ id: email_id });

    if (!email) {
      throw new Error("Email not found");
    }

    const { subject, htmlTemplate, cssTemplate } = email;

    const subjectReplaced = await replaceSmartValues({
      conn,
      activity_id,
      replaceValues: subject,
    });

    const toReplaced = (
      await replaceSmartValues({
        conn,
        activity_id,
        replaceValues: to,
      })
    ).flatMap((el) => el.split(", "));

    const htmlTemplateReplaced = await replaceSmartValues({
      conn,
      activity_id,
      replaceValues: htmlTemplate,
    });

    await sendEmail(
      toReplaced,
      subjectReplaced,
      htmlTemplateReplaced,
      cssTemplate,
      sender,
    );

    await sendNextQueue({
      conn,
      activity,
      context,
    });
  } catch (err) {
    console.error(err);
    throw err;
  }
};

export default new QueueWrapper<TMessage>(handler).configure({
  name: "WorkSendEmail",
  options: {
    queueName: NodeTypes.SendEmail,
  },
});
