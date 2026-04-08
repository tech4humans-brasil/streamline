import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Badge,
  Box,
  Button,
  Card,
  Divider,
  Flex,
  Icon,
  Input,
  InputGroup,
  InputLeftElement,
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
  useColorModeValue,
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
import { FaChevronDown, FaSearch } from "react-icons/fa";
import { FaCheckCircle, FaExclamationCircle } from "react-icons/fa";
import { AxiosError } from "axios";

interface TicketHeaderCardProps {
  activity: IActivity;
}

function getFormProjectId(activity: IActivity): string | null {
  if (typeof activity.form !== "object" || !activity.form) return null;
  const p = activity.form.project;
  if (p == null || p === "") return null;
  return String(p);
}

function statusTypeColorScheme(type: string): string {
  switch (type) {
    case "progress":
      return "blue";
    case "done":
      return "green";
    case "canceled":
      return "red";
    default:
      return "gray";
  }
}

const TicketHeaderCard: React.FC<TicketHeaderCardProps> = ({ activity }) => {
  const { t } = useTranslation();
  const toast = useToast();
  const queryClient = useQueryClient();
  const [auth] = useAuth();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [statusSearch, setStatusSearch] = useState("");

  const projectId = useMemo(() => getFormProjectId(activity), [activity.form]);

  const statusListQueryKey = useMemo(() => {
    const params = new URLSearchParams({ limit: "500" });
    if (projectId) params.set("project", projectId);
    return ["activity-statuses", projectId ?? "", params.toString()];
  }, [projectId]);

  const { data: statusesData, isLoading: statusesLoading } = useQuery({
    queryKey: statusListQueryKey,
    queryFn: getStatuses,
    enabled: isOpen && !!projectId,
  });

  const listItemBg = useColorModeValue("white", "gray.800");
  const listItemHoverBg = useColorModeValue("gray.50", "gray.700");
  const listItemBorder = useColorModeValue("gray.200", "gray.600");

  useEffect(() => {
    if (!isOpen) setStatusSearch("");
  }, [isOpen]);

  const filteredStatuses = useMemo(() => {
    const list = statusesData?.statuses ?? [];
    const q = statusSearch.trim().toLowerCase();
    if (!q) return list;
    return list.filter((s) => s.name.toLowerCase().includes(q));
  }, [statusesData?.statuses, statusSearch]);

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

      <Modal isOpen={isOpen} onClose={onClose} size="lg">
        <ModalOverlay />
        <ModalContent borderRadius="xl">
          <ModalHeader pb={2}>{t("activityDetails.actions.changeStatus")}</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            {!projectId ? (
              <Text fontSize="sm" color="gray.500">
                {t("activityDetails.actions.statusNoProject")}
              </Text>
            ) : statusesLoading ? (
              <Flex justify="center" py={10}>
                <Spinner />
              </Flex>
            ) : (
              <VStack align="stretch" spacing={4}>
                <InputGroup size="md">
                  <InputLeftElement pointerEvents="none" h="full">
                    <Icon as={FaSearch} color="gray.400" />
                  </InputLeftElement>
                  <Input
                    placeholder={t("activityDetails.actions.statusSearchPlaceholder")}
                    value={statusSearch}
                    onChange={(e) => setStatusSearch(e.target.value)}
                    borderRadius="lg"
                    pl={10}
                  />
                </InputGroup>
                <Box
                  borderWidth="1px"
                  borderColor={listItemBorder}
                  borderRadius="lg"
                  overflow="hidden"
                  maxH="360px"
                  overflowY="auto"
                  sx={{
                    "&::-webkit-scrollbar": { width: "6px" },
                    "&::-webkit-scrollbar-thumb": {
                      background: "var(--chakra-colors-gray-300)",
                      borderRadius: "full",
                    },
                  }}
                >
                  {filteredStatuses.map((s) => {
                    const isCurrent =
                      String(activity.status?._id ?? "") === String(s._id) ||
                      (!activity.status?._id &&
                        activity.status?.name === s.name &&
                        activity.status?.type === s.type);
                    const disabled = statusMutation.isPending || isCurrent;
                    return (
                      <Box
                        key={s._id}
                        as="button"
                        type="button"
                        w="100%"
                        textAlign="left"
                        px={4}
                        py={3}
                        borderBottomWidth="1px"
                        borderColor={listItemBorder}
                        bg={listItemBg}
                        transition="background 0.15s ease"
                        _hover={disabled ? undefined : { bg: listItemHoverBg }}
                        _last={{ borderBottomWidth: 0 }}
                        disabled={disabled}
                        opacity={isCurrent ? 0.55 : 1}
                        cursor={disabled ? "not-allowed" : "pointer"}
                        onClick={() => {
                          if (!disabled) handlePickStatus(s._id);
                        }}
                      >
                        <Flex align="center" justify="space-between" gap={3} wrap="wrap">
                          <Text fontWeight="semibold" fontSize="sm" noOfLines={2}>
                            {s.name}
                          </Text>
                          <Badge
                            colorScheme={statusTypeColorScheme(s.type)}
                            fontSize="0.65rem"
                            textTransform="uppercase"
                            letterSpacing="wider"
                            flexShrink={0}
                          >
                            {s.type}
                          </Badge>
                        </Flex>
                        {isCurrent ? (
                          <Text fontSize="xs" color="gray.500" mt={1}>
                            {t("activityDetails.actions.statusCurrent")}
                          </Text>
                        ) : null}
                      </Box>
                    );
                  })}
                </Box>
                {!statusesData?.statuses?.length ? (
                  <Text fontSize="sm" color="gray.500">
                    {t("activityDetails.actions.noStatuses")}
                  </Text>
                ) : null}
                {statusesData?.statuses?.length && !filteredStatuses.length ? (
                  <Text fontSize="sm" color="gray.500">
                    {t("activityDetails.actions.statusNoMatch")}
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
