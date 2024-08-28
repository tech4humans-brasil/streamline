import Http, { HttpHandler } from "../../../middlewares/http";
import WorkflowDraftRepository from "../../../repositories/WorkflowDraft";
import res from "../../../utils/apiResponse";

interface Query {
  page?: number;
  limit?: number;
}

const handler: HttpHandler = async (conn, req, context) => {
  const { id } = req.params;
  const workflowDraftRepository = new WorkflowDraftRepository(conn);

  const workflows = await workflowDraftRepository.find({
    populate: [
      {
        path: "owner",
        select: {
          _id: 1,
          name: 1,
        },
      },
    ],
    where: {
      parent: id,
    },
    select: {
      _id: 1,
      version: 1,
      status: 1,
      createdAt: 1,
    },
    sort: {
      version: -1,
    },
  });

  return res.success({
    workflows,
  });
};

export default new Http(handler)
  .setSchemaValidator((schema) => ({
    query: schema
      .object({
        page: schema
          .number()
          .optional()
          .transform((v) => Number(v))
          .default(1)
          .min(1),
        limit: schema
          .number()
          .optional()
          .transform((v) => Number(v)),
      })
      .optional(),
  }))
  .configure({
    name: "WorkflowsList",
    permission: "workflowDraft.read",
    options: {
      methods: ["GET"],
      route: "workflow-drafts/{id}",
    },
  });
