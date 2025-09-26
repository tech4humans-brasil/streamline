import QueueWrapper, {
  GenericMessage,
  QueueWrapperHandler,
} from "../../middlewares/queue";
import { IFormDraft } from "../../models/client/FormDraft";
import { IConditional, NodeTypes } from "../../models/client/WorkflowDraft";
import ActivityRepository from "../../repositories/Activity";
import ConditionalEvaluator from "../../utils/conditionalEvaluator";
import sendNextQueue from "../../utils/sendNextQueue";

interface TMessage extends GenericMessage { }

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

  const { data } = step as { data: IConditional };

  const answers: { data: IFormDraft }[] = [];

  if (activity.form.toString() === data.form_id) {
    answers.push({ data: activity.form_draft });
  } else {
    const interaction = activity.interactions.find(
      (iteration) => iteration.form._id.toString() === data.form_id
    );

    if (interaction) {
      answers.push(
        ...interaction.answers.map((answer) => ({
          data: answer.data,
        }))
      );
    }
  }

  let path;

  if (data.conditional && answers.length) {
    const conditionals = data.conditional;

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
  name: "WorkConditional",
  options: {
    queueName: NodeTypes.Conditional,
  },
});
