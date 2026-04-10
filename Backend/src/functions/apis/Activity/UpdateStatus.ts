import Http, { HttpHandler } from "../../../middlewares/http";
import res from "../../../utils/apiResponse";
import ActivityRepository from "../../../repositories/Activity";
import StatusRepository from "../../../repositories/Status";
import { StatusType } from "../../../models/client/Status";
import { IActivityState } from "../../../models/client/Activity";
import { IUserRoles } from "../../../models/client/User";
import {
  emailsForStatusChangeNotification,
  sendActivityStatusChangeEmail,
} from "../../../utils/activityNotificationEmails";

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

  const isClosingWithDone = statusDoc.type === StatusType.DONE;

  if (isClosingWithDone) {
    if (activity.finished_at) {
      return res.conflict("Activity already closed");
    }
    const isAdmin = req.user.roles.includes(IUserRoles.admin);
    const requester = activity.users?.[0] as { _id?: unknown } | undefined;
    const isRequester =
      requester != null &&
      requester._id != null &&
      String(requester._id) === String(req.user.id);
    if (!isAdmin && !isRequester) {
      return res.forbidden(
        "Only admins or the ticket requester can set a done status"
      );
    }
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
    content: isClosingWithDone
      ? `O ticket foi encerrado com o status "${statusDoc.name}"${previousName && statusChanged ? ` (antes: ${previousName})` : ""
      }`
      : `O status foi alterado para ${statusDoc.name}${previousName && statusChanged ? ` (antes: ${previousName})` : ""
      }`,
    isSystem: true,
  };

  const $set: Record<string, unknown> = { status: newStatus };
  if (isClosingWithDone) {
    $set.finished_at = new Date();
    $set.state = IActivityState.finished;
  }

  const updatePayload: Record<string, unknown> = {
    $set,
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

  if (statusChanged) {
    await sendActivityStatusChangeEmail({
      slug: conn.name,
      activityId: id,
      protocol: updated.protocol,
      activityName: updated.name,
      previousStatusName: previousName,
      newStatusName: statusDoc.name,
      primaryUserName: activity.users?.[0]?.name,
      recipients: emailsForStatusChangeNotification(
        activity.users,
        activity.assignee
      ),
    });
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
