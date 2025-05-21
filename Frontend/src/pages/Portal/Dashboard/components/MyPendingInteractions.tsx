import { getMyActivitiesPendingInteractions } from "@apis/dashboard";
import {
  Box,
  Button,
  Divider,
  Flex,
  Heading,
  IconButton,
  Text,
} from "@chakra-ui/react";
import DueDateIndicator from "@components/atoms/DueDateIndicatior";
import Table from "@components/organisms/Table";
import { useQuery } from "@tanstack/react-query";
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
    key: "user",
    label: "common.fields.name",
  },
  {
    key: "name",
    label: "common.fields.type",
  },
  {
    key: "forms",
    label: "common.fields.form",
  },
  {
    key: "due_date",
    label: "common.fields.due_date",
  },
  {
    key: "actions",
    label: "common.fields.actions",
  },
];

type IItem = Awaited<ReturnType<typeof getMyActivitiesPendingInteractions>>[0];

const PendingInteractions: React.FC = () => {
  const [t] = useTranslation();
  const { data, isLoading, refetch } = useQuery({
    queryKey: ["my-pending-interactions"],
    queryFn: getMyActivitiesPendingInteractions,
    refetchInterval: 60000,
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
      forms: activity.form.name,
      user: activity?.users[0]?.name || "-",
      due_date: <DueDateIndicator dueDate={activity.due_date} />,
      actions: (
        <Flex>
          <Button mr={2} onClick={() => handleView(activity)} size="sm">
            <FaEye />
          </Button>
          {
            activity.form && (<Button size="sm" onClick={() => handleResponse(activity)}>
              <FaPen />
            </Button>)
          }
        </Flex>
      ),
    }));
  }, [data, handleResponse, handleView]);

  return (
    <Box p={4} bg="bg.card" borderRadius="md" id="pending-interactions">
      <Flex>
        <div>
          <Heading size="md">{t("dashboard.title.interactionPending")}</Heading>
          <Text size="sm" color={"text.secondary"}>
            {t("dashboard.description.interactionPending")}
          </Text>
        </div>
        <IconButton
          ml="auto"
          aria-label={t("common.refresh")}
          icon={<FaSync />}
          onClick={() => refetch()}
          isLoading={isLoading}
        />
      </Flex>

      <Divider my={2} />

      <Table columns={columns} data={dataForm} isLoading={isLoading} />
    </Box>
  );
};

export default PendingInteractions;
