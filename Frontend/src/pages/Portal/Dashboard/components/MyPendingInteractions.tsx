import { getMyActivitiesPendingInteractions } from "@apis/dashboard";
import { Box, Button, Divider, Flex, Heading, Text } from "@chakra-ui/react";
import Table from "@components/organisms/Table";
import { useQuery } from "@tanstack/react-query";
import { convertDateTime } from "@utils/date";
import React, { useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { FaEye, FaPen } from "react-icons/fa";
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

type IItem = Awaited<ReturnType<typeof getMyActivitiesPendingInteractions>>[0];

const PendingInteractions: React.FC = () => {
  const [t] = useTranslation();
  const { data, isLoading } = useQuery({
    queryKey: ["my-pending-interactions"],
    queryFn: getMyActivitiesPendingInteractions,
  });

  const navigate = useNavigate();

  const handleResponse = useCallback(
    (activity: IItem) => {
      navigate(`/response/${activity.form.slug}`, {
        state: {
          activity_id: activity._id,
        },
      });
    },
    [navigate]
  );

  const handleView = useCallback(
    (activity: IItem) => {
      navigate(`/portal/activity/${activity._id}`);
    },
    [navigate]
  );

  const dataForm = useMemo(() => {
    if (!data || data.length === 0) return null;
    //[Todo] - Verificar se o campo form.period.close é o correto
    return data.map((activity) => ({
      ...activity,
      createdAt: convertDateTime(activity.form.period.close),
      actions: (
        <Flex>
          <Button mr={2} onClick={() => handleView(activity)} size="sm">
            <FaEye />
          </Button>
          <Button size="sm" onClick={() => handleResponse(activity)}>
            <FaPen />
          </Button>
        </Flex>
      ),
    }));
  }, [data, handleResponse, handleView]);

  return (
    <Box p={4} bg="bg.card" borderRadius="md" id="pending-interactions">
      <Heading size="md">{t("dashboard.title.interactionPending")}</Heading>
      <Text size="sm" color={"text.secondary"}>
        {t("dashboard.description.interactionPending")}
      </Text>

      <Divider my={2} />

      <Table columns={columns} data={dataForm} isLoading={isLoading} />
    </Box>
  );
};

export default PendingInteractions;
