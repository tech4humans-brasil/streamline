import { useColorMode } from "@chakra-ui/react";
import React, { useCallback, useMemo } from "react";
import ReactSelect, { MultiValue, StylesConfig } from "react-select";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { getActivityNames } from "@apis/activity";

type Option = { value: string; label: string };

type Props = {
  value: string[];
  onChange: (names: string[]) => void;
  isDisabled?: boolean;
};

/** Matches Chakra `Select` / `Input` size="sm" (h 8, radius md). */
const CONTROL_MIN_HEIGHT = "32px";

const TicketNameMultiSelect: React.FC<Props> = ({
  value,
  onChange,
  isDisabled,
}) => {
  const { t } = useTranslation();
  const { colorMode } = useColorMode();

  // Mesmas cores do Select em components/atoms/Inputs/Select (react-select não resolve tokens Chakra).
  const borderColor = colorMode === "light" ? "#cbd5e0" : "#4a5568";
  const backgroundColor = colorMode === "light" ? "#ffffff" : "#2d3748";
  const backgroundColorSelected =
    colorMode === "light" ? "#90cdf4" : "#395161";
  const backgroundColorHover = colorMode === "light" ? "#e9e9e9" : "#363636";
  const focusBorderColor = colorMode === "light" ? "#3182ce" : "#63b3ed";
  const placeholderColor = colorMode === "light" ? "#718096" : "#a0aec0";
  const color = colorMode === "light" ? "#000000" : "#ffffff";

  const backgroundOption = useCallback(
    (isSelected: boolean, isFocused: boolean) => {
      if (isSelected) return backgroundColorSelected;
      if (isFocused) return backgroundColorHover;
      return backgroundColor;
    },
    [backgroundColor, backgroundColorSelected, backgroundColorHover]
  );

  const { data, isLoading } = useQuery({
    queryKey: ["activity-names"],
    queryFn: getActivityNames,
    staleTime: 1000 * 60 * 5,
  });

  const options = useMemo<Option[]>(
    () =>
      (data?.names ?? []).map((name) => ({
        value: name,
        label: name,
      })),
    [data?.names]
  );

  const selected = useMemo(
    () => options.filter((o) => value.includes(o.value)),
    [options, value]
  );

  const styles: StylesConfig<Option, true> = useMemo(
    () => ({
      container: (provided) => ({
        ...provided,
        width: "100%",
      }),
      control: (provided, state) => ({
        ...provided,
        minHeight: CONTROL_MIN_HEIGHT,
        height: CONTROL_MIN_HEIGHT,
        borderColor: state.isFocused ? focusBorderColor : borderColor,
        borderWidth: "1px",
        borderStyle: "solid",
        borderRadius: "0.375rem",
        backgroundColor,
        boxShadow: state.isFocused ? `0 0 0 1px ${focusBorderColor}` : "none",
        fontSize: "14px",
        cursor: "pointer",
        opacity: isDisabled ? 0.4 : 1,
        "&:hover": {
          borderColor: state.isFocused ? focusBorderColor : borderColor,
        },
      }),
      valueContainer: (provided) => ({
        ...provided,
        height: CONTROL_MIN_HEIGHT,
        maxHeight: CONTROL_MIN_HEIGHT,
        overflow: "hidden",
        flexWrap: "nowrap",
        padding: "0 8px",
      }),
      input: (provided) => ({
        ...provided,
        margin: 0,
        padding: 0,
        color,
      }),
      placeholder: (provided) => ({
        ...provided,
        color: placeholderColor,
        margin: 0,
      }),
      indicatorsContainer: (provided) => ({
        ...provided,
        height: CONTROL_MIN_HEIGHT,
        color,
      }),
      dropdownIndicator: (provided) => ({
        ...provided,
        padding: "0 8px",
        color,
      }),
      clearIndicator: (provided) => ({
        ...provided,
        padding: "0 4px",
        color,
      }),
      multiValue: (provided) => ({
        ...provided,
        backgroundColor: backgroundColorSelected,
        maxWidth: "120px",
      }),
      multiValueLabel: (provided) => ({
        ...provided,
        color,
        fontSize: "12px",
        padding: "0 4px",
      }),
      multiValueRemove: (provided) => ({
        ...provided,
        color,
        ":hover": {
          backgroundColor: backgroundColorSelected,
          color,
        },
      }),
      menu: (provided) => ({
        ...provided,
        borderRadius: "0.375rem",
        backgroundColor,
        border: `1px solid ${borderColor}`,
        zIndex: 3,
        boxShadow: "none",
        overflow: "hidden",
      }),
      menuList: (provided) => ({
        ...provided,
        backgroundColor,
        padding: 0,
      }),
      option: (provided, state) => ({
        ...provided,
        backgroundColor: backgroundOption(state.isSelected, state.isFocused),
        color,
        fontSize: "14px",
        cursor: "pointer",
        ":active": {
          backgroundColor: backgroundColorSelected,
        },
      }),
    }),
    [
      backgroundColor,
      backgroundColorSelected,
      backgroundOption,
      borderColor,
      color,
      focusBorderColor,
      isDisabled,
      placeholderColor,
    ]
  );

  const handleChange = useCallback(
    (next: MultiValue<Option>) => {
      onChange(next.map((o) => o.value));
    },
    [onChange]
  );

  return (
    <ReactSelect
      isMulti
      isClearable
      isLoading={isLoading}
      isDisabled={isDisabled}
      options={options}
      value={selected}
      onChange={handleChange}
      placeholder={t("activitiesList.selectTicketNames")}
      noOptionsMessage={() => t("table.noData")}
      styles={styles}
      closeMenuOnSelect={false}
      classNamePrefix="activities-ticket-name"
    />
  );
};

export default TicketNameMultiSelect;
