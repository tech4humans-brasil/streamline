import { Connection } from "mongoose";
import Activity, { IActivity } from "../models/client/Activity";
import { IField } from "../models/client/FormDraft";

const isOptionField = (field: IField): boolean =>
  ["select", "radio", "checkbox", "multiselect"].includes(field.type);

const replaceSmartValues = async <T extends string | string[]>({
  conn,
  activity_id,
  replaceValues,
  vars = {},
}: {
  conn: Connection;
  activity_id: string | IActivity;
  vars?: { [key: string]: string };
  replaceValues: T;
}): Promise<T> => {
  const activityBase =
    typeof activity_id === "string"
      ? (await new Activity(conn).model().findById(activity_id)).toObject()
      : activity_id;

  if (!activityBase) {
    return replaceValues;
  }

  const customFields = extractCustomFields(activityBase.form_draft);

  const activity = createActivity(customFields, {
    name: activityBase.name,
    description: activityBase.description,
    users: activityBase.users,
    protocol: activityBase.protocol,
    status: {
      ...activityBase.status,
      _id: activityBase.status._id?.toString(),
    },
    due_date: activityBase?.due_date,
    _id: activityBase._id?.toString(),
    parent: activityBase?.parent?.toString(),
  });

  console.log("activity", activity);

  if (Array.isArray(replaceValues)) {
    return replaceValues.map((replaceValue) =>
      runDynamicTemplate(replaceValue, { activity, vars })
    ) as T;
  } else {
    return runDynamicTemplate(replaceValues, { activity, vars }) as T;
  }
};

export default replaceSmartValues;

export const extractCustomFields = (form_draft: { fields: IField[] }) => {
  return form_draft.fields.reduce((acc, field) => {
    if (field.system) {
      return acc;
    }

    if (isOptionField(field)) {
      if (Array.isArray(field.options)) {
        if (Array.isArray(field.value)) {
          acc[field.id] = field.value
            .map((value) => {
              const option = field.options.find(
                (option) => "value" in option && option.value === value
              );
              return option?.label || value;
            })
            .join(", ");
        } else {
          const option = field.options.find(
            (option) => "value" in option && option.value === field.value
          );
          acc[field.id] = option?.label || field.value;
        }
      }
      return acc;
    }

    acc[field.id] = field.value;
    return acc;
  }, {});
};

/**
 * Função para processar um template dinâmico utilizando `new Function`.
 */
export function runDynamicTemplate(template: string, context: any): any {
  const { activity, vars } = context;

  // Normaliza o template para substituir os delimitadores e caminhos de campos
  const normalizedTemplate = template
    .replace(/\${{([\s\S]+?)}}/g, "${$1}")
    .replace(/{{([\s\S]+?)}}/g, "${$1}")
    .replace(/\.#([\w]+)(\.[\w]+)?/g, (_, field, rest) => {
      const baseField = `["#${field}"]`;
      const remainingPath = rest ? `["${rest.slice(1)}"]` : "";
      return `${baseField}${remainingPath}`;
    });

  if (normalizedTemplate.includes("activity.&")) {
    const before = normalizedTemplate.split("activity.&");
    const value = before[1].split("}")[0];

    return activity?.[value] || "-";
  }

  try {
    // Cria a função dinâmica com o template
    const dynamicFunction = new Function(
      "activity",
      "vars",
      "return `" + normalizedTemplate + "`;"
    );

    const result = dynamicFunction(activity, vars);

    return result; // Retorna o resultado diretamente se não houver "&"
  } catch (error) {
    console.error("Erro ao processar template: " + template, error);
    return "";
  }
}

function createActivity(customFields: object, activityBase: object): object {
  if (!customFields) {
    customFields = {};
    console.warn("customFields was undefined. Using an empty object instead.");
  }
  if (!activityBase) {
    activityBase = {};
    console.warn("activityBase was undefined. Using an empty object instead.");
  }

  return {
    ...customFields,
    ...activityBase,
    "#users": {
      _id: activityBase["users"]
        .map((user: any) => user._id.toString())
        .join(", "),
      name: activityBase["users"].map((user: any) => user.name).join(", "),
      email: activityBase["users"].map((user: any) => user.email).join(", "),
      "#institutes": {
        name: activityBase["users"]
          .map((user: any) => user.institutes.name)
          .join(", "),
        acronym: activityBase["users"]
          .map((user: any) => user.institutes.acronym)
          .join(", "),
      },
      matriculation: activityBase["users"]
        .map((user: any) => user.matriculation)
        .join(", "),
    },
  };
}
