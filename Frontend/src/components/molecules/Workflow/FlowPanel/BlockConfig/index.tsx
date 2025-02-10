import { getWorkflowDraftForms } from "@apis/workflowDraft";
import { useQuery } from "@tanstack/react-query";
import { NodeTypes } from "@interfaces/WorkflowDraft";
import React, { memo, useCallback, useMemo } from "react";
import Select from "@components/atoms/Inputs/Select";
import {
  FormProvider,
  useFieldArray,
  useForm,
  useFormContext,
} from "react-hook-form";
import { Button, Divider, Flex, Heading, Spinner } from "@chakra-ui/react";
import { zodResolver } from "@hookform/resolvers/zod";
import Text from "@components/atoms/Inputs/Text";
import nodesSchema, {
  BlockFormInputs,
} from "../../../../../pages/Portal/WorkflowDraft/nodesSchema";
import Switch from "@components/atoms/Inputs/Switch";
import { getFormWithFields } from "@apis/form";
import { FaPlus, FaTrash } from "react-icons/fa";
import TextArea from "@components/atoms/Inputs/TextArea";
import { useParams } from "react-router-dom";
import CreatableSelect from "@components/atoms/Inputs/CreatableSelect";
import NumberInput from "@components/atoms/Inputs/NumberInput";
import CodeEditor from "@components/atoms/Inputs/CodeEditor";
import { listClicksignTemplates } from "@apis/clicksign";
import { ClicksignRequirements } from "@utils/clicksign";

interface BlockConfigProps {
  type: NodeTypes;
  data: BlockFormInputs;
  onSave: (data: BlockFormInputs) => void;
}

const conditionalOperators = [
  {
    label: "Igual",
    value: "eq",
  },
  {
    label: "Diferente",
    value: "ne",
  },
  {
    label: "Maior",
    value: "gt",
  },
  {
    label: "Menor",
    value: "lt",
  },
  {
    label: "Maior ou igual",
    value: "gte",
  },
  {
    label: "Menor ou igual",
    value: "lte",
  },
  {
    label: "Contém",
    value: "in",
  },
  {
    label: "Não Contém",
    value: "notIn",
  },
  {
    label: "Nulo",
    value: "isNull",
  },
  {
    label: "Não Nulo",
    value: "isNotNull",
  },
];

