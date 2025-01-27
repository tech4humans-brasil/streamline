import Http, { HttpHandler } from "../../../middlewares/http";
import res from "../../../utils/apiResponse";
import {
  IWorkflowDraft,
  IWorkflowDraftStatus,
  NodeTypes,
} from "../../../models/client/WorkflowDraft";
import WorkflowDraftRepository from "../../../repositories/WorkflowDraft";

const handler: HttpHandler = async (conn, req) => {
  const { steps, viewport } = req.body as Pick<
    IWorkflowDraft,
    "steps" | "viewport"
  >;

  const { id } = req.params;

  const workflowDraftRepository = new WorkflowDraftRepository(conn);

  const existsWorkflow = await workflowDraftRepository.findById({ id });

  if (!existsWorkflow) {
    return res.notFound("Workflow not found");
  }

  if (existsWorkflow.status === IWorkflowDraftStatus.Published) {
    return res.forbidden("Cannot update a published workflow");
  }

  const workflowDraft = await workflowDraftRepository.update({
    where: { _id: id },
    data: {
      status: IWorkflowDraftStatus.Delete,
    },
  });

  return res.created(workflowDraft);
};

export default new Http(handler)
  .setSchemaValidator((schema) => ({
    params: schema.object().shape({
      id: schema.string().required(),
    }),
  }))
  .configure({
    name: "WorkflowDraftDelete",
    permission: "workflowDraft.delete",
    options: {
      methods: ["DELETE"],
      route: "workflow-draft/{id}",
    },
  });
