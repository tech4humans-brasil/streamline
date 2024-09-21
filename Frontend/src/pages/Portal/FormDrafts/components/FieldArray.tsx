import { Flex, Button, useColorModeValue } from "@chakra-ui/react";
import Text from "@components/atoms/Inputs/Text";
import Select from "@components/atoms/Inputs/Select";
import { formFormSchema } from "../schema";
import { memo, useEffect } from "react";
import {
  FieldArrayWithId,
  UseFieldArrayRemove,
  UseFieldArraySwap,
  useFormContext,
} from "react-hook-form";
import { FaArrowDown, FaArrowUp, FaTrash } from "react-icons/fa";
import FieldArrayOption from "@components/atoms/FieldArrayOption";
import Switch from "@components/atoms/Inputs/Switch";
import Number from "@components/atoms/Inputs/NumberInput";
import TextArea from "@components/atoms/Inputs/TextArea";
import { FieldTypes } from "@interfaces/FormDraft";

const fieldTypes = {
  text: "Texto",
  number: "Número",
  email: "Email",
  password: "Senha",
  textarea: "Textarea",
  checkbox: "Checkbox",
  radio: "Radio",
  select: "Combobox",
  multiselect: "Multi Combobox",
  date: "Data",
  file: "Arquivo",
  placeholder: "Requisição Web",
  time: "Hora",
};

const fieldOptions = Object.entries(fieldTypes).map(([value, label]) => ({
  value,
  label,
}));

interface FieldFormsProps {
  field: FieldArrayWithId<formFormSchema, "fields"> & { system: boolean };
  index: number;
  remove: UseFieldArrayRemove;
  swap: UseFieldArraySwap;
  isEnd: boolean;
}

const FieldArray: React.FC<FieldFormsProps> = memo(
  ({ field, index, remove, swap, isEnd }) => {
    const border = useColorModeValue("gray.200", "gray.600");

    const { watch, setValue } = useFormContext<formFormSchema>();

    const isTimeTrigger = watch(`type`) === "time-trigger";
    const fieldType = watch(`fields.${index}.type`);
    const haveOptions = ["select", "multiselect", "radio", "checkbox"].includes(
      fieldType
    );

    useEffect(() => {
      if (fieldType === FieldTypes.placeholder) {
        setValue(`fields.${index}.required`, false);
      }
    }, [fieldType, setValue, index]);

    useEffect(() => {
      if (!haveOptions) {
        setValue(`fields.${index}.options`, undefined);
      }
    }, [fieldType, setValue, index]);

    return (
      <Flex
        key={field.id}
        direction="column"
        borderRadius="md"
        gap={4}
        p="4"
        pb="6"
        border="2px"
        borderColor={border}
        position="relative"
      >
        <Flex
          flex={1}
          justify="flex-end"
          gap={2}
          position="absolute"
          top="2"
          right="4"
          zIndex="1"
        >
          <Button
            colorScheme="blue"
            variant="outline"
            size="sm"
            onClick={() => swap(index, index - 1)}
            isDisabled={index === 0}
          >
            <FaArrowUp />
          </Button>

          <Button
            colorScheme="blue"
            variant="outline"
            size="sm"
            onClick={() => swap(index, index + 1)}
            isDisabled={index === 0 || isEnd}
          >
            <FaArrowDown />
          </Button>

          <Button
            colorScheme="red"
            size="sm"
            variant="outline"
            onClick={() => remove(index)}
            isDisabled={field.system}
          >
            <FaTrash />
          </Button>
        </Flex>

        <Flex direction={["column", "row"]} gap={4}>
          <Switch
            input={{
              id: `fields.${index}.required`,
              label: "Campo obrigatório",
              required: false,
            }}
            isDisabled={field.system || fieldType === FieldTypes.placeholder}
          />

          <Switch
            input={{
              id: `fields.${index}.visible`,
              label: "Visivel para o usuário",
              required: false,
            }}
            isDisabled={field.system}
          />
        </Flex>

        <Flex direction={["column", "row"]} gap={4}>
          <Text
            input={{
              id: `fields.${index}.id`,
              label: "Digite a identificação do campo",
              placeholder: "Identificação",
              isDisabled: field.system,
            }}
          />
        </Flex>

        <Flex direction={["column", "row"]} gap={4}>
          <Text
            input={{
              id: `fields.${index}.label`,
              label: "Digite o label do campo",
              placeholder: "Label",
              required: true,
            }}
          />

          <Text
            input={{
              id: `fields.${index}.placeholder`,
              label: "Digite o placeholder do campo",
              placeholder: "Placeholder",
              required: false,
            }}
          />
        </Flex>

        <TextArea
          input={{
            id: `fields.${index}.describe`,
            label: "Descrição",
            placeholder: "Adicione uma descrição para ajudar o usuário",
            required: false,
          }}
        />

        <Flex direction={["column", "row"]} gap={4}>
          <Select
            input={{
              id: `fields.${index}.type`,
              label: "Tipo",
              placeholder: "Tipo",
              required: true,
              options: isTimeTrigger
                ? [{ value: "placeholder", label: "Requisição Web" }]
                : fieldOptions,
              isDisabled: field.system,
            }}
          />

          {fieldType === "number" && (
            <>
              <Number
                input={{
                  id: `fields.${index}.validation.min`,
                  label: "Valor mínimo",
                  placeholder: "Valor mínimo",
                  required: false,
                  type: "number",
                }}
              />

              <Number
                input={{
                  id: `fields.${index}.validation.max`,
                  label: "Valor máximo",
                  placeholder: "Valor máximo",
                  required: false,
                  type: "number",
                }}
              />
            </>
          )}

          {fieldType === "text" && (
            <Text
              input={{
                id: `fields.${index}.validation.pattern`,
                label: "Padrão de validação",
                placeholder: "Padrão de validação Regex",
                required: false,
              }}
            />
          )}
        </Flex>

        {haveOptions && <FieldArrayOption index={index} />}
      </Flex>
    );
  }
);

export default FieldArray;
