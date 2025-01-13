import { getUsersByRole } from "@apis/field";
import useAuth from "@hooks/useAuth";
import { IActivityInteractions } from "@interfaces/Activitiy";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { FormProvider, useFieldArray, useForm } from "react-hook-form";
import Select from "@components/atoms/Inputs/Select";
import TextArea from "@components/atoms/Inputs/TextArea";
import { useCallback, useMemo, useState } from "react";
import {
  Button,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  ModalFooter,
  Flex,
} from "@chakra-ui/react";
import { addUsersInInteraction } from "@apis/activity";
import { useTranslation } from "react-i18next";
import useActivity from "@hooks/useActivity";
import { FaPlus, FaTrash } from "react-icons/fa";
import { BiX } from "react-icons/bi";

export default function AddInteractionUser({
  interaction,
}: {
  interaction: IActivityInteractions;
}) {
  const [auth] = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const { t } = useTranslation();
  const { activity } = useActivity();

  const methods = useForm();
  const queryClient = useQueryClient();

  const { fields, append, remove } = useFieldArray({
    control: methods.control,
    name: "users",
  });

  const { data: users, isLoading } = useQuery({
    queryKey: ["users", "fields"],
    queryFn: getUsersByRole,
  });

  const openModal = () => setIsOpen(true);
  const closeModal = () => setIsOpen(false);

  const { mutateAsync, isPending } = useMutation({
    mutationFn: addUsersInInteraction,
    onSuccess: () => {
      closeModal();
      queryClient.invalidateQueries({ queryKey: ["activity", activity?._id] });
    },
  });

  const mutate = useCallback(
    async (users?: { userId: string; observation: string }[]) => {
      if (!activity?._id) return;

      await mutateAsync({
        id: activity._id,
        interactionId: interaction._id,
        users: users,
      });
    },
    [activity, interaction, mutateAsync]
  );

  const handleMutate = useCallback(() => {
    if (
      confirm("Tem certeza, depois não será possível adicionar mais usuários")
    ) {
      mutate();
    }
  }, [confirm, mutate]);

  const onSubmit = methods.handleSubmit((data) => {
    if (!activity?._id) return;

    mutate(data.users);
  });

  const hasUsers = useMemo(
    () => interaction.answers.length > 0,
    [interaction.answers]
  );

  if (!interaction?.canAddParticipants) return null;

  if (auth?.id && !interaction?.permissionAddParticipants?.includes(auth.id)) {
    return null;
  }

  return (
    <>
      <Flex justifyContent="space-between">
        <Button
          leftIcon={<FaPlus />}
          onClick={openModal}
          colorScheme="gray"
          variant="outline"
          size="sm"
          mt={4}
        >
          Add {t("common.fields.user")}
        </Button>

        {hasUsers && (
          <Button
            onClick={handleMutate}
            colorScheme="red"
            variant="outline"
            size="sm"
            mt={4}
            isLoading={isPending}
          >
            <BiX />
          </Button>
        )}
      </Flex>
      <Modal isOpen={isOpen} onClose={closeModal}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>{t("common.fields.users")}</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <FormProvider {...methods}>
              <form onSubmit={onSubmit} id="addInteractionUser">
                <Flex direction="column" gap={4}>
                  <Flex justifyContent="end">
                    <Button
                      colorScheme="blue"
                      onClick={() => append({})}
                      size="sm"
                    >
                      <FaPlus />
                    </Button>
                  </Flex>
                  {fields.map((field, index) => (
                    <Flex
                      key={field.id}
                      mb={4}
                      borderWidth="1px"
                      p={4}
                      borderRadius="md"
                      direction="column"
                      gap={4}
                      position="relative"
                    >
                      <Button
                        colorScheme="red"
                        onClick={() => remove(index)}
                        size="sm"
                        alignSelf="end"
                        position="absolute"
                        top={2}
                        zIndex={200}
                      >
                        <FaTrash />
                      </Button>

                      <Select
                        key={field.id}
                        input={{
                          id: `users[${index}].userId`,
                          label: t("common.fields.user"),
                          required: true,
                          options:
                            users?.map((user) => ({
                              value: user._id,
                              label: user.name,
                            })) ?? [],
                        }}
                        isLoading={isLoading}
                      />

                      <TextArea
                        input={{
                          id: `users[${index}].observation`,
                          label: t("common.fields.description"),
                        }}
                      />
                    </Flex>
                  ))}
                </Flex>
              </form>
            </FormProvider>
          </ModalBody>
          <ModalFooter>
            <Button
              colorScheme="blue"
              mr={3}
              form="addInteractionUser"
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
