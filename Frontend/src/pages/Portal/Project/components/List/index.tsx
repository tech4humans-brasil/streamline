import { Box, Tabs, TabList, TabPanels, Tab, TabPanel } from "@chakra-ui/react";
import { useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useCallback } from "react";
import WorkflowsTab from "../Tabs/Workflows";
import FormsTab from "../Tabs/Forms";
import EmailsTab from "../Tabs/Emails";
import StatusesTab from "../Tabs/Statuses";
import SchedulesTab from "../Tabs/Schedules";

const List: React.FC = () => {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedTab = searchParams.get('tab') || '0';

  const handleTabChange = useCallback((index: number) => {
    setSearchParams({ tab: index.toString() });
  }, [setSearchParams]);

  return (
    <Box w="full" p={[4, 2]}>
      <Tabs
        variant="enclosed"
        index={parseInt(selectedTab)}
        onChange={handleTabChange}
      >
        <TabList>
          <Tab>{t("workflows.title")}</Tab>
          <Tab>{t("forms.title")}</Tab>
          <Tab>{t("emails.title")}</Tab>
          <Tab>{t("statuses.title")}</Tab>
          <Tab>{t("schedule.title")}</Tab>
        </TabList>

        <TabPanels>
          <TabPanel>
            <WorkflowsTab />
          </TabPanel>

          <TabPanel>
            <FormsTab />
          </TabPanel>

          <TabPanel>
            <EmailsTab />
          </TabPanel>

          <TabPanel>
            <StatusesTab />
          </TabPanel>

          <TabPanel>
            <SchedulesTab />
          </TabPanel>
        </TabPanels>
      </Tabs>
    </Box>
  );
};

export default List;
