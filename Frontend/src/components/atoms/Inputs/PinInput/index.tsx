import {
  FormControl,
  FormLabel,
  NumberInput,
  PinInput as PinInputChackra,
  PinInputField,
  HStack,
} from "@chakra-ui/react";
import React from "react";
import { Controller, useFormContext } from "react-hook-form";
import ErrorMessage from "../ErrorMessage";
import InfoTooltip from "../InfoTooltip";

type IOption = { value: string; label: string };

interface PinInputProps {
  input: {
    id: string;
    label: string;
    placeholder?: string;
    required?: boolean;
    options: IOption[];
    describe?: string | null;
  };
}

const PinInput: React.FC<PinInputProps> = ({ input }) => {
  const {
    formState: { errors },
    control,
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
        control={control}
        render={({ field }) => (
          <HStack spacing={4}>
            <PinInputChackra
              {...field}
              value={field.value}
              onChange={(value) => field.onChange(value)}
              type="number"
            >
              <PinInputField />
              <PinInputField />
              <PinInputField />
              <PinInputField />
              <PinInputField />
              <PinInputField />
            </PinInputChackra>
          </HStack>
        )}
        rules={{ required: !!input.required }}
      />
      <ErrorMessage id={input.id} />
    </FormControl>
  );
};

export default PinInput;
