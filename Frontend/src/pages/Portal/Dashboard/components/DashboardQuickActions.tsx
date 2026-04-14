import { Box, Button, Flex, Text } from "@chakra-ui/react";
import Can from "@components/atoms/Can";
import React, { useCallback } from "react";
import { useTranslation } from "react-i18next";
import OpenForms from "./OpenForms";

const scrollToId = (id: string) => {
  document.getElementById(id)?.scrollIntoView({
    behavior: "smooth",
    block: "start",
  });
};

const DashboardQuickActions: React.FC = () => {
  const { t } = useTranslation();

  const onPending = useCallback(() => scrollToId("pending-interactions"), []);
  const onTickets = useCallback(() => scrollToId("my-activities"), []);

  return (
    <Box
      id="quick-actions"
      p={4}
      bg="bg.card"
      borderRadius="md"
      borderWidth="1px"
      borderColor="chakra-border-color"
      w="100%"
    >
      <Text fontWeight="bold" fontSize="sm" mb={3}>
        {t("dashboard.quickActions.title")}
      </Text>
      <Flex
        gap={2}
        flexWrap="wrap"
        align="center"
        justify={{ base: "stretch", sm: "flex-start" }}
      >
        <Button size="sm" variant="outline" onClick={onPending}>
          {t("dashboard.quickActions.goPending")}
        </Button>
        <Button size="sm" variant="outline" onClick={onTickets}>
          {t("dashboard.quickActions.goTickets")}
        </Button>
        <Can permission="activity.create">
          <OpenForms />
        </Can>
      </Flex>
    </Box>
  );
};

export default DashboardQuickActions;
