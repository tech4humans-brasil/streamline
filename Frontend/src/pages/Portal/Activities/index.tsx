import { Box, Button, Flex, Heading } from "@chakra-ui/react";
import Table from "@components/organisms/Table";
import { useQuery } from "@tanstack/react-query";
import React, { memo, useCallback, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { BiRefresh, BiEdit } from "react-icons/bi";
import Pagination from "@components/organisms/Pagination";
import Filter from "@components/organisms/Filter";
import Text from "@components/atoms/Inputs/Text";
import { getActivities } from "@apis/activity";
import IActivity from "@interfaces/Activitiy";
import { useTranslation } from "react-i18next";
import Select from "@components/atoms/Inputs/Select";

const columns = [
  {
    key: "name",
    label: "common.fields.name",
  },
  {
    key: "protocol",
    label: "common.fields.protocol",
  },
  {
    key: "status",
    label: "common.fields.status",
  },
  {
    key: "users",
    label: "common.fields.users",
  },
  {
    key: "actions",
    label: "common.fields.actions",
  },
  {
    key: "finished_at",
    label: "common.fields.finished",
  },
];

const Action = memo((activity: Pick<IActivity, "_id">) => {
  const navigate = useNavigate();

  const handleSee = useCallback(() => {
    navigate(`/portal/activity/${activity._id}`);
  }, [navigate, activity._id]);

  return (
    <div>
      <Button mr={2} onClick={handleSee} size="sm">
        <BiEdit size={20} />
      </Button>
    </div>
  );
});

const Activities: React.FC = () => {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();

  const {
    data: { activities, pagination } = {},
    isFetching,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["activities", searchParams.toString()],
    queryFn: getActivities,
  });

  const data = useMemo(() => {
    if (!activities) return [];

    return activities.map((activity) => ({
      ...activity,
      status: activity.status.name,
      users: activity.users.map((user) => user.name).join(", "),
      actions: <Action {...activity} />,
      finished_at: activity.finished_at
        ? new Date(activity.finished_at).toLocaleString()
        : "-",
    }));
  }, [activities]);

  return (
    <Box width="100%" p="10">
      <Heading> {t("common.activities")}</Heading>
      <Flex justifyContent="flex-end" mt="4" width="100%">
        <Button
          onClick={() => refetch()}
          mr={2}
          size="sm"
          isLoading={isFetching}
        >
          <BiRefresh size={20} />
        </Button>
      </Flex>

      <Filter.Container>
        <Text input={{ label: t("common.fields.name"), id: "name" }} />

        <Text input={{ label: t("common.fields.protocol"), id: "protocol" }} />

        <Text input={{ label: t("common.fields.status"), id: "status" }} />

        <Select
          input={{
            label: t("common.fields.finished"),
            id: "finished",
            options: [
              { label: t("common.fields.yes"), value: "true" },
              { label: t("common.fields.no"), value: "false" },
            ],
          }}
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
        <Table columns={columns} data={data} />
        <Pagination pagination={pagination} isLoading={isFetching} />
      </Flex>
      {isError && (
        <Flex justifyContent="center" alignItems="center" mt="4" width="100%">
          <Heading color="red.500">{t("table.error")}</Heading>
        </Flex>
      )}
    </Box>
  );
};

export default Activities;
