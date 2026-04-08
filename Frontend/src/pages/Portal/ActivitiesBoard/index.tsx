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
  Input,
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
  useToast,
  useColorModeValue,
  IconButton,
  Tooltip,
} from "@chakra-ui/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  DndContext,
  DragEndEvent,
  PointerSensor,
  closestCorners,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import type { TFunction } from "i18next";
import { getActivities, ActivityListItem, updateActivityStatus } from "@apis/activity";
import { getStatuses } from "@apis/status";
import { FaArrowLeft } from "react-icons/fa";
import { MdTune, MdUnfoldLess, MdUnfoldMore } from "react-icons/md";
import {
  useActivitiesBoardCardSettings,
  ACTIVITIES_BOARD_BUILT_IN_KEYS,
} from "@hooks/useActivitiesBoardCardSettings";
import { useActivitiesBoardCollapsedColumns } from "@hooks/useActivitiesBoardCollapsedColumns";
import KanbanBoardCard from "./KanbanBoardCard";
import usePermission from "@hooks/usePermission";

function KanbanColumnDropzone({
  statusId,
  children,
  minH = "120px",
}: {
  statusId: string;
  children: React.ReactNode;
  minH?: string;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: statusId });
  const highlight = useColorModeValue("blue.50", "whiteAlpha.100");
  return (
    <Flex
      ref={setNodeRef}
      direction="column"
      gap={2}
      minH={minH}
      p={1}
      mx={-1}
      borderRadius="md"
      bg={isOver ? highlight : "transparent"}
      transition="background 0.15s ease"
    >
      {children}
    </Flex>
  );
}

function DraggableActivityCard({
  activity,
  builtInKeys,
  formFieldIds,
  onOpen,
  t,
  disabled,
}: {
  activity: ActivityListItem;
  builtInKeys: string[];
  formFieldIds: string[];
  onOpen: (id: string) => void;
  t: TFunction;
  disabled: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: activity._id,
      disabled,
    });
  const style: React.CSSProperties = {
    transform: disabled ? undefined : CSS.Translate.toString(transform),
    opacity: isDragging ? 0.55 : 1,
    touchAction: disabled ? undefined : "none",
  };
  return (
    <Box
      ref={setNodeRef}
      style={style}
      {...(disabled ? {} : listeners)}
      {...(disabled ? {} : attributes)}
    >
      <KanbanBoardCard
        activity={activity}
        builtInKeys={builtInKeys}
        formFieldIds={formFieldIds}
        onOpen={onOpen}
        t={t}
      />
    </Box>
  );
}

