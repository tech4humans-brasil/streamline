import Http, { HttpHandler } from "../../../middlewares/http";
import res from "../../../utils/apiResponse";
import { IForm, IFormType } from "../../../models/client/Form";
import moment from "moment";
import FormRepository from "../../../repositories/Form";

const handler: HttpHandler = async (conn, req) => {
  const { id } = req.params;
  const { period, ...formData } = req.body as IForm;

  const formRepository = new FormRepository(conn);

  const isSlugExists = await formRepository.findOne({
    select: { slug: 1 },
    where: { slug: formData.slug, _id: { $ne: id } },
  });

  if (isSlugExists) {
    return res.badRequest("Slug already exists");
  }

  const form = await formRepository.findByIdAndUpdate({
    id,
    data: {
      ...formData,
      period: {
        open: period.open ? moment.utc(period.open).toDate() : null,
        close: period.close ? moment.utc(period.close).toDate() : null,
      },
    },
  });

  form.save();

  return res.created(form);
};

export default new Http(handler)
  .setSchemaValidator((schema) => ({
    params: schema.object({
      id: schema.string().required(),
    }),
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
      type: schema
        .string()
        .required()
        .oneOf(Object.values(IFormType)),
      sla: schema.number().nullable().default(null),
      initial_status: schema.string().when("type", ([type], schema) => {
        if (type === "created") {
          return schema.required();
        }
        return schema.nullable().default(null);
      }),
      period: schema.object().shape({
        open: schema.date().required().nullable(),
        close: schema.date().required().nullable(),
      }),
      active: schema.boolean().required().default(true),
      workflow: schema.string().when("type", ([type], schema) => {
        if (type === "created") {
          return schema.required();
        }
        return schema.nullable().default(null);
      }),
      description: schema.string().optional().nullable().default(""),
      published: schema.string().optional().nullable().default(null),
      institute: schema
        .array(schema.string())
        .optional()
        .nullable()
        .default([]),
      visibilities: schema
        .array(schema.string())
        .optional()
        .nullable()
        .default([]),
    }),
  }))
  .configure({
    name: "FormUpdate",
    permission: "form.update",
    options: {
      methods: ["PUT"],
      route: "form/{id}",
    },
  });
