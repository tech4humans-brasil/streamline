import QueueWrapper, {
  GenericMessage,
  QueueWrapperHandler,
} from "../../middlewares/queue";
import { IInteraction } from "../../models/client/WorkflowDraft";
import ActivityRepository from "../../repositories/Activity";
import ConditionalEvaluator from "../../utils/conditionalEvaluator";
import sendNextQueue from "../../utils/sendNextQueue";

interface TMessage extends GenericMessage {}

const handler: QueueWrapperHandler<TMessage> = async (
  conn,
  messageQueue,
  context
) => {
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

    const { data } = step as { data: IInteraction };

    let path;

    if (data.conditional) {
      const interactions = activity.interactions.filter(
        (interaction) =>
          interaction.activity_step_id.toString() ===
          activity_step_id.toString()
      );

      if (!interactions.length) {
        throw new Error("Interaction not found");
      }

      const interaction = interactions.at(-1);

      const conditionals = data.conditional;
      const { answers } = interaction;

      const evaluated = ConditionalEvaluator.evaluate(answers, conditionals);

      if (!evaluated) {
        path = "alternative-source";
      }
    }

    await sendNextQueue({
      conn,
      activity,
      context,
      path,
    });

    await activity.save();

};

export default new QueueWrapper<TMessage>(handler).configure({
  name: "WorkInteractionProcess",
  options: {
    queueName: "interaction_process",
  },
});
