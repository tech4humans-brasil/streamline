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

  if (![IFormType.External, IFormType.TimeTrigger].includes(formData.type)) {
    const isSlugExists = await formRepository.findOne({
      select: { slug: 1 },
      where: { slug: formData.slug, }
    });

    if (isSlugExists) {
      return res.badRequest("Slug already exists");
    }
  }

  const form = await formRepository.create({
    ...formData,
    slug: !formData.slug ? null : formData.slug,
    period: {
      open: period.open ? moment.utc(period.open).toDate() : null,
      close: period.close ? moment.utc(period.close).toDate() : null,
    },
  });

  if (
    formData.type === IFormType.TimeTrigger ||
    formData.type === IFormType.External
  ) {
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
      slug: schema.string().when("type", ([type], s) => {
        if (["external", "time-trigger"].includes(type)) {
          return s.nullable().default(null);
        }
        return s
          .min(3)
          .max(30)
          .matches(/^[a-z0-9-]+$/);
      }),
      type: schema.string().required().oneOf(Object.values(IFormType)),
      initial_status: schema.string().when("type", ([type], s) => {
        if (type === "created") {
          return s.required();
        }
        return s.nullable().default(null);
      }),
      sla: schema.number().nullable().default(null),
      active: schema.boolean().default(true),
      period: schema.object().shape({
        open: schema.string().optional().nullable(),
        close: schema.string().when("period.open", ([open], s) => {
          if (open) {
            return s.required();
          }
          return s.nullable().default(null);
        }),
      }),
      workflow: schema.string().when("type", ([type], s) => {
        if (type === "created") {
          return s.required();
        }
        return s.nullable().default(null);
      }),
      description: schema.string().optional().nullable().default(""),
      published: schema.string().optional().nullable().default(null),
      institute: schema.array(schema.string()).default([]),
      visibilities: schema.array(schema.string()).default([]).required(),
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