const ActivitiesBoard: React.FC = () => {
  const { t } = useTranslation();
  const toast = useToast();
  const queryClient = useQueryClient();
  const { userCan } = usePermission();
  const navigate = useNavigate();
  const { project = "" } = useParams<{ project: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const canDragBoard = userCan("activity.update");
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 10 },
    })
  );

  const {
    builtInKeys,
    formFieldIds,
    toggleBuiltIn,
    toggleFormField,
    reset,
  } = useActivitiesBoardCardSettings(project);

  const {
    isCollapsed,
    toggle: toggleColumnCollapse,
    expandAll: expandAllColumns,
    collapseAll: collapseAllColumns,
  } = useActivitiesBoardCollapsedColumns(project);

  const nameFromUrl = searchParams.get("name") ?? "";
  const protocolFromUrl = searchParams.get("protocol") ?? "";
  const assigneeFromUrl = searchParams.get("assignee") ?? "";

  useEffect(() => {
    if (!searchParams.get("formType")) return;
    const next = new URLSearchParams(searchParams);
    next.delete("formType");
    setSearchParams(next, { replace: true });
  }, [searchParams, setSearchParams]);

  const activitiesQuery = useMemo(() => {
    const q = new URLSearchParams();
    q.set("finished", "false");
    q.set("project", project);
    q.set("limit", "200");
    q.set("page", "1");
    if (nameFromUrl.length >= 3) {
      q.set("name", nameFromUrl);
    }
    if (protocolFromUrl.length >= 3) {
      q.set("protocol", protocolFromUrl);
    }
    if (assigneeFromUrl) {
      q.set("assignee", assigneeFromUrl);
    }
    return q.toString();
  }, [project, nameFromUrl, protocolFromUrl, assigneeFromUrl]);

  const statusMutation = useMutation({
    mutationFn: updateActivityStatus,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["activities", activitiesQuery],
      });
    },
    onError: () => {
      toast({
        title: t("activitiesBoard.dragStatusError"),
        status: "error",
        duration: 6000,
        isClosable: true,
      });
    },
  });

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

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over) return;
      const activityId = String(active.id);
      const newStatusId = String(over.id);
      const act = activities.find((a) => String(a._id) === activityId);
      if (!act) return;
      if (String(act.status?._id) === newStatusId) return;
      statusMutation.mutate({ id: activityId, statusId: newStatusId });
    },
    [activities, statusMutation]
  );

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
    return [...list].sort((a, b) => {
      const oa = a.order ?? 0;
      const ob = b.order ?? 0;
      if (oa !== ob) return oa - ob;
      return a.name.localeCompare(b.name);
    });
  }, [statusesData?.statuses]);

  const [draftName, setDraftName] = useState(nameFromUrl);
  const [draftProtocol, setDraftProtocol] = useState(protocolFromUrl);

  useEffect(() => {
    setDraftName(nameFromUrl);
    setDraftProtocol(protocolFromUrl);
  }, [nameFromUrl, protocolFromUrl, project]);

  const assigneeOptions = useMemo(() => {
    const m = new Map<string, string>();
    for (const a of activities) {
      if (a.assignee?._id && a.assignee.name) {
        m.set(String(a.assignee._id), a.assignee.name);
      }
    }
    return [...m.entries()]
      .map(([id, name]) => ({ id, name }))
      .sort((x, y) => x.name.localeCompare(y.name));
  }, [activities]);

  const applyBoardFilters = useCallback(() => {
    const next = new URLSearchParams(searchParams);
    if (draftName.trim().length >= 3) {
      next.set("name", draftName.trim());
    } else {
      next.delete("name");
    }
    if (draftProtocol.trim().length >= 3) {
      next.set("protocol", draftProtocol.trim());
    } else {
      next.delete("protocol");
    }
    setSearchParams(next);
  }, [draftName, draftProtocol, searchParams, setSearchParams]);

  const handleAssigneeFilterChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      const v = e.target.value;
      const next = new URLSearchParams(searchParams);
      if (v) {
        next.set("assignee", v);
      } else {
        next.delete("assignee");
      }
      setSearchParams(next);
    },
    [searchParams, setSearchParams]
  );

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
        <Button
          size="sm"
          variant="outline"
          onClick={expandAllColumns}
          isDisabled={!statuses.length}
        >
          {t("activitiesBoard.expandAllColumns")}
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() =>
            collapseAllColumns(statuses.map((s) => String(s._id)))
          }
          isDisabled={!statuses.length}
        >
          {t("activitiesBoard.collapseAllColumns")}
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

      <Flex gap={6} mb="6" flexWrap="wrap" align="flex-end">
        <FormControl maxW="240px">
          <FormLabel>{t("activitiesBoard.filterNameLabel")}</FormLabel>
          <Input
            value={draftName}
            onChange={(e) => setDraftName(e.target.value)}
            placeholder={t("activitiesBoard.filterNamePlaceholder")}
            onKeyDown={(e) => {
              if (e.key === "Enter") applyBoardFilters();
            }}
          />
        </FormControl>
        <FormControl maxW="200px">
          <FormLabel>{t("activitiesBoard.filterProtocolLabel")}</FormLabel>
          <Input
            value={draftProtocol}
            onChange={(e) => setDraftProtocol(e.target.value)}
            placeholder={t("activitiesBoard.filterProtocolPlaceholder")}
            onKeyDown={(e) => {
              if (e.key === "Enter") applyBoardFilters();
            }}
          />
        </FormControl>
        <FormControl maxW="260px">
          <FormLabel>{t("activitiesBoard.filterAssigneeLabel")}</FormLabel>
          <Select
            value={assigneeFromUrl}
            onChange={handleAssigneeFilterChange}
          >
            <option value="">{t("activitiesBoard.filterAssigneeAll")}</option>
            {assigneeOptions.map(({ id, name }) => (
              <option key={id} value={id}>
                {name}
              </option>
            ))}
          </Select>
        </FormControl>
        <Button size="md" colorScheme="blue" onClick={applyBoardFilters}>
          {t("activitiesBoard.applyFilters")}
        </Button>
      </Flex>
      <Text fontSize="xs" color="gray.500" mb="6">
        {t("activitiesBoard.filterNameHint")}
      </Text>

      {loading && (
        <Flex justify="center" py="10">
          <Spinner size="lg" />
        </Flex>
      )}

      {error && !loading && (
        <Text color="red.500">{t("activitiesBoard.error")}</Text>
      )}

      {!loading && !error && (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragEnd={handleDragEnd}
        >
          <Flex
            gap="4"
            overflowX="auto"
            pb="4"
            align="flex-start"
            minH="320px"
          >
            {statuses.map((status) => {
              const statusId = String(status._id);
              const colItems = columns.get(statusId) ?? [];
              const colCount = colItems.length;
              const columnCollapsed = isCollapsed(statusId);
              return (
                <Box
                  key={status._id}
                  flex="0 0 auto"
                  minW={columnCollapsed ? "52px" : "280px"}
                  maxW={columnCollapsed ? "56px" : "300px"}
                  bg="bg.card"
                  borderRadius="md"
                  borderWidth="1px"
                  borderColor="gray.200"
                  p={columnCollapsed ? "2" : "3"}
                >
                  {columnCollapsed ? (
                    <Flex direction="column" align="center" gap={2} mb={2}>
                      <Tooltip label={t("activitiesBoard.expandColumn")}>
                        <IconButton
                          aria-label={t("activitiesBoard.expandColumn")}
                          icon={<MdUnfoldMore />}
                          size="xs"
                          variant="ghost"
                          onClick={() => toggleColumnCollapse(statusId)}
                        />
                      </Tooltip>
                      <Text
                        fontSize="xs"
                        fontWeight="bold"
                        lineHeight="1.2"
                        maxH="140px"
                        noOfLines={5}
                        title={status.name}
                        sx={{
                          writingMode: "vertical-rl",
                          transform: "rotate(180deg)",
                        }}
                      >
                        {status.name}
                      </Text>
                      <Text
                        fontSize="xs"
                        fontWeight="semibold"
                        color="gray.500"
                        aria-label={t("activitiesBoard.columnCountAria", {
                          count: colCount,
                        })}
                      >
                        {colCount}
                      </Text>
                    </Flex>
                  ) : (
                    <Flex
                      align="center"
                      justify="space-between"
                      gap={1}
                      mb="3"
                    >
                      <Flex
                        align="baseline"
                        justify="flex-start"
                        gap={2}
                        flex="1"
                        minW={0}
                        wrap="wrap"
                      >
                        <Text
                          fontWeight="bold"
                          fontSize="sm"
                          noOfLines={2}
                          flex="1"
                        >
                          {status.name}
                        </Text>
                        <Text
                          fontSize="xs"
                          fontWeight="semibold"
                          color="gray.500"
                          flexShrink={0}
                          aria-label={t("activitiesBoard.columnCountAria", {
                            count: colCount,
                          })}
                        >
                          {colCount}
                        </Text>
                      </Flex>
                      <Tooltip label={t("activitiesBoard.collapseColumn")}>
                        <IconButton
                          aria-label={t("activitiesBoard.collapseColumn")}
                          icon={<MdUnfoldLess />}
                          size="xs"
                          variant="ghost"
                          flexShrink={0}
                          onClick={() => toggleColumnCollapse(statusId)}
                        />
                      </Tooltip>
                    </Flex>
                  )}
                  <KanbanColumnDropzone
                    statusId={statusId}
                    minH={columnCollapsed ? "240px" : "120px"}
                  >
                    {columnCollapsed ? (
                      <Flex
                        flex="1"
                        minH="220px"
                        align="center"
                        justify="center"
                        px={0}
                      >
                        <Text
                          fontSize="10px"
                          color="gray.400"
                          textAlign="center"
                          lineHeight="1.3"
                          sx={{
                            writingMode: "vertical-rl",
                            transform: "rotate(180deg)",
                          }}
                        >
                          {t("activitiesBoard.columnCollapsedDropHint")}
                        </Text>
                      </Flex>
                    ) : colCount === 0 ? (
                      <Text fontSize="sm" color="gray.500">
                        {t("activitiesBoard.columnEmpty")}
                      </Text>
                    ) : (
                      colItems.map((a) => (
                        <DraggableActivityCard
                          key={a._id}
                          activity={a}
                          builtInKeys={builtInKeys}
                          formFieldIds={formFieldIds}
                          onOpen={handleOpenActivity}
                          t={t}
                          disabled={!canDragBoard || statusMutation.isPending}
                        />
                      ))
                    )}
                  </KanbanColumnDropzone>
                </Box>
              );
            })}
          </Flex>
        </DndContext>
      )}
    </Box>
  );
};

export default ActivitiesBoard;
