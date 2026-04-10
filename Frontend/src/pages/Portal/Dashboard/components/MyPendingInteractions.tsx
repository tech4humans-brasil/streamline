import { getMyActivitiesPendingInteractions } from "@apis/dashboard";
import {
  Accordion,
  AccordionButton,
  AccordionIcon,
  AccordionItem,
  AccordionPanel,
  Badge,
  Box,
  Divider,
  Flex,
  Heading,
  HStack,
  IconButton,
  Spinner,
  Stack,
  Text,
  Tooltip,
  VStack,
} from "@chakra-ui/react";
import DueDateIndicator from "@components/atoms/DueDateIndicatior";
import StatusTag from "@components/atoms/StatusTag";
import { useQuery } from "@tanstack/react-query";
import React, { useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { FaEye, FaPen, FaSync } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
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

const PendingInteractions: React.FC<Props> = ({ isNewSinceLastSeen }) => {
  const [t] = useTranslation();
  const { data, isLoading, refetch } = useQuery({
    queryKey: ["my-pending-interactions"],
    queryFn: getMyActivitiesPendingInteractions,
    refetchInterval: 60000,
  });

  const navigate = useNavigate();

  const { groups, defaultOpenIndexes } = useMemo(() => {
    if (!data?.length) return { groups: [] as FormGroup[], defaultOpenIndexes: [] as number[] };

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

    const ordered = sortGroups(formGroups);
    const defaultOpenIndexes = ordered
      .map((g, index) =>
        g.items.some((i) => isOverdue(i.due_date)) ? index : -1
      )
      .filter((i) => i >= 0);

    return { groups: ordered, defaultOpenIndexes };
  }, [data, t]);

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
            {activity.due_date ? (
              <>
                {requester ? (
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

      <Divider my={3} />

      {isLoading && <Spinner size="sm" />}

      {!isLoading && (!data || data.length === 0) && (
        <Text fontSize="sm" color="text.secondary">
          {t("table.noData")}
        </Text>
      )}

      {!isLoading && groups.length > 0 && (
        <Accordion
          allowMultiple
          reduceMotion
          defaultIndex={defaultOpenIndexes}
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
