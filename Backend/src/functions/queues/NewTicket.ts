import QueueWrapper, {
  GenericMessage,
  QueueWrapperHandler,
} from "../../middlewares/queue";
import { INewTicket, NodeTypes } from "../../models/client/WorkflowDraft";
import ActivityRepository from "../../repositories/Activity";
import { handler as NewTicket } from "../apis/Response/Created";
import sendNextQueue from "../../utils/sendNextQueue";
import { IUserRoles } from "../../models/client/User";
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

    const { data } = step as { data: INewTicket };

    if (!data) {
      throw new Error("Data not found");
    }

    const { form_id, fields } = data;

    const activityObj = activity.toObject();

    const body: { [key: string]: any } = {};

    for (const [key, value] of Object.entries(fields)) {
      body[key] = await replaceSmartValues({
        conn,
        activity_id: activityObj,
        replaceValues: value,
      });
    }
    console.log("body", body);

    const newActivity = await NewTicket(
      conn,
      {
        body: {
          ...body,
        },
        params: {
          form_id,
          parent_id: activity_id.toString(),
          automatic: "true",
        },
        query: undefined,
        headers: {},
        method: "POST",
        url: "",
        user: {
          ...activity.users[0],
          id: activity.users[0]._id.toString(),
          slug: conn.name,
          roles: IUserRoles.student,
          permissions: [],
          matriculation: activity.users[0].matriculation || "",
          institutes: null,
        },
        bodyUsed: false,
      },
      context
    ).catch((err) => {
      throw err;
    });

    if (!newActivity || newActivity.status !== 201) {
      throw new Error(
        "Error creating new ticket" + newActivity?.body?.valueOf()
      );
    }

    const newActivityObj = JSON.parse(newActivity.body?.toString()) as {
      data: { _id: string };
    };

    activityStep.data = {
      ...activityStep.data,
      new_ticket: newActivityObj.data._id,
    };

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
  name: "WorkNewTicket",
  options: {
    queueName: NodeTypes.NewTicket,
  },
});
