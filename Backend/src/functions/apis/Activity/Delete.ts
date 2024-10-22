import Http, { HttpHandler } from "../../../middlewares/http";
import res from "../../../utils/apiResponse";
import ActivityRepository from "../../../repositories/Activity";
import { IActivityStepStatus } from "../../../models/client/Activity";

const handler: HttpHandler = async (conn, req) => {
  const { id } = req.params as { id: string };
  const activityRepository = new ActivityRepository(conn);

  const activity = await activityRepository.findById({
    id,
  });

  if (!activity) {
    return res.notFound("Activity not found");
  }

  const notFinished = activity.workflows.some((workflow) =>
    workflow.steps.some(
      (step) =>
        step.status === IActivityStepStatus.inProgress ||
        step.status === IActivityStepStatus.inQueue
    )
  );

  if (notFinished) {
    return res.badRequest("Activity is not finished");
  }

  const activityDeleted = await activityRepository.delete({
    where: {
      _id: id,
    },
  });

  return res.success(activityDeleted);
};

export default new Http(handler)
  .setSchemaValidator((schema) => ({
    params: schema.object({
      id: schema.string().required(),
    }),
  }))
  .configure({
    name: "ActivityDelete",
    permission: "activity.delete",
    options: {
      methods: ["DELETE"],
      route: "activity/{id}",
    },
  });
