import QueueWrapper, {
  GenericMessage,
  QueueWrapperHandler,
} from "../../middlewares/queue";
import { IActivityStepStatus } from "../../models/client/Activity";
import { IClicksign, NodeTypes } from "../../models/client/WorkflowDraft";
import ActivityRepository from "../../repositories/Activity";
import AdminRepository from "../../repositories/Admin";
import UserRepository from "../../repositories/User";
import { ClickSignService } from "../../services/clicksign";
import { connectAdmin } from "../../services/mongo";
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

    const connAdmin = await connectAdmin();
    const admin = await new AdminRepository(connAdmin).findOne({
      where: {
        acronym: conn.name,
      },
    });

    if (!admin || !admin.config?.clicksign?.apiKey) {
      throw new Error("Admin not found");
    }

    const clicksignService = new ClickSignService(
      admin.config.clicksign.apiKey
    );

    const { documentKey, name, fields, signers } = data;

    const fieldsReplaced: { key: string; value: string }[] = [];

    const destination: {
      user: { email: string; name: string };
      type: `${string}:${string}`;
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

    for (const { key, value } of fields) {
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
        name: `Envelope ${activity.protocol} | ${name}`,
      })
      .catch((err) => {
        throw "Error creating envelope " + err.message;
      });

    console.log("Envelope created", envelopeId);

    const documentName = `${name}.docx`;

    const document = await clicksignService.addDocument({
      templateKey: documentKey,
      envelopeId,
      content: fieldsReplaced.reduce((acc, field) => {
        acc[field.key] = field.value;
        return acc;
      }, {}),
      documentName,
      stepId: activity_step_id,
      ticketId: activity_id,
      workflowId: activity_workflow_id,
    });

    console.log("Document added", document.id);

    const addSignersPromises = destination.map((signer) =>
      clicksignService.addSigner({
        signerName: signer.user.name,
        signerEmail: signer.user.email,
        envelopeId,
      })
    );

    const signersIds = await Promise.all(addSignersPromises);

    console.log("Signers added", signersIds);

    await clicksignService
      .addRequirements({
        envelopeId,
        documentId: document.id,
        requirements: destination.map((signer) => ({
          signer: signersIds.find((s) => s.userId === signer.user.email)?.id,
          type: signer.type,
        })),
      })
      .catch((err) => {
        throw "Error adding requirements " + err.message;
      });

    console.log("Requirements added");

    await clicksignService.startEnvelope(envelopeId);

    for (const signer of signersIds) {
      await clicksignService
        .sendNotification({
          envelopeId,
          signerId: signer.id,
          message: `Você tem um documento para assinar do ticket ${activity.protocol}`,
        })
        .catch((err) => {
          console.error("Error sending notification " + err.message);
        });
    }

    activity.documents.push({
      activity_workflow_id,
      activity_step_id,
      envelope_id: envelopeId,
      documents: [
        {
          id: document.id,
          name: documentName,
          fields: fieldsReplaced,
          closed: true,
          users: destination.map((signer) => ({
            id: signersIds.find((s) => s.userId === signer.user.email)?.id,
            name: signer.user.name,
            email: signer.user.email,
            role: signer.type,
          })),
        },
      ],
      finished: true,
    });
    await activity.save();

    await sendNextQueue({
      conn,
      activity,
      context,
    });
  } catch (err) {
    throw err;
  }
};

export default new QueueWrapper<TMessage>(handler).configure({
  name: "WorkClicksign",
  options: {
    queueName: NodeTypes.Clicksign,
  },
});
