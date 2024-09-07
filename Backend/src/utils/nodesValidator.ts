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

  if (type === NodeTypes.Interaction) {
    return schema.object().shape({
      name: schema.string().required(),
      form_id: schema.string().required(),
      to: schema.array().of(schema.string()).required(),
      visible: schema.boolean().default(true),
      waitForOne: schema.boolean().required(),
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
};

export default nodeValidator;
