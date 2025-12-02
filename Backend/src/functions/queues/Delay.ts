import QueueWrapper, {
  GenericMessage,
  QueueWrapperHandler,
} from "../../middlewares/queue";
import { IDelay, NodeTypes } from "../../models/client/WorkflowDraft";
import ActivityRepository from "../../repositories/Activity";
import sendNextQueue from "../../utils/sendNextQueue";
import { IActivityStepStatus } from "../../models/client/Activity";

interface TMessage extends GenericMessage {}

const handler: QueueWrapperHandler<TMessage> = async (
  conn,
  messageQueue,
  context
) => {
  const { activity_id, activity_step_id, activity_workflow_id } = messageQueue;

  const activityRepository = new ActivityRepository(conn);

  const activity = await activityRepository.findById({ id: activity_id });

  if (!activity) {
    throw new Error("Activity not found");
  }

  const activityWorkflowIndex = activity.workflows.findIndex(
    (workflow) => workflow._id.toString() === activity_workflow_id
  );

  if (activityWorkflowIndex === -1) {
    throw new Error("Workflow not found");
  }

  const activityWorkflow = activity.workflows[activityWorkflowIndex];

  const {
    workflow_draft: { steps },
  } = activityWorkflow;

  const activityStepIndex = activityWorkflow.steps.findIndex(
    (step) => step._id.toString() === activity_step_id
  );

  if (activityStepIndex === -1) {
    throw new Error("Step not found");
  }

  const activityStep = activityWorkflow.steps[activityStepIndex];

  const stepIndex = steps.findIndex(
    (step) => step._id.toString() === activityStep.step.toString()
  );

  if (stepIndex === -1) {
    throw new Error("Step not found");
  }

  const step = steps[stepIndex];

  try {
    const { data } = step as { data: IDelay };

    if (!data) {
      throw new Error("Data not found");
    }

    const { time_value, time_unit } = data;

    let delay = 0;

    switch (time_unit) {
      case "seconds":
        delay = time_value * 1000;
        break;
      case "minutes":
        delay = time_value * 60 * 1000;
        break;
      case "hours":
        delay = time_value * 60 * 60 * 1000;
        break;
      case "days":
        delay = time_value * 24 * 60 * 60 * 1000;
        break;
      default:
        delay = 0;
        break;
    }

    await sendNextQueue({
      conn,
      activity,
      context,
      delay,
    });

    activityStep.status = IActivityStepStatus.finished;

    await activity.save();
  } catch (err) {
    console.error(err.message);
    if (!step.next["alternative-source"]) {
      throw err;
    }

    await sendNextQueue({
      conn,
      activity,
      context,
      path: "alternative-source",
    });

    activityStep.status = IActivityStepStatus.error;
    activityStep.data = {
      ...(activityStep.data || {}),
      error: err.message,
    };

    await activity.save();
  }
};

export default new QueueWrapper<TMessage>(handler).configure({
  name: "Delay",
  options: {
    queueName: NodeTypes.Delay,
  },
});

