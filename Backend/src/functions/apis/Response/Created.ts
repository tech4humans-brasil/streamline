import Http, { HttpHandler } from "../../../middlewares/http";
import res from "../../../utils/apiResponse";
import { IFormType } from "../../../models/client/Form";
import Status from "../../../models/client/Status";
import { ObjectId } from "mongoose";
import FormRepository from "../../../repositories/Form";
import FormDraftRepository from "../../../repositories/FormDraft";
import UserRepository from "../../../repositories/User";
import ActivityRepository from "../../../repositories/Activity";
import BlobUploader from "../../../services/upload";
import AnswerRepository from "../../../repositories/Answer";
import ResponseUseCases from "../../../use-cases/Response";
import { IActivityStepStatus } from "../../../models/client/Activity";
import sendNextQueue from "../../../utils/sendNextQueue";
import sbusOutputs from "../../../utils/sbusOutputs";
import WorkflowDraftRepository from "../../../repositories/WorkflowDraft";
import WorkflowRepository from "../../../repositories/Workflow";
import { sendEmail } from "../../../services/email";
import emailTemplate from "../../../utils/emailTemplate";
import Holiday from "../../../services/holliday";

interface IUser {
  _id: ObjectId;
  name: string;
  email: string;
}

type DtoCreated = {
  description: string; // "description"
} & {
  [key: string]: File | string | Array<string> | IUser | Array<IUser>;
};

export const handler: HttpHandler = async (conn, req, context) => {
  const rest = req.body as DtoCreated;
  const { description } = rest;

  const formRepository = new FormRepository(conn);
  const formDraftRepository = new FormDraftRepository(conn);
  const userRepository = new UserRepository(conn);
  const activityRepository = new ActivityRepository(conn);
  const workflowRepository = new WorkflowRepository(conn);
  const workflowDraftRepository = new WorkflowDraftRepository(conn);

  const form = (
    await formRepository.findOpenForms({
      where: {
        _id: req.params.form_id,
        type: IFormType.Created,
      },
      institutes: !!req.user.institutes
        ? req.user.institutes?.map((institute) => institute._id)
        : undefined,
    })
  )[0];

  if (!form) {
    return res.notFound("Form not found");
  }

  const [workflow, formDraft] = await Promise.all([
    workflowRepository.findById({ id: form.workflow }),
    formDraftRepository.findById({ id: form.published }),
  ]);

  if (!workflow) {
    return res.notFound("Workflow not found");
  }

  if (!formDraft) {
    return res.notFound("Form draft not found");
  }

  const responseUseCases = new ResponseUseCases(
    formDraft,
    new BlobUploader(req.user.id),
    userRepository
  );

  await responseUseCases.processFormFields(rest);

  const statusPromise = await new Status(conn)
    .model()
    .findById(form.initial_status);

  const userPromise = await userRepository.findById({
    id: req.user.id,
    select: {
      _id: 1,
      name: 1,
      email: 1,
      matriculation: 1,
      institutes: 1,
    },
  });

  const [status, user] = await Promise.all([statusPromise, userPromise]).catch(
    (error) => {
      console.error("Error creating response", error);
      throw new Error(error);
    }
  );

  const activity = await activityRepository.create({
    name: form.name,
    description,
    form: String(form._id),
    status: status.toObject(),
    users: [user.toObject()],
    form_draft: formDraft.toObject(),
    parent: req.params.parent_id ?? null,
    automatic: !!req.params.automatic,
  });

  console.log("Activity", activity);

  if (form.sla) {
    const slaCalculator = new Holiday();

    const dueDate = await slaCalculator.calculateDueDate(new Date(), form.sla);

    activity.due_date = dueDate;
  }

  const answerRepository = new AnswerRepository(conn);

  const answers = answerRepository.updateMany({
    where: {
      form: form._id,
      user: req.user.id,
      submitted: false,
    },
    data: {
      activity: activity._id,
      submitted: true,
    },
  });

  const workflowDraft = await workflowDraftRepository.findById({
    id: workflow.published,
    select: { steps: 1 },
  });

  const firstStep = workflowDraft.steps.find((step) => step.id === "start");

  if (!firstStep) {
    return res.error(400, {}, "Invalid workflow");
  }

  activity.workflows.push({
    workflow_draft: workflowDraft,
    steps: [
      {
        step: firstStep._id,
        status: IActivityStepStatus.inProgress,
      },
    ],
  });

  await sendNextQueue({
    conn,
    context,
    activity,
  }).catch((error) => {
    console.error("Error sending to queue", error);
    activity.deleteOne();
    throw new Error(error);
  });

  activity.workflows[0].steps[0].status = IActivityStepStatus.finished;

  await activity.save();

  const content = `
    <p>Olá, ${user.name}!</p>
    <p>Seu ticket foi criada com sucesso.</p>
    <p>Protocolo: ${activity.protocol}</p>
    <p>Descrição: ${activity.description}</p>
    <div class="button-container">
      <a class="button" href="${process.env.FRONTEND_URL}/portal/activity/${activity._id}">Acessar o ticket</a>
    </div>
`;

  const { html, css } = await emailTemplate({
    content,
    slug: conn.name,
  });

  await sendEmail(
    user.email,
    `[${activity.protocol}] - Seu ticket foi criado com sucesso!`,
    html,
    css
  );

  await answers;

  return res.created(activity);
};

export default new Http(handler)
  .setSchemaValidator((schema) => ({
    params: schema.object().shape({
      form_id: schema.string().required(),
    }),
    body: schema.object().shape({
      description: schema.string().required().min(3),
    }),
  }))
  .configure({
    name: "ResponseCreated",
    permission: "response.create",
    options: {
      methods: ["POST"],
      route: "response/{form_id}/created/{parent_id?}/{automatic?}",
      extraOutputs: sbusOutputs,
    },
  });
