import { getMyActivities } from "@apis/dashboard";
import {
  Accordion,
  AccordionButton,
  AccordionIcon,
  AccordionItem,
  AccordionPanel,
  Avatar,
  Badge,
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
  Tag,
  Text,
  Tooltip,
  useBreakpointValue,
} from "@chakra-ui/react";
import Table from "@components/organisms/Table";
import { IActivityState } from "@interfaces/Activitiy";
import { useQuery } from "@tanstack/react-query";
import { convertDateTime } from "@utils/date";
import { serializeDashboardMyActivitiesParams } from "@utils/dashboardMyActivitiesParams";
import React, { useCallback, useEffect, useMemo, useRef } from "react";
import { useTranslation } from "react-i18next";
import { FaEye, FaPen, FaSync } from "react-icons/fa";
import { useNavigate, useSearchParams } from "react-router-dom";
import Filter from "@components/organisms/Filter";
import Pagination from "@components/organisms/Pagination";
import StatusTag from "@components/atoms/StatusTag";
import InputText from "@components/atoms/Inputs/Text";
import Select from "@components/atoms/Inputs/Select";

const columnsFull = [
  { key: "protocol", label: "common.fields.protocol" },
  { key: "name", label: "common.fields.form" },
  { key: "description", label: "common.fields.description" },
  { key: "status", label: "common.fields.status" },
  { key: "assignee", label: "common.fields.assignee" },
  { key: "createdAt", label: "common.fields.createdAt" },
  { key: "finished_at", label: "common.fields.finishedAt" },
  { key: "actions", label: "common.fields.actions" },
];

const columnsCompact = [
  { key: "protocol", label: "common.fields.protocol" },
  { key: "name", label: "common.fields.form" },
  { key: "status", label: "common.fields.status" },
  { key: "actions", label: "common.fields.actions" },
];

type IItem = Awaited<ReturnType<typeof getMyActivities>>["activities"][0];

type Props = {
  isNewSinceLastSeen: (updatedAt: string | Date | undefined | null) => boolean;
};

const ActivitiesTableBlock: React.FC<Props> = ({ isNewSinceLastSeen }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isCompact = useBreakpointValue({ base: true, lg: false });

  const myActivitiesParamsKey = useMemo(
    () => serializeDashboardMyActivitiesParams(searchParams),
    [searchParams]
  );

  const columns = useMemo(
    () => (isCompact ? columnsCompact : columnsFull),
    [isCompact]
  );

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["my-activities", myActivitiesParamsKey],
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
    if (!data?.activities) return [];

    return data.activities.map((activity) => {
      const formLabel = activity.form?.name ?? activity.name;
      const showNew = isNewSinceLastSeen(activity.updatedAt);

      return {
        ...activity,
        name: formLabel,
        protocol: (
          <Flex align="center" gap={2} flexWrap="wrap">
            <Text as="span">{activity.protocol}</Text>
            {showNew && (
              <Badge colorScheme="green">{t("dashboard.badge.new")}</Badge>
            )}
          </Flex>
        ),
        description: (
          <Tooltip label={activity.description} hasArrow openDelay={400}>
            <Text noOfLines={2} maxW="240px" cursor="default">
              {activity.description}
            </Text>
          </Tooltip>
        ),
        createdAt: convertDateTime(activity.createdAt),
        finished_at: activity.finished_at
          ? convertDateTime(activity.finished_at)
          : "-",
        status: <StatusTag status={activity.status} />,
        assignee: activity.assignee ? (
          <Flex align="center" gap={2}>
            <Avatar
              size="xs"
              name={activity.assignee.name}
              src={activity.assignee.photo_url?.url}
            />
            <Text fontSize="sm" noOfLines={1} maxW="140px">
              {activity.assignee.name}
            </Text>
          </Flex>
        ) : (
          <Tag colorScheme="orange" size="sm">
            {t("activityDetails.assignee.notAssigned")}
          </Tag>
        ),
        actions: (
          <Flex>
            <Button
              mr={2}
              onClick={() => handleView(activity)}
              size="sm"
              aria-label={t("dashboard.pendingActions.viewTicket")}
            >
              <FaEye />
            </Button>
            {activity.state === IActivityState.created &&
              !activity.finished_at && (
                <Button
                  size="sm"
                  onClick={() => handleEdit(activity)}
                  aria-label={t("common.edit")}
                >
                  <FaPen />
                </Button>
              )}
          </Flex>
        ),
      };
    });
  }, [data, handleView, handleEdit, t, isNewSinceLastSeen]);

  return (
    <>
      <Box px={4} pb={2}>
        <Accordion allowToggle reduceMotion defaultIndex={[]}>
          <AccordionItem border="none">
            <Flex align="center" gap={2}>
              <AccordionButton
                borderRadius="md"
                flex={1}
                px={3}
                py={2}
                _hover={{ bg: "blackAlpha.50" }}
              >
                <Box flex="1" textAlign="left" fontWeight="medium">
                  {t("dashboard.filtersToggle")}
                </Box>
                <AccordionIcon />
              </AccordionButton>
              <IconButton
                aria-label={t("common.refresh")}
                icon={<FaSync />}
                onClick={() => refetch()}
                isLoading={isLoading}
                size="md"
                variant="ghost"
              />
            </Flex>
            <AccordionPanel px={0} pt={2} pb={0}>
              <Filter.Container>
                <Select
                  input={{
                    id: "finished",
                    label: t("common.fields.status"),
                    options: [
                      {
                        label: t("dashboard.status.inProgress"),
                        value: "false",
                      },
                      {
                        label: t("dashboard.status.finished"),
                        value: "true",
                      },
                    ],
                  }}
                />
                <Select
                  input={{
                    id: "assignedToMe",
                    label: t("dashboard.myActivitiesAssignFilter.label"),
                    options: [
                      {
                        label: t("dashboard.myActivitiesAssignFilter.all"),
                        value: "",
                      },
                      {
                        label: t(
                          "dashboard.myActivitiesAssignFilter.assignedToMe"
                        ),
                        value: "true",
                      },
                    ],
                  }}
                />
                <Flex alignItems="end" gap={2} w="100%">
                  <InputText
                    input={{
                      id: "search",
                      type: "text",
                      placeholder: t("common.fields.search"),
                      label: t("common.fields.description"),
                    }}
                  />
                </Flex>
              </Filter.Container>
            </AccordionPanel>
          </AccordionItem>
        </Accordion>
      </Box>

      <Flex
        justifyContent="center"
        alignItems="center"
        mt={4}
        p={4}
        borderRadius="md"
        direction="column"
        bg="bg.card"
        w="100%"
        maxW="100%"
        overflowX="auto"
      >
        <Table columns={columns} data={rows} isLoading={isLoading} />
        <Pagination pagination={data?.pagination} isLoading={isLoading} />
      </Flex>
    </>
  );
};

