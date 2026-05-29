import {
  Accordion,
  AccordionButton,
  AccordionIcon,
  AccordionItem,
  AccordionPanel,
  Badge,
  Box,
  Flex,
  FormControl,
  FormLabel,
  Select,
} from "@chakra-ui/react";
import Filter from "@components/organisms/Filter";
import Text from "@components/atoms/Inputs/Text";
import React, { useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useSearchParams } from "react-router-dom";
import TicketNameMultiSelect from "./TicketNameMultiSelect";

const TEXT_FILTER_KEYS = ["protocol", "status", "creator"] as const;

const toolbarFieldProps = {
  flex: { base: "1 1 100%", md: "1 1 0" },
  minW: 0,
  w: { base: "100%", md: "auto" },
} as const;

function useSetListParam() {
  const [, setSearchParams] = useSearchParams();

  return useCallback(
    (key: string, value: string | null) => {
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        next.set("page", "1");
        if (value) {
          next.set(key, value);
        } else {
          next.delete(key);
        }
        return next;
      });
    },
    [setSearchParams]
  );
}

function parseNameParam(raw: string | null): string[] {
  if (!raw) return [];
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

const ActivitiesListFilters: React.FC = () => {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const setListParam = useSetListParam();

  const sortBy = searchParams.get("sortBy") ?? "createdAt";
  const sortDir = searchParams.get("sortDir") ?? "desc";
  const finished = searchParams.get("finished") ?? "";
  const selectedNames = useMemo(
    () => parseNameParam(searchParams.get("name")),
    [searchParams]
  );

  const activeTextFilterCount = useMemo(() => {
    let count = TEXT_FILTER_KEYS.filter((key) => {
      const v = searchParams.get(key);
      return v != null && v !== "";
    }).length;
    if (selectedNames.length > 0) count += 1;
    return count;
  }, [searchParams, selectedNames.length]);

  const handleSelectChange = useCallback(
    (key: string) => (e: React.ChangeEvent<HTMLSelectElement>) => {
      const value = e.target.value;
      setListParam(key, value || null);
    },
    [setListParam]
  );

  const handleNamesChange = useCallback(
    (names: string[]) => {
      setListParam("name", names.length ? names.join(",") : null);
    },
    [setListParam]
  );

  return (
    <Box bg="bg.card" borderRadius="md" mt={4}>
      <Flex
        direction={{ base: "column", md: "row" }}
        gap={4}
        p={4}
        alignItems="flex-end"
        flexWrap="nowrap"
      >
        <FormControl {...toolbarFieldProps}>
          <FormLabel fontSize="sm" mb={1}>
            {t("common.fields.name")}
          </FormLabel>
          <TicketNameMultiSelect
            value={selectedNames}
            onChange={handleNamesChange}
          />
        </FormControl>

        <FormControl {...toolbarFieldProps}>
          <FormLabel fontSize="sm" mb={1}>
            {t("activitiesList.sortBy")}
          </FormLabel>
          <Select size="sm" value={sortBy} onChange={handleSelectChange("sortBy")}>
            <option value="name">{t("common.fields.name")}</option>
            <option value="protocol">{t("common.fields.protocol")}</option>
            <option value="creator">{t("activitiesList.createdBy")}</option>
            <option value="status">{t("common.fields.status")}</option>
            <option value="createdAt">{t("activitiesList.sortCreatedAt")}</option>
            <option value="diadeploy">{t("activitiesList.sortDeployDate")}</option>
          </Select>
        </FormControl>

        <FormControl {...toolbarFieldProps}>
          <FormLabel fontSize="sm" mb={1}>
            {t("activitiesList.sortDir")}
          </FormLabel>
          <Select size="sm" value={sortDir} onChange={handleSelectChange("sortDir")}>
            <option value="desc">{t("activitiesList.sortDescending")}</option>
            <option value="asc">{t("activitiesList.sortAscending")}</option>
          </Select>
        </FormControl>

        <FormControl {...toolbarFieldProps}>
          <FormLabel fontSize="sm" mb={1}>
            {t("common.fields.finished")}
          </FormLabel>
          <Select
            size="sm"
            value={finished}
            onChange={handleSelectChange("finished")}
          >
            <option value="">{t("activitiesList.finishedAll")}</option>
            <option value="false">{t("common.fields.no")}</option>
            <option value="true">{t("common.fields.yes")}</option>
          </Select>
        </FormControl>
      </Flex>

      <Accordion allowToggle reduceMotion defaultIndex={[]}>
        <AccordionItem border="none">
          <AccordionButton px={4} py={2} _hover={{ bg: "blackAlpha.50" }}>
            <Flex flex="1" align="center" gap={2} textAlign="left">
              <Box fontWeight="medium" fontSize="sm">
                {t("activitiesList.moreFilters")}
              </Box>
              {activeTextFilterCount > 0 ? (
                <Badge colorScheme="blue" borderRadius="md">
                  {activeTextFilterCount}
                </Badge>
              ) : null}
            </Flex>
            <AccordionIcon />
          </AccordionButton>
          <AccordionPanel px={0} pb={0} pt={0}>
            <Filter.Container resetPageOnSubmit>
              <Text
                input={{ label: t("common.fields.protocol"), id: "protocol" }}
              />
              <Text input={{ label: t("common.fields.status"), id: "status" }} />
              <Text
                input={{
                  label: t("activitiesList.createdBy"),
                  id: "creator",
                }}
              />
            </Filter.Container>
          </AccordionPanel>
        </AccordionItem>
      </Accordion>
    </Box>
  );
};

export default ActivitiesListFilters;
