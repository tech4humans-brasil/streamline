import React, { useCallback } from "react";
import {
  Box,
  Button,
  Card,
  Flex,
  Tag,
  Text,
  VStack,
  useToast,
} from "@chakra-ui/react";
import { convertDateTime } from "@utils/date";
import StatusTag from "@components/atoms/StatusTag";
import IActivity from "@interfaces/Activitiy";
import { useTranslation } from "react-i18next";
import UserDetails from "../sections/UserDetails";
import Can from "@components/atoms/Can";
import { assignActivity } from "@apis/activity";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import useAuth from "@hooks/useAuth";
import { FaCheckCircle, FaExclamationCircle } from "react-icons/fa";
import { AxiosError } from "axios";

interface TicketInfoCardProps {
  activity: IActivity;
}

const TicketInfoCard: React.FC<TicketInfoCardProps> = ({ activity }) => {
  const { t } = useTranslation();
  const toast = useToast();
  const queryClient = useQueryClient();
  const [auth] = useAuth();

  const assignMutation = useMutation({
    mutationFn: assignActivity,
    onSuccess: (data) => {
      queryClient.setQueryData(["activity", activity._id], data);
      toast({
        title: t("activityDetails.actions.assignSuccess"),
        status: "success",
        duration: 5000,
        isClosable: true,
        icon: <FaCheckCircle />,
      });
    },
    onError: (error: AxiosError<{ message: string }>) => {
      toast({
        title: t("activityDetails.actions.assignError"),
        description: error.message,
        status: "error",
        duration: 8000,
        isClosable: true,
        icon: <FaExclamationCircle />,
      });
    },
  });

  const handleAssume = useCallback(() => {
    if (!auth?.id) return;
    assignMutation.mutate({ id: activity._id, userId: auth.id });
  }, [assignMutation, activity._id, auth?.id]);

  const assignee = activity.assignee ?? null;

  return (
    <Card>
      <Box p={6}>
        <Text fontSize="lg" fontWeight="bold" mb={4}>
          {t("activityDetails.information")}
        </Text>
        <VStack spacing={4} align="stretch">
          <Box>
            <Text fontSize="sm" fontWeight="medium" color="gray.500" mb={2}>
              {t("activityDetails.ticketId")}
            </Text>
            <Text fontSize="sm" fontFamily="mono">
              {activity._id}
            </Text>
          </Box>
          <Box>
            <Text fontSize="sm" fontWeight="medium" color="gray.500" mb={2}>
              {t("activityDetails.ticketProtocol")}
            </Text>
            <Text fontSize="sm" fontFamily="mono">
              {activity.protocol}
            </Text>
          </Box>
          <Box>
            <Text fontSize="sm" fontWeight="medium" color="gray.500" mb={2}>
              {t("activityDetails.status")}
            </Text>
            <StatusTag status={activity.status} />
          </Box>

          <Box>
            <Text fontSize="sm" fontWeight="medium" color="gray.500" mb={2}>
              {t("activityDetails.assignee.title")}
            </Text>
            {assignee ? (
              <UserDetails user={assignee} />
            ) : (
              <Flex align="center" gap={3} flexWrap="wrap">
                <Tag colorScheme="orange" size="md">
                  {t("activityDetails.assignee.notAssigned")}
                </Tag>
                <Can permission="activity.update">
                  <Button
                    size="xs"
                    colorScheme="blue"
                    onClick={handleAssume}
                    isLoading={assignMutation.isPending}
                    isDisabled={!auth?.id}
                  >
                    {t("activityDetails.assignee.assume")}
                  </Button>
                </Can>
              </Flex>
            )}
          </Box>

          <Box>
            <Text fontSize="sm" fontWeight="medium" color="gray.500" mb={2}>
              {t("activityDetails.createdAt")}
            </Text>
            <Text fontSize="sm">{convertDateTime(activity.createdAt)}</Text>
          </Box>

          <Box>
            <Text fontSize="sm" fontWeight="medium" color="gray.500" mb={2}>
              {t("activityDetails.lastUpdate")}
            </Text>
            <Text fontSize="sm">{convertDateTime(activity.updatedAt)}</Text>
          </Box>
        </VStack>
      </Box>
    </Card>
  );
};

export default TicketInfoCard;
