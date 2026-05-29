import { useColorModeValue } from "@chakra-ui/react";
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
  const borderColor = useColorModeValue("gray.200", "whiteAlpha.300");
  const bg = useColorModeValue("white", "gray.700");
  const focusBorderColor = useColorModeValue("blue.500", "blue.300");
  const placeholderColor = useColorModeValue("gray.500", "gray.400");
  const tagBg = useColorModeValue("blue.100", "blue.900");
  const tagColor = useColorModeValue("gray.800", "white");
  const menuBg = useColorModeValue("white", "gray.700");
  const optionHoverBg = useColorModeValue("gray.100", "whiteAlpha.200");
  const optionSelectedBg = useColorModeValue("blue.50", "blue.900");

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
        backgroundColor: bg,
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
        color: "inherit",
      }),
      placeholder: (provided) => ({
        ...provided,
        color: placeholderColor,
        margin: 0,
      }),
      indicatorsContainer: (provided) => ({
        ...provided,
        height: CONTROL_MIN_HEIGHT,
      }),
      dropdownIndicator: (provided) => ({
        ...provided,
        padding: "0 8px",
      }),
      clearIndicator: (provided) => ({
        ...provided,
        padding: "0 4px",
      }),
      multiValue: (provided) => ({
        ...provided,
        backgroundColor: tagBg,
        maxWidth: "120px",
      }),
      multiValueLabel: (provided) => ({
        ...provided,
        color: tagColor,
        fontSize: "12px",
        padding: "0 4px",
      }),
      multiValueRemove: (provided) => ({
        ...provided,
        color: tagColor,
        ":hover": {
          backgroundColor: tagBg,
          color: tagColor,
        },
      }),
      menu: (provided) => ({
        ...provided,
        borderRadius: "0.375rem",
        backgroundColor: menuBg,
        border: `1px solid ${borderColor}`,
        zIndex: 3,
        boxShadow: "md",
      }),
      option: (provided, state) => ({
        ...provided,
        backgroundColor: state.isSelected
          ? optionSelectedBg
          : state.isFocused
            ? optionHoverBg
            : menuBg,
        color: "inherit",
        fontSize: "14px",
        cursor: "pointer",
      }),
    }),
    [
      bg,
      borderColor,
      focusBorderColor,
      isDisabled,
      menuBg,
      optionHoverBg,
      optionSelectedBg,
      placeholderColor,
      tagBg,
      tagColor,
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
