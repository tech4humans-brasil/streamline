import { NodeTypes } from "@interfaces/WorkflowDraft";
import { z } from "zod";

type NodeSchemas = {
  [K in NodeTypes]: z.ZodType;
};

const schemas: NodeSchemas = {
  [NodeTypes.SendEmail]: z.object({
    name: z.string().min(3, { message: "Nome é obrigatório" }),
    email_id: z.string().min(3, { message: "Selecione um template de email" }),
    sender: z.string().email().optional().nullable(),
    to: z
      .array(z.string())
      .min(1, { message: "Selecione pelo menos 1 destinatario" }),
    visible: z.boolean().default(true),
  }),
  [NodeTypes.ChangeStatus]: z.object({
    name: z.string().min(3, { message: "Nome é obrigatório" }),
    status_id: z.string().min(3, { message: "Selecione um status" }),
    visible: z.boolean().default(true),
  }),
  [NodeTypes.Circle]: z.object({
    visible: z.boolean().default(false),
  }),
  [NodeTypes.SwapWorkflow]: z.object({
    name: z.string().min(3, { message: "Nome é obrigatório" }),
    workflow_id: z.string().min(3, { message: "Selecione um workflow" }),
    visible: z.boolean().default(false),
  }),
  [NodeTypes.Interaction]: z.object({
    name: z.string().min(3, { message: "Nome é obrigatório" }),
    to: z
      .array(z.string())
      .min(1, { message: "Selecione pelo menos 1 destinatario" }),
    form_id: z.string().min(1, { message: "Selecione um formulário" }),
    visible: z.boolean().default(true),
    waitForOne: z.boolean().default(false),
    conditional: z.array(
      z
        .object({
          field: z.string().min(1, { message: "Selecione um campo" }),
          value: z.string(),
          operator: z.enum([
            "eq",
            "ne",
            "gt",
            "lt",
            "gte",
            "lte",
            "in",
            "notIn",
            "isNull",
            "isNotNull",
          ]),
        })
        .refine(
          (data) => {
            if (data.operator === "isNull" || data.operator === "isNotNull") {
              return true;
            }

            return !!data.value && data.value?.length > 1;
          },
          { message: "Valor é obrigatório", path: ["value"] }
        )
    ),
  }),
  [NodeTypes.WebRequest]: z.object({
    name: z.string().min(3, { message: "Nome é obrigatório" }),
    url: z.string().min(3, { message: "URL é obrigatório" }),
    method: z.enum(["GET", "POST", "PUT", "DELETE"]),
    headers: z.array(
      z.object({
        key: z.string().min(3, { message: "Chave é obrigatória" }),
        value: z.string().min(3, { message: "Valor é obrigatório" }),
      })
    ),
    is_async: z.boolean().default(false),
    body: z
      .string()
      .default("{}")
      .refine(
        (data) => {
          try {
            JSON.parse(data);
            return true;
          } catch (e) {
            return false;
          }
        },
        { message: "Body deve ser um JSON válido" }
      ),
    visible: z.boolean().default(false),
    field_populate: z.array(
      z.object({
        key: z.string().min(3, { message: "ID é obrigatório" }),
        value: z.string().min(3, { message: "Caminho é obrigatório" }),
      })
    ),
  }),
  [NodeTypes.Conditional]: z.object({
    name: z.string().min(3, { message: "Nome é obrigatório" }),
    form_id: z.string().min(3, { message: "Selecione um formulário" }),
    conditional: z
      .array(
        z
          .object({
            field: z.string().min(1, { message: "Selecione um campo" }),
            value: z.string(),
            operator: z.enum([
              "eq",
              "ne",
              "gt",
              "lt",
              "gte",
              "lte",
              "in",
              "notIn",
              "isNull",
              "isNotNull",
            ]),
          })
          .refine(
            (data) => {
              if (data.operator === "isNull" || data.operator === "isNotNull") {
                return true;
              }

              return !!data.value && data.value?.length > 1;
            },
            { message: "Valor é obrigatório", path: ["value"] }
          )
      )
      .length(1, { message: "Adicione pelo menos uma condição" }),
    visible: z.boolean().default(true),
    ifNotExists: z.string().optional(),
  }),
};

export type SchemaTypes = keyof typeof schemas;

export type BlockFormInputs = {
  [K in SchemaTypes]: z.infer<(typeof schemas)[K]>;
}[SchemaTypes];

export default schemas;

export const validateNode = (type: NodeTypes, data: BlockFormInputs) => {
  const schema = schemas[type];

  return schema.safeParse(data).success;
};

export const workflowSchema = z.object({
  edges: z.array(
    z.object({
      id: z.string(),
      source: z.string(),
      target: z.string(),
      sourceHandle: z.enum(["default-source", "alternative-source"]),
    })
  ),
  nodes: z.array(
    z.object({
      id: z.string(),
      type: z
        .enum([
          "send_email",
          "change_status",
          "circle",
          "swap_workflow",
          "interaction",
          "conditional",
          "web_request",
        ])
        .optional(),
      data: z.union([
        schemas[NodeTypes.SendEmail],
        schemas[NodeTypes.ChangeStatus],
        schemas[NodeTypes.Circle],
        schemas[NodeTypes.SwapWorkflow],
        schemas[NodeTypes.Interaction],
        schemas[NodeTypes.Conditional],
      ]),
      position: z.object({ x: z.number(), y: z.number() }),
      deletable: z.boolean().optional(),
    })
  ),
});

export type WorkflowFormInputs = z.infer<typeof workflowSchema>;
