import { FormControl, FormLabel, useColorMode } from "@chakra-ui/react";
import React, { useCallback, useMemo } from "react";
import ErrorMessage from "../ErrorMessage";
import { Controller, useFormContext } from "react-hook-form";
import ReactSelect, { StylesConfig } from "react-select";
import InfoTooltip from "../InfoTooltip";

interface SelectProps {
  input: {
    id: string;
    label: string;
    placeholder?: string;
    required?: boolean;
    isDisabled?: boolean;
    options:
      | { value: string; label: string; isDisabled?: boolean }[]
      | {
          label: string;
          options: { value: string; label: string; isDisabled?: boolean }[];
        }[];
    describe?: string;
  };
  isMulti?: boolean;
  isLoading?: boolean;
}

const Select: React.FC<SelectProps> = ({ input, isMulti, isLoading }) => {
  const { colorMode } = useColorMode();

  const {
    formState: { errors },
    control,
  } = useFormContext();

  const borderColor = colorMode === "light" ? "#cbd5e0" : "#4a5568";
  const backgroundColor = colorMode === "light" ? "#fff" : "#2D3748";
  const backgroundColorSelected = colorMode === "light" ? "#90cdf4" : "#395161";
  const backgroundColorHover = colorMode === "light" ? "#e9e9e9" : "#363636";
  const color = colorMode === "light" ? "#000" : "#fff";

  const backgroundOption = useCallback(
    (isSelect: boolean, isFocused: boolean) => {
      if (isSelect) {
        return backgroundColorSelected;
      } else if (isFocused) {
        return backgroundColorHover;
      } else {
        return backgroundColor;
      }
    },
    [backgroundColor, backgroundColorSelected, backgroundColorHover]
  );

  const styles: StylesConfig = useMemo(() => {
    return {
      control: (provided) => ({
        ...provided,
        borderColor: "none",
        backgroundColor: "none",
        borderRadius: "0.375rem",
        boxShadow: "none",
        opacity: input.isDisabled ? 0.4 : 1,
      }),
      input: (provided) => ({
        ...provided,
        color: color,
      }),
      singleValue: (provided) => ({
        ...provided,
        color: color,
      }),
      menu: (provided) => ({
        ...provided,
        borderRadius: "0.375rem",
        boxShadow: "none",
        backgroundColor: backgroundColor,
        border: `1px solid ${borderColor}`,
      }),
      option: (provided, state) => ({
        ...provided,
        backgroundColor: backgroundOption(state.isSelected, state.isFocused),
        color: color,
        "&:hover": {
          backgroundColor: backgroundColorHover,
          color: color,
        },
      }),
      multiValue: (provided) => ({
        ...provided,
        backgroundColor: backgroundColorSelected,
        color: color,
      }),
      multiValueLabel: (provided) => ({
        ...provided,
        color: color,
      }),
    };
  }, [
    borderColor,
    backgroundColor,
    backgroundColorSelected,
    backgroundColorHover,
    color,
    input.isDisabled,
  ]);

  const searchValue = useCallback(
    (value: string | string[]) => {
      const allOptions = input.options
        .map((option) => {
          if ("options" in option) {
            return option?.options;
          } else {
            return option;
          }
        })
        .flat();

      if (Array.isArray(value)) {
        return allOptions.filter(
          (option) => option?.value && value.includes(option.value)
        );
      } else {
        return allOptions.find((option) => option?.value === value) ?? null;
      }
    },
    [input.options]
  );

  return (
    <FormControl
      id={input.id}
      isInvalid={!!errors?.[input.id]}
      isRequired={input.required}
      isDisabled={input?.isDisabled}
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
        render={({ field: { onChange, value, ref } }) => (
          <ReactSelect
            value={searchValue(value)}
            ref={ref}
            onChange={(newValue: unknown) => {
              const value = newValue as { value: string }[] | { value: string };

              if (!value) {
                onChange(null);
                return;
              }

              if (Array.isArray(value)) {
                onChange(value?.map((v) => v.value));
              } else {
                onChange(value?.value);
              }
            }}
            noOptionsMessage={() => "Sem opções"}
            options={input?.options}
            placeholder={input.placeholder ?? "Selecione uma opção"}
            isMulti={isMulti}
            isClearable={!input?.required}
            styles={styles}
            isLoading={isLoading}
            isDisabled={input?.isDisabled}
          />
        )}
        rules={{ required: !!input.required }}
      />
      <ErrorMessage id={input.id} />
    </FormControl>
  );
};

export default Select;
