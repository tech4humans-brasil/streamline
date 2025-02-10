import { getMyActivities } from "@apis/dashboard";
import {
  Box,
  Button,
  Flex,
  Heading,
  IconButton,
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
} from "@chakra-ui/react";
import Table from "@components/organisms/Table";
import { IActivityState } from "@interfaces/Activitiy";
import { useQuery } from "@tanstack/react-query";
import { convertDateTime } from "@utils/date";
import React, { useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { FaEye, FaPen, FaSync } from "react-icons/fa";
import { useNavigate } from "react-router-dom";

const columns = [
  {
    key: "protocol",
    label: "common.fields.protocol",
  },
  {
    key: "name",
    label: "common.fields.name",
  },
  {
    key: "description",
    label: "common.fields.description",
  },
  {
    key: "createdAt",
    label: "common.fields.createdAt",
  },
  {
    key: "actions",
    label: "common.fields.actions",
  },
];

const columnsFinished = [
  {
    key: "protocol",
    label: "common.fields.protocol",
  },
  {
    key: "name",
    label: "common.fields.name",
  },
  {
    key: "description",
    label: "common.fields.description",
  },
  {
    key: "createdAt",
    label: "common.fields.createdAt",
  },
  {
    key: "finished_at",
    label: "common.fields.finishedAt",
  },
  {
    key: "actions",
    label: "common.fields.actions",
  },
];

type IItem = Awaited<ReturnType<typeof getMyActivities>>["activities"][0];

const MyActivities: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["my-activities"],
    queryFn: getMyActivities,
  });

  const handleView = useCallback(
    (activity: IItem) => {
      navigate(`/portal/activity/${activity._id}`);
    },
    [navigate]
  );

  const handleEdit = useCallback(
    (activity: IItem) => {
      navigate(`/response/${activity._id}/edit`);
    },
    [navigate]
  );

  const rows = useMemo(() => {
    if (!data || data.activities.length === 0) return null;

    return data.activities.map((activity) => ({
      ...activity,
      createdAt: convertDateTime(activity.createdAt),
      actions: (
        <Flex>
          <Button mr={2} onClick={() => handleView(activity)} size="sm">
            <FaEye />
          </Button>
          {activity.state === IActivityState.created && (
            <Button size="sm" onClick={() => handleEdit(activity)}>
              <FaPen />
            </Button>
          )}
        </Flex>
      ),
    }));
  }, [data, handleView, handleEdit]);

  const rowsFinished = useMemo(() => {
    if (!data || data.finishedActivities.length === 0) return null;

    return data.finishedActivities.map((activity) => ({
      ...activity,
      createdAt: convertDateTime(activity.createdAt),
      finished_at: convertDateTime(activity.finished_at),
      actions: (
        <Flex>
          <Button mr={2} onClick={() => handleView(activity)} size="sm">
            <FaEye />
          </Button>
        </Flex>
      ),
    }));
  }, [data, handleView, handleEdit]);

  return (
    <Box p={4} mb={4} bg="bg.card" borderRadius="md" id="my-activities">
      <Flex align="center" mb="5">
        <Heading size="md">{t("dashboard.title.myActivities")}</Heading>
        <IconButton
          ml="auto"
          aria-label={t("common.refresh")}
          icon={<FaSync />}
          onClick={() => refetch()}
          isLoading={isLoading}
        />
      </Flex>

      <Tabs>
        <TabList>
          <Tab>{t("state.inProgress")}</Tab>
          <Tab>{t("state.finished")}</Tab>
        </TabList>
        <TabPanels>
          <TabPanel>
            <Table columns={columns} data={rows ?? []} isLoading={isLoading} />
          </TabPanel>
          <TabPanel>
            <Table
              columns={columnsFinished}
              data={rowsFinished ?? []}
              isLoading={isLoading}
            />
          </TabPanel>
        </TabPanels>
      </Tabs>
    </Box>
  );
};

export default MyActivities;
