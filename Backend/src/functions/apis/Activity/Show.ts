import Http, { HttpHandler } from "../../../middlewares/http";
import res from "../../../utils/apiResponse";
import ActivityRepository from "../../../repositories/Activity";
import { FieldTypes } from "../../../models/client/FormDraft";
import BlobUploader from "../../../services/upload";
import { IUserRoles } from "../../../models/client/User";
import { NodeTypes } from "../../../models/client/WorkflowDraft";

const handler: HttpHandler = async (conn, req) => {
  const { id } = req.params as { id: string };
  const activityRepository = new ActivityRepository(conn);

  const isAdmin = req.user.roles.includes(IUserRoles.admin);
  const isExternalUser = req.user.roles.includes(IUserRoles.external);

  const activity = await activityRepository.findById({
    id,
  });

  if (!activity) {
    return res.notFound("Activity not found");
  }

  const blobUploader = new BlobUploader(req.user.id);

  // Processa campos do formulário
  for (const field of activity.form_draft.fields) {
    if (field.type === FieldTypes.File) {
      if (!field.value) continue;
      await blobUploader.updateSas(field.value);
    }

    // Regra de visibilidade: Admin sempre vê todos os campos, outros usuários seguem a regra de visibilidade
    if (!isAdmin && !field.visible && field.value && typeof field.value === "string") {
      field.value = field.value.replace(/.(?=.{2,}$)/g, "*");
    }
  }

  // Processa interações
  for (const interactions of activity.interactions) {
    for (const answers of interactions.answers) {
      if (!answers.data) {
        continue;
      }
      for (const field of answers.data.fields) {
        if (field.type === FieldTypes.File) {
          if (!field.value) continue;
          await blobUploader.updateSas(field.value);
        }
      }
    }
  }

  // Processa workflows
  if (activity.workflows?.length) {
    for (const workflow of activity.workflows) {
      for (const step of workflow.workflow_draft.steps) {
        if (step.data) {
          // @ts-ignore0
          step.data = {
            name: step.data.name ?? "Start",
            visible: step.data.visible,
          };
        }
      }
      if (isExternalUser) {
        workflow.workflow_draft.steps = workflow.workflow_draft.steps.filter((step) => {
          if (step.type === NodeTypes.ChangeStatus) {
            return true;
          }

          if (step.type === NodeTypes.Interaction) {
            const interaction = activity.interactions.find(
              (interaction) => interaction.activity_step_id === step._id
            );
            return interaction?.answers.some(
              (answer) => String(answer.user) === req.user.id
            ) || false;
          }

          return false;
        });
      } else if (!isAdmin) {
        workflow.workflow_draft.steps = workflow.workflow_draft.steps.filter(
          (step) => step.data?.visible
        );
      }
    }
  }

  return res.success(activity);
};

export default new Http(handler)
  .setSchemaValidator((schema) => ({
    params: schema.object({
      id: schema.string().required(),
    }),
  }))
  .configure({
    name: "ActivityShow",
    permission: "activity.read",
    options: {
      methods: ["GET"],
      route: "activity/{id}",
    },
  });
