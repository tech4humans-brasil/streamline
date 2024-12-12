// @ts-nocheck

import { z } from "zod";
import { IField } from "@interfaces/FormDraft";

//@ts-ignore
export default function convertToZodSchema(fields: IField[]): z.ZodObject<any> {
  const schemaObject: {
    [key: string]: ReturnType<
      | typeof z.string
      | typeof z.number
      | typeof z.date
      | typeof z.array
      | typeof z.any
      | typeof z.boolean
    >;
  } = {};

  fields.forEach((field) => {
    //@ts-ignore
    let fieldSchema: z.ZodType<any, any, any>;

    switch (field.type) {
      case "text":
      case "email":
      case "password":
      case "textarea":
        fieldSchema = z.string().refine(value => !value?.includes('"') && !value?.includes('\n'), 'Não são permitidas aspas duplas ou quebras de linha')
        break;
      case "number":
        fieldSchema = z.coerce.number();
        break;
      case "checkbox":
        fieldSchema = z.array(z.string());
        break;
      case "select":
      case "radio":
        if (field.options) {
          fieldSchema = z.enum([
            "",
            ...field.options.flatMap((option) =>
              "options" in option
                ? option.options.map((o) => o.value)
                : option.value
              ),
            ]);
          } else {
            fieldSchema = z.string();
          }
          break;
      case "multiselect":
        if (field.options) {
          fieldSchema = z.array(
            z.enum([
              "",
              ...field.options.flatMap((option) =>
                "options" in option
                  ? option.options.map((o) => o.value)
                  : option.value
                ),
              ])
          );
          } else {
            fieldSchema = z.array(z.string());
          }
          break;
      case "date":
        fieldSchema = z.string();
        break;
      case "evaluated":
        fieldSchema = z.coerce.number();
        break;
      case "file":
        fieldSchema = z.union([
          z.string().optional(),
          z.object({
            containerName: z.string(),
            name: z.string(),
            url: z.string(),
            mimeType: z.string(),
            size: z.string(),
          }).optional(),
        ]);
        break;
      case "teacher":
        fieldSchema = z
          .array(
            z.object({
              _id: z.string().optional(),
              name: z.string(),
              email: z.string().email(),
              isExternal: z.boolean().optional(),
              matriculation: z.string().optional(),
              institute: z.object({
                _id: z.string().optional(),
                name: z.string(),
                acronym: z.string(),
              }),
            })
          )
          .min(field.required ? 1 : 0, "Selecione um professor");
        break;
      default:
        fieldSchema = z.string(); // Fallback to string for unknown types
    }

    if (field.validation) {
      if (field.type === "number") {
        if (field.validation.min !== undefined) {
          fieldSchema = fieldSchema.refine(
            (value) => !value || value >= (field?.validation?.min ?? 0),
            {
              message: `O valor deve ser maior ou igual a ${field.validation.min}`,
            }
          );
        }
        if (field.validation.max !== undefined) {
          fieldSchema = fieldSchema.refine(
            (value) => !value || value <= (field?.validation?.max ?? 0),
            {
              message: `O valor deve ser menor ou igual a ${field.validation.max}`,
            }
          );
        }
      }
      if (field.validation?.pattern && field.type === "text") {
        fieldSchema = fieldSchema.refine(
          (value) => new RegExp(field?.validation?.pattern ?? "").test(value),
          {
            message: `O valor não corresponde ao padrão esperado ${field.validation.pattern}`,
          }
        );
      }
    }

    // Make field optional if not required
    if (!field.required) {
      fieldSchema = fieldSchema.optional();
    }

    schemaObject[field.id] = fieldSchema;
  });

  return z.object(schemaObject);
}