const BlockConfig: React.FC<BlockConfigProps> = ({ type, data, onSave }) => {
  const params = useParams<{ workflow_id: string }>();

  const methods = useForm<BlockFormInputs>({
    defaultValues: data,
    resolver: zodResolver(nodesSchema[type]),
  });

  const {
    handleSubmit,
    reset,
    formState: { isDirty },
    watch,
  } = methods;

  const { data: formsData, isLoading: isLoadingForms } = useQuery({
    queryKey: ["forms", "workflow", params?.workflow_id ?? ""],
    queryFn: getWorkflowDraftForms,
    retryOnMount: false,
    staleTime: 1000 * 60 * 60,
  });

  const formsAll = useMemo(() => {
    if (!formsData) return;

    return formsData.forms.interaction.concat(formsData.forms.created);
  }, [formsData]);

  const onSubmit = handleSubmit((data) => {
    onSave(data);
  });

  const onCancel = useCallback(() => {
    reset();
  }, [reset]);

  console.log("erros", methods.formState.errors);

  const RenderInputs = useCallback(() => {
    switch (type) {
      case NodeTypes.SendEmail:
        return (
          <>
            <Text
              input={{
                label: "Nome",
                id: "name",
                placeholder: "Nome do bloco",
                required: true,
              }}
            />
            <Text
              input={{
                id: "sender",
                label: "Email do Remetente",
                type: "email",
                placeholder: "Caso não queira usar o padrão",
                required: false,
              }}
            />
            <CreatableSelect
              input={{
                label: "Destinatario",
                id: "to",
                placeholder: "Selecione um formulário",
                options: formsData?.users ?? [],
                required: true,
              }}
              isMulti
            />
            <Select
              input={{
                label: "Template de Email",
                id: "email_id",
                placeholder: "Selecione um template de email",
                options: formsData?.emails ?? [],
                required: true,
              }}
            />
            <Switch
              input={{
                label: "Visivel",
                id: "visible",
                required: true,
              }}
            />
          </>
        );
      case NodeTypes.ChangeStatus:
        return (
          <>
            <Text
              input={{
                label: "Nome",
                id: "name",
                placeholder: "Nome do bloco",
                required: true,
              }}
            />

            <Flex justifyContent={"space-between"} alignItems={"end"} gap={5}>
              <Select
                input={{
                  label: "Status",
                  id: "status_id",
                  placeholder: "Selecione um status",
                  options: formsData?.statuses ?? [],
                  required: true,
                }}
              />
            </Flex>

            <Switch
              input={{
                label: "Visivel",
                id: "visible",
                required: true,
              }}
            />
          </>
        );
      case NodeTypes.Circle:
        return (
          <Text
            input={{
              label: "Nome",
              id: "name",
              placeholder: "Nome do Workflow",
              required: true,
            }}
          />
        );
      case NodeTypes.SwapWorkflow:
        return (
          <>
            <Text
              input={{
                label: "Nome",
                id: "name",
                placeholder: "Nome do bloco",
                required: true,
              }}
            />
            <Select
              input={{
                label: "Workflow",
                id: "workflow_id",
                placeholder: "Selecione um workflow que será executado",
                options: formsData?.workflows ?? [],
                required: true,
              }}
            />
            <Switch
              input={{
                label: "Visivel",
                id: "visible",
                required: true,
              }}
            />
          </>
        );
      case NodeTypes.Interaction:
        return (
          <>
            <Text
              input={{
                label: "Nome",
                id: "name",
                placeholder: "Nome do bloco",
                required: true,
              }}
            />
            <Select
              input={{
                label: "Formulário",
                id: "form_id",
                placeholder: "Selecione o formulário que será enviado",
                options: formsData?.forms.interaction ?? [],
                required: true,
              }}
            />

            <Switch
              input={{
                label: "Adiar seleção de usuários",
                id: "canAddParticipants",
                required: false,
              }}
            />

            {watch("canAddParticipants") && (
              <Select
                input={{
                  label:
                    "Adicione quem pode adicionar usúarios (Usuarios add no 'Destinarario' possuem por padrão)",
                  id: "permissionAddParticipants",
                  placeholder: "Selecione um ou mais usuários",
                  options: formsData?.users ?? [],
                  required: false,
                }}
                isMulti
              />
            )}

            <Select
              input={{
                label: "Destinatario",
                id: "to",
                placeholder: "Selecione um ou mais usuários",
                options: formsData?.users ?? [],
                required: !watch("canAddParticipants"),
              }}
              isMulti
            />

            <Select
              input={{
                id: "waitType",
                required: true,
                label: "Esperar por",
                options: [
                  {
                    label: "Todos",
                    value: "all",
                  },
                  {
                    label: "Qualquer um",
                    value: "any",
                  },
                  {
                    label: "Customizado",
                    value: "custom",
                  },
                ],
              }}
            />

            {watch("waitType") === "custom" && (
              <NumberInput
                input={{
                  id: "waitValue",
                  label: "Quantidade de respostas",
                  placeholder: "Quantidade de respostas",
                  type: "number",
                }}
                min={2}
              />
            )}

            {watch("form_id") && (
              <ConditionalFields
                form_id={watch("form_id")}
                name="conditional"
              />
            )}
          </>
        );
      case NodeTypes.Conditional:
        return (
          <>
            <Text
              input={{
                label: "Nome",
                id: "name",
                placeholder: "Nome do bloco",
                required: true,
              }}
            />
            <Select
              input={{
                label: "Formulário",
                id: "form_id",
                placeholder: "Selecione o formulário que será avaliado",
                options: formsAll ?? [],
                required: true,
              }}
            />

            <Switch
              input={{
                label: "Visivel",
                id: "visible",
                required: true,
              }}
            />

            {/* <Select
              input={{
                label: "Caso não tenha resposta",
                id: "ifNotExists",
                placeholder: "Selecione um formulário",
                options: formsData?.workflows ?? [],
              }}
            /> */}

            <ConditionalFields form_id={watch("form_id")} name="conditional" />
          </>
        );
      case NodeTypes.WebRequest:
        return (
          <>
            <Text
              input={{
                label: "Nome",
                id: "name",
                placeholder: "Nome do bloco",
                required: true,
              }}
            />
            <Switch
              input={{
                label: "Assincrono",
                id: "is_async",
                required: true,
              }}
            />
            <Text
              input={{
                label: "URL",
                id: "url",
                placeholder: "URL",
                required: true,
              }}
            />
            <Switch
              input={{
                label: "Visivel",
                id: "visible",
                required: true,
              }}
            />
            <Select
              input={{
                label: "Método",
                id: "method",
                placeholder: "Selecione um método",
                options: [
                  { label: "GET", value: "GET" },
                  { label: "POST", value: "POST" },
                  { label: "PUT", value: "PUT" },
                  { label: "DELETE", value: "DELETE" },
                ],
                required: true,
              }}
            />
            <TextArea
              input={{
                label: "Corpo",
                id: "body",
                placeholder: "Corpo da requisição",
                required: true,
              }}
            />
            <KeyValueArray
              name="headers"
              label={"Headers"}
              control={methods.control}
            />

            <KeyValueArray
              name="field_populate"
              label={"Alterar campos da atividade"}
              control={methods.control}
            />
          </>
        );
      case NodeTypes.Script:
        return (
          <>
            <Text
              input={{
                label: "Nome",
                id: "name",
                placeholder: "Nome do bloco",
                required: true,
              }}
            />
            <CodeEditor
              input={{
                label: "Script",
                id: "script",
                placeholder: "Digite o script",
                required: true,
              }}
            />

            <Switch
              input={{
                label: "Visivel",
                id: "visible",
                required: true,
              }}
            />
          </>
        );
      case NodeTypes.NewTicket:
        return (
          <>
            <Text
              input={{
                label: "Nome",
                id: "name",
                placeholder: "Nome do bloco",
                required: true,
              }}
            />

            <Switch
              input={{
                label: "Visivel",
                id: "visible",
                required: true,
              }}
            />

            <Select
              input={{
                label: "Formulário",
                id: "form_id",
                placeholder: "Selecione o formulário que será enviado",
                options: formsData?.forms.created ?? [],
                required: true,
              }}
            />

            {watch("form_id") && (
              <FormFieldsInput form_id={watch("form_id")} name="fields" />
            )}
          </>
        );

      case NodeTypes.Clicksign:
        return (
          <>
            <Text
              input={{
                label: "Nome",
                id: "name",
                placeholder: "Nome do bloco",
                required: true,
              }}
            />
            <Switch
              input={{
                label: "Visivel",
                id: "visible",
                required: true,
              }}
            />

            <ClicksignConfig />

            <KeyValueArray
              name="fields"
              label={"Variaveis para preencher no template"}
              control={methods.control}
            />
          </>
        );

      default:
        return <h1>Default</h1>;
    }
  }, [type, formsData, watch]);

  return (
    <Flex direction="column" justify="space-between" h="100%">
      {isLoadingForms ? (
        <Spinner />
      ) : (
        <FormProvider {...methods}>
          <Flex justify="start" gap={5} direction="column" mb={5}>
            <RenderInputs />
          </Flex>
        </FormProvider>
      )}
      <Flex justify="flex-end" mb={5}>
        <Button mr={3} onClick={onCancel}>
          Cancelar
        </Button>
        <Button
          colorScheme="blue"
          mr={3}
          onClick={onSubmit}
          isDisabled={!isDirty}
        >
          Salvar
        </Button>
      </Flex>
    </Flex>
  );
};

