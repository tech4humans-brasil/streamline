import mongoose from "mongoose";
import replaceSmartValues, {
  extractCustomFields,
  replaceVariables,
} from "./replaceSmartValues";
import Activity, { IActivity, IActivityState } from "../models/client/Activity";
import {
  FieldTypes,
  IFormDraft,
  IFormStatus,
} from "../models/client/FormDraft";
import { StatusType } from "../models/client/Status";

describe("replaceVariables", () => {
  it("should replace variables in the template with corresponding values from the data object", () => {
    const data = {
      name: "John",
      age: 30,
      hobbies: ["reading", "coding"],
      clothes: [
        {
          type: "shirt",
          color: "blue",
        },
        {
          type: "pants",
          color: "black",
        },
      ],
      address: {
        city: "New York",
        country: "USA",
      },
    };

    const template =
      "My name is ${{activity.name}} and I am ${{activity.age}} years old. My hobbies are ${{activity.#hobbies}}. I live in ${{activity.address.city}}, ${{activity.address.country}} and I am wearing a ${{activity.#clothes.color}} ${{activity.#clothes.type}}";

    const expectedOutput =
      "My name is John and I am 30 years old. My hobbies are reading, coding. I live in New York, USA and I am wearing a blue, black shirt, pants";

    const result = replaceVariables({ activity: data }, template);

    expect(result).toBe(expectedOutput);
  });

  it("should return the original template if a variable is not found in the data object", () => {
    const data = {
      name: "John",
      age: 30,
    };

    const template =
      "My name is ${{activity.name}} and I am ${{activity.age}} years old. I live in ${{activity.address.city}}, ${{activity.address.country}}.";

    const expectedOutput =
      "My name is John and I am 30 years old. I live in -, -.";

    const result = replaceVariables({ activity: data }, template);

    expect(result).toBe(expectedOutput);
  });

  it("should return array of emails of users", () => {
    const data = {
      users: [
        {
          _id: {
            $oid: "6617d3bbbf168b47ecb6c04f",
          },
          isExternal: false,
          name: "Luis Ricardo",
          email: "email@unifei.edu.br",
          matriculation: "2021031844",
          institute: {
            _id: {
              $oid: "6617d0d9b3a6fbb432f0374f",
            },
            name: "Instituto de Matemática e Computação",
            acronym: "IMC",
            active: true,
            createdAt: {
              $date: "2024-04-11T12:00:25.331Z",
            },
            updatedAt: {
              $date: "2024-04-11T12:00:25.331Z",
            },
            __v: 0,
          },
        },
      ],
    };

    const template = "${{activity.#users.email}}";

    const expectedOutput = "email@unifei.edu.br";

    const result = replaceVariables({ activity: data }, template);

    expect(result).toBe(expectedOutput);
  });

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
        }
      ],
    };

    const expectedOutput = {
      field1: "Option 1",
      field2: "Option 1, Option 2",
    }

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
    }

    const result = extractCustomFields(data);

    expect(result).toEqual(expectedOutput);
  });
});
