import mongoose from "mongoose";
import replaceSmartValues, {
  extractCustomFields,
  replaceVariables,
} from "./replaceSmartValues";
import { FieldTypes } from "../models/client/FormDraft";

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
          name: "test",
          email: "teste@teste.com.br",
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

    const expectedOutput = "teste@teste.com.br";

    const result = replaceVariables({ activity: data }, template);

    expect(result).toBe(expectedOutput);
  });

  it("should exectute javascript if use single {", () => {
    const template = "${new Date().toLocaleDateString('pt-br')}";
    const context = {
      vars: {},
    };

    const result = replaceVariables(context, template);

    expect(result).toMatch(/\d{2}\/\d{2}\/\d{4}/);
  });

  it("should return lowCase of a string", () => {
    const template = "${'TESTE'.toLowerCase()}";
    const context = {
      vars: {},
    };

    const result = replaceVariables(context, template);

    expect(result).toBe("teste");
  });

  it("should return lowCase of activity.name", () => {
    const template = "${activity.name.toLowerCase()}";
    const context = {
      activity: {
        name: "TESTE",
      },
      vars: {},
    };

    const result = replaceVariables(context, template);

    expect(result).toBe("teste");
  });

  it("should return in json with user single { and & reference", () => {
    const template = "${activity.&name}";
    const context = {
      activity: {
        name: {
          first: "TESTE",
          last: "TESTE",
        },
      },
      vars: {},
    };

    const result = replaceVariables(context, template);

    expect(typeof result).toBe("object");
  });

  it("should return the resolved value of a variable", () => {
    const template =
      '<body id="i23f"><div class="gjs-editor gjs-one-bg gjs-two-color"><div class="gjs-cv-canvas"><div data-frames="" class="gjs-cv-canvas__frames"><div class="gjs-frames"><div id="i31g" class="gjs-frame-wrapper gjs-frame-wrapper--anim"><div data-frame-top="" class="gjs-frame-wrapper__top gjs-two-color"><div data-action-move="" class="gjs-frame-wrapper__name">\n          \n        </div><div class="gjs-frame-wrapper__top-r"><div data-action-remove="" id="ixxzi" class="gjs-frame-wrapper__icon"><svg viewBox="0 0 24 24"><path d="M19 4h-3.5l-1-1h-5l-1 1H5v2h14M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12z"></path></svg></div></div></div><div data-frame-right="" class="gjs-frame-wrapper__right"></div><div data-frame-left="" class="gjs-frame-wrapper__left"></div><div data-frame-bottom="" class="gjs-frame-wrapper__bottom"></div><iframe frameborder="0" allowfullscreen="allowfullscreen" class="gjs-frame"></iframe></div></div></div><div id="gjs-cv-tools" data-tools="" class="gjs-cv-canvas__tools"><div id="ihsyf" class="gjs-tools gjs-tools-gl"><div class="gjs-placeholder"><div class="gjs-placeholder-int"></div></div></div><div id="gjs-tools"><div class="gjs-badge"></div><div class="gjs-ghost"></div><div id="i66cz" class="gjs-toolbar"></div><div class="gjs-resizer"></div><div class="gjs-offset-v"></div><div class="gjs-offset-fixed-v"></div><div id="i2axk" class="gjs-rte-toolbar gjs-one-bg"><div class="gjs-rte-actionbar"><span title="Bold" class="gjs-rte-action"><b>B</b></span><span title="Italic" class="gjs-rte-action"><i>I</i></span><span title="Underline" class="gjs-rte-action"><u>U</u></span><span title="Strike-through" class="gjs-rte-action"><s>S</s></span><span title="Link" id="iy7nj" class="gjs-rte-action"><svg viewBox="0 0 24 24"><path fill="currentColor" d="M3.9,12C3.9,10.29 5.29,8.9 7,8.9H11V7H7A5,5 0 0,0 2,12A5,5 0 0,0 7,17H11V15.1H7C5.29,15.1 3.9,13.71 3.9,12M8,13H16V11H8V13M17,7H13V8.9H17C18.71,8.9 20.1,10.29 20.1,12C20.1,13.71 18.71,15.1 17,15.1H13V17H17A5,5 0 0,0 22,12A5,5 0 0,0 17,7Z"></path></svg></span><span title="Wrap for style" class="gjs-rte-action"><svg viewBox="0 0 24 24"><path fill="currentColor" d="M20.71,4.63L19.37,3.29C19,2.9 18.35,2.9 17.96,3.29L9,12.25L11.75,15L20.71,6.04C21.1,5.65 21.1,5 20.71,4.63M7,14A3,3 0 0,0 4,17C4,18.31 2.84,19 2,19C2.92,20.22 4.5,21 6,21A4,4 0 0,0 10,17A3,3 0 0,0 7,14Z"></path></svg></span></div></div></div><div id="i2cli" class="gjs-tools"><div data-hl="" class="gjs-highlighter"></div><div data-badge="" class="gjs-badge"></div><div class="gjs-placeholder"><div class="gjs-placeholder-int"></div></div><div class="gjs-ghost"></div><div id="itvnq" class="gjs-toolbar"></div><div class="gjs-resizer"></div><div data-offset="" class="gjs-offset-v"><div data-offset-m="" class="gjs-marginName"><div data-offset-m-t="" class="gjs-margin-v-el gjs-margin-v-top"></div><div data-offset-m-b="" class="gjs-margin-v-el gjs-margin-v-bottom"></div><div data-offset-m-l="" class="gjs-margin-v-el gjs-margin-v-left"></div><div data-offset-m-r="" class="gjs-margin-v-el gjs-margin-v-right"></div></div><div data-offset-m="" class="gjs-paddingName"><div data-offset-p-t="" class="gjs-padding-v-el gjs-padding-v-top"></div><div data-offset-p-b="" class="gjs-padding-v-el gjs-padding-v-bottom"></div><div data-offset-p-l="" class="gjs-padding-v-el gjs-padding-v-left"></div><div data-offset-p-r="" class="gjs-padding-v-el gjs-padding-v-right"></div></div></div><div class="gjs-offset-fixed-v"></div></div></div></div><div class="gjs-pn-panels"><div class="gjs-pn-panel gjs-pn-commands gjs-one-bg gjs-two-color"><div class="gjs-pn-buttons"><span class="gjs-pn-btn"></span></div></div><div class="gjs-pn-panel gjs-pn-devices-c gjs-one-bg gjs-two-color"><div class="gjs-pn-buttons"></div></div><div class="gjs-pn-panel gjs-pn-options gjs-one-bg gjs-two-color"><div class="gjs-pn-buttons"></div></div><div class="gjs-pn-panel gjs-pn-views gjs-one-bg gjs-two-color"><div class="gjs-pn-buttons"></div></div></div><div id="ivpvr2" class="cv-canvas"><div data-frames="" class="cv-canvas__frames"><div class="frames"><div id="ifheui" class="frame-wrapper frame-wrapper--anim"><div data-frame-top="" class="frame-wrapper__top gjs-two-color"><div data-action-move="" class="frame-wrapper__name">\n          \n        </div><div class="frame-wrapper__top-r"><div data-action-remove="" id="isnap2" class="frame-wrapper__icon"><svg viewBox="0 0 24 24"><path d="M19 4h-3.5l-1-1h-5l-1 1H5v2h14M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12z"></path></svg></div></div></div><div data-frame-right="" class="frame-wrapper__right"></div><div data-frame-left="" class="frame-wrapper__left"></div><div data-frame-bottom="" class="frame-wrapper__bottom"></div><iframe frameborder="0" allowfullscreen="allowfullscreen" class="frame"></iframe></div></div></div><div id="cv-tools" data-tools="" class="cv-canvas__tools"><div id="ijgkw8" class="tools tools-gl"><div class="placeholder"><div class="placeholder-int"></div></div></div><div id="tools"><div class="badge"></div><div class="ghost"></div><div id="intq1h" class="toolbar"></div><div class="resizer"></div><div class="offset-v"></div><div class="offset-fixed-v"></div></div><div id="iynsfw" class="tools"><div data-hl="" class="highlighter"></div><div data-badge="" class="badge"></div><div class="placeholder"><div class="placeholder-int"></div></div><div class="ghost"></div><div id="iehjai" class="toolbar"></div><div class="resizer"></div><div data-offset="" class="offset-v"><div data-offset-m="" class="gjs-marginName"><div data-offset-m-t="" class="gjs-margin-v-el gjs-margin-v-top"></div><div data-offset-m-b="" class="gjs-margin-v-el gjs-margin-v-bottom"></div><div data-offset-m-l="" class="gjs-margin-v-el gjs-margin-v-left"></div><div data-offset-m-r="" class="gjs-margin-v-el gjs-margin-v-right"></div></div><div data-offset-m="" class="gjs-paddingName"><div data-offset-p-t="" class="gjs-padding-v-el gjs-padding-v-top"></div><div data-offset-p-b="" class="gjs-padding-v-el gjs-padding-v-bottom"></div><div data-offset-p-l="" class="gjs-padding-v-el gjs-padding-v-left"></div><div data-offset-p-r="" class="gjs-padding-v-el gjs-padding-v-right"></div></div></div><div class="offset-fixed-v"></div></div></div></div></div><div id="ib1get" class="gjs-mdl-container"><div class="gjs-mdl-dialog gjs-one-bg gjs-two-color"><div class="gjs-mdl-header"><div class="gjs-mdl-title"></div><div data-close-modal="" class="gjs-mdl-btn-close">⨯</div></div><div class="gjs-mdl-content"><div id="gjs-mdl-c"></div><div id="i1zgbp"></div></div></div><div id="i5hox5" class="gjs-mdl-collector"></div></div><table id="i278p1"><tbody><tr><td id="ihiq4h"><div id="i73mro">activity._id: ${{activity._id}}<br id="ie8f" draggable="true"/>activity.name: ${{activity.name}}<br id="iouj" draggable="true"/>activity.description: ${{activity.description}}<br id="imfxm" draggable="true"/>activity.#users.name: ${{activity.#users.name}}<br id="i32ui" draggable="true"/>activity.#users.email: ${{activity.#users.email}}<br id="i0uwi" draggable="true"/>activity.#users.matriculation: ${{activity.#users.matriculation}}<br id="ihozb" draggable="true"/>new Date: ${new Date().toLocaleDateString("pt-br")}</div></td></tr></tbody></table></body>';
    const context = {
      activity: {
        _id: "123456",
        name: "Atividade: Teste",
        status: {
          _id: "123456",
          name: "Atividade: Teste",
          type: "Atividade",
        },
        description: "Descrição da atividade",
        users: [
          {
            _id: "oapsjdposad",
            name: "Usuário 1",
            email: "user@teste.com.br",
            matriculation: "123456",
          },
        ],
        form_draft: {
          fields: [
            {
              id: "file",
              type: "file",
              label: "Arquivo",
              multi: false,
              created: false,
              placeholder: "",
              required: true,
              visible: true,
              system: false,
              describe: "",
              value: {
                containerName: "676429a4977088627adf0c6f",
                name: "c0209913-fd38-4298-86e9-a136f8cb2864@Declarao_-_asdasd.pdf",
                url: "https://teste.com.br/file.pdf",
                mimeType: "application/pdf",
                size: "235450",
              },
              options: [],
              validation: {
                pattern: "",
              },
              _id: {
                $oid: "6776ca5f951ee7fecd93c945",
              },
            },
          ],
        },
      },
      vars: {},
    };

    const result = replaceVariables(context, template);

    expect(result).toContain("activity._id: 123456");
    expect(result).toContain("activity.name: Atividade: Teste");
    expect(result).toContain("activity.description: Descrição da atividade");
    expect(result).toContain("activity.#users.name: Usuário 1");
    expect(result).toContain("activity.#users.email: user@teste.com.br");
    expect(result).toContain("activity.#users.matriculation: 123456");
    expect(result).toMatch(/new Date: \d{2}\/\d{2}\/\d{4}/);
  });
});
