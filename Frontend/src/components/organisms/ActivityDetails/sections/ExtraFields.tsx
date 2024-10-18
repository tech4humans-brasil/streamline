// ExtraFields.tsx
import React, { useMemo } from "react";
import { Flex } from "@chakra-ui/react";
import RenderFieldValue from "@components/atoms/RenderFieldValue";
import { IField } from "@interfaces/FormDraft";
import Accordion from "@components/atoms/Accordion";

interface ExtraFieldsProps {
  fields: IField[];
}

const ExtraFields: React.FC<ExtraFieldsProps> = ({ fields = [] }) => {
  const fieldsFilled = useMemo(
    () => fields.filter((field) => field?.value),
    [fields]
  );

  const fieldsEmpty = useMemo(
    () => fields.filter((field) => !field?.value),
    [fields]
  );

  return (
    <Flex flexWrap="wrap" gap={4} direction={"column"}>
      {fieldsFilled.map((field) => (
        <RenderFieldValue key={field.id} field={field} />
      ))}

      {fieldsEmpty.length > 0 && (
        <Accordion.Container allowToggle allowMultiple defaultIndex={[]}>
          <Accordion.Item>
            <Accordion.Button fontSize="sm">
              Campos não preenchidos
            </Accordion.Button>
            <Accordion.Panel>
              {fields
                .filter((field) => !field.value)
                .map((field) => (
                  <RenderFieldValue key={field.id} field={field} />
                ))}
            </Accordion.Panel>
          </Accordion.Item>
        </Accordion.Container>
      )}

      {fields.length === 0 && (
        <Flex justifyContent="center" alignItems="center" h="100%">
          Nenhum campo extra
        </Flex>
      )}
    </Flex>
  );
};

export default ExtraFields;
