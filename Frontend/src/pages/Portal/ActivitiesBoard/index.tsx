import {
  Box,
  Flex,
  Heading,
  Text,
  Select,
  FormControl,
  FormLabel,
  Spinner,
  Button,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  useDisclosure,
  Checkbox,
  Stack,
  Divider,
} from "@chakra-ui/react";
import { useQuery } from "@tanstack/react-query";
import React, { useCallback, useMemo } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { getActivities, ActivityListItem } from "@apis/activity";
import { getStatuses } from "@apis/status";
import { IFormType } from "@interfaces/Form";
import { FaArrowLeft } from "react-icons/fa";
import { MdTune } from "react-icons/md";
import {
  useActivitiesBoardCardSettings,
  ACTIVITIES_BOARD_BUILT_IN_KEYS,
} from "@hooks/useActivitiesBoardCardSettings";
import KanbanBoardCard from "./KanbanBoardCard";

const FORM_TYPES = [
  IFormType.Created,
  IFormType.Interaction,
  IFormType.TimeTrigger,
  IFormType.External,
] as const;

const ActivitiesBoard: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { project = "" } = useParams<{ project: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const formType = searchParams.get("formType") ?? "";
  const { isOpen, onOpen, onClose } = useDisclosure();

  const {
    builtInKeys,
    formFieldIds,
    toggleBuiltIn,
    toggleFormField,
    reset,
  } = useActivitiesBoardCardSettings(project);

  const activitiesQuery = useMemo(() => {
    const q = new URLSearchParams();
    q.set("finished", "false");
    q.set("project", project);
    q.set("limit", "200");
    q.set("page", "1");
    if (formType) {
      q.set("formType", formType);
    }
    return q.toString();
  }, [project, formType]);

  const statusesQuery = useMemo(() => {
    const q = new URLSearchParams();
    q.set("project", project);
    q.set("type", "progress");
    q.set("limit", "100");
    q.set("page", "1");
    return q.toString();
  }, [project]);

  const {
    data: activitiesData,
    isFetching: activitiesLoading,
    isError: activitiesError,
  } = useQuery({
    queryKey: ["activities", activitiesQuery],
    queryFn: getActivities,
    enabled: !!project,
  });

  const {
    data: statusesData,
    isFetching: statusesLoading,
    isError: statusesError,
  } = useQuery({
    queryKey: ["statuses", statusesQuery],
    queryFn: getStatuses,
    enabled: !!project,
  });

  const activities = activitiesData?.activities ?? [];

  const discoveredFormFields = useMemo(() => {
    const map = new Map<string, string>();
    for (const a of activities) {
      for (const f of a.form_draft?.fields ?? []) {
        if (f.id && f.type !== "section" && !map.has(f.id)) {
          map.set(f.id, f.label || f.id);
        }
      }
    }
    return [...map.entries()].map(([id, label]) => ({ id, label }));
  }, [activities]);

  const statuses = useMemo(() => {
    const list = statusesData?.statuses ?? [];
    return [...list].sort((a, b) => a.name.localeCompare(b.name));
  }, [statusesData?.statuses]);

  const columns = useMemo(() => {
    const map = new Map<string, ActivityListItem[]>();
    for (const s of statuses) {
      map.set(String(s._id), []);
    }
    for (const a of activities) {
      if (a.status?.type !== "progress") continue;
      const key = String(a.status._id);
      if (map.has(key)) {
        map.get(key)!.push(a);
      }
    }
    return map;
  }, [activities, statuses]);

  const handleFormTypeChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      const v = e.target.value;
      const next = new URLSearchParams(searchParams);
      if (v) {
        next.set("formType", v);
      } else {
        next.delete("formType");
      }
      setSearchParams(next);
    },
    [searchParams, setSearchParams]
  );

  const handleOpenActivity = useCallback(
    (id: string) => {
      navigate(`/portal/activity/${id}`);
    },
    [navigate]
  );

  if (!project) {
    return (
      <Box width="100%" p="10">
        <Text color="red.500">{t("activitiesBoard.noProject")}</Text>
      </Box>
    );
  }

  const loading = activitiesLoading || statusesLoading;
  const error = activitiesError || statusesError;

  return (
    <Box width="100%" p="6">
      <Flex align="center" gap="4" mb="6" flexWrap="wrap">
        <Button
          variant="ghost"
          leftIcon={<FaArrowLeft />}
          onClick={() => navigate(-1)}
          size="sm"
        >
          {t("activitiesBoard.back")}
        </Button>
        <Heading size="lg">{t("activitiesBoard.title")}</Heading>
        <Button
          size="sm"
          variant="outline"
          leftIcon={<MdTune />}
          onClick={onOpen}
        >
          {t("activitiesBoard.customizeCard")}
        </Button>
      </Flex>

      <Modal isOpen={isOpen} onClose={onClose} size="lg">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>{t("activitiesBoard.customizeCard")}</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Text fontSize="sm" color="gray.600" mb="4">
              {t("activitiesBoard.customizeHint")}
            </Text>
            <Text fontWeight="semibold" fontSize="sm" mb="2">
              {t("activitiesBoard.builtInFields")}
            </Text>
            <Stack spacing={2} mb={4}>
              {ACTIVITIES_BOARD_BUILT_IN_KEYS.map((key) => (
                <Checkbox
                  key={key}
                  isChecked={builtInKeys.includes(key)}
                  onChange={(e) => toggleBuiltIn(key, e.target.checked)}
                >
                  {t(`activitiesBoard.builtIn.${key}`)}
                </Checkbox>
              ))}
            </Stack>
            <Divider my={4} />
            <Text fontWeight="semibold" fontSize="sm" mb="2">
              {t("activitiesBoard.formFields")}
            </Text>
            {discoveredFormFields.length === 0 ? (
              <Text fontSize="sm" color="gray.500">
                {t("activitiesBoard.noFormFieldsHint")}
              </Text>
            ) : (
              <Stack spacing={2} maxH="240px" overflowY="auto">
                {discoveredFormFields.map(({ id, label }) => (
                  <Checkbox
                    key={id}
                    isChecked={formFieldIds.includes(id)}
                    onChange={(e) => toggleFormField(id, e.target.checked)}
                  >
                    {label}{" "}
                    <Text as="span" fontSize="xs" color="gray.500">
                      ({id})
                    </Text>
                  </Checkbox>
                ))}
              </Stack>
            )}
          </ModalBody>
          <ModalFooter gap={2}>
            <Button variant="ghost" onClick={reset}>
              {t("activitiesBoard.resetCardFields")}
            </Button>
            <Button colorScheme="blue" onClick={onClose}>
              {t("activitiesBoard.done")}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      <FormControl maxW="320px" mb="6">
        <FormLabel>{t("activitiesBoard.formTypeFilter")}</FormLabel>
        <Select value={formType} onChange={handleFormTypeChange}>
          <option value="">{t("activitiesBoard.formTypeAll")}</option>
          {FORM_TYPES.map((type) => (
            <option key={type} value={type}>
              {t(`forms.type.${type}`, { defaultValue: type })}
            </option>
          ))}
        </Select>
      </FormControl>

      {loading && (
        <Flex justify="center" py="10">
          <Spinner size="lg" />
        </Flex>
      )}

      {error && !loading && (
        <Text color="red.500">{t("activitiesBoard.error")}</Text>
      )}

      {!loading && !error && (
        <Flex
          gap="4"
          overflowX="auto"
          pb="4"
          align="flex-start"
          minH="320px"
        >
          {statuses.map((status) => (
            <Box
              key={status._id}
              flex="0 0 auto"
              minW="280px"
              maxW="300px"
              bg="bg.card"
              borderRadius="md"
              borderWidth="1px"
              borderColor="gray.200"
              p="3"
            >
              <Text fontWeight="bold" mb="3" fontSize="sm">
                {status.name}
              </Text>
              <Flex direction="column" gap="2">
                {(columns.get(String(status._id)) ?? []).length === 0 ? (
                  <Text fontSize="sm" color="gray.500">
                    {t("activitiesBoard.columnEmpty")}
                  </Text>
                ) : (
                  (columns.get(String(status._id)) ?? []).map((a) => (
                    <KanbanBoardCard
                      key={a._id}
                      activity={a}
                      builtInKeys={builtInKeys}
                      formFieldIds={formFieldIds}
                      onOpen={handleOpenActivity}
                      t={t}
                    />
                  ))
                )}
              </Flex>
            </Box>
          ))}
        </Flex>
      )}
    </Box>
  );
};

export default ActivitiesBoard;
