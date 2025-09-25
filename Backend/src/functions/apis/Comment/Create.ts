import Http, { HttpHandler } from "../../../middlewares/http";
import { IComment } from "../../../models/client/Activity";
import ActivityRepository from "../../../repositories/Activity";
import FormRepository from "../../../repositories/Form";
import UserRepository from "../../../repositories/User";
import { sendEmail } from "../../../services/email";
import res from "../../../utils/apiResponse";
import emailTemplate from "../../../utils/emailTemplate";

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

  const content = `
  <p>Olá!</p>
  <p>${newComment.user.name} comentou em sua atividade.</p>
  <p>Comentário: ${newComment.content}</p>
  <p>Para visualizar a atividade, acesse: 
    <a href="${process.env.FRONTEND_URL}/activity/${comment._id}">
      Visualizar atividade
    </a>
  </p>
`;

  const userRepository = new UserRepository(conn);
  const formRepository = new FormRepository(conn);

  const form = await formRepository.findById({
    id: comment.form.toString(),
  });

  const users = await userRepository.find({
    where: {
      institutes: {
        $in: form.visibilities,
      },
      active: true,
    },
    select: {
      email: 1,
      name: 1,
      matriculation: 1,
    },
  });

  const interactionUsers = comment.interactions.map((interaction) => interaction.answers.map((answer) => answer.user.email)).flat();

  const { html, css } = await emailTemplate({
    content,
    slug: conn.name,
  });

  await sendEmail(
    [...new Set([...users.map((user) => user.email), ...interactionUsers, ...comment.users.map((user) => user.email)])],
    `[${comment.protocol}] | ${req.user.name} adicionou um comentário em seu ticket`,
    html,
    css
  );

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
