import React, { memo, useCallback } from "react";
import Select from "./Select";
import TextArea from "./TextArea";
import File from "./File";
import Radio from "./Radio";
import Checkbox from "./Checkbox";
import Text from "./Text";
import NumberInput from "./NumberInput";
import { IField } from "@interfaces/FormDraft";
import Password from "./Password";

interface Props {
  fields: IField[];
}

const fieldComponents: {
  select: typeof Select;
  number: typeof NumberInput;
  multiselect: typeof Select;
  textarea: typeof TextArea;
  file: typeof File;
  radio: typeof Radio;
  checkbox: typeof Checkbox;
  default: typeof Text;
  password: typeof Password;
  placeholder: null;
  text: typeof Text;
  email: typeof Text;
  date: typeof Text;
  time: typeof Text;
} = {
  select: Select,
  multiselect: Select,
  textarea: TextArea,
  file: File,
  radio: Radio,
  checkbox: Checkbox,
  default: Text,
  number: NumberInput,
  text: Text,
  placeholder: null,
  email: Text,
  password: Password,
  date: Text,
  time: Text,
};

const Inputs: React.FC<Props> = memo(({ fields }) => {
  const renderInput = useCallback((input: IField) => {
    const FieldComponent =
      fieldComponents[input.type as keyof typeof fieldComponents];

    if (!FieldComponent) {
      return null;
    }

    return (
      <FieldComponent
        // @ts-ignore
        input={input}
        isMulti={input.type === "multiselect"}
      />
    );
  }, []);

  return fields.map((input: IField) => (
    <React.Fragment key={input.id}>{renderInput(input)}</React.Fragment>
  ));
});

export default Inputs;
