import { getMyActivitiesPendingInteractions } from "@apis/dashboard";
import {
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
import React, { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { FaEye, FaPen, FaSync } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { convertDateTime } from "@utils/date";

type IItem = Awaited<ReturnType<typeof getMyActivitiesPendingInteractions>>[0];

type Props = {
  isNewSinceLastSeen: (updatedAt: string | Date | undefined | null) => boolean;
};

const PendingInteractions: React.FC<Props> = ({ isNewSinceLastSeen }) => {
  const [t] = useTranslation();
  const { data, isLoading, refetch } = useQuery({
    queryKey: ["my-pending-interactions"],
    queryFn: getMyActivitiesPendingInteractions,
    refetchInterval: 60000,
  });

  const navigate = useNavigate();

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

      <Stack spacing={2}>
        {data?.map((activity) => {
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
                  <Text noOfLines={1}>
                    <Text as="span" fontWeight="medium" color="text.primary">
                      {t("dashboard.pendingCard.form")}
                    </Text>{" "}
                    {activity.form?.name ?? "—"}
                  </Text>
                  {requester ? (
                    <>
                      <Text color="gray.400" aria-hidden>
                        ·
                      </Text>
                      <Text noOfLines={1}>
                        <Text as="span" fontWeight="medium" color="text.primary">
                          {t("dashboard.pendingCard.requester")}
                        </Text>{" "}
                        {requester}
                      </Text>
                    </>
                  ) : null}
                  {activity.due_date ? (
                    <>
                      <Text color="gray.400" aria-hidden>
                        ·
                      </Text>
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
        })}
      </Stack>
    </Box>
  );
};

export default PendingInteractions;
