import Http, { HttpHandler } from "../../../middlewares/http";
import res from "../../../utils/apiResponse";
import ActivityRepository from "../../../repositories/Activity";
import UserRepository from "../../../repositories/User";
import { IUserChild } from "../../../models/client/Activity";

const handler: HttpHandler = async (conn, req) => {
  const { id } = req.params as { id: string };
  const body = req.body as { userId: string | null };

  const activityRepository = new ActivityRepository(conn);
  const userRepository = new UserRepository(conn);

  const activity = await activityRepository.findById({ id });
  if (!activity) {
    return res.notFound("Activity not found");
  }

  let assignee: IUserChild | null = null;
  let content: string;

  if (body.userId == null || body.userId === "") {
    assignee = null;
    content = "O ticket ficou sem responsável";
  } else {
    const userDoc = await userRepository.findById({
      id: body.userId,
      select: {
        _id: 1,
        name: 1,
        email: 1,
        matriculation: 1,
        institutes: 1,
        isExternal: 1,
        photo_url: 1,
      },
    });
    if (!userDoc) {
      return res.notFound("User not found");
    }
    assignee = userDoc.toObject() as IUserChild;
    content = `O ticket foi atribuído a ${assignee.name}`;
  }

  const previousAssigneeId = activity.assignee
    ? String((activity.assignee as IUserChild)._id)
    : null;
  const nextAssigneeId = assignee ? String(assignee._id) : null;
  const assigneeChanged = previousAssigneeId !== nextAssigneeId;

  const systemComment = {
    user: {
      _id: req.user.id,
      name: req.user.name,
      email: req.user.email,
      matriculation: req.user.matriculation,
      institutes: req.user.institutes,
      photo_url: req.user.photo_url,
    },
    content,
    isSystem: true,
  };

  const updatePayload: Record<string, unknown> = {
    $set: { assignee },
  };

  if (assigneeChanged) {
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
      userId: schema.string().nullable().optional(),
    }),
  }))
  .configure({
    name: "ActivityAssign",
    permission: "activity.update",
    options: {
      methods: ["PATCH"],
      route: "activity/{id}/assign",
    },
  });
