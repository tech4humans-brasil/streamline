import { z } from "zod";

const formsZodSchema = z.object({
  type: z.enum(["created", "interaction", "time-trigger"]),
  fields: z
    .array(
      z.object({
        id: z.string().min(3, "ID precisa ter pelo menos 3 caracteres"),
        label: z
          .string()
          .min(3, "Label precisa ter min 3 caracteres")
          .max(200, "Label precisa ter no máximo 100 caracteres"),
        placeholder: z.string().optional(),
        type: z.enum([
          "text",
          "number",
          "email",
          "password",
          "textarea",
          "checkbox",
          "radio",
          "select",
          "teacher",
          "multiselect",
          "date",
          "file",
          "placeholder",
          "time",
        ]),
        multi: z.boolean().optional().default(false),
        created: z.boolean().optional().default(false),
        required: z.boolean().optional().default(false),
        value: z.union([
          z.string(),
          z.null(),
          z.object({
            _id: z.string(),
            name: z.string(),
            matriculation: z.string(),
            email: z.string(),
          }),
          z.object({
            _id: z.string(),
            name: z.string(),
            matriculation: z.string(),
            email: z.string(),
          }),
        ]),
        visible: z.boolean().optional().default(true),
        predefined: z
          .enum(["teachers", "students", "institutions"])
          .nullable()
          .optional(),
        system: z.boolean().optional().default(false),
        weight: z.coerce
          .number()
          .min(1, "Peso mínimo é 1")
          .max(10, "Peso máximo é 10")
          .optional(),
        describe: z
          .string()
          .max(512, "Descrição precisa ter no máximo 512 caracteres")
          .nullable()
          .optional(),
        options: z
          .array(
            z.object({
              label: z
                .string()
                .min(3, "Label precisa ter pelo menos 3 caracteres"),
              value: z
                .string()
                .min(3, "Valor precisa ter pelo menos 3 caracteres"),
            })
          )
          .nullable()
          .optional(),
        validation: z
          .object({
            min: z.coerce.number().optional(),
            max: z.coerce.number().optional(),
            pattern: z.coerce.string().optional(),
          })
          .optional(),
      })
    )
    .nonempty("Crie pelo menor um campo"),
});

export default formsZodSchema;

export type formFormSchema = z.infer<typeof formsZodSchema>;
