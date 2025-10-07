import { getMyActivities } from "@apis/dashboard";
import {
  Box,
  Button,
  Flex,
  IconButton,
  Heading,
  Text,
} from "@chakra-ui/react";
import Table from "@components/organisms/Table";
import { IActivityState } from "@interfaces/Activitiy";
import { useQuery } from "@tanstack/react-query";
import { convertDateTime } from "@utils/date";
import React, { useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { FaEye, FaPen, FaSync } from "react-icons/fa";
import { useNavigate, useSearchParams } from "react-router-dom";
import Filter from "@components/organisms/Filter";
import Pagination from "@components/organisms/Pagination";
import StatusTag from "@components/atoms/StatusTag";
import InputText from "@components/atoms/Inputs/Text";
import Select from "@components/atoms/Inputs/Select";


const columns = [
  {
    key: "protocol",
    label: "common.fields.protocol",
  },
  {
    key: "name",
    label: "common.fields.form",
  },
  {
    key: "description",
    label: "common.fields.description",
  },
  {
    key: "status",
    label: "common.fields.status",
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
  const [searchParams] = useSearchParams();

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["my-activities", searchParams.toString()],
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

    return data.activities.map((activity) => ({
      ...activity,
      description: (
        <div title={activity.description}>
          {activity.description.length > 15
            ? `${activity.description.slice(0, 15)}...`
            : activity.description}
        </div>
      ),
      createdAt: convertDateTime(activity.createdAt),
      finished_at: activity.finished_at ? convertDateTime(activity.finished_at) : "-",
      status: <StatusTag status={activity.status} />,
      actions: (
        <Flex>
          <Button mr={2} onClick={() => handleView(activity)} size="sm">
            <FaEye />
          </Button>
          {activity.state === IActivityState.created && !activity.finished_at && (
            <Button size="sm" onClick={() => handleEdit(activity)}>
              <FaPen />
            </Button>
          )}
        </Flex>
      ),
    }));
  }, [data, handleView, handleEdit]);

  return (
    <Box mb={4} bg="bg.card" borderRadius="md" id="my-activities">

      <Flex justifyContent="space-between" alignItems="start" p="4" direction="column">
        <Heading size="md">
          {t("dashboard.title.myActivities")}
        </Heading>
        <Text fontSize="sm" color="gray.500">
          {t("dashboard.description.myActivities")}
        </Text>
      </Flex>

      <Filter.Container>
        <Select
          input={{
            id: "finished",
            label: t("common.fields.status"),
            options: [
              { label: t("dashboard.status.inProgress"), value: "false" },
              { label: t("dashboard.status.finished"), value: "true" },
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
          <Select
            input={{
              id: "automatic",
              label: t("common.fields.automatic"),
              options: [
                { label: t("common.fields.yes"), value: "true" },
                { label: t("common.fields.no"), value: "false" },
              ],
            }}
          />

          <IconButton
            ml="auto"
            aria-label={t("common.refresh")}
            icon={<FaSync />}
            onClick={() => refetch()}
            isLoading={isLoading}
          />
        </Flex>
      </Filter.Container>

      <Flex
        justifyContent="center"
        alignItems="center"
        mt="4"
        p="4"
        borderRadius="md"
        direction="column"
        bg={"bg.card"}
      >
        <Table columns={columns} data={rows} isLoading={isLoading} />
        <Pagination pagination={data?.pagination} isLoading={isLoading} />
      </Flex>
    </Box>
  );
};

export default MyActivities;
