import { IField } from "@interfaces/FormDraft";

type Template = {
  type?: "created" | "interaction" | "evaluated";
  fields: IField[];
};

const created: Template = {
  type: "created",
  fields: [
    {
      id: "description",
      type: "textarea",
      required: true,
      visible: true,
      system: true,
      label: "Descrição da solicitação",
      predefined: null,
      value: null,
    },
  ],
};

const interaction: Template = {
  type: "interaction",
  fields: [],
};

const templates: {
  [key: string]: Template;
} = {
  created,
  interaction,
};

const keys = Object.keys(templates);

export default function getTemplate(
  templateId: string | undefined | null
): Template | object {
  if (!templateId) return {};

  if (!keys.includes(templateId)) {
    console.warn(`Template ${templateId} not found`);
    return {};
  }

  return templates[templateId];
}
