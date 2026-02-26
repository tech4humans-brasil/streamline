import Http, { HttpHandler } from "../../../middlewares/http";
import res from "../../../utils/apiResponse";
import ActivityRepository from "../../../repositories/Activity";
import { FieldTypes } from "../../../models/client/FormDraft";
import BlobUploader from "../../../services/upload";
import { IUserRoles } from "../../../models/client/User";
import { NodeTypes } from "../../../models/client/WorkflowDraft";

const handler: HttpHandler = async (conn, req) => {
  const { protocol } = req.params as { protocol: string };
  const activityRepository = new ActivityRepository(conn);

  const activity = await activityRepository.findOne({
    where: { protocol: protocol.trim() },
  });

  if (!activity) {
    return res.notFound("Activity not found for this protocol");
  }

  const isAdmin = req.user.roles.includes(IUserRoles.admin);
  const isExternalUser = req.user.roles.includes(IUserRoles.external);

  const sasCache = new Map<string, Promise<any>>();
  const blobUploader = new BlobUploader(req.user.id);

  const getSasToken = (fileObj: any) => {
    if (!fileObj || !fileObj.url) return Promise.resolve(fileObj);

    if (!sasCache.has(fileObj.url)) {
      const promise = blobUploader.updateSas(fileObj).then((r) => r);
      sasCache.set(fileObj.url, promise);
    }
    return sasCache.get(fileObj.url);
  };

  const mainUserPhotoPromise = (async () => {
    if (activity?.users[0]?.photo_url) {
      activity.users[0].photo_url = await getSasToken(activity.users[0].photo_url);
    }
  })();

  const formFieldsPromise = Promise.all(
    activity.form_draft.fields.map(async (field) => {
      if (field.type === FieldTypes.File && field.value) {
        field.value = await getSasToken(field.value);
      }

      if (
        !isAdmin &&
        !field.visible &&
        field.value &&
        typeof field.value === "string"
      ) {
        field.value = field.value.replace(/.(?=.{2,}$)/g, "*");
      }
    })
  );

  const interactionsPromise = Promise.all(
    activity.interactions.map(async (interaction) => {
      await Promise.all(
        interaction.answers.map(async (answer) => {
          if (!answer.data) return;

          await Promise.all(
            answer.data.fields.map(async (field) => {
              if (field.type === FieldTypes.File && field.value) {
                field.value = await getSasToken(field.value);
              }
            })
          );
        })
      );
    })
  );

  const commentsPromise = Promise.all(
    activity.comments.map(async (comment) => {
      if (comment.user.photo_url) {
        comment.user.photo_url = await getSasToken(comment.user.photo_url);
      }
    })
  );

  let userInteractionSteps: Set<string> | null = null;

  if (isExternalUser && activity.workflows?.length) {
    userInteractionSteps = new Set();
    activity.interactions.forEach((interaction) => {
      const hasAnswered = interaction.answers.some(
        (a) => String(a.user) === req.user.id
      );
      if (hasAnswered && interaction.activity_step_id) {
        userInteractionSteps!.add(interaction.activity_step_id.toString());
      }
    });
  }

  const workflowsProcessing = () => {
    if (!activity.workflows?.length) return;

    for (const workflow of activity.workflows) {
      workflow.workflow_draft.steps.forEach((step) => {
        if (step.data) {
          (step.data as any) = {
            name: step.data.name,
            visible: step.data.visible,
          };
        }
      });

      if (isExternalUser) {
        workflow.workflow_draft.steps =
          workflow.workflow_draft.steps.filter((step) => {
            if (step.type === NodeTypes.ChangeStatus) return true;

            if (step.type === NodeTypes.Interaction) {
              return userInteractionSteps?.has(
                step._id?.toString() ?? ""
              ) ?? false;
            }
            return false;
          });
      } else if (!isAdmin) {
        workflow.workflow_draft.steps = workflow.workflow_draft.steps.filter(
          (step) => step.data?.visible
        );
      }
    }
  };

  await Promise.all([
    mainUserPhotoPromise,
    formFieldsPromise,
    interactionsPromise,
    commentsPromise,
    Promise.resolve(workflowsProcessing()),
  ]);

  return res.success(activity);
};

export default new Http(handler)
  .setSchemaValidator((schema) => ({
    params: schema.object({
      protocol: schema.string().required(),
    }),
  }))
  .configure({
    name: "ActivityShowByProtocol",
    permission: "activity.read",
    options: {
      methods: ["GET"],
      route: "activity/by-protocol/{protocol}",
    },
  });
