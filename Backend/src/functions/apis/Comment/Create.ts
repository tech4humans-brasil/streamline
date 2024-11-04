import Http, { HttpHandler } from "../../../middlewares/http";
import { IComment } from "../../../models/client/Activity";
import ActivityRepository from "../../../repositories/Activity";
import res from "../../../utils/apiResponse";

const handler: HttpHandler = async (conn, req) => {
  const data = req.body as Pick<IComment, "content">;

  const activityRepository = new ActivityRepository(conn);

  const comment = await activityRepository.findByIdAndUpdate({
    id: req.params.id,
    data: {
      $push: {
        comments: {
          user: {
            _id: req.user.id,
            name: req.user.name,
            email: req.user.email,
            matriculation: req.user.matriculation,
            institutes: req.user.institutes,
          },
          content: data.content,
        },
      },
    },
  });

  comment.save();

  const newComment = comment.comments[comment.comments.length - 1];

  return res.created(newComment);
};

export default new Http(handler)
  .setSchemaValidator((schema) => ({
    params: schema.object().shape({
      id: schema.string().required(),
    }),
    body: schema.object().shape({
      content: schema.string().required(),
    }),
  }))
  .configure({
    name: "CommentCreate",
    permission: "comment.create",
    options: {
      methods: ["POST"],
      route: "comment/{id}",
    },
  });
