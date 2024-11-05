import Http, { HttpHandler } from "../../../middlewares/http";
import res from "../../../utils/apiResponse";
import { ObjectId } from "mongoose";
import FormRepository from "../../../repositories/Form";
import FormDraftRepository from "../../../repositories/FormDraft";
import ResponseUseCases from "../../../use-cases/Response";
import UserRepository from "../../../repositories/User";
import BlobUploader from "../../../services/upload";
import AnswerRepository from "../../../repositories/Answer";

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
  const userRepository = new UserRepository(conn);

  const form = (
    await formRepository.findOpenForms({
      where: {
        _id: req.params.form_id,
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

  const responseUseCases = new ResponseUseCases(
    formDraft,
    new BlobUploader(req.user.id),
    userRepository
  );

  await responseUseCases.processFormFields(rest);

  const answer = formDraft.fields.reduce((acc, field) => {
    return {
      ...acc,
      [field.id]: field.value ?? undefined,
    };
  }, {});

  const answerRepository = new AnswerRepository(conn);

  const existDraft = await answerRepository.findOne({
    where: {
      user: req.user.id,
      form: String(form._id),
      submitted: false,
      activity: req.params.activity_id ?? null,
    },
  });

  if (existDraft) {
    existDraft.data = answer;

    await existDraft.save();
  } else {
    await answerRepository.create({
      user: req.user.id,
      activity: req.params.activity_id ?? null,
      form: String(form._id),
      data: answer,
    });
  }

  return res.created(answer);
};

export default new Http(handler)
  .setSchemaValidator((schema) => ({
    params: schema.object().shape({
      form_id: schema.string().required(),
      activity_id: schema.string().optional().nullable(),
    }),
    body: schema.object().shape({}),
  }))
  .configure({
    name: "AnswerDraftSave",
    permission: "answer.create",
    options: {
      methods: ["POST"],
      route: "form/{form_id}/answer/{activity_id?}",
    },
  });
