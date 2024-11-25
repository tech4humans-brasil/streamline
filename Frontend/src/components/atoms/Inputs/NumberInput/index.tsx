import {
  FormControl,
  FormLabel,
  NumberDecrementStepper,
  NumberIncrementStepper,
  NumberInput as NumberInputChackra,
  NumberInputField,
  NumberInputStepper,
} from "@chakra-ui/react";
import React from "react";
import ErrorMessage from "../ErrorMessage";
import { Controller, useFormContext } from "react-hook-form";
import InfoTooltip from "../InfoTooltip";

interface TextProps {
  input: {
    id: string;
    label?: string;
    placeholder?: string;
    required?: boolean;
    type?: string;
    isDisabled?: boolean;
    describe?: string | null;
  };
  max?: number;
  min?: number;
}

const NumberInput: React.FC<TextProps> = ({ input, max, min }) => {
  const {
    control,
    formState: { errors },
  } = useFormContext();

  return (
    <FormControl
      id={input.id}
      isInvalid={!!errors?.[input.id]}
      isRequired={input.required}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "start",
          position: "relative",
        }}
      >
        <FormLabel>{input?.label}</FormLabel>
      </div>

      <InfoTooltip describe={input?.describe} />
      <Controller
        name={input.id}
        render={({ field }) => (
          <NumberInputChackra
            {...field}
            value={field.value || ""}
            isDisabled={input?.isDisabled}
            max={max}
            min={min}
          >
            <NumberInputField
              placeholder={input?.placeholder}
              ref={field.ref}
            />
            <NumberInputStepper>
              <NumberIncrementStepper />
              <NumberDecrementStepper />
            </NumberInputStepper>
          </NumberInputChackra>
        )}
        control={control}
      />

      <ErrorMessage id={input.id} />
    </FormControl>
  );
};

export default NumberInput;
