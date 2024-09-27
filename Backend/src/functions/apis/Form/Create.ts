import Http, { HttpHandler } from "../../../middlewares/http";
import res from "../../../utils/apiResponse";
import moment from "moment";
import FormRepository from "../../../repositories/Form";
import { IForm, IFormType } from "../../../models/client/Form";
import FormDraftRepository from "../../../repositories/FormDraft";
import { IFormStatus } from "../../../models/client/FormDraft";

const handler: HttpHandler = async (conn, req) => {
  const { period, ...formData } = req.body as IForm;

  const formRepository = new FormRepository(conn);

  const form = await formRepository.create({
    ...formData,
    period: {
      open: period.open ? moment.utc(period.open).toDate() : null,
      close: period.close ? moment.utc(period.close).toDate() : null,
    },
  });

  if (formData.type === IFormType.TimeTrigger) {
    const formDraftRepository = new FormDraftRepository(conn);

    const formDraft = await formDraftRepository.create({
      parent: form._id,
      status: IFormStatus.Published,
      fields: [],
      owner: req.user.id,
    });

    form.published = formDraft._id;
  }

  await form.save();

  return res.created(form);
};

export default new Http(handler)
  .setSchemaValidator((schema) => ({
    body: schema.object().shape({
      name: schema.string().required().min(3).max(255),
      slug: schema
        .string()
        .required()
        .min(3)
        .max(30)
        .matches(/^[a-z0-9-]+$/),
      type: schema
        .string()
        .required()
        .oneOf(["created", "interaction", "time-trigger"]),
      initial_status: schema.string().when("type", ([type], schema) => {
        if (type === "created") {
          return schema.required();
        }
        return schema.nullable().default(null);
      }),
      active: schema.boolean().default(true),
      period: schema.object().shape({
        open: schema.string().optional().nullable(),
        close: schema.string().when("period.open", ([open], schema) => {
          if (open) {
            return schema.required();
          }
          return schema.nullable().default(null);
        }),
      }),
      workflow: schema.string().when("type", ([type], schema) => {
        if (type === "created") {
          return schema.required();
        }
        return schema.nullable().default(null);
      }),
      description: schema.string().optional().nullable().default(""),
      published: schema.string().optional().nullable().default(null),
      institute: schema.array(schema.string()).default([]),
      visibilities: schema.array(schema.string()).default([]),
    }),
  }))
  .configure({
    name: "FormCreate",
    permission: "form.create",
    options: {
      methods: ["POST"],
      route: "form",
    },
  });
