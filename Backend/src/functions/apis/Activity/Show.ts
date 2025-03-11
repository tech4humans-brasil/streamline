import Http, { HttpHandler } from "../../../middlewares/http";
import res from "../../../utils/apiResponse";
import ActivityRepository from "../../../repositories/Activity";
import { FieldTypes } from "../../../models/client/FormDraft";
import BlobUploader from "../../../services/upload";

const handler: HttpHandler = async (conn, req) => {
  const { id } = req.params as { id: string };
  const activityRepository = new ActivityRepository(conn);

  const activity = await activityRepository.findById({
    id,
  });

  if (!activity) {
    return res.notFound("Activity not found");
  }

  const blobUploader = new BlobUploader(req.user.id);

  for (const field of activity.form_draft.fields) {
    if (field.type === FieldTypes.File) {
      if (!field.value) continue;
      await blobUploader.updateSas(field.value);
    }

    if (!field.visible && field.value && typeof field.value === "string") {
      field.value = field.value.replace(/.(?=.{2,}$)/g, "*");
    }
  }

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

  if (activity.workflows?.length) {
    for (const workflow of activity.workflows) {
      for (const step of workflow.workflow_draft.steps) {
        if (step.data) {
          // @ts-ignore0
          step.data = {
            name: step.data.name,
            visible: step.data.visible,
          };
        }
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
