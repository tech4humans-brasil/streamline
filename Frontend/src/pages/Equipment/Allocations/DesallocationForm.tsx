import { useEffect } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Button,
  Divider,
  Flex,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  useToast,
} from "@chakra-ui/react";
import { updateAllocation } from "@apis/allocation";
import { useTranslation } from "react-i18next";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useParams } from "react-router-dom";
import TextArea from "@components/atoms/Inputs/TextArea";
import Radio from "@components/atoms/Inputs/Radio";

const deallocationSchema = z.object({
  description: z.string().min(3),
  checklist: z.object({
    backup: z.object({
      backupToDrive: z.string().min(1),
      verifyFilesIncluded: z.string().min(1),
      secureBackup: z.string().min(1),
    }),
    formattingCompleted: z.string().min(1),
  }),
  physicalDamages: z.object({
    additionalInfo: z.object({
      hasPhysicalDamage: z.string().min(1),
      damageDetails: z.string().nullable().default(null),
    }),
    componentDamage: z.object({
      hasComponentDamage: z.string().min(1),
      damageDetails: z.string().nullable().default(null),
    }),
    accessoriesReturned: z.string().min(1),
  }),
});

type DeallocationFormSchema = z.infer<typeof deallocationSchema>;

interface DeallocationFormProps {
  isOpen: boolean;
  onClose: () => void;
  id: string;
}

const DeallocationForm: React.FC<DeallocationFormProps> = ({
  id,
  isOpen,
  onClose,
}) => {
  const { t } = useTranslation();
  const toast = useToast();
  const queryClient = useQueryClient();

  const { id: userId = "" } = useParams<{ id: string }>();

  const { mutateAsync, isPending } = useMutation({
    mutationFn: updateAllocation,
    onSuccess: () => {
      toast({
        title: t(`allocation.updated`),
        status: "success",
        duration: 3000,
        isClosable: true,
        position: "top-right",
      });
      queryClient.invalidateQueries({ queryKey: ["allocations", userId] });
      onClose();
    },
    onError: () => {
      toast({
        title: t(`allocation.error`),
        status: "error",
        duration: 3000,
        isClosable: true,
        position: "top-right",
      });
    },
  });

  const methods = useForm<DeallocationFormSchema>({
    resolver: zodResolver(deallocationSchema),
  });

  const {
    handleSubmit,
    formState: { errors },
  } = methods;

  const onSubmit = handleSubmit(async (data) => {
    await mutateAsync({ userId, data, id });
  });

  useEffect(() => {
    console.log(errors);
  }, [errors]);

  return (
    <FormProvider {...methods}>
      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalCloseButton />
        <ModalContent>
          <ModalHeader>{t("allocation.deallocate")}</ModalHeader>
          <ModalBody>
            <TextArea
              input={{
                id: "description",
                label: t("common.fields.description"),
                required: true,
              }}
            />
            <Flex direction="column" gap={4} mt="4">
              <Radio
                input={{
                  id: "checklist.backup.backupToDrive",
                  label: t("common.fields.backupToDrive"),
                  options: [
                    { value: "yes", label: t("common.fields.yes") },
                    { value: "no", label: t("common.fields.no") },
                  ],
                  required: true,
                }}
              />
              <Radio
                input={{
                  id: "checklist.backup.verifyFilesIncluded",
                  label: t("common.fields.verifyFilesIncluded"),
                  options: [
                    { value: "yes", label: t("common.fields.yes") },
                    { value: "no", label: t("common.fields.no") },
                  ],
                  required: true,
                }}
              />
              <Radio
                input={{
                  id: "checklist.backup.secureBackup",
                  label: t("common.fields.secureBackup"),
                  options: [
                    { value: "yes", label: t("common.fields.yes") },
                    { value: "no", label: t("common.fields.no") },
                  ],
                  required: true,
                }}
              />
              <Radio
                input={{
                  id: "checklist.formattingCompleted",
                  label: t("common.fields.formattingCompleted"),
                  options: [
                    { value: "yes", label: t("common.fields.yes") },
                    { value: "no", label: t("common.fields.no") },
                  ],
                  required: true,
                }}
              />
            </Flex>

            <Divider mt="4" />

            <Flex direction="column" gap={4} mt="4">
              <Radio
                input={{
                  id: "physicalDamages.additionalInfo.hasPhysicalDamage",
                  label: t("common.fields.hasPhysicalDamage"),
                  options: [
                    { value: "yes", label: t("common.fields.yes") },
                    { value: "no", label: t("common.fields.no") },
                  ],
                }}
              />
              <TextArea
                input={{
                  id: "physicalDamages.additionalInfo.damageDetails",
                  label: t("common.fields.damageDetails"),
                }}
              />
              <Radio
                input={{
                  id: "physicalDamages.componentDamage.hasComponentDamage",
                  label: t("common.fields.hasComponentDamage"),
                  options: [
                    { value: "yes", label: t("common.fields.yes") },
                    { value: "no", label: t("common.fields.no") },
                  ],
                }}
              />
              <TextArea
                input={{
                  id: "physicalDamages.componentDamage.damageDetails",
                  label: t("common.fields.damageDetails"),
                }}
              />
              <Radio
                input={{
                  id: "physicalDamages.accessoriesReturned",
                  label: t("common.fields.accessoriesReturned"),
                  options: [
                    { value: "yes", label: t("common.fields.yes") },
                    { value: "no", label: t("common.fields.no") },
                  ],
                }}
              />
            </Flex>
          </ModalBody>
          <ModalFooter>
            <Button
              onClick={onSubmit}
              colorScheme="blue"
              ml={3}
              isLoading={isPending}
              isDisabled={!methods.formState.isDirty}
            >
              {t("allocation.deallocate")}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </FormProvider>
  );
};

export default DeallocationForm;
