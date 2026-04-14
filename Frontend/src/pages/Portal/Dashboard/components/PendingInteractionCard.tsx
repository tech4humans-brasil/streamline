import {
  Badge,
  Flex,
  HStack,
  IconButton,
  Text,
  Tooltip,
  VStack,
} from "@chakra-ui/react";
import DueDateIndicator from "@components/atoms/DueDateIndicatior";
import StatusTag from "@components/atoms/StatusTag";
import type { PendingInteractionListItem } from "@utils/pendingInteractionFilters";
import React from "react";
import type { TFunction } from "i18next";
import { FaEye, FaPen } from "react-icons/fa";
import { convertDateTime } from "@utils/date";

type Props = {
  activity: PendingInteractionListItem;
  t: TFunction;
  showNewBadge: boolean;
  showStatusTag?: boolean;
  onView: (activity: PendingInteractionListItem) => void;
  onRespond: (activity: PendingInteractionListItem) => void;
};

const PendingInteractionCard: React.FC<Props> = ({
  activity,
  t,
  showNewBadge,
  showStatusTag = true,
  onView,
  onRespond,
}) => {
  const requester = activity?.users[0]?.name;
  const ticketStatus = activity.ticketStatus;
  const assigneeName = activity.assignee?.name;

  return (
    <Flex
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
          {showNewBadge && (
            <Badge colorScheme="green" fontSize="0.6rem">
              {t("dashboard.badge.new")}
            </Badge>
          )}
          {showStatusTag && ticketStatus?.name ? (
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
            onClick={() => onView(activity)}
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
              onClick={() => onRespond(activity)}
            />
          </Tooltip>
        ) : null}
      </HStack>
    </Flex>
  );
};

export default PendingInteractionCard;
