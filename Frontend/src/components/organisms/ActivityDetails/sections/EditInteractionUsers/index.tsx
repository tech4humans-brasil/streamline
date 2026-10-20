import { getUsersByRole } from "@apis/field";
import { replaceUserInInteraction } from "@apis/activity";
import useAuth from "@hooks/useAuth";
import useActivity from "@hooks/useActivity";
import { IActivityInteractions } from "@interfaces/Activitiy";
import { IUserRoles } from "@interfaces/User";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { FormProvider, useForm } from "react-hook-form";
import Select from "@components/atoms/Inputs/Select";
import { useMemo, useState } from "react";
import {
  Box,
  Button,
  Flex,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Text,
  useToast,
} from "@chakra-ui/react";
import { useTranslation } from "react-i18next";
import { FaPen } from "react-icons/fa";
import { AxiosError } from "axios";

type FormValues = { replacements: Record<string, string | null> };

/**
 * Admin-only: troca quem ainda não respondeu uma interação (ex.: aprovador).
 * O ticket guarda o fluxo da época em que foi aberto, então mudanças no fluxo
 * publicado não chegam aos tickets em andamento.
 */
export default function EditInteractionUsers({
  interaction,
}: {
  interaction: IActivityInteractions;
}) {
  const [auth] = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const { t } = useTranslation();
  const { activity } = useActivity();
  const queryClient = useQueryClient();
  const toast = useToast();

  const methods = useForm<FormValues>({ defaultValues: { replacements: {} } });

  const isAdmin = Boolean(auth?.roles?.includes(IUserRoles.admin));

  const pendingAnswers = useMemo(
    () =>
      interaction.answers.filter(
        (answer) => !answer.data && answer.status === "idle"
      ),
    [interaction.answers]
  );

  const { data: users, isLoading } = useQuery({
    queryKey: ["users", "fields"],
    queryFn: getUsersByRole,
    enabled: isOpen,
  });

  const userOptions = useMemo(() => {
    const inInteraction = new Set(
      interaction.answers.map((answer) => String(answer.user._id))
    );
    return (
      users
        ?.filter((user) => !inInteraction.has(String(user._id)))
        .map((user) => ({ value: user._id, label: user.name })) ?? []
    );
  }, [users, interaction.answers]);

  const closeModal = () => {
    setIsOpen(false);
    methods.reset({ replacements: {} });
  };

  const { mutateAsync, isPending } = useMutation({
    mutationFn: replaceUserInInteraction,
  });

  const onSubmit = methods.handleSubmit(async ({ replacements }) => {
    if (!activity?._id) return;

    const changes = Object.entries(replacements ?? {}).filter(
      (entry): entry is [string, string] => Boolean(entry[1])
    );

    if (new Set(changes.map(([, userId]) => userId)).size !== changes.length) {
      toast({
        title: t("activityDetails.timelineStatus.editApproversError"),
        description: "A mesma pessoa foi escolhida mais de uma vez.",
        status: "error",
        isClosable: true,
      });
      return;
    }

    try {
      for (const [answerId, userId] of changes) {
        await mutateAsync({
          id: activity._id,
          interactionId: interaction._id,
          answerId,
          userId,
        });
      }
      toast({
        title: t("activityDetails.timelineStatus.editApproversSuccess"),
        status: "success",
        isClosable: true,
      });
      closeModal();
    } catch (error) {
      toast({
        title: t("activityDetails.timelineStatus.editApproversError"),
        description: (error as AxiosError<{ message: string }>).response?.data
          ?.message,
        status: "error",
        isClosable: true,
      });
    } finally {
      queryClient.invalidateQueries({ queryKey: ["activity", activity._id] });
    }
  });

  if (!isAdmin || interaction.finished || pendingAnswers.length === 0) {
    return null;
  }

  return (
    <>
      <Button
        leftIcon={<FaPen />}
        onClick={() => setIsOpen(true)}
        colorScheme="gray"
        variant="outline"
        size="sm"
        w="fit-content"
      >
        {t("activityDetails.timelineStatus.editApprovers")}
      </Button>
      <Modal isOpen={isOpen} onClose={closeModal}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>
            {t("activityDetails.timelineStatus.editApprovers")}
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Text fontSize="sm" color="gray.500" mb={4}>
              {t("activityDetails.timelineStatus.editApproversHint")}
            </Text>
            <FormProvider {...methods}>
              <form onSubmit={onSubmit} id="editInteractionUsers">
                <Flex direction="column" gap={4}>
                  {pendingAnswers.map((answer) => (
                    <Box
                      key={answer._id}
                      borderWidth="1px"
                      p={4}
                      borderRadius="md"
                    >
                      <Text fontWeight="bold">{answer.user.name}</Text>
                      <Text fontSize="sm" mb={3}>
                        {answer.user.email}
                      </Text>
                      <Select
                        input={{
                          id: `replacements.${answer._id}`,
                          label: t("activityDetails.timelineStatus.replaceWith"),
                          options: userOptions,
                        }}
                        isLoading={isLoading}
                      />
                    </Box>
                  ))}
                </Flex>
              </form>
            </FormProvider>
          </ModalBody>
          <ModalFooter>
            <Button
              colorScheme="blue"
              mr={3}
              form="editInteractionUsers"
              type="submit"
              isLoading={isPending}
            >
              {t("common.save")}
            </Button>
            <Button variant="ghost" onClick={closeModal} isDisabled={isPending}>
              {t("common.cancel")}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
}