export default BlockConfig;

interface ConditionalProps {
  form_id: string;
  name: string;
}

const ConditionalFields = memo(({ form_id, name }: ConditionalProps) => {
  const { data: formsData, isLoading } = useQuery({
    queryKey: ["formDraft", form_id],
    queryFn: getFormWithFields,
    retryOnMount: false,
    select(data) {
      return data?.published;
    },
  });

  const { control, watch } = useFormContext();

  const {
    fields: conditionalFields,
    append,
    remove,
  } = useFieldArray({
    name: name,
    control: control,
  });

  const getFieldOptions = useMemo(() => {
    return (
      formsData?.fields?.map((field) => ({
        label: field.label,
        value: field.id,
      })) ?? []
    );
  }, [formsData]);

  const getField = useCallback(
    (id: string) => {
      return formsData?.fields?.find((field) => field.id === id);
    },
    [formsData]
  );

  const haveOptions = useCallback(
    (id: string) => {
      return ["select", "multiselect", "radio"].includes(
        getField(id)?.type ?? ""
      );
    },
    [getField]
  );

  return (
    <Flex direction="column" gap={5}>
      {isLoading ? (
        <Spinner />
      ) : (
        <>
          <Button
            onClick={() => {
              append({ field: "", value: "", operator: "==" });
            }}
          >
            Adicionar Condição
          </Button>
          {conditionalFields.map((field, index) => (
            <Flex key={field.id} gap={2} direction="column">
              <Flex
                key={field.id}
                gap={2}
                justify="start"
                alignItems="center"
                direction="row"
              >
                <Flex key={field.id} direction="column" flex="1">
                  <Select
                    input={{
                      label: "Campo",
                      id: `${name}[${index}].field`,
                      placeholder: "Field Id",
                      options: getFieldOptions,
                      required: true,
                    }}
                  />

                  <Select
                    input={{
                      label: "Operador",
                      id: `${name}[${index}].operator`,
                      placeholder: "Selecione",
                      options: conditionalOperators,
                      required: true,
                    }}
                  />

                  {haveOptions(watch(`${name}[${index}].field`)) ? (
                    <Select
                      input={{
                        label: "Valor",
                        id: `${name}[${index}].value`,
                        placeholder: "Selecione",
                        options:
                          getField(watch(`${name}[${index}].field`))?.options ??
                          [],
                        required: true,
                      }}
                    />
                  ) : (
                    <>
                      {["isNull", "isNotNull"].includes(
                        watch(`${name}[${index}].operator`)
                      ) ? null : (
                        <Text
                          input={{
                            label: "Valor",
                            id: `${name}[${index}].value`,
                            placeholder: "Digite",
                            required: true,
                          }}
                        />
                      )}
                    </>
                  )}
                </Flex>
                <Button
                  size="sm"
                  onClick={() => remove(index)}
                  variant="outline"
                  colorScheme="red"
                >
                  <FaTrash />
                </Button>
              </Flex>
              {index < conditionalFields.length - 1 && (
                <Button size="sm" isDisabled mt={5}>
                  And
                </Button>
              )}
            </Flex>
          ))}
        </>
      )}
    </Flex>
  );
});

