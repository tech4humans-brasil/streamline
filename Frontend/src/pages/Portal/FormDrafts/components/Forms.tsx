import React, { memo, useCallback } from "react";
import {
  UseFieldArrayInsert,
  useFieldArray,
  useFormContext,
} from "react-hook-form";
import { Button, Divider, Flex, FormControl, Heading } from "@chakra-ui/react";
import FieldArray from "./FieldArray";
import { FaPlus } from "react-icons/fa";
import { formFormSchema } from "../schema";
import ErrorMessages from "@components/atoms/Inputs/ErrorMessage";
import { FieldTypes } from "@interfaces/FormDraft";

interface FormEditProps {
  isEditing: boolean;
  formType: "created" | "interaction" | "evaluated";
  isCreated: boolean;
}

const FormEdit: React.FC<FormEditProps> = memo(({ formType, isEditing }) => {
  const { control } = useFormContext<formFormSchema>();

  const { fields, insert, remove, swap } = useFieldArray({
    control,
    name: "fields",
  });

  return (
    <React.Fragment>
      <FormControl>
        <ErrorMessages id={`refine`} />
      </FormControl>

      <Heading size="md">Campos do formulário</Heading>
      <Divider />

      <ButtonAdd {...{ insert }} />

      {fields.map((field, index) => (
        <Flex key={field.id} direction="column" gap="4">
          <FieldArray
            field={field}
            index={index}
            remove={remove}
            swap={swap}
            isEnd={index === fields.length - 1}
          />
          <ButtonAdd length={fields.length} {...{ insert, index, formType }} />
        </Flex>
      ))}
    </React.Fragment>
  );
});

interface ButtonAddProps {
  insert: UseFieldArrayInsert<formFormSchema, "fields">;
  index?: number;
  length?: number;
}

const ButtonAdd: React.FC<ButtonAddProps> = ({
  insert,
  index = 0,
  length = 0,
}) => {
  const handleAddField = useCallback(() => {
    insert(
      index + 1,
      {
        id: `field-${length}`,
        label: "",
        placeholder: "",
        type: FieldTypes.text,
        required: true,
        system: false,
        value: "",
        weight: undefined,
        options: undefined,
        visible: true,
        multi: false,
        created: false,
        validation: {
          min: undefined,
          max: undefined,
          pattern: undefined,
        },
        describe: "",
        predefined: null,
      },
      { shouldFocus: true }
    );
  }, [insert, index, length]);

  return (
    <>
      <Button
        colorScheme="blue"
        variant="outline"
        size="sm"
        onClick={handleAddField}
        title="Adicionar campo"
        w="fit-content"
        margin="auto"
      >
        <FaPlus />
      </Button>
      <FormControl>
        <ErrorMessages id={`fields.root`} />
      </FormControl>
    </>
  );
};

export default FormEdit;