const MyActivities: React.FC<Props> = ({ isNewSinceLastSeen }) => {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  /** Evita repor `automatic=false` depois do utilizador escolher explicitamente "Todos". */
  const userChoseAllTabsRef = useRef(false);

  useEffect(() => {
    if (userChoseAllTabsRef.current) return;
    if (searchParams.has("automatic")) return;
    setSearchParams(
      (prev) => {
        const n = new URLSearchParams(prev);
        n.set("automatic", "false");
        return n;
      },
      { replace: true }
    );
  }, [searchParams, setSearchParams]);

  const automatic = searchParams.get("automatic");
  const tabIndex =
    automatic === "true" ? 1 : automatic === "false" ? 2 : 0;

  const handleTabChange = useCallback(
    (index: number) => {
      userChoseAllTabsRef.current = index === 0;
      setSearchParams((prev) => {
        const p = new URLSearchParams(prev);
        p.set("page", "1");
        if (index === 0) p.delete("automatic");
        else if (index === 1) p.set("automatic", "true");
        else p.set("automatic", "false");
        return p;
      });
    },
    [setSearchParams]
  );

  return (
    <Box bg="bg.card" borderRadius="md" id="my-activities">
      <Flex
        justifyContent="space-between"
        alignItems="start"
        p={4}
        direction="column"
        gap={1}
      >
        <Heading size="md">{t("dashboard.title.myActivities")}</Heading>
        <Text fontSize="sm" color="gray.500">
          {t("dashboard.description.myActivities")}
        </Text>
      </Flex>

      <Tabs
        isLazy
        variant="enclosed"
        colorScheme="blue"
        index={tabIndex}
        onChange={handleTabChange}
      >
        <TabList px={4} flexWrap="wrap" borderBottomWidth={0}>
          <Tab>{t("dashboard.myActivitiesTabs.all")}</Tab>
          <Tab>{t("dashboard.myActivitiesTabs.automatic")}</Tab>
          <Tab>{t("dashboard.myActivitiesTabs.manual")}</Tab>
        </TabList>
        <TabPanels>
          <TabPanel p={0}>
            <ActivitiesTableBlock isNewSinceLastSeen={isNewSinceLastSeen} />
          </TabPanel>
          <TabPanel p={0}>
            <ActivitiesTableBlock isNewSinceLastSeen={isNewSinceLastSeen} />
          </TabPanel>
          <TabPanel p={0}>
            <ActivitiesTableBlock isNewSinceLastSeen={isNewSinceLastSeen} />
          </TabPanel>
        </TabPanels>
      </Tabs>
    </Box>
  );
};

export default MyActivities;
