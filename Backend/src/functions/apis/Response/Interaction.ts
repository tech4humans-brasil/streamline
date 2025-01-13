import Http, { HttpHandler } from "../../../middlewares/http";
import res from "../../../utils/apiResponse";
import { IActivityStepStatus } from "../../../models/client/Activity";
import { IFormType } from "../../../models/client/Form";
import { ObjectId } from "mongoose";
import {
  extraOutputsInteractionProcess,
  sendToQueue,
} from "../../../utils/sbusOutputs";
import FormRepository from "../../../repositories/Form";
import FormDraftRepository from "../../../repositories/FormDraft";
import ActivityRepository from "../../../repositories/Activity";
import UserRepository from "../../../repositories/User";
import BlobUploader from "../../../services/upload";
import AnswerRepository from "../../../repositories/Answer";
import ResponseUseCases from "../../../use-cases/Response";
import InteractionHelper from "../../../use-cases/InteractionHelper";

interface File {
  name: string;
  mimeType: string;
  base64: string;
}

interface IUser {
  _id?: ObjectId;
  name: string;
  email: string;
}

type DtoCreated = {} & {
  [key: string]: File | string | Array<string> | IUser | Array<IUser>;
};

const handler: HttpHandler = async (conn, req, context) => {
  const rest = req.body as DtoCreated;

  const formRepository = new FormRepository(conn);
  const formDraftRepository = new FormDraftRepository(conn);
  const activityRepository = new ActivityRepository(conn);
  const userRepository = new UserRepository(conn);

  const form = (
    await formRepository.findOpenForms({
      where: {
        _id: req.params.form_id,
        type: IFormType.Interaction,
      },
    })
  )[0];

  if (!form) {
    return res.notFound("Form not found");
  }

  const formDraft = await formDraftRepository.findById({ id: form.published });

  if (!formDraft) {
    return res.notFound("Form draft not found");
  }

  const activity = await activityRepository.findById({
    id: req.params.activity_id,
  });

  if (!activity) {
    return res.notFound("Activity not found");
  }

  const responseUseCases = new ResponseUseCases(
    formDraft,
    new BlobUploader(req.user.id),
    userRepository
  );

  await responseUseCases.processFormFields(rest).catch((err) => {
    return res.badRequest(err);
  });

  const activeInteraction = activity.interactions.findIndex(
    (interaction) => !interaction.finished
  );

  if (activeInteraction === -1) {
    return res.badRequest("No active interaction");
  }

  const interaction = activity.interactions[activeInteraction];

  const myAnswer = interaction.answers.findIndex(
    (answer) => String(answer.user._id) === String(req.user.id)
  );

  if (myAnswer === -1) {
    return res.badRequest("You already answered this interaction");
  }

  interaction.answers[myAnswer].data = formDraft.toObject();
  interaction.answers[myAnswer].status = IActivityStepStatus.finished;

  InteractionHelper.processInteractionAnswers(
    interaction,
    activity,
    context,
    conn
  );

  const answerRepository = new AnswerRepository(conn);

  await answerRepository.updateMany({
    where: {
      form: form._id,
      user: req.user.id,
    },
    data: {
      submitted: true,
    },
  });

  activity.save();

  return res.created(activity);
};

export default new Http(handler)
  .setSchemaValidator((schema) => ({
    params: schema.object().shape({
      form_id: schema.string().required(),
      activity_id: schema.string().required(),
    }),
    body: schema.object().shape({}),
  }))
  .configure({
    name: "ResponseInteraction",
    permission: "response.create",
    options: {
      methods: ["POST"],
      route: "response/{form_id}/interaction/{activity_id}",
      extraOutputs: [extraOutputsInteractionProcess],
    },
  });
