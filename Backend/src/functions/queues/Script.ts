import QueueWrapper, {
  GenericMessage,
  QueueWrapperHandler,
} from "../../middlewares/queue";
import { FieldTypes } from "../../models/client/FormDraft";
import { IScript, NodeTypes } from "../../models/client/WorkflowDraft";
import ActivityRepository from "../../repositories/Activity";
import ProjectRepository from "../../repositories/Project";
import WorkflowRepository from "../../repositories/Workflow";
import WorkflowDraftRepository from "../../repositories/WorkflowDraft";
import BlobUploader from "../../services/upload";
import { decrypt } from "../../utils/crypto";
import sendNextQueue from "../../utils/sendNextQueue";
import axios from "axios";
import runJavaScriptCode from "../../services/vm";

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

    const { data } = step as { data: IScript };

    if (!data) {
      throw new Error("Data not found");
    }

    const projectRepository = new ProjectRepository(conn);
    const workflowRepository = new WorkflowRepository(conn);
    const workflowDraftRepository = new WorkflowDraftRepository(conn);

    const workflowDraft = await workflowDraftRepository.findById({
      id: activityWorkflow.workflow_draft._id,
      select: {
        parent: 1,
      },
    });

    const workflow = await workflowRepository.findById({
      id: workflowDraft.parent,
      select: {
        project: 1,
      },
    });

    if (!workflow) {
      throw new Error("Workflow not found");
    }

    const project = await projectRepository.findById({
      id: workflow.project,
      select: {
        variables: 1,
      },
    });

    const { script } = data;

    const vars = project.variables.reduce((acc, variable) => {
      acc[variable.name] =
        variable.type === "variable" ? variable.value : decrypt(variable.value);
      return acc;
    }, {});

    const blobUploader = new BlobUploader("files");

    for (const field of activity.form_draft.fields) {
      if (field.type === FieldTypes.File) {
        if (!field.value) continue;
        await blobUploader.updateSas(field.value);
      }
    }

    const { result, error } = await (async () => {
      try {
        const context = {
          vars,
          activity,
          axios,
        };

        let result = await runJavaScriptCode(`(${script})()`, context, {
          timeout: 2 * 60 * 1000,
          filename: step.data.name + step._id,
        });

        return { result, error: null };
      } catch (error) {
        return { result: null, error };
      }
    })();

    if (error) {
      throw error;
    }

    console.log("Result", result);

    await activity.save();

    await sendNextQueue({
      conn,
      activity,
      context,
    });

    await activity.save();
  } catch (err) {
    console.error(err);
    throw err;
  }
};

export default new QueueWrapper<TMessage>(handler).configure({
  name: "WorkScript",
  options: {
    queueName: NodeTypes.Script,
  },
});
