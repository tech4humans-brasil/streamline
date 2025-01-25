import { NodeTypes } from "../models/client/WorkflowDraft";

const nodeValidator = (type: string, schema: typeof import("yup")) => {
  if (type === NodeTypes.SendEmail) {
    return schema.object().shape({
      to: schema.array().of(schema.string()).required(),
      name: schema.string().required(),
      email_id: schema.string().required(),
      visible: schema.boolean().default(true),
    });
  }
  if (type === NodeTypes.ChangeStatus) {
    return schema.object().shape({
      name: schema.string().required(),
      status_id: schema.string().required(),
      visible: schema.boolean().default(true),
    });
  }

  if (type === NodeTypes.SwapWorkflow) {
    return schema.object().shape({
      name: schema.string().required(),
      workflow_id: schema.string().required(),
      visible: schema.boolean().default(true),
    });
  }

  if (type === NodeTypes.NewTicket) {
    return schema.object().shape({
      name: schema.string().required(),
      form_id: schema.string().required(),
      visible: schema.boolean().default(true),
      fields: schema.object().required(),
    });
  }

  if (type === NodeTypes.Interaction) {
    return schema.object().shape({
      name: schema.string().required(),
      form_id: schema.string().required(),
      to: schema.array().of(schema.string()).required(),
      sender: schema.string().email().optional().nullable(),
      visible: schema.boolean().default(true),
      waitForOne: schema.boolean().optional(),
      waitType: schema.mixed().oneOf(["all", "any", "custom"]).required(),
      waitValue: schema.number().when("waitType", {
        is: "custom",
        then: (schema) =>
          schema.required('waitValue is required when waitType is "custom"'),
        otherwise: (schema) => schema.notRequired(),
      }),
      canAddParticipants: schema.boolean().default(false),
    });
  }

  if (type === NodeTypes.WebRequest) {
    return schema.object().shape({
      name: schema.string().required(),
      url: schema
        .string()
        .matches(/^((http|https):\/\/[^ "]+|\$\{\{vars\.[^}]+\}\})/),
      method: schema.string().required(),
      active: schema.boolean().default(true),
      is_async: schema.boolean().default(false),
      headers: schema
        .array()
        .of(
          schema.object().shape({
            key: schema.string().required(),
            value: schema.string().required(),
            isSecret: schema.boolean().default(false),
          })
        )
        .required(),
      body: schema.string(),
    });
  }

  if (type === NodeTypes.Script) {
    return schema.object().shape({
      name: schema.string().required(),
      script: schema.string().required(),
    });
  }
};

export default nodeValidator;
