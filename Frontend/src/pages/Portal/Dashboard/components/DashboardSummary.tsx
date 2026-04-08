import {
  getMyActivities,
  getMyActivitiesPendingInteractions,
} from "@apis/dashboard";
import {
  Box,
  Button,
  Flex,
  SimpleGrid,
  Stat,
  StatHelpText,
  StatLabel,
  StatNumber,
  Text,
} from "@chakra-ui/react";
import { useQuery } from "@tanstack/react-query";
import React, { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useSearchParams } from "react-router-dom";

type Props = {
  isNewSinceLastSeen: (updatedAt: string | Date | undefined | null) => boolean;
  markAllSeen: () => void;
};

const DashboardSummary: React.FC<Props> = ({
  isNewSinceLastSeen,
  markAllSeen,
}) => {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();

  const { data: pending } = useQuery({
    queryKey: ["my-pending-interactions"],
    queryFn: getMyActivitiesPendingInteractions,
    refetchInterval: 60000,
  });

  const { data: activitiesData } = useQuery({
    queryKey: ["my-activities", searchParams.toString()],
    queryFn: getMyActivities,
  });

  const pendingCount = pending?.length ?? 0;
  const ticketsTotal = activitiesData?.pagination?.total ?? 0;

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
        <Stat>
          <StatLabel>{t("dashboard.summary.pendingInteractions")}</StatLabel>
          <StatNumber>{pendingCount}</StatNumber>
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
