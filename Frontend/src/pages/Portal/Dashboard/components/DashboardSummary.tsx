import {
  getMyActivities,
  getMyActivitiesPendingInteractions,
} from "@apis/dashboard";
import {
  Box,
  Button,
  Flex,
  HStack,
  Icon,
  SimpleGrid,
  Stat,
  StatHelpText,
  StatLabel,
  StatNumber,
  Text,
} from "@chakra-ui/react";
import { useQuery } from "@tanstack/react-query";
import React, { useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { FaExclamationTriangle } from "react-icons/fa";
import { useSearchParams } from "react-router-dom";
import { serializeDashboardMyActivitiesParams } from "@utils/dashboardMyActivitiesParams";

type Props = {
  isNewSinceLastSeen: (updatedAt: string | Date | undefined | null) => boolean;
  markAllSeen: () => void;
};

function isDueOverdue(due: string | Date | null | undefined): boolean {
  if (!due) return false;
  return new Date(due).getTime() < Date.now();
}

const DashboardSummary: React.FC<Props> = ({
  isNewSinceLastSeen,
  markAllSeen,
}) => {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();

  const myActivitiesParamsKey = useMemo(
    () => serializeDashboardMyActivitiesParams(searchParams),
    [searchParams]
  );

  const { data: pending } = useQuery({
    queryKey: ["my-pending-interactions"],
    queryFn: getMyActivitiesPendingInteractions,
    refetchInterval: 60000,
  });

  const { data: activitiesData } = useQuery({
    queryKey: ["my-activities", myActivitiesParamsKey],
    queryFn: getMyActivities,
  });

  const pendingCount = pending?.length ?? 0;
  const ticketsTotal = activitiesData?.pagination?.total ?? 0;

  const overdueCount = useMemo(() => {
    if (!pending?.length) return 0;
    return pending.filter((item) => isDueOverdue(item.due_date)).length;
  }, [pending]);

  const newCount = useMemo(() => {
    let n = 0;
    pending?.forEach((item) => {
      if (isNewSinceLastSeen(item.updatedAt)) n += 1;
    });
    activitiesData?.activities.forEach((item) => {
      if (isNewSinceLastSeen(item.updatedAt)) n += 1;
    });
    return n;
  }, [pending, activitiesData, isNewSinceLastSeen]);

  const scrollToPending = useCallback(() => {
    document
      .getElementById("pending-interactions")
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  const onPendingKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        scrollToPending();
      }
    },
    [scrollToPending]
  );

  return (
    <Box
      p={4}
      bg="bg.card"
      borderRadius="md"
      borderWidth="1px"
      borderColor="chakra-border-color"
    >
      <Flex
        direction={{ base: "column", sm: "row" }}
        align={{ base: "stretch", sm: "center" }}
        justify="space-between"
        gap={4}
        mb={4}
      >
        <Box>
          <Text fontWeight="bold" fontSize="lg">
            {t("dashboard.summary.title")}
          </Text>
          <Text fontSize="sm" color="text.secondary">
            {t("dashboard.summary.subtitle")}
          </Text>
        </Box>
        <Button size="sm" variant="outline" onClick={markAllSeen}>
          {t("dashboard.summary.markAllSeen")}
        </Button>
      </Flex>

      <SimpleGrid columns={{ base: 1, sm: 3 }} spacing={4}>
        <Stat
          as="button"
          type="button"
          textAlign="left"
          p={2}
          mx={-2}
          borderRadius="md"
          cursor="pointer"
          transition="background 0.15s ease"
          _hover={{ bg: "blackAlpha.50", _dark: { bg: "whiteAlpha.50" } }}
          _focusVisible={{
            outline: "none",
            boxShadow: "outline",
          }}
          onClick={scrollToPending}
          onKeyDown={onPendingKeyDown}
          aria-label={t("dashboard.summary.pendingInteractionsScroll")}
        >
          <StatLabel>{t("dashboard.summary.pendingInteractions")}</StatLabel>
          <HStack spacing={2} align="baseline">
            <StatNumber>{pendingCount}</StatNumber>
            {overdueCount > 0 ? (
              <Icon
                as={FaExclamationTriangle}
                color="red.500"
                boxSize={4}
                aria-hidden
                title={t("dashboard.summary.overdueCount", {
                  count: overdueCount,
                })}
              />
            ) : null}
          </HStack>
          {overdueCount > 0 ? (
            <StatHelpText color="red.500" mb={0}>
              {t("dashboard.summary.overdueCount", { count: overdueCount })}
            </StatHelpText>
          ) : null}
        </Stat>
        <Stat>
          <StatLabel>{t("dashboard.summary.myTicketsTotal")}</StatLabel>
          <StatNumber>{ticketsTotal}</StatNumber>
          <StatHelpText>{t("dashboard.summary.myTicketsHint")}</StatHelpText>
        </Stat>
        <Stat>
          <StatLabel>{t("dashboard.summary.newSinceVisit")}</StatLabel>
          <StatNumber>{newCount}</StatNumber>
          <StatHelpText>{t("dashboard.summary.newSinceVisitHint")}</StatHelpText>
        </Stat>
      </SimpleGrid>
    </Box>
  );
};

export default DashboardSummary;
