import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Badge,
  Box,
  Button,
  Card,
  Flex,
  Icon,
  Input,
  InputGroup,
  InputLeftElement,
  Menu,
  MenuButton,
  MenuDivider,
  MenuItem,
  MenuList,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalOverlay,
  SimpleGrid,
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
import { updateActivityStatus } from "@apis/activity";
import { getStatuses } from "@apis/status";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import useAuth from "@hooks/useAuth";
import useActivity from "@hooks/useActivity";
import usePermission from "@hooks/usePermission";
import { FaChevronDown, FaSearch } from "react-icons/fa";
import { FaCheckCircle, FaExclamationCircle } from "react-icons/fa";
import { AxiosError } from "axios";
import { IUserRoles } from "@interfaces/User";
import { useActivityDetailCardProps } from "../useActivityDetailCardProps";

interface TicketHeaderCardProps {
  activity: IActivity;
  onAssignClick: () => void;
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

const TicketHeaderCard: React.FC<TicketHeaderCardProps> = ({
  activity,
  onAssignClick,
}) => {
  const { t } = useTranslation();
  const toast = useToast();
  const queryClient = useQueryClient();
  const [auth] = useAuth();
  const { ticketPageActions } = useActivity();
  const { userCan } = usePermission();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const {
    isOpen: isCloseOpen,
    onOpen: onCloseOpen,
    onClose: onCloseClose,
  } = useDisclosure();
  const [statusSearch, setStatusSearch] = useState("");

  const projectId = useMemo(() => getFormProjectId(activity), [activity.form]);

  const statusListQueryKey = useMemo(() => {
    const params = new URLSearchParams({ limit: "500", type: "progress" });
    if (projectId) params.set("project", projectId);
    return ["activity-statuses", params.toString()];
  }, [projectId]);

  const closeStatusListQueryKey = useMemo(() => {
    const params = new URLSearchParams({
      limit: "500",
      type: "done,canceled",
    });
    if (projectId) params.set("project", projectId);
    return ["activity-statuses-close", params.toString()];
  }, [projectId]);

  const { data: statusesData, isLoading: statusesLoading } = useQuery({
    queryKey: statusListQueryKey,
    queryFn: getStatuses,
    enabled: isOpen && !!projectId,
  });

  const { data: closeStatusesData, isLoading: closeStatusesLoading } =
    useQuery({
      queryKey: closeStatusListQueryKey,
      queryFn: getStatuses,
      enabled: isCloseOpen && !!projectId,
    });

  const listItemBg = useColorModeValue("white", "gray.800");
  const listItemHoverBg = useColorModeValue("gray.50", "gray.700");
  const listItemBorder = useColorModeValue("gray.200", "gray.600");
  const detailCardProps = useActivityDetailCardProps({ hero: true });
  const toolbarBg = useColorModeValue("gray.50", "whiteAlpha.50");
  const descBg = useColorModeValue("gray.50", "whiteAlpha.50");
  const descBorder = useColorModeValue("gray.200", "whiteAlpha.200");

  useEffect(() => {
    if (!isOpen) setStatusSearch("");
  }, [isOpen]);

  const isAdmin = Boolean(auth?.roles?.includes(IUserRoles.admin));
  const isRequester = Boolean(
    auth?.id &&
    activity.users?.[0]?._id &&
    String(activity.users[0]._id) === String(auth.id)
  );
  const canCloseTicket = isAdmin || isRequester;

  const filteredStatuses = useMemo(() => {
    const list = statusesData?.statuses ?? [];
    const q = statusSearch.trim().toLowerCase();
    return !q ? list : list.filter((s) => s.name.toLowerCase().includes(q));
  }, [statusesData?.statuses, statusSearch]);

  const statusMutation = useMutation({
    mutationFn: updateActivityStatus,
    onSuccess: (data) => {
      queryClient.setQueryData(["activity", activity._id], data);
      queryClient.invalidateQueries({ queryKey: ["activities"] });
      onClose();
      onCloseClose();
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

  const handlePickStatus = useCallback(
    (statusId: string) => {
      statusMutation.mutate({ id: activity._id, statusId });
    },
    [statusMutation, activity._id]
  );

  const canUpdate = userCan("activity.update");
  const showAssignItem = canUpdate && Boolean(auth?.id);
  const showChangeStatusItem = canUpdate;
  const showCloseItem =
    canUpdate &&
    canCloseTicket &&
    !activity.finished_at &&
    Boolean(projectId);

  const hasWorkflowItems =
    showAssignItem || showChangeStatusItem || showCloseItem;
  const hasPageItems = Boolean(ticketPageActions);
  const showActionsMenu = hasPageItems || hasWorkflowItems;

  const metaLabelSx = {
    fontSize: "xs",
    fontWeight: "semibold",
    color: "gray.500",
    textTransform: "uppercase",
    letterSpacing: "0.06em",
    mb: 2,
  } as const;

  return (
    <Card {...detailCardProps}>
      <Box bg={toolbarBg} px={6} py={4}>
        <Flex justify="flex-start" align="center" gap={2} flexWrap="wrap" w="100%">
          <StatusTag status={activity.status} size="lg" />
          {showActionsMenu ? (
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
                {ticketPageActions ? (
                  <>
                    <MenuItem
                      onClick={ticketPageActions.onRefresh}
                      isDisabled={ticketPageActions.isRefreshing}
                    >
                      {t("activityDetails.actions.refresh")}
                    </MenuItem>
                    <MenuItem
                      onClick={ticketPageActions.onExport}
                      isDisabled={ticketPageActions.isExporting}
                    >
                      {t("activityDetails.actions.export")}
                    </MenuItem>
                    <Can permission="activity.delete">
                      <MenuItem
                        onClick={ticketPageActions.onDelete}
                        isDisabled={ticketPageActions.isDeleting}
                        color="red.500"
                      >
                        {t("activityDetails.actions.deleteTicket")}
                      </MenuItem>
                    </Can>
                    {hasWorkflowItems ? <MenuDivider /> : null}
                  </>
                ) : null}
                {showAssignItem ? (
                  <MenuItem onClick={onAssignClick}>
                    {t("activityDetails.actions.assignTicketMenu")}
                  </MenuItem>
                ) : null}
                {showChangeStatusItem ? (
                  <MenuItem onClick={onOpen}>
                    {t("activityDetails.actions.changeStatus")}
                  </MenuItem>
                ) : null}
                {showCloseItem ? (
                  <MenuItem onClick={onCloseOpen}>
                    {t("activityDetails.actions.closeTicket")}
                  </MenuItem>
                ) : null}
              </MenuList>
            </Menu>
          ) : null}
        </Flex>
      </Box>
      <Box p={6}>
        <VStack spacing={6} align="stretch">
          <Box
            borderRadius="md"
            bg={descBg}
            borderWidth="1px"
            borderColor={descBorder}
            p={4}
          >
            <Text {...metaLabelSx}>{t("activityDetails.description")}</Text>
            <Text fontSize="sm" fontWeight="medium" lineHeight="tall">
              {activity.description || t("activityDetails.noDescription")}
            </Text>
          </Box>

          <SimpleGrid columns={{ base: 1, md: 2 }} spacingX={8} spacingY={4}>
            <Box>
              <Text {...metaLabelSx}>{t("activityDetails.creationDate")}</Text>
              <Text fontSize="sm" fontWeight="medium">
                {convertDateTime(activity.createdAt)}
              </Text>
            </Box>

            {activity.finished_at ? (
              <Box>
                <Text {...metaLabelSx}>
                  {t("activityDetails.completionDate")}
                </Text>
                <Text fontSize="sm" fontWeight="medium">
                  {convertDateTime(activity.finished_at)}
                </Text>
              </Box>
            ) : null}

            {activity.due_date ? (
              <Box>
                <Text {...metaLabelSx}>{t("activityDetails.dueDate")}</Text>
                <Text fontSize="sm" fontWeight="medium">
                  {convertDateTime(activity.due_date)}
                </Text>
              </Box>
            ) : null}
          </SimpleGrid>

          <Box>
            <Text {...metaLabelSx}>{t("activityDetails.requester")}</Text>
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

      <Modal isOpen={isCloseOpen} onClose={onCloseClose} size="lg">
        <ModalOverlay />
        <ModalContent borderRadius="xl">
          <ModalHeader pb={2}>
            {t("activityDetails.actions.closeTicketTitle")}
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={2}>
            <Text fontSize="sm" color="gray.600" mb={4}>
              {t("activityDetails.actions.closeTicketHint")}
            </Text>
            {!projectId ? (
              <Text fontSize="sm" color="gray.500">
                {t("activityDetails.actions.statusNoProject")}
              </Text>
            ) : closeStatusesLoading ? (
              <Flex justify="center" py={10}>
                <Spinner />
              </Flex>
            ) : (
              <Box
                borderWidth="1px"
                borderColor={listItemBorder}
                borderRadius="lg"
                overflow="hidden"
                maxH="360px"
                overflowY="auto"
              >
                {(closeStatusesData?.statuses ?? []).map((s) => {
                  const disabled = statusMutation.isPending;
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
                    </Box>
                  );
                })}
              </Box>
            )}
            {!closeStatusesLoading &&
              projectId &&
              !(closeStatusesData?.statuses ?? []).length ? (
              <Text fontSize="sm" color="gray.500">
                {t("activityDetails.actions.closeTicketNoDoneStatuses")}
              </Text>
            ) : null}
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onCloseClose}>
              {t("activityDetails.actions.closeTicketCancel")}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Card>
  );
};

export default TicketHeaderCard;
