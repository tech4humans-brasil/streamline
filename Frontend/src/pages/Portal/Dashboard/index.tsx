import React from "react";
import MyActivities from "./components/MyActivities";
import { Box, Flex, Grid, Heading, Text } from "@chakra-ui/react";
import OpenForms from "./components/OpenForms";
import PendingInteractions from "./components/MyPendingInteractions";
import DashboardSummary from "./components/DashboardSummary";
import Can from "@components/atoms/Can";
import Tutorial, { JoyrideSteps } from "@components/molecules/Tutorial";
import { useDashboardLastSeen } from "@hooks/useDashboardLastSeen";
import { useConfig } from "@hooks/useConfig";
import useAuth from "@hooks/useAuth";
import { useTranslation } from "react-i18next";

const steps: JoyrideSteps = [
  {
    target: "#open-forms",
    content: "dashboard.joyride.open-forms",
  },
  {
    target: "#my-activities",
    content: "dashboard.joyride.my-activities",
  },
  {
    target: "#pending-interactions",
    content: "dashboard.joyride.pending-interactions",
  },
  {
    target: "#switch-theme",
    content: "dashboard.joyride.switch-theme",
  },
  {
    target: "#profile-menu",
    content: "dashboard.joyride.profile-menu",
  },
];

const Dashboard: React.FC = () => {
  const { t } = useTranslation();
  const [authData] = useAuth();
  const { data: config } = useConfig(authData?.slug);
  const { markAllSeen, isNewSinceLastSeen } = useDashboardLastSeen();

  return (
    <Flex p={[4, 8]} width="100%" direction="column" gap={6}>
      <Tutorial steps={steps} name="dashboard" />

      <Flex
        id="open-forms"
        w="100%"
        justify="space-between"
        align="center"
        wrap="wrap"
        gap={4}
      >
        <Box>
          <Heading size="lg">{t("title.dashboard")}</Heading>
          <Text fontSize="sm" color="text.secondary" mt={1}>
            {[config?.name, t("welcome.title")].filter(Boolean).join(" · ")}
          </Text>
        </Box>
        <Can permission="activity.create">
          <OpenForms />
        </Can>
      </Flex>

      <DashboardSummary
        isNewSinceLastSeen={isNewSinceLastSeen}
        markAllSeen={markAllSeen}
      />

      <Grid
        templateColumns={{ base: "1fr", lg: "minmax(300px, 0.38fr) 1fr" }}
        gap={{ base: 6, lg: 8 }}
        alignItems="start"
        w="100%"
      >
        <Box
          minW={0}
          w="100%"
          position={{ base: "static", lg: "sticky" }}
          top={{ lg: 4 }}
          alignSelf="start"
        >
          <PendingInteractions isNewSinceLastSeen={isNewSinceLastSeen} />
        </Box>
        <Box minW={0} w="100%">
          <MyActivities isNewSinceLastSeen={isNewSinceLastSeen} />
        </Box>
      </Grid>
    </Flex>
  );
};

export default Dashboard;
