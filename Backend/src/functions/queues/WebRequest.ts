import QueueWrapper, {
  GenericMessage,
  QueueWrapperHandler,
} from "../../middlewares/queue";
import { IActivityStepStatus } from "../../models/client/Activity";
import { IWebRequest, NodeTypes } from "../../models/client/WorkflowDraft";
import ActivityRepository from "../../repositories/Activity";
import ProjectRepository from "../../repositories/Project";
import WorkflowRepository from "../../repositories/Workflow";
import WorkflowDraftRepository from "../../repositories/WorkflowDraft";
import { decrypt } from "../../utils/crypto";
import replaceSmartValues from "../../utils/replaceSmartValues";
import sendNextQueue from "../../utils/sendNextQueue";
import axios from "axios";

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

    const { data } = step as { data: IWebRequest };

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

    console.log("workflow", workflow);

    const project = await projectRepository.findById({
      id: workflow.project,
      select: {
        variables: 1,
      },
    });

    const { body, field_populate, headers, method, url } = data;

    const vars = project.variables.reduce((acc, variable) => {
      acc[variable.name] =
        variable.type === "variable" ? variable.value : decrypt(variable.value);
      return acc;
    }, {});

    const bodyReplacedPromise = replaceSmartValues({
      conn,
      activity_id: activity.toObject(),
      replaceValues: body,
      vars,
    });

    const urlReplacedPromise = replaceSmartValues({
      conn,
      activity_id: activity.toObject(),
      replaceValues: url,
      vars,
    });

    const headersReplaced: { key: string; value: string }[] = [];

    for (const header of headers) {
      headersReplaced.push({
        key: header.key,
        value: await replaceSmartValues({
          conn,
          activity_id: activity.toObject(),
          replaceValues: header.value,
          vars,
        }),
      });
    }

    const [bodyReplaced, urlReplaced] = await Promise.all([
      bodyReplacedPromise,
      urlReplacedPromise,
    ]);

    context.log("bodyReplaced", bodyReplaced);
    const bodyParsed = await JSON.parse(bodyReplaced)

    const request = {
      data: bodyParsed,
      headers: headersReplaced.reduce((acc, header) => {
        acc[header.key] = header.value;
        return acc;
      }, {}),
      method,
      url: urlReplaced,
    };

    console.log(request);

    const response = await axios.request(request);

    if (response.status >= 400) {
      throw new Error(`Request failed with status code ${response.status}`);
    }

    function getValueByKey(data, key) {
      return key
        .split(".")
        .reduce(
          (obj, k) => (obj && obj[k] !== undefined ? obj[k] : undefined),
          data
        );
    }

    if (field_populate?.length) {
      for (const field of field_populate) {
        const fieldIndex = activity.form_draft.fields.findIndex(
          (form) => form.id.toString() === field.key
        );

        if (fieldIndex === -1) continue;

        activity.form_draft.fields[fieldIndex].value = getValueByKey(
          response.data,
          field.value
        );
      }
    }

    await sendNextQueue({
      conn,
      activity,
      context,
    });

    activity.workflows.at(-1).steps[0].status = IActivityStepStatus.finished;

    await activity.save();
  } catch (err) {
    console.error(err);
    throw err;
  }
};

export default new QueueWrapper<TMessage>(handler).configure({
  name: "WorkWebRequest",
  options: {
    queueName: NodeTypes.WebRequest,
  },
});
