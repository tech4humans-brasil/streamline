import QueueWrapper, {
  GenericMessage,
  QueueWrapperHandler,
} from "../../middlewares/queue";
import { IActivityStepStatus } from "../../models/client/Activity";
import { ISwapWorkflow, NodeTypes } from "../../models/client/WorkflowDraft";
import ActivityRepository from "../../repositories/Activity";
import WorkflowRepository from "../../repositories/Workflow";
import WorkflowDraftRepository from "../../repositories/WorkflowDraft";
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
    const workflowRepository = new WorkflowRepository(conn);
    const workflowDraftRepository = new WorkflowDraftRepository(conn);

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

    const { data } = step as { data: ISwapWorkflow };

    if (!data) {
      throw new Error("Data not found");
    }

    const { workflow_id } = data;

    const workflow = await workflowRepository.findById({ id: workflow_id });

    if (!workflow) {
      throw new Error("Workflow not found");
    }

    const workflowDraft = await workflowDraftRepository.findById({
      id: workflow.published,
    });

    if (!workflowDraft) {
      throw new Error("Workflow draft not found");
    }

    const firstStep = workflowDraft.steps.find((step) => step.id === "start");

    if (!firstStep) {
      throw new Error("First step not found");
    }

    activity.workflows[activityWorkflowIndex].finished = true;

    activity.workflows.push({
      workflow_draft: workflowDraft.toObject(),
      finished: false,
      steps: [
        {
          step: firstStep._id,
          status: IActivityStepStatus.inProgress,
        },
      ],
    });

    await sendNextQueue({
      conn,
      activity,
      context,
    });

    activity.workflows.at(-1).steps[0].status = IActivityStepStatus.finished;

  await activity.save();

};

export default new QueueWrapper<TMessage>(handler).configure({
  name: "WorkSwapWorkflow",
  options: {
    queueName: NodeTypes.SwapWorkflow,
  },
});
