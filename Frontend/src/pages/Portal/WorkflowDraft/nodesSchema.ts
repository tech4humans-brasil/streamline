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
  [NodeTypes.Interaction]: z
    .object({
      name: z.string().min(3, { message: "Nome é obrigatório" }),
      to: z.array(z.string()),
      canAddParticipants: z.boolean().default(false),
      permissionAddParticipants: z.array(z.string()).default([]),
      form_id: z.string().min(1, { message: "Selecione um formulário" }),
      visible: z.boolean().default(true),
      waitType: z.enum(["all", "any", "custom"]),
      waitValue: z.number().optional().nullable(),
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
    })
    .refine(
      (data) => {
        if (
          data.canAddParticipants &&
          data.permissionAddParticipants.length === 0 &&
          data.to.length === 0
        ) {
          return false;
        }

        return true;
      },
      {
        message: "Selecione pelo menos um usuário",
        path: ["permissionAddParticipants"],
      }
    )
    .refine(
      (data) => {
        if (data.waitType === "custom") {
          return !!data.waitValue;
        }
        return true;
      },
      {
        message: "Valor é obrigatório",
        path: ["waitValue"],
      }
    ),
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

  [NodeTypes.Script]: z.object({
    name: z.string().min(3, { message: "Nome é obrigatório" }),
    script: z.string().min(3, { message: "Script é obrigatório" }),
    visible: z.boolean().default(false),
  }),

  [NodeTypes.NewTicket]: z.object({
    name: z.string().min(3, { message: "Nome é obrigatório" }),
    visible: z.boolean().default(true),
    form_id: z.string().min(3, { message: "Selecione um formulário" }),
    fields: z.record(z.string()),
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
      type: z.nativeEnum(NodeTypes).optional(),
      data: z.union([
        schemas[NodeTypes.SendEmail],
        schemas[NodeTypes.ChangeStatus],
        schemas[NodeTypes.Circle],
        schemas[NodeTypes.SwapWorkflow],
        schemas[NodeTypes.Interaction],
        schemas[NodeTypes.Conditional],
        schemas[NodeTypes.WebRequest],
        schemas[NodeTypes.Script],
      ]),
      position: z.object({ x: z.number(), y: z.number() }),
      deletable: z.boolean().optional(),
    })
  ),
});

export type WorkflowFormInputs = z.infer<typeof workflowSchema>;
