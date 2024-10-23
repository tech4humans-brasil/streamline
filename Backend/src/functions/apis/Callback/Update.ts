import Http, { HttpHandler } from "../../../middlewares/http";
import AdminClient from "../../../models/admin/Client";
import { IActivityStepStatus } from "../../../models/client/Activity";
import { CallbackStatus } from "../../../models/client/Callback";
import { IWebRequest } from "../../../models/client/WorkflowDraft";
import ActivityRepository from "../../../repositories/Activity";
import CallbackRepository from "../../../repositories/Callback";
import WorkflowRepository from "../../../repositories/Workflow";
import WorkflowDraftRepository from "../../../repositories/WorkflowDraft";
import { connectAdmin, connect } from "../../../services/mongo";
import res from "../../../utils/apiResponse";
import sbusOutputs from "../../../utils/sbusOutputs";
import sendNextQueue from "../../../utils/sendNextQueue";

const handler: HttpHandler = async (_, req, context) => {
  const { id, acronym } = req.params as { id: string; acronym: string };

  const adminConn = await connectAdmin();

  const client = await new AdminClient(adminConn).model().findOne({
    acronym,
  });

  if (!client) {
    return res.notFound("Acronym not found");
  }

  const conn = connect(client.acronym);

  const callbackRepository = new CallbackRepository(conn);
  const activityRepository = new ActivityRepository(conn);

  const callback = await callbackRepository.findOne({
    where: {
      _id: id,
      status: "idle",
    },
  });

  if (!callback) {
    return res.notFound("Callback not found");
  }

  const activity = await activityRepository.findById({
    id: callback.activity,
  });

  if (!activity) {
    return res.notFound("Activity not found");
  }

  const activityWorkflowIndex = activity.workflows.findIndex(
    (workflow) => workflow._id.toString() === callback.workflow.toString()
  );

  if (activityWorkflowIndex === -1) {
    throw new Error("Workflow not found");
  }

  const activityWorkflow = activity.workflows[activityWorkflowIndex];

  const {
    workflow_draft: { steps },
  } = activityWorkflow;

  const activityStepIndex = activityWorkflow.steps.findIndex(
    (step) => step._id.toString() === callback.step.toString()
  );

  if (activityStepIndex === -1) {
    throw new Error("Step not found");
  }

  const activityStep = activityWorkflow.steps[activityStepIndex];

  activityStep.status = IActivityStepStatus.inProgress;

  const stepIndex = steps.findIndex(
    (step) => step._id.toString() === activityStep.step.toString()
  );

  if (stepIndex === -1) {
    throw new Error("Step not found");
  }

  const step = steps[stepIndex];

  const { data } = step as { data: IWebRequest };

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

  const { field_populate } = data;

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
        req.body,
        field.value
      );
    }
  }

  await sendNextQueue({
    conn,
    activity,
    context,
  });

  callback.status = CallbackStatus.DONE;
  activityStep.status = IActivityStepStatus.finished;
  await callback.save();
  await activity.save();

  return res.success({
    activity,
  });
};

export default new Http(handler)
  .setSchemaValidator((schema) => ({
    params: schema.object({
      id: schema.string().required(),
      acronym: schema.string().required(),
    }),
  }))
  .setPublic()
  .configure({
    name: "WebRequestCallback",
    options: {
      methods: ["POST"],
      route: "{acronym}/web-req/{id}/callback",
      extraOutputs: sbusOutputs,
    },
  });
