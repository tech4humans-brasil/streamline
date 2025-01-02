import mongoose from "mongoose";
import replaceSmartValues, { extractCustomFields, runDynamicTemplate } from "./replaceSmartValues";
import { FieldTypes } from "../models/client/FormDraft";

describe("replaceVariables", () => {
  it("should return label of the option of a field", () => {
    const data = {
      fields: [
        {
          id: "field1",
          visible: true,
          label: "Field 1",
          type: FieldTypes.Select,
          value: "option1",
          options: [
            { label: "Option 1", value: "option1" },
            { label: "Option 2", value: "option2" },
          ],
        },
        {
          id: "field2",
          visible: true,
          label: "Field 2",
          type: FieldTypes.Select,
          value: ["option1", "option2"],
          options: [
            { label: "Option 1", value: "option1" },
            { label: "Option 2", value: "option2" },
          ],
        },
      ],
    };

    const expectedOutput = {
      field1: "Option 1",
      field2: "Option 1, Option 2",
    };

    const result = extractCustomFields(data);

    expect(result).toEqual(expectedOutput);
  });

  it("should return label of the option of a field", () => {
    const data = {
      fields: [
        {
          id: "field1",
          visible: true,
          label: "Field 1",
          type: FieldTypes.Text,
          value: "Random text",
        },
      ],
    };

    const expectedOutput = {
      field1: "Random text",
    };

    const result = extractCustomFields(data);

    expect(result).toEqual(expectedOutput);
  });

  it("deve retornar o template processado com variáveis simples", () => {
    const template = "Olá, ${{activity.name}}!";
    const context = {
      activity: { name: "Mundo" },
      vars: {},
    };

    const result = runDynamicTemplate(template, context);
    expect(result).toBe("Olá, Mundo!");
  });

  it("deve retornar o template processado com valores aninhados", () => {
    const template = "Atividade: ${{activity.details.title}}";
    const context = {
      activity: { details: { title: "Teste" } },
      vars: {},
    };

    const result = runDynamicTemplate(template, context);
    expect(result).toBe("Atividade: Teste");
  });

  it("deve processar loops em arrays", () => {
    const template =
      "Valores: ${{activity.#values.value}}";
    const context = {
      activity: { values: ["a","b"] },
      vars: {},
    };

    const result = runDynamicTemplate(template, context);
    expect(result).toBe("Valores: a,b");
  });

  it("deve suportar múltiplas variáveis no mesmo template", () => {
    const template = "Olá, ${{activity.name}}! Hoje é ${{vars.date}}.";
    const context = {
      activity: { name: "Luis" },
      vars: { date: "2025-01-02" },
    };

    const result = runDynamicTemplate(template, context);
    expect(result).toBe("Olá, Luis! Hoje é 2025-01-02.");
  });
});
