import QueueWrapper, {
  GenericMessage,
  QueueWrapperHandler,
} from "../../middlewares/queue";
import { IActivityStepStatus } from "../../models/client/Activity";
import { IClicksign, NodeTypes } from "../../models/client/WorkflowDraft";
import ActivityRepository from "../../repositories/Activity";
import UserRepository from "../../repositories/User";
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

    const { data } = step as { data: IClicksign };

    if (!data) {
      throw new Error("Data not found");
    }

    const clicksignService = new ClickSignService(
      process.env.CLICKSIGN_API_KEY
    );

    const { documentKey, name, fields, signers } = data;

    const fieldsReplaced: { key: string; value: string }[] = [];

    const destination: {
      user: { email: string; name: string };
      type: string;
    }[] = [];

    for (const signer of signers) {
      const user = signer.user;
      let userName = user.name;
      let userEmail = user.email;

      if (user.name.startsWith("${{") && user.name.endsWith("}}")) {
        userName = await replaceSmartValues({
          conn,
          activity_id: activity.toObject(),
          replaceValues: user.name,
        });
      }

      if (user.email.startsWith("${{") && user.email.endsWith("}}")) {
        userEmail = await replaceSmartValues({
          conn,
          activity_id: activity.toObject(),
          replaceValues: user.email,
        });
      }

      destination.push({
        user: {
          name: userName,
          email: userEmail,
        },
        type: signer.type,
      });
    }

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

    const addSignersPromises = destination.map((signer) =>
      clicksignService.addSigner({
        signerName: signer.user.name,
        signerEmail: signer.user.email,
        envelopeId,
      })
    );

    const signersIds = await Promise.all(addSignersPromises);

    await clicksignService.addRequirements({
      envelopeId,
      documentId: document.id,
      requirements: signers.map((signer) => ({
        signer: signersIds.find((s) => s.userId === signer.user.email)?.id,
        type: signer.type,
      })),
    });

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