interface FormFieldsInputProps {
  form_id: string;
  name: string;
}

const FormFieldsInput = memo(({ form_id, name }: FormFieldsInputProps) => {
  const { data: formsData, isLoading } = useQuery({
    queryKey: ["formDraft", form_id],
    queryFn: getFormWithFields,
    retryOnMount: false,
    select(data) {
      return data?.published;
    },
  });

  return (
    <Flex direction="column" gap={5}>
      <Divider />
      <Heading size="sm">Campos do Formulário</Heading>
      {isLoading ? (
        <Spinner />
      ) : (
        formsData?.fields?.map((field) => (
          <Text
            key={field.id}
            input={{
              label: field.label,
              id: `${name}.${field.id}`,
              placeholder: field.label,
              required: field.required,
            }}
          />
        ))
      )}
    </Flex>
  );
});

interface KeyValueArrayProps {
  name: string;
  control: any;
  label: string;
}

const KeyValueArray: React.FC<KeyValueArrayProps> = memo(
  ({ name, control, label }) => {
    const { fields, append, remove } = useFieldArray({
      name: name,
      control,
    });

    return (
      <Flex direction="column">
        <Heading size="sm">{label}</Heading>
        {fields.map((field, index) => (
          <Flex
            key={field.id}
            gap={2}
            direction="column"
            alignItems="end"
            mt={5}
          >
            <Text
              input={{
                label: "Chave",
                id: `${name}[${index}].key`,
                placeholder: "Chave",
                required: true,
              }}
            />

            <Text
              input={{
                label: "Valor",
                id: `${name}[${index}].value`,
                placeholder: "Valor",
                required: true,
              }}
            />
            <Flex w="100%" justify="flex-end">
              <Button
                size="md"
                onClick={() => remove(index)}
                variant="outline"
                colorScheme="red"
              >
                <FaTrash />
              </Button>
            </Flex>
            <Divider />
          </Flex>
        ))}
        <Button
          onClick={() => {
            append({ key: "", value: "" });
          }}
          mt={5}
        >
          Adicionar
        </Button>
      </Flex>
    );
  }
);

const ClicksignConfig: React.FC = () => {
  const { control } = useFormContext();

  const { fields, append, remove } = useFieldArray({
    name: "signers",
    control: control,
  });

  const { data: templatesData, isLoading: isLoadingTemplates } = useQuery({
    queryKey: ["clicksign", "templates"],
    queryFn: listClicksignTemplates,
    retryOnMount: false,
    staleTime: 1000 * 60 * 60,
  });

  const templates = useMemo(() => {
    if (!templatesData) return [];

    return templatesData.data.map((template) => ({
      label: template.name,
      value: template.id,
    }));
  }, [templatesData]);

  const addSigner = useCallback(() => {
    append({
      user: {
        name: "",
        email: "",
      },
      type: "",
    });
  }, [append]);

  return (
    <Flex direction="column" gap={5}>
      <Heading size="sm">Signatários</Heading>
      <Flex justify="end">
        <Button onClick={addSigner} leftIcon={<FaPlus />}>
          Adicionar
        </Button>
      </Flex>
      {fields.map((field, index) => (
        <Flex key={field.id} gap={2} direction="column">
          <Text
            input={{
              label: "Nome",
              id: `signers[${index}].user.name`,
              placeholder: "Nome",
              required: true,
            }}
          />

          <Text
            input={{
              label: "Email",
              id: `signers[${index}].user.email`,
              placeholder: "Email",
              required: true,
            }}
          />

          <Select
            input={{
              label: "Tipo",
              id: `signers[${index}].type`,
              placeholder: "Selecione",
              options: ClicksignRequirements,
              required: true,
            }}
          />

          <Button
            size="sm"
            onClick={() => remove(index)}
            variant="outline"
            colorScheme="red"
          >
            <FaTrash />
          </Button>
        </Flex>
      ))}

      <Divider />

      <Select
        input={{
          label: "Template",
          id: "documentKey",
          placeholder: "Selecione um template do clicksign",
          options: templates,
          required: true,
        }}
        isLoading={isLoadingTemplates}
      />
    </Flex>
  );
};