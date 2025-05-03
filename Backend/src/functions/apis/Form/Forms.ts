import Http, { HttpHandler } from "../../../middlewares/http";
import res from "../../../utils/apiResponse";
import Status, { StatusType } from "../../../models/client/Status";
import Workflow from "../../../models/client/Workflow";
import Institute from "../../../models/client/Institute";

const handler: HttpHandler = async (conn, req) => {
  const { project } = req.query as { project: string };

  const status = (
    await new Status(conn).model().find().where({
      type: StatusType.PROGRESS,
    })
  ).map((s) => ({
    value: s._id,
    label: s.name,
  }));

  const workflows = (
    await new Workflow(conn)
      .model()
      .find()
      .select({
        _id: 1,
        name: 1,
      })
      .where({
        active: true,
        published: { $exists: true },
        project,
      })
  ).map((w) => ({
    value: w._id,
    label: w.name,
  }));

  const institutes = (
    await new Institute(conn)
      .model()
      .find()
      .select({
        _id: 1,
        acronym: 1,
      })
      .where({
        active: true,
      })
  ).map((w) => ({
    value: w._id,
    label: w.acronym,
  }));

  return res.success({
    status,
    workflows,
    institutes,
  });
};

export default new Http(handler)
  .setSchemaValidator((schema) => ({
    query: schema.object({
      workflow: schema.string().required(),
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
