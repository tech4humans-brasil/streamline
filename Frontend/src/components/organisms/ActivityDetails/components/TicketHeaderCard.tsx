import React, { useCallback, useMemo } from "react";
import {
  Box,
  Button,
  Card,
  Divider,
  Flex,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalHeader,
  ModalOverlay,
  Spinner,
  Text,
  VStack,
  useDisclosure,
  useToast,
} from "@chakra-ui/react";
import { convertDateTime } from "@utils/date";
import UserDetails from "../sections/UserDetails";
import IActivity from "@interfaces/Activitiy";
import StatusTag from "@components/atoms/StatusTag";
import { useTranslation } from "react-i18next";
import Can from "@components/atoms/Can";
import { assignActivity, updateActivityStatus } from "@apis/activity";
import { getStatuses } from "@apis/status";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import useAuth from "@hooks/useAuth";
import { FaChevronDown } from "react-icons/fa";
import { FaCheckCircle, FaExclamationCircle } from "react-icons/fa";
import { AxiosError } from "axios";

interface TicketHeaderCardProps {
  activity: IActivity;
}

const TicketHeaderCard: React.FC<TicketHeaderCardProps> = ({ activity }) => {
  const { t } = useTranslation();
  const toast = useToast();
  const queryClient = useQueryClient();
  const [auth] = useAuth();
  const { isOpen, onOpen, onClose } = useDisclosure();

  const statusListQueryKey = useMemo(() => {
    const projectId =
      typeof activity.form === "object" && activity.form?.project
        ? String(activity.form.project)
        : "";
    const params = new URLSearchParams({ limit: "200" });
    if (projectId) params.set("project", projectId);
    return ["activity-statuses", params.toString()];
  }, [activity.form]);

  const { data: statusesData, isLoading: statusesLoading } = useQuery({
    queryKey: statusListQueryKey,
    queryFn: getStatuses,
    enabled: isOpen,
  });

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

  const statusMutation = useMutation({
    mutationFn: updateActivityStatus,
    onSuccess: (data) => {
      queryClient.setQueryData(["activity", activity._id], data);
      onClose();
      toast({
        title: t("activityDetails.actions.statusSuccess"),
        status: "success",
        duration: 5000,
        isClosable: true,
        icon: <FaCheckCircle />,
      });
    },
    onError: (error: AxiosError<{ message: string }>) => {
      toast({
        title: t("activityDetails.actions.statusError"),
        description: error.message,
        status: "error",
        duration: 8000,
        isClosable: true,
        icon: <FaExclamationCircle />,
      });
    },
  });

  const isCurrentAssignee =
    auth &&
    activity.assignee &&
    String(activity.assignee._id) === String(auth.id);

  const handleAssume = useCallback(() => {
    if (!auth?.id) return;
    assignMutation.mutate({ id: activity._id, userId: auth.id });
  }, [assignMutation, activity._id, auth?.id]);

  const handlePickStatus = useCallback(
    (statusId: string) => {
      statusMutation.mutate({ id: activity._id, statusId });
    },
    [statusMutation, activity._id]
  );

  return (
    <Card>
      <Box p={6}>
        <Flex justify="space-between" align="start" gap={4} flexWrap="wrap">
          <Box flex="1" minW="0">
            <Text fontSize="xl" fontWeight="bold">
              {activity.name}
            </Text>
          </Box>
          <Flex align="center" gap={2} flexShrink={0}>
            <StatusTag status={activity.status} size="lg" />
            <Can permission="activity.update">
              <Menu>
                <MenuButton
                  as={Button}
                  variant="outline"
                  size="sm"
                  rightIcon={<FaChevronDown />}
                >
                  {t("activityDetails.actions.menu")}
                </MenuButton>
                <MenuList zIndex={20}>
                  {!isCurrentAssignee && auth?.id ? (
                    <MenuItem
                      onClick={handleAssume}
                      isDisabled={assignMutation.isPending}
                    >
                      {t("activityDetails.actions.assumeTicket")}
                    </MenuItem>
                  ) : null}
                  <MenuItem onClick={onOpen}>
                    {t("activityDetails.actions.changeStatus")}
                  </MenuItem>
                </MenuList>
              </Menu>
            </Can>
          </Flex>
        </Flex>
      </Box>
      <Divider />
      <Box p={6}>
        <VStack spacing={4} align="stretch">
          <Box>
            <Text fontSize="sm" fontWeight="medium" color="gray.500" mb={2}>
              {t("activityDetails.description")}
            </Text>
            <Text fontSize="sm">
              {activity.description || t("activityDetails.noDescription")}
            </Text>
          </Box>

          <Box>
            <Text fontSize="sm" fontWeight="medium" color="gray.500" mb={2}>
              {t("activityDetails.creationDate")}
            </Text>
            <Text fontSize="sm">{convertDateTime(activity.createdAt)}</Text>
          </Box>

          {activity.finished_at && (
            <Box>
              <Text fontSize="sm" fontWeight="medium" color="gray.500" mb={2}>
                {t("activityDetails.completionDate")}
              </Text>
              <Text fontSize="sm">{convertDateTime(activity.finished_at)}</Text>
            </Box>
          )}

          {activity.due_date && (
            <Box>
              <Text fontSize="sm" fontWeight="medium" color="gray.500" mb={2}>
                {t("activityDetails.dueDate")}
              </Text>
              <Text fontSize="sm">{convertDateTime(activity.due_date)}</Text>
            </Box>
          )}

          <Box>
            <Text fontSize="sm" fontWeight="medium" color="gray.500" mb={2}>
              {t("activityDetails.requester")}
            </Text>
            <Flex flexWrap="wrap" gap={4}>
              {activity.users.map((user) => (
                <UserDetails key={user._id} user={user} />
              ))}
            </Flex>
          </Box>
        </VStack>
      </Box>

      <Modal isOpen={isOpen} onClose={onClose} size="md">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>{t("activityDetails.actions.changeStatus")}</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            {statusesLoading ? (
              <Flex justify="center" py={8}>
                <Spinner />
              </Flex>
            ) : (
              <VStack align="stretch" spacing={2} maxH="320px" overflowY="auto">
                {statusesData?.statuses?.map((s) => (
                  <Button
                    key={s._id}
                    variant="ghost"
                    justifyContent="flex-start"
                    fontWeight="normal"
                    isDisabled={
                      statusMutation.isPending ||
                      String(activity.status._id) === String(s._id)
                    }
                    onClick={() => handlePickStatus(s._id)}
                  >
                    {s.name}
                  </Button>
                ))}
                {!statusesData?.statuses?.length ? (
                  <Text fontSize="sm" color="gray.500">
                    {t("activityDetails.actions.noStatuses")}
                  </Text>
                ) : null}
              </VStack>
            )}
          </ModalBody>
        </ModalContent>
      </Modal>
    </Card>
  );
};

export default TicketHeaderCard;
