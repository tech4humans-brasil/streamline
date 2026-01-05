import Http, { HttpHandler } from "../../../middlewares/http";
import res from "../../../utils/apiResponse";
import Status, { StatusType } from "../../../models/client/Status";
import Workflow from "../../../models/client/Workflow";
import Institute from "../../../models/client/Institute";
import FormRepository from "../../../repositories/Form";

const handler: HttpHandler = async (conn, req) => {
  const { project } = req.query as { project: string };

  const [status, workflows, institutes, categories] = await Promise.all([
    new Status(conn)
      .model()
      .find({
        type: StatusType.PROGRESS,
        project: { $in: [null, project] },
      })
      .select({ _id: 1, name: 1 })
      .lean()
      .then((docs) =>
        docs.map((s: any) => ({
          value: s._id,
          label: s.name,
        }))
      ),
    new Workflow(conn)
      .model()
      .find({
        active: true,
        published: { $exists: true },
        project,
      })
      .select({ _id: 1, name: 1 })
      .lean()
      .then((docs) =>
        docs.map((w: any) => ({
          value: w._id,
          label: w.name,
        }))
      ),
    new Institute(conn)
      .model()
      .find({ active: true })
      .select({ _id: 1, acronym: 1 })
      .lean()
      .then((docs) =>
        docs.map((i: any) => ({
          value: i._id,
          label: i.acronym,
        }))
      ),
    new FormRepository(conn).findDistinctCategories(),
  ]);

  return res.success({
    status,
    workflows,
    institutes,
    categories,
  });
};

export default new Http(handler)
  .setSchemaValidator((schema) => ({
    query: schema.object({
      project: schema.string().required(),
    }),
  }))
  .configure({
    name: "FormForms",
    permission: "form.read",
    options: {
      methods: ["GET"],
      route: "form/forms",
    },
  });
