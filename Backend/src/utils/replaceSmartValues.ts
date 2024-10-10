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

  const activity = {
    ...customFields,
    ...activityBase,
  };

  if (Array.isArray(replaceValues)) {
    return replaceValues.map((replaceValue) => {
      return replaceVariables({ activity, vars }, replaceValue);
    }) as T;
  } else {
    return replaceVariables({ activity, vars }, replaceValues) as T;
  }
};

export default replaceSmartValues;

export function replaceVariables(data, template: string): string {
  const regex = /\${{([\w.#]+)}}/g;

  // Função recursiva para lidar com a navegação e extração de valores.
  function resolveValue(currentValue, levels, levelIndex = 0): any {
    if (currentValue === undefined || levelIndex >= levels.length) {
      return currentValue;
    }

    const level = levels[levelIndex];
    if (level[0] === "#") {
      // Trata arrays
      const arrayName = level.substring(1);
      let nextValue = currentValue[arrayName];

      if (!Array.isArray(nextValue)) {
        return "-";
      }

      if (levelIndex < levels.length - 1) {
        // Processa os elementos do array recursivamente.
        return nextValue
          .map((item) => resolveValue(item, levels, levelIndex + 1))
          .join(", ");
      } else {
        // Se for o último nível, junta os valores do array.
        return nextValue.join(", ");
      }
    } else {
      // Processa objetos e valores simples recursivamente.
      return resolveValue(currentValue[level], levels, levelIndex + 1);
    }
  }

  return template.replace(regex, (match, key) => {
    const levels = key.split(".");
    const resolvedValue = resolveValue(data, levels);
    return resolvedValue !== undefined ? resolvedValue : "-";
  });
}

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
