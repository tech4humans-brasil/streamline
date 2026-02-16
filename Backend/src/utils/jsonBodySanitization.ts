/**
 * Escapa caracteres especiais de uma string para inserção segura em JSON.
 * Usa JSON.stringify e remove as aspas externais, deixando o valor pronto
 * para ser colocado entre aspas no template.
 */
export function escapeForJson(value: unknown): unknown {
  if (typeof value === "string") {
    return JSON.stringify(value).slice(1, -1);
  }
  if (Array.isArray(value)) {
    return value.map((item) =>
      typeof item === "string" ? JSON.stringify(item).slice(1, -1) : item
    );
  }
  return value;
}

/**
 * Cria um objeto de variáveis com valores string escapados para uso seguro em JSON.
 */
export function createJsonSafeVars(
  vars: Record<string, string>
): Record<string, string> {
  return Object.fromEntries(
    Object.entries(vars).map(([key, val]) => [
      key,
      typeof val === "string" ? (escapeForJson(val) as string) : val,
    ])
  );
}

/**
 * Cria uma cópia da activity com os valores sanitizados para inserção segura em JSON.
 * Sanitiza: form_draft.fields, description (top-level) e comments[].content.
 */
export function createSafeActivityForBody(
  activity: Record<string, unknown>
): Record<string, unknown> {
  const safeActivity = JSON.parse(JSON.stringify(activity));

  if (typeof safeActivity?.description === "string") {
    safeActivity.description = escapeForJson(safeActivity.description) as string;
  }

  if (
    safeActivity?.form_draft?.fields &&
    Array.isArray(safeActivity.form_draft.fields)
  ) {
    for (const field of safeActivity.form_draft.fields) {
      if (field.value !== undefined && field.value !== null) {
        field.value = escapeForJson(field.value);
      }
      if (field.options && Array.isArray(field.options)) {
        for (const option of field.options) {
          if (option.label !== undefined && typeof option.label === "string") {
            option.label = escapeForJson(option.label) as string;
          }
          if (option.options && Array.isArray(option.options)) {
            for (const nested of option.options) {
              if (
                nested.label !== undefined &&
                typeof nested.label === "string"
              ) {
                nested.label = escapeForJson(nested.label) as string;
              }
            }
          }
        }
      }
    }
  }

  return safeActivity;
}
