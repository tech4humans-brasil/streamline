import { isValidObjectId } from "mongoose";
import Http, { HttpHandler } from "../../../middlewares/http";
import res from "../../../utils/apiResponse";
import ActivityRepository from "../../../repositories/Activity";
import { IActivityStepStatus } from "../../../models/client/Activity";
import UserRepository from "../../../repositories/User";
import { IUserRoles } from "../../../models/client/User";
import emailTemplate from "../../../utils/emailTemplate";
import { sendEmail } from "../../../services/email";

/**
 * Troca quem responde uma pendência de interação (ex.: aprovador) num ticket
 * em andamento. O ticket guarda uma cópia do fluxo da época em que foi aberto,
 * então mudar o fluxo publicado não atualiza os tickets já abertos — esta rota
 * é a correção pontual, restrita a admin.
 */
const handler: HttpHandler = async (conn, req) => {
  const { id, interactionId, answerId } = req.params as {
    id: string;
    interactionId: string;
    answerId: string;
  };

  const { userId } = req.body as { userId: string };

  if (!req.user.roles.includes(IUserRoles.admin)) {
    return res.forbidden("Only admins can replace an interaction user");
  }

  if (!isValidObjectId(userId)) {
    return res.badRequest("Invalid user id");
  }

  const activityRepository = new ActivityRepository(conn);
  const userRepository = new UserRepository(conn);

  const activity = await activityRepository.findById({ id });

  if (!activity) {
    return res.notFound("Activity not found");
  }

  const interaction = activity.interactions.id(interactionId);

  if (!interaction) {
    return res.notFound("Interaction not found");
  }

  if (interaction.finished) {
    return res.conflict("Interaction already finished");
  }

  const answer = interaction.answers.id(answerId);

  if (!answer) {
    return res.notFound("Answer not found");
  }

  if (answer.data || answer.status !== IActivityStepStatus.idle) {
    return res.conflict("Answer already sent");
  }

  if (String(answer.user._id) === userId) {
    return res.success(interaction);
  }

  const alreadyInInteraction = interaction.answers.some(
    (a) => String(a.user._id) === userId
  );

  if (alreadyInInteraction) {
    return res.conflict("User already in this interaction");
  }

  const [newUser] = await userRepository.find({
    where: { _id: userId, active: true },
    select: ["_id", "name", "email", "matriculation", "institutes"],
  });

  if (!newUser) {
    return res.notFound("User not found");
  }

  const previousUser = answer.user;

  answer.user = newUser.toObject();

  await activity.save();

  const systemComment = {
    user: {
      _id: req.user.id,
      name: req.user.name,
      email: req.user.email,
      matriculation: req.user.matriculation,
      institutes: req.user.institutes,
      photo_url: req.user.photo_url,
    },
    content: `Responsável por "${interaction.form.name}" alterado de ${previousUser.name} para ${newUser.name}`,
    isSystem: true,
  };

  await activityRepository.findByIdAndUpdate({
    id,
    data: { $push: { comments: systemComment } },
  });

  const content = `
  <p>Olá, ${newUser.name}</p>
  <p>O formulário "${interaction.form.name}" foi enviado para você.</p>
  <p>Acesse o painel para responder.</p>
  <a href="${process.env.FRONTEND_URL}/portal">Acessar o painel</a>
`;

  const { html, css } = await emailTemplate({
    slug: conn.name,
    content,
  });

  await sendEmail(
    [newUser.email],
    `[${activity.protocol}] - Você possui uma nova pendência!`,
    html,
    css
  );

  return res.success(interaction);
};

export default new Http(handler)
  .setSchemaValidator((schema) => ({
    params: schema.object({
      id: schema.string().required(),
      interactionId: schema.string().required(),
      answerId: schema.string().required(),
    }),
    body: schema.object().shape({
      userId: schema.string().required(),
    }),
  }))
  .configure({
    name: "ActivityReplaceUserInInteraction",
    permission: "activity.update",
    options: {
      methods: ["PATCH"],
      route: "activity/{id}/interaction/{interactionId}/answers/{answerId}/user",
    },
  });
