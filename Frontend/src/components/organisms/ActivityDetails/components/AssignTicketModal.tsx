import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Box,
  Flex,
  Icon,
  Input,
  InputGroup,
  InputLeftElement,
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
  useToast,
} from "@chakra-ui/react";
import { useTranslation } from "react-i18next";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { assignActivity } from "@apis/activity";
import { getUsersByRole } from "@apis/field";
import IActivity from "@interfaces/Activitiy";
import useAuth from "@hooks/useAuth";
import { FaCheckCircle, FaExclamationCircle, FaSearch } from "react-icons/fa";
import { AxiosError } from "axios";

export interface AssignTicketModalProps {
  activity: IActivity;
  isOpen: boolean;
  onClose: () => void;
}

const AssignTicketModal: React.FC<AssignTicketModalProps> = ({
  activity,
  isOpen,
  onClose,
}) => {
  const { t } = useTranslation();
  const toast = useToast();
  const queryClient = useQueryClient();
  const [auth] = useAuth();
  const [search, setSearch] = useState("");

  const listItemBg = useColorModeValue("white", "gray.800");
  const listItemHoverBg = useColorModeValue("gray.50", "gray.700");
  const listItemBorder = useColorModeValue("gray.200", "gray.600");

  useEffect(() => {
    if (!isOpen) setSearch("");
  }, [isOpen]);

  const { data: users, isLoading: usersLoading } = useQuery({
    queryKey: ["users", "field", "assign-ticket"],
    queryFn: getUsersByRole,
    enabled: isOpen,
  });

  const assignMutation = useMutation({
    mutationFn: assignActivity,
    onSuccess: (data) => {
      queryClient.setQueryData(["activity", activity._id], data);
      queryClient.invalidateQueries({ queryKey: ["activities"] });
      onClose();
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

  const filteredUsers = useMemo(() => {
    const list = users ?? [];
    const q = search.trim().toLowerCase();
    if (!q) {
      return [...list].sort((a, b) =>
        (a.name ?? "").localeCompare(b.name ?? "", undefined, {
          sensitivity: "base",
        })
      );
    }
    return list
      .filter((u) => {
        const name = (u.name ?? "").toLowerCase();
        const email = (u.email ?? "").toLowerCase();
        const mat = (u.matriculation ?? "").toLowerCase();
        return name.includes(q) || email.includes(q) || mat.includes(q);
      })
      .sort((a, b) =>
        (a.name ?? "").localeCompare(b.name ?? "", undefined, {
          sensitivity: "base",
        })
      );
  }, [users, search]);

  const currentAssigneeId = activity.assignee?._id
    ? String(activity.assignee._id)
    : null;

  const handlePickUser = useCallback(
    (userId: string | null) => {
      assignMutation.mutate({ id: activity._id, userId });
    },
    [assignMutation, activity._id]
  );

  const isSelfCurrent = Boolean(
    auth?.id &&
    currentAssigneeId &&
    String(auth.id) === currentAssigneeId
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg">
      <ModalOverlay />
      <ModalContent borderRadius="xl">
        <ModalHeader pb={2}>
          {t("activityDetails.actions.assignTicketTitle")}
        </ModalHeader>
        <ModalCloseButton />
        <ModalBody pb={6}>
          {usersLoading ? (
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
                  placeholder={t(
                    "activityDetails.actions.assignSearchPlaceholder"
                  )}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
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
                {auth?.id ? (
                  <Box
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
                    _hover={
                      assignMutation.isPending || isSelfCurrent
                        ? undefined
                        : { bg: listItemHoverBg }
                    }
                    disabled={assignMutation.isPending || isSelfCurrent}
                    opacity={isSelfCurrent ? 0.55 : 1}
                    cursor={
                      assignMutation.isPending || isSelfCurrent
                        ? "not-allowed"
                        : "pointer"
                    }
                    onClick={() => {
                      if (!assignMutation.isPending && !isSelfCurrent) {
                        handlePickUser(String(auth.id));
                      }
                    }}
                  >
                    <Text fontWeight="semibold" fontSize="sm">
                      {t("activityDetails.actions.assignToMe")}
                    </Text>
                    {isSelfCurrent ? (
                      <Text fontSize="xs" color="gray.500" mt={1}>
                        {t("activityDetails.actions.assignCurrent")}
                      </Text>
                    ) : null}
                  </Box>
                ) : null}

                {currentAssigneeId ? (
                  <Box
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
                    _hover={
                      assignMutation.isPending
                        ? undefined
                        : { bg: listItemHoverBg }
                    }
                    disabled={assignMutation.isPending}
                    cursor={assignMutation.isPending ? "not-allowed" : "pointer"}
                    onClick={() => {
                      if (!assignMutation.isPending) handlePickUser(null);
                    }}
                  >
                    <Text fontWeight="semibold" fontSize="sm" color="red.500">
                      {t("activityDetails.actions.unassignTicket")}
                    </Text>
                  </Box>
                ) : null}

                {filteredUsers.map((u) => {
                  const uid = String(u._id);
                  const isCurrent = currentAssigneeId === uid;
                  const disabled = assignMutation.isPending || isCurrent;
                  return (
                    <Box
                      key={uid}
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
                        if (!disabled) handlePickUser(uid);
                      }}
                    >
                      <Text fontWeight="semibold" fontSize="sm" noOfLines={2}>
                        {u.name}
                      </Text>
                      {u.email ? (
                        <Text fontSize="xs" color="gray.500" mt={0.5} noOfLines={1}>
                          {u.email}
                        </Text>
                      ) : null}
                      {isCurrent ? (
                        <Text fontSize="xs" color="gray.500" mt={1}>
                          {t("activityDetails.actions.assignCurrent")}
                        </Text>
                      ) : null}
                    </Box>
                  );
                })}
              </Box>

              {!users?.length ? (
                <Text fontSize="sm" color="gray.500">
                  {t("activityDetails.actions.assignNoUsers")}
                </Text>
              ) : null}
              {users?.length && !filteredUsers.length ? (
                <Text fontSize="sm" color="gray.500">
                  {t("activityDetails.actions.assignNoMatch")}
                </Text>
              ) : null}
            </VStack>
          )}
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

export default AssignTicketModal;
