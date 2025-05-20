import { getMyActivities } from "@apis/dashboard";
import {
  Box,
  Button,
  ButtonGroup,
  Flex,
  IconButton,
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
  const [searchParams, setSearchParams] = useSearchParams();

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

  const handleStatusChange = useCallback((status: string) => {
    setSearchParams((prev) => {
      const newParams = new URLSearchParams(prev);
      if (status === "all") {
        newParams.delete("finished");
      } else {
        newParams.set("finished", status);
      }
      newParams.set("page", "1"); // Reset to first page when changing status
      return newParams;
    });
  }, [setSearchParams]);

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

  const currentStatus = searchParams.get("finished");

  return (
    <Box mb={4} bg="bg.card" borderRadius="md" id="my-activities">
      <Filter.Container>
        <ButtonGroup size="md" isAttached variant="solid">
          <Button
            onClick={() => handleStatusChange("all")}
            colorScheme={currentStatus === null ? "blue" : undefined}
          >
            {t("dashboard.status.all")}
          </Button>
          <Button
            onClick={() => handleStatusChange("false")}
            colorScheme={currentStatus === "false" ? "blue" : undefined}
          >
            {t("dashboard.status.inProgress")}
          </Button>
          <Button
            onClick={() => handleStatusChange("true")}
            colorScheme={currentStatus === "true" ? "blue" : undefined}
          >
            {t("dashboard.status.finished")}
          </Button>
        </ButtonGroup>
        <IconButton
          ml="auto"
          aria-label={t("common.refresh")}
          icon={<FaSync />}
          onClick={() => refetch()}
          isLoading={isLoading}
        />
      </Filter.Container>

      <Flex
        justifyContent="center"
        alignItems="center"
        mt="4"
        width="100%"
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
