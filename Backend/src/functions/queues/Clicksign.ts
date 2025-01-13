import QueueWrapper, {
  GenericMessage,
  QueueWrapperHandler,
} from "../../middlewares/queue";
import { IActivityStepStatus } from "../../models/client/Activity";
import { IClicksign, NodeTypes } from "../../models/client/WorkflowDraft";
import ActivityRepository from "../../repositories/Activity";
import { ClickSignService } from "../../services/clicksign";
import replaceSmartValues from "../../utils/replaceSmartValues";

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

    const { data } = step as { data: IClicksign };

    if (!data) {
      throw new Error("Data not found");
    }

    const clicksignService = new ClickSignService(
      process.env.CLICKSIGN_API_KEY
    );

    const { documentKey, name, fields } = data;

    const fieldsReplaced: { key: string; value: string }[] = [];

    for (const [key, value] of Object.entries(fields)) {
      fieldsReplaced.push({
        key: key,
        value: await replaceSmartValues({
          conn,
          activity_id: activity.toObject(),
          replaceValues: value,
        }),
      });
    }

    const {
      data: { id: envelopeId },
    } = await clicksignService
      .createEnvelope({
        name,
      })
      .catch((err) => {
        throw err;
      });

    const document = await clicksignService.addDocument({
      templateKey: documentKey,
      envelopeId,
      content: fields,
      documentName: name,
      stepId: activity_step_id,
      ticketId: activity_id,
      workflowId: activity_workflow_id,
    });

    const signers = data.signers.map((signer) =>
      clicksignService.addSigner({
        signerEmail: signer.email,
        signerName: signer.name,
        envelopeId,
      })
    );

    await Promise.all(signers);

    activityStep.status = IActivityStepStatus.idle;

    await clicksignService.startEnvelope(envelopeId);

    await activity.save();
  } catch (err) {
    console.error(err);
    throw err;
  }
};

export default new QueueWrapper<TMessage>(handler).configure({
  name: "WorkClicksign",
  options: {
    queueName: NodeTypes.Clicksign,
  },
});
