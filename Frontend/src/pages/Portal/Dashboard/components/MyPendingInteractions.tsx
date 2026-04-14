import { getMyActivitiesPendingInteractions } from "@apis/dashboard";
import {
  Accordion,
  AccordionButton,
  AccordionIcon,
  AccordionItem,
  AccordionPanel,
  Badge,
  Box,
  Button,
  Divider,
  Flex,
  Heading,
  HStack,
  IconButton,
  Input,
  Select,
  Spinner,
  Stack,
  Text,
  Tooltip,
  VStack,
  Wrap,
} from "@chakra-ui/react";
import DueDateIndicator from "@components/atoms/DueDateIndicatior";
import StatusTag from "@components/atoms/StatusTag";
import { useQuery } from "@tanstack/react-query";
import React, { useCallback, useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { FaEye, FaPen, FaSync } from "react-icons/fa";
import { useNavigate, useSearchParams } from "react-router-dom";
import { convertDateTime } from "@utils/date";

type IItem = Awaited<ReturnType<typeof getMyActivitiesPendingInteractions>>[0];

type Props = {
  isNewSinceLastSeen: (updatedAt: string | Date | undefined | null) => boolean;
};

type FormGroup = {
  id: string;
  label: string;
  items: IItem[];
};

const PI_OPEN_SEP = ",";

function serializePiOpenIds(ids: string[]): string {
  return ids.map((id) => encodeURIComponent(id)).join(PI_OPEN_SEP);
}

function parsePiOpen(raw: string | null): string[] {
  if (raw == null || raw === "") return [];
  return raw
    .split(PI_OPEN_SEP)
    .map((s) => {
      try {
        return decodeURIComponent(s.trim());
      } catch {
        return s.trim();
      }
    })
    .filter(Boolean);
}

function isOverdue(due: string | Date | null | undefined): boolean {
  if (!due) return false;
  return new Date(due).getTime() < Date.now();
}

function groupId(item: IItem): string {
  return item.form?._id ?? item.form?.slug ?? item.form?.name ?? "__other__";
}

function minDueTime(items: IItem[]): number {
  let m = Infinity;
  for (const i of items) {
    if (i.due_date) {
      const t = new Date(i.due_date).getTime();
      if (t < m) m = t;
    }
  }
  return m;
}

function sortItemsInGroup(items: IItem[]): IItem[] {
  return [...items].sort((a, b) => {
    const aOver = isOverdue(a.due_date);
    const bOver = isOverdue(b.due_date);
    if (aOver !== bOver) return aOver ? -1 : 1;
    const ad = a.due_date ? new Date(a.due_date).getTime() : Infinity;
    const bd = b.due_date ? new Date(b.due_date).getTime() : Infinity;
    if (ad !== bd) return ad - bd;
    return (
      new Date(b.updatedAt ?? 0).getTime() -
      new Date(a.updatedAt ?? 0).getTime()
    );
  });
}

function sortGroups(groups: FormGroup[]): FormGroup[] {
  return [...groups].sort((a, b) => {
    const aOver = a.items.some((i) => isOverdue(i.due_date));
    const bOver = b.items.some((i) => isOverdue(i.due_date));
    if (aOver !== bOver) return aOver ? -1 : 1;
    const cmp = minDueTime(a.items) - minDueTime(b.items);
    if (cmp !== 0) return cmp;
    return b.items.length - a.items.length;
  });
}

function buildGroups(data: IItem[], t: (k: string) => string): FormGroup[] {
  const map = new Map<string, IItem[]>();
  for (const item of data) {
    const id = groupId(item);
    const list = map.get(id) ?? [];
    list.push(item);
    map.set(id, list);
  }

  const formGroups: FormGroup[] = [];
  for (const [, items] of map) {
    const sorted = sortItemsInGroup(items);
    const first = sorted[0];
    const label =
      first?.form?.name ??
      first?.form?.slug ??
      t("dashboard.pendingGroup.noForm");
    formGroups.push({
      id: groupId(first),
      label,
      items: sorted,
    });
  }

  return sortGroups(formGroups);
}

function defaultOpenIndexesForOverdue(groups: FormGroup[]): number[] {
  return groups
    .map((g, index) =>
      g.items.some((i) => isOverdue(i.due_date)) ? index : -1
    )
    .filter((i) => i >= 0);
}

function itemMatchesFilters(
  item: IItem,
  piStatus: string | null,
  piAssignee: string | null,
  piSearch: string | null
): boolean {
  if (piStatus && item.ticketStatus?._id !== piStatus) return false;
  if (piAssignee === "unassigned") {
    if (item.assignee?._id) return false;
  } else if (piAssignee && item.assignee?._id !== piAssignee) {
    return false;
  }
  if (piSearch?.trim()) {
    const q = piSearch.trim().toLowerCase();
    const hay = [item.protocol, item.name, item.description]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    if (!hay.includes(q)) return false;
  }
  return true;
}

function resolveAccordionIndex(
  groups: FormGroup[],
  searchParams: URLSearchParams,
  overdueDefaults: number[]
): number[] {
  if (!searchParams.has("piOpen")) {
    return overdueDefaults;
  }
  const raw = searchParams.get("piOpen");
  if (raw === "") {
    return [];
  }
  const ids = parsePiOpen(raw);
  const open: number[] = [];
  groups.forEach((g, i) => {
    if (ids.includes(g.id)) open.push(i);
  });
  return open;
}

const PendingInteractions: React.FC<Props> = ({ isNewSinceLastSeen }) => {
  const [t] = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const { data, isLoading, refetch } = useQuery({
    queryKey: ["my-pending-interactions"],
    queryFn: getMyActivitiesPendingInteractions,
    refetchInterval: 60000,
  });

  const navigate = useNavigate();

  const piStatus = searchParams.get("piStatus");
  const piAssignee = searchParams.get("piAssignee");
  const piSearch = searchParams.get("piSearch");

  const filteredItems = useMemo(() => {
    if (!data?.length) return [];
    return data.filter((item) =>
      itemMatchesFilters(item, piStatus, piAssignee, piSearch)
    );
  }, [data, piStatus, piAssignee, piSearch]);

  const { groups, overdueDefaults } = useMemo(() => {
    if (!filteredItems.length) {
      return { groups: [] as FormGroup[], overdueDefaults: [] as number[] };
    }
    const g = buildGroups(filteredItems, t);
    return {
      groups: g,
      overdueDefaults: defaultOpenIndexesForOverdue(g),
    };
  }, [filteredItems, t]);

  const accordionIndex = useMemo(
    () => resolveAccordionIndex(groups, searchParams, overdueDefaults),
    [groups, searchParams, overdueDefaults]
  );

  useEffect(() => {
    if (!searchParams.has("piOpen")) return;
    const raw = searchParams.get("piOpen");
    if (raw === null || raw === "") return;
    const ids = parsePiOpen(raw);
    const valid = new Set(groups.map((g) => g.id));
    const next = ids.filter((id) => valid.has(id));
    if (next.length === ids.length) return;
    setSearchParams(
      (prev) => {
        const n = new URLSearchParams(prev);
        if (next.length === 0) n.delete("piOpen");
        else n.set("piOpen", serializePiOpenIds(next));
        return n;
      },
      { replace: true }
    );
  }, [groups, searchParams, setSearchParams]);

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

  const onAccordionChange = useCallback(
    (expandedIndex: number | number[]) => {
      const indexes = Array.isArray(expandedIndex)
        ? expandedIndex
        : [expandedIndex];
      const ids = indexes
        .map((i) => groups[i]?.id)
        .filter((id): id is string => Boolean(id));
      setSearchParams((prev) => {
        const n = new URLSearchParams(prev);
        if (ids.length === 0) {
          n.set("piOpen", "");
        } else {
          n.set("piOpen", serializePiOpenIds(ids));
        }
        return n;
      });
    },
    [groups, setSearchParams]
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

  const clearPendingFilters = useCallback(() => {
    setSearchParams((prev) => {
      const n = new URLSearchParams(prev);
      n.delete("piStatus");
      n.delete("piAssignee");
      n.delete("piSearch");
      return n;
    });
  }, [setSearchParams]);

  const handleResponse = useCallback(
    (activity: IItem) => {
      if (!activity.form?.slug) return;
      navigate(`/response/${activity.form.slug}`, {
        state: {
          activity_id: activity._id,
        },
      });
    },
    [navigate]
  );

  const handleView = useCallback(
    (activity: IItem) => {
      navigate(`/portal/activity/${activity._id}`);
    },
    [navigate]
  );

  const renderCard = (activity: IItem) => {
    const showNew = isNewSinceLastSeen(activity.updatedAt);
    const requester = activity?.users[0]?.name;
    const ticketStatus = activity.ticketStatus;
    const assigneeName = activity.assignee?.name;

    return (
      <Flex
        key={activity._id}
        align="flex-start"
        gap={2}
        py={2}
        px={2}
        borderWidth="1px"
        borderRadius="md"
        borderColor="chakra-border-color"
        _hover={{ bg: "blackAlpha.50", _dark: { bg: "whiteAlpha.50" } }}
      >
        <VStack align="stretch" spacing={0.5} flex="1" minW={0}>
          <HStack spacing={1.5} flexWrap="wrap" align="center">
            <Text fontSize="xs" fontFamily="mono" fontWeight="semibold">
              {activity.protocol}
            </Text>
            {showNew && (
              <Badge colorScheme="green" fontSize="0.6rem">
                {t("dashboard.badge.new")}
              </Badge>
            )}
            {ticketStatus?.name ? (
              <StatusTag status={ticketStatus} size="sm" />
            ) : null}
          </HStack>

          <Text fontSize="sm" fontWeight="medium" noOfLines={1}>
            {activity.name}
          </Text>

          <Text fontSize="xs" color="text.secondary" noOfLines={2}>
            {activity.description}
          </Text>

          <Flex
            gap={2}
            flexWrap="wrap"
            align="center"
            rowGap={1}
            columnGap={2}
            pt={0.5}
            fontSize="xs"
            color="text.secondary"
          >
            {requester ? (
              <Text noOfLines={1}>
                <Text as="span" fontWeight="medium" color="text.primary">
                  {t("dashboard.pendingCard.requester")}
                </Text>{" "}
                {requester}
              </Text>
            ) : null}
            {assigneeName ? (
              <>
                {requester ? (
                  <Text color="gray.400" aria-hidden>
                    ·
                  </Text>
                ) : null}
                <Text noOfLines={1}>
                  <Text as="span" fontWeight="medium" color="text.primary">
                    {t("dashboard.pendingCard.assignee")}
                  </Text>{" "}
                  {assigneeName}
                </Text>
              </>
            ) : null}
            {activity.due_date ? (
              <>
                {requester || assigneeName ? (
                  <Text color="gray.400" aria-hidden>
                    ·
                  </Text>
                ) : null}
                <HStack spacing={1}>
                  <Text as="span" fontWeight="medium" color="text.primary">
                    {t("dashboard.pendingCard.due")}
                  </Text>
                  <DueDateIndicator
                    dueDate={activity.due_date}
                    fontSize="xs"
                    hideWhenEmpty
                  />
                </HStack>
              </>
            ) : null}
            <Text color="gray.400" aria-hidden>
              ·
            </Text>
            <Text whiteSpace="nowrap">
              <Text as="span" fontWeight="medium" color="text.primary">
                {t("dashboard.pendingCard.updated")}
              </Text>{" "}
              {activity.updatedAt
                ? convertDateTime(activity.updatedAt, {
                    day: "2-digit",
                    month: "short",
                    hour: "2-digit",
                    minute: "2-digit",
                  })
                : "—"}
            </Text>
          </Flex>
        </VStack>

        <HStack spacing={0} flexShrink={0} align="flex-start">
          <Tooltip label={t("dashboard.pendingActions.viewTicket")}>
            <IconButton
              size="sm"
              variant="ghost"
              aria-label={t("dashboard.pendingActions.viewTicket")}
              icon={<FaEye />}
              onClick={() => handleView(activity)}
            />
          </Tooltip>
          {activity.form?.slug ? (
            <Tooltip label={t("dashboard.pendingActions.respond")}>
              <IconButton
                size="sm"
                variant="ghost"
                colorScheme="blue"
                aria-label={t("dashboard.pendingActions.respond")}
                icon={<FaPen />}
                onClick={() => handleResponse(activity)}
              />
            </Tooltip>
          ) : null}
        </HStack>
      </Flex>
    );
  };

  const showFilteredEmpty =
    !isLoading &&
    data &&
    data.length > 0 &&
    filteredItems.length === 0;

  return (
    <Box p={3} bg="bg.card" borderRadius="md" id="pending-interactions">
      <Flex align="flex-start" gap={3} wrap="wrap">
        <Box flex="1" minW="200px">
          <Heading size="sm">{t("dashboard.title.interactionPending")}</Heading>
          <Text fontSize="xs" color="text.secondary" mt={0.5}>
            {t("dashboard.description.interactionPending")}
          </Text>
        </Box>
        <IconButton
          ml={{ base: 0, md: "auto" }}
          size="sm"
          aria-label={t("common.refresh")}
          icon={<FaSync />}
          onClick={() => refetch()}
          isLoading={isLoading}
        />
      </Flex>

      <Wrap spacing={3} mt={3} align="flex-end">
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
        <Button size="sm" variant="ghost" onClick={clearPendingFilters}>
          {t("dashboard.pendingFilters.clear")}
        </Button>
      </Wrap>

      <Divider my={3} />

      {isLoading && <Spinner size="sm" />}

      {!isLoading && (!data || data.length === 0) && (
        <Text fontSize="sm" color="text.secondary">
          {t("table.noData")}
        </Text>
      )}

      {showFilteredEmpty && (
        <Text fontSize="sm" color="text.secondary">
          {t("dashboard.pendingFilters.noResults")}
        </Text>
      )}

      {!isLoading && groups.length > 0 && (
        <Accordion
          allowMultiple
          reduceMotion
          index={accordionIndex}
          onChange={onAccordionChange}
        >
          {groups.map((group) => (
            <AccordionItem key={group.id} border="none" mb={2}>
              <AccordionButton
                borderRadius="md"
                px={3}
                py={2}
                bg="blackAlpha.50"
                _dark={{ bg: "whiteAlpha.50" }}
                _hover={{ bg: "blackAlpha.100", _dark: { bg: "whiteAlpha.100" } }}
              >
                <Flex flex="1" align="center" gap={2} textAlign="left" wrap="wrap">
                  <Text fontWeight="semibold" fontSize="sm">
                    {group.label}
                  </Text>
                  <Badge colorScheme="blue" borderRadius="md">
                    {group.items.length}
                  </Badge>
                </Flex>
                <AccordionIcon />
              </AccordionButton>
              <AccordionPanel px={0} pt={2} pb={0}>
                <Stack spacing={2}>{group.items.map(renderCard)}</Stack>
              </AccordionPanel>
            </AccordionItem>
          ))}
        </Accordion>
      )}
    </Box>
  );
};

export default PendingInteractions;
