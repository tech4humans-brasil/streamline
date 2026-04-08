import Http, { HttpHandler } from "../../../middlewares/http";
import res from "../../../utils/apiResponse";
import ActivityRepository from "../../../repositories/Activity";
import StatusRepository from "../../../repositories/Status";

const handler: HttpHandler = async (conn, req) => {
  const { id } = req.params as { id: string };
  const { statusId } = req.body as { statusId: string };

  const activityRepository = new ActivityRepository(conn);
  const statusRepository = new StatusRepository(conn);

  const activity = await activityRepository.findById({ id });
  if (!activity) {
    return res.notFound("Activity not found");
  }

  const statusDoc = await statusRepository.findById({ id: statusId });
  if (!statusDoc) {
    return res.notFound("Status not found");
  }

  const newStatus = statusDoc.toObject();
  const previousName = activity.status?.name;
  const prev = activity.status as { _id?: unknown; name?: string; type?: string };
  const sameStatus =
    String(prev?._id ?? "") === String(statusDoc._id) ||
    (prev?.name === statusDoc.name && prev?.type === statusDoc.type);
  const statusChanged = !sameStatus;

  const systemComment = {
    user: {
      _id: req.user.id,
      name: req.user.name,
      email: req.user.email,
      matriculation: req.user.matriculation,
      institutes: req.user.institutes,
      photo_url: req.user.photo_url,
    },
    content: `O status foi alterado para ${statusDoc.name}${
      previousName && statusChanged ? ` (antes: ${previousName})` : ""
    }`,
    isSystem: true,
  };

  const updatePayload: Record<string, unknown> = {
    $set: { status: newStatus },
  };

  if (statusChanged) {
    updatePayload.$push = { comments: systemComment };
  }

  const updated = await activityRepository.findByIdAndUpdate({
    id,
    data: updatePayload,
  });

  if (!updated) {
    return res.notFound("Activity not found");
  }

  return res.success(updated);
};

export default new Http(handler)
  .setSchemaValidator((schema) => ({
    params: schema.object({
      id: schema.string().required(),
    }),
    body: schema.object({
      statusId: schema.string().required(),
    }),
  }))
  .configure({
    name: "ActivityUpdateStatus",
    permission: "activity.update",
    options: {
      methods: ["PATCH"],
      route: "activity/{id}/status",
    },
  });
