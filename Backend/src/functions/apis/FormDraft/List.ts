import Http, { HttpHandler } from "../../../middlewares/http";
import res from "../../../utils/apiResponse";
import FormDraftRepository from "../../../repositories/FormDraft";

const handler: HttpHandler = async (conn, req) => {
  const { id } = req.params;
  const formDraftRepository = new FormDraftRepository(conn);

  const forms = await formDraftRepository.find({
    where: {
      parent: id,
    },
    select: {
      name: 1,
      status: 1,
      version: 1,
      createdAt: 1,
    },
    sort: {
      version: -1,
    },
    populate: [
      {
        path: "owner",
        select: {
          name: 1,
          _id: 1,
        },
      },
    ],
  });

  return res.success({
    forms,
  });
};

export default new Http(handler)
  .setSchemaValidator((schema) => ({
    params: schema.object({
      id: schema.string().required(),
    }),
  }))
  .configure({
    name: "FormsDraftList",
    permission: "formDraft.view",
    options: {
      methods: ["GET"],
      route: "form-drafts/{id}",
    },
  });
