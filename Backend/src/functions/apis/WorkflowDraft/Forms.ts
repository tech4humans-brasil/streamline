import Http, { HttpHandler } from "../../../middlewares/http";
import res from "../../../utils/apiResponse";
import Email from "../../../models/client/Email";
import Status from "../../../models/client/Status";
import Workflow from "../../../models/client/Workflow";
import Form, { IFormType } from "../../../models/client/Form";
import InstituteRepository from "../../../repositories/Institute";
import UserRepository from "../../../repositories/User";
import WorkflowRepository from "../../../repositories/Workflow";

const handler: HttpHandler = async (conn, req) => {
  const { workflow } = req.query as { workflow: string };

  const workflowRepository = new WorkflowRepository(conn);

  const workflowData = await workflowRepository.findById({
    id: workflow,
    select: {
      project: 1,
    },
  });

  if (!workflowData) {
    return res.notFound("Workflow does not exist");
  }

  const project = workflowData.project;

  const getEmails = new Email(conn)
    .model()
    .find()
    .where({
      $or: [
        {
          project: { $eq: null },
        },
        {
          project,
        },
      ],
    })
    .select({
      _id: 1,
      slug: 1,
    })
    .exec();

  const getUsers = new UserRepository(conn).find({
    where: {
      active: true,
    },
    select: {
      _id: 1,
      name: 1,
    },
  });

  const getInstitutes = new InstituteRepository(conn).find({
    where: {
      active: true,
    },
  });

  const getStatuses = new Status(conn)
    .model()
    .find()
    .select({
      _id: 1,
      name: 1,
    })
    .where({
      $or: [
        {
          project: { $eq: null },
        },
        {
          project,
        },
      ],
    });

  const getWorkflows = new Workflow(conn)
    .model()
    .find({
      active: true,
      published: { $exists: true },
    })
    .select({
      _id: 1,
      name: 1,
    });

  const getFormsInteraction = new Form(conn)
    .model()
    .find({
      type: IFormType.Interaction,
      active: true,
      published: { $exists: true, $ne: null },
      $and: [
        {
          $or: [
            {
              project: { $eq: null },
            },
            {
              project,
            },
          ],
        },
      ],
    })
    .select({
      _id: 1,
      name: 1,
    });

  const getFormsCreated = new Form(conn)
    .model()
    .find({
      type: IFormType.Created,
      active: true,
      published: { $exists: true },
      $and: [
        {
          $or: [
            {
              project: { $eq: null },
            },
            {
              project,
            },
          ],
        },
      ],
    })
    .select({
      _id: 1,
      name: 1,
    });

  const [
    emailsResponse,
    usersResponse,
    institutesResponse,
    statusesResponse,
    workflowsResponse,
    formsInteractionResponse,
    formsCreatedResponse,
  ] = await Promise.all([
    getEmails,
    getUsers,
    getInstitutes,
    getStatuses,
    getWorkflows,
    getFormsInteraction,
    getFormsCreated,
  ]);

  const emails = emailsResponse.map((email) => ({
    label: email.slug,
    value: email._id,
  }));

  const userOptions = [
    {
      label: "Especiais",
      options: [
        {
          label: "Solicitante",
          value: "${{activity.#users.email}}",
        },
      ],
    },
    {
      label: "Instituições",
      options: institutesResponse.map((institute) => ({
        label: institute.name,
        value: institute._id,
      })),
    },
    {
      label: "Usuários",
      options: usersResponse.map((user) => ({
        label: user.name,
        value: user._id,
      })),
    },
  ];

  const statuses = statusesResponse.map((status) => ({
    label: status.name,
    value: status._id,
  }));

  const workflows = workflowsResponse.map((workflow) => ({
    label: workflow.name,
    value: workflow._id,
  }));

  const formsInteraction = formsInteractionResponse.map((form) => ({
    value: form._id,
    label: form.name,
  }));

  const formsCreated = formsCreatedResponse.map((form) => ({
    value: form._id,
    label: form.name,
  }));

  return res.success({
    emails,
    statuses,
    users: userOptions,
    workflows,
    forms: {
      interaction: formsInteraction,
      created: formsCreated,
    },
  });
};

export default new Http(handler)
  .configure({
    name: "WorkflowForms",
    options: {
      methods: ["GET"],
      route: "workflows-draft/forms",
    },
  })
  .setSchemaValidator((schema) => ({
    query: schema.object({
      workflow: schema.string().required(),
    }),
  }));
