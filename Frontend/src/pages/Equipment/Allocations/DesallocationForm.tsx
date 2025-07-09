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
import { IEquipmentStatus } from "@interfaces/Equipment";
import Select from "@components/atoms/Inputs/Select";

const deallocationSchema = z.object({
  description: z.string().min(3),
  status: z.nativeEnum(IEquipmentStatus).default(IEquipmentStatus.available),
  checklist: z.object({
    backup: z.object({
      verifyFilesIncluded: z.enum(["yes", "no"]),
      secureBackup: z.enum(["yes", "no"]),
    }),
    formattingCompleted: z.enum(["yes", "no"]),
  }),
  physicalDamages: z.object({
    additionalInfo: z.object({
      hasPhysicalDamage: z.enum(["yes", "no"]),
      damageDetails: z.string().optional(),
    }),
    componentDamage: z.object({
      hasComponentDamage: z.enum(["yes", "no"]),
      damageDetails: z.string().optional(),
    }),
    accessoriesReturned: z.enum(["yes", "no"]).optional(),
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
      });
    },
  });

  const methods = useForm<DeallocationFormSchema>({
    resolver: zodResolver(deallocationSchema),
    defaultValues: {
      status: IEquipmentStatus.available,
    },
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
          <ModalBody display="flex" flexDirection="column" gap={4}>
            <TextArea
              input={{
                id: "description",
                label: t("common.fields.description"),
                required: true,
              }}
            />
            <Select
              input={{
                id: "status",
                label: t("common.fields.status"),
                placeholder: t("common.fields.status"),
                options: [
                  {
                    label: t("common.fields.allocated"),
                    value: "allocated",
                    isDisabled: true,
                  },
                  {
                    label: t("common.fields.available"),
                    value: "available",
                  },
                  {
                    label: t("common.fields.discarded"),
                    value: "discarded",
                  },
                  { label: t("common.fields.office"), value: "office" },
                ],
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
