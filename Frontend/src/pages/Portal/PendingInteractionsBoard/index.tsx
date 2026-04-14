import {
  Box,
  Button,
  Divider,
  Flex,
  Heading,
  HStack,
  Input,
  Select,
  Spinner,
  Stack,
  Text,
  useColorModeValue,
  useToast,
  Wrap,
} from "@chakra-ui/react";
import { getMyActivitiesPendingInteractions } from "@apis/dashboard";
import { updateActivityStatus } from "@apis/activity";
import { getProjects } from "@apis/project";
import { getStatuses } from "@apis/status";
import usePermission from "@hooks/usePermission";
import IStatus from "@interfaces/Status";
import PendingInteractionCard from "@pages/Portal/Dashboard/components/PendingInteractionCard";
import {
  pendingInteractionMatchesFilters,
  PendingInteractionListItem,
  sortPendingInteractionsInColumn,
} from "@utils/pendingInteractionFilters";
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
import { useMutation, useQueries, useQuery, useQueryClient } from "@tanstack/react-query";
import React, { useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import type { TFunction } from "i18next";
import { FaArrowLeft } from "react-icons/fa";
import { useNavigate, useSearchParams } from "react-router-dom";

const PROJECTS_LIST_QUERY = "page=1&limit=500";
const NONE_PROJECT_KEY = "__none__";

function buildStatusesQuery(projectId: string): string {
  const q = new URLSearchParams();
  q.set("project", projectId);
  q.set("type", "progress");
  q.set("limit", "100");
  q.set("page", "1");
  return q.toString();
}

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

function DraggablePendingCard({
  activity,
  t,
  showNewBadge,
  onView,
  onRespond,
  disabled,
}: {
  activity: PendingInteractionListItem;
  t: TFunction;
  showNewBadge: boolean;
  onView: (a: PendingInteractionListItem) => void;
  onRespond: (a: PendingInteractionListItem) => void;
  disabled: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: String(activity._id),
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
      <PendingInteractionCard
        activity={activity}
        t={t}
        showNewBadge={showNewBadge}
        showStatusTag={false}
        onView={onView}
        onRespond={onRespond}
      />
    </Box>
  );
}

function sortStatusesByOrder(a: IStatus, b: IStatus): number {
  const oa = a.order ?? 0;
  const ob = b.order ?? 0;
  if (oa !== ob) return oa - ob;
  return a.name.localeCompare(b.name);
}

function mergeColumnStatuses(
  apiStatuses: IStatus[],
  items: PendingInteractionListItem[]
): IStatus[] {
  const sortedApi = [...apiStatuses].sort(sortStatusesByOrder);
  const seen = new Set(sortedApi.map((s) => String(s._id)));
  const extras: IStatus[] = [];
  for (const it of items) {
    const ts = it.ticketStatus;
    if (ts?._id && !seen.has(String(ts._id))) {
      seen.add(String(ts._id));
      extras.push(ts);
    }
  }
  extras.sort((a, b) => a.name.localeCompare(b.name));
  return [...sortedApi, ...extras];
}

function fallbackColumnsFromItems(
  items: PendingInteractionListItem[]
): IStatus[] {
  const map = new Map<string, IStatus>();
  for (const it of items) {
    const s = it.ticketStatus;
    if (s?._id) map.set(String(s._id), s);
  }
  return [...map.values()].sort((a, b) => a.name.localeCompare(b.name));
}

function projectKeyFromItem(item: PendingInteractionListItem): string {
  const p = item.form?.project;
  if (p == null || String(p) === "") return NONE_PROJECT_KEY;
  return String(p);
}

const PendingInteractionsBoard: React.FC = () => {
  const { t } = useTranslation();
  const toast = useToast();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { userCan } = usePermission();
  const canDrag = userCan("activity.update");

  const piStatus = searchParams.get("piStatus");
  const piAssignee = searchParams.get("piAssignee");
  const piSearch = searchParams.get("piSearch");

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 10 },
    })
  );

  const { data, isLoading, isError } = useQuery({
    queryKey: ["my-pending-interactions"],
    queryFn: getMyActivitiesPendingInteractions,
    refetchInterval: 60000,
  });

  const { data: projectsData } = useQuery({
    queryKey: ["projects", PROJECTS_LIST_QUERY],
    queryFn: () =>
      getProjects({ queryKey: ["projects", PROJECTS_LIST_QUERY] }),
  });

  const projectNameById = useMemo(() => {
    const m = new Map<string, string>();
    for (const p of projectsData?.projects ?? []) {
      m.set(String(p._id), p.name);
    }
    return m;
  }, [projectsData?.projects]);

  const filteredItems = useMemo(() => {
    if (!data?.length) return [];
    return data.filter((item) =>
      pendingInteractionMatchesFilters(item, piStatus, piAssignee, piSearch)
    );
  }, [data, piStatus, piAssignee, piSearch]);

  const distinctProjectIds = useMemo(() => {
    const s = new Set<string>();
    for (const item of filteredItems) {
      const k = projectKeyFromItem(item);
      if (k !== NONE_PROJECT_KEY) s.add(k);
    }
    return [...s].sort();
  }, [filteredItems]);

  const statusQueries = useQueries({
    queries: distinctProjectIds.map((projectId) => ({
      queryKey: ["statuses", "pending-interactions-board", projectId],
      queryFn: () =>
        getStatuses({
          queryKey: ["statuses", buildStatusesQuery(projectId)],
        }),
      staleTime: 60_000,
    })),
  });

  const statusesByProjectId = useMemo(() => {
    const m = new Map<string, IStatus[]>();
    distinctProjectIds.forEach((id, i) => {
      const list = statusQueries[i]?.data?.statuses ?? [];
      m.set(id, list);
    });
    return m;
  }, [distinctProjectIds, statusQueries]);

  const statusLoading = statusQueries.some((q) => q.isLoading);

  const itemsByProject = useMemo(() => {
    const m = new Map<string, PendingInteractionListItem[]>();
    for (const item of filteredItems) {
      const key = projectKeyFromItem(item);
      const list = m.get(key) ?? [];
      list.push(item);
      m.set(key, list);
    }
    return m;
  }, [filteredItems]);

  const sectionKeys = useMemo(() => {
    const keys = [...itemsByProject.keys()];
    return keys.sort((a, b) => {
      if (a === NONE_PROJECT_KEY) return 1;
      if (b === NONE_PROJECT_KEY) return -1;
      const na = projectNameById.get(a) ?? a;
      const nb = projectNameById.get(b) ?? b;
      return na.localeCompare(nb);
    });
  }, [itemsByProject, projectNameById]);

  const statusMutation = useMutation({
    mutationFn: updateActivityStatus,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-pending-interactions"] });
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

  const handleView = useCallback(
    (activity: PendingInteractionListItem) => {
      navigate(`/portal/activity/${activity._id}`);
    },
    [navigate]
  );

  const handleRespond = useCallback(
    (activity: PendingInteractionListItem) => {
      if (!activity.form?.slug) return;
      navigate(`/response/${activity.form.slug}`, {
        state: { activity_id: activity._id },
      });
    },
    [navigate]
  );

  const setFilterParam = useCallback(
    (key: string, value: string | null) => {
      setSearchParams((prev) => {
        const n = new URLSearchParams(prev);
        if (value) n.set(key, value);
        else n.delete(key);
        return n;
      });
    },
    [setSearchParams]
  );

  const clearFilters = useCallback(() => {
    setSearchParams((prev) => {
      const n = new URLSearchParams(prev);
      n.delete("piStatus");
      n.delete("piAssignee");
      n.delete("piSearch");
      return n;
    });
  }, [setSearchParams]);

  const statusOptions = useMemo(() => {
    if (!data?.length) return [];
    const map = new Map<string, { _id: string; name: string }>();
    for (const item of data) {
      const s = item.ticketStatus;
      if (s?._id) map.set(s._id, { _id: s._id, name: s.name });
    }
    return [...map.values()].sort((a, b) => a.name.localeCompare(b.name));
  }, [data]);

  const assigneeOptions = useMemo(() => {
    if (!data?.length) return [];
    const map = new Map<string, { _id: string; name: string }>();
    for (const item of data) {
      const a = item.assignee;
      if (a?._id && a.name) map.set(a._id, { _id: a._id, name: a.name });
    }
    return [...map.values()].sort((a, b) => a.name.localeCompare(b.name));
  }, [data]);

  const hasAssigneeUnassigned = useMemo(
    () => Boolean(data?.some((i) => !i.assignee?._id)),
    [data]
  );

  const makeDragEndHandler = useCallback(
    (projectItems: PendingInteractionListItem[]) => (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over) return;
      const activityId = String(active.id);
      const newStatusId = String(over.id);
      const act = projectItems.find((a) => String(a._id) === activityId);
      if (!act) return;
      if (String(act.ticketStatus?._id) === newStatusId) return;
      statusMutation.mutate({ id: activityId, statusId: newStatusId });
    },
    [statusMutation]
  );

  const showFilteredEmpty =
    !isLoading && data && data.length > 0 && filteredItems.length === 0;

  return (
    <Box width="100%" p={{ base: 4, md: 6 }}>
      <Flex align="center" gap={4} mb={6} flexWrap="wrap">
        <Button
          variant="ghost"
          leftIcon={<FaArrowLeft />}
          onClick={() => navigate("/portal")}
          size="sm"
        >
          {t("dashboard.pendingBoard.back")}
        </Button>
        <Heading size="lg">{t("dashboard.pendingBoard.title")}</Heading>
      </Flex>

      <Text fontSize="sm" color="text.secondary" mb={4}>
        {t("dashboard.pendingBoard.description")}
      </Text>

      <Wrap spacing={3} mb={6} align="flex-end">
        <Box minW={{ base: "100%", sm: "160px" }} flex="1">
          <Text fontSize="xs" mb={1} color="text.secondary">
            {t("dashboard.pendingFilters.status")}
          </Text>
          <Select
            size="sm"
            value={piStatus ?? ""}
            onChange={(e) =>
              setFilterParam("piStatus", e.target.value || null)
            }
          >
            <option value="">{t("dashboard.status.all")}</option>
            {statusOptions.map((s) => (
              <option key={s._id} value={s._id}>
                {s.name}
              </option>
            ))}
          </Select>
        </Box>
        <Box minW={{ base: "100%", sm: "180px" }} flex="1">
          <Text fontSize="xs" mb={1} color="text.secondary">
            {t("dashboard.pendingFilters.assignee")}
          </Text>
          <Select
            size="sm"
            value={piAssignee ?? ""}
            onChange={(e) =>
              setFilterParam("piAssignee", e.target.value || null)
            }
          >
            <option value="">{t("dashboard.pendingFilters.assigneeAll")}</option>
            {hasAssigneeUnassigned ? (
              <option value="unassigned">
                {t("dashboard.pendingFilters.assigneeUnassigned")}
              </option>
            ) : null}
            {assigneeOptions.map((a) => (
              <option key={a._id} value={a._id}>
                {a.name}
              </option>
            ))}
          </Select>
        </Box>
        <Box minW={{ base: "100%", md: "200px" }} flex="1.5">
          <Text fontSize="xs" mb={1} color="text.secondary">
            {t("dashboard.pendingFilters.search")}
          </Text>
          <Input
            size="sm"
            value={piSearch ?? ""}
            placeholder={t("common.fields.search")}
            onChange={(e) =>
              setFilterParam("piSearch", e.target.value || null)
            }
          />
        </Box>
        <Button size="sm" variant="ghost" onClick={clearFilters}>
          {t("dashboard.pendingFilters.clear")}
        </Button>
      </Wrap>

      <Divider mb={6} />

      {isLoading && (
        <Flex justify="center" py={10}>
          <Spinner size="lg" />
        </Flex>
      )}

      {isError && !isLoading && (
        <Text color="red.500">{t("table.error")}</Text>
      )}

      {!isLoading && !isError && (!data || data.length === 0) && (
        <Text fontSize="sm" color="text.secondary">
          {t("table.noData")}
        </Text>
      )}

      {showFilteredEmpty && (
        <Text fontSize="sm" color="text.secondary">
          {t("dashboard.pendingFilters.noResults")}
        </Text>
      )}

      {!isLoading &&
        !isError &&
        filteredItems.length > 0 &&
        statusLoading &&
        distinctProjectIds.length > 0 && (
          <Flex justify="center" py={6}>
            <Spinner size="md" />
          </Flex>
        )}

      {!isLoading &&
        !isError &&
        filteredItems.length > 0 &&
        !(statusLoading && distinctProjectIds.length > 0) &&
        sectionKeys.map((projectKey) => {
          const items = itemsByProject.get(projectKey) ?? [];
          const apiStatuses =
            projectKey === NONE_PROJECT_KEY
              ? []
              : statusesByProjectId.get(projectKey) ?? [];
          const columnStatuses =
            projectKey === NONE_PROJECT_KEY
              ? fallbackColumnsFromItems(items)
              : mergeColumnStatuses(apiStatuses, items);

          const columnMap = new Map<string, PendingInteractionListItem[]>();
          for (const s of columnStatuses) {
            columnMap.set(String(s._id), []);
          }
          for (const it of items) {
            const sid = it.ticketStatus?._id;
            if (sid && columnMap.has(String(sid))) {
              columnMap.get(String(sid))!.push(it);
            }
          }
          for (const [k, list] of columnMap) {
            columnMap.set(k, sortPendingInteractionsInColumn(list));
          }

          const title =
            projectKey === NONE_PROJECT_KEY
              ? t("dashboard.pendingBoard.noProject")
              : projectNameById.get(projectKey) ?? projectKey;

          if (columnStatuses.length === 0 && items.length > 0) {
            return (
              <Box key={projectKey} mb={10}>
                <Heading size="md" mb={4}>
                  {title}
                </Heading>
                <Stack spacing={2}>
                  {sortPendingInteractionsInColumn(items).map((activity) => (
                    <PendingInteractionCard
                      key={String(activity._id)}
                      activity={activity}
                      t={t}
                      showNewBadge={false}
                      showStatusTag
                      onView={handleView}
                      onRespond={handleRespond}
                    />
                  ))}
                </Stack>
              </Box>
            );
          }

          return (
            <Box key={projectKey} mb={10}>
              <Heading size="md" mb={4}>
                {title}
              </Heading>
              <DndContext
                sensors={sensors}
                collisionDetection={closestCorners}
                onDragEnd={makeDragEndHandler(items)}
              >
                <Flex
                  gap={4}
                  overflowX="auto"
                  pb={4}
                  align="flex-start"
                  minH="280px"
                >
                  {columnStatuses.map((status) => {
                    const statusId = String(status._id);
                    const colItems = columnMap.get(statusId) ?? [];
                    const colCount = colItems.length;
                    return (
                      <Box
                        key={status._id}
                        flex="0 0 auto"
                        minW="280px"
                        maxW="300px"
                        bg="bg.card"
                        borderRadius="md"
                        borderWidth="1px"
                        borderColor="gray.200"
                        p={3}
                      >
                        <HStack
                          align="baseline"
                          justify="flex-start"
                          gap={2}
                          mb={3}
                          flexWrap="wrap"
                        >
                          <Text fontWeight="bold" fontSize="sm" noOfLines={2}>
                            {status.name}
                          </Text>
                          <Text
                            fontSize="xs"
                            fontWeight="semibold"
                            color="gray.500"
                          >
                            {colCount}
                          </Text>
                        </HStack>
                        <KanbanColumnDropzone statusId={statusId}>
                          {colCount === 0 ? (
                            <Text fontSize="sm" color="gray.500">
                              {t("activitiesBoard.columnEmpty")}
                            </Text>
                          ) : (
                            colItems.map((activity) => (
                              <DraggablePendingCard
                                key={String(activity._id)}
                                activity={activity}
                                t={t}
                                showNewBadge={false}
                                onView={handleView}
                                onRespond={handleRespond}
                                disabled={
                                  !canDrag || statusMutation.isPending
                                }
                              />
                            ))
                          )}
                        </KanbanColumnDropzone>
                      </Box>
                    );
                  })}
                </Flex>
              </DndContext>
            </Box>
          );
        })}
    </Box>
  );
};

export default PendingInteractionsBoard;
