import { useEffect } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Button,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  useToast,
} from "@chakra-ui/react";
import { createOrUpdateAllocation } from "@apis/allocation";
import Text from "@components/atoms/Inputs/Text";
import EquipmentInput from "@components/atoms/Inputs/InputEquipment";
import { useTranslation } from "react-i18next";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useParams } from "react-router-dom";

const allocationSchema = z.object({
  equipment: z.string().min(1),
  startDate: z.string().optional().nullable(),
  endDate: z.string().optional().nullable(),
});

type AllocationFormSchema = z.infer<typeof allocationSchema>;

interface AllocationFormProps {
  isOpen: boolean;
  onClose: () => void;
}

const AllocationForm: React.FC<AllocationFormProps> = ({ isOpen, onClose }) => {
  const { t } = useTranslation();
  const toast = useToast();
  const queryClient = useQueryClient();

  const { id: userId = "" } = useParams<{ id: string }>();

  const { mutateAsync, isPending } = useMutation({
    mutationFn: createOrUpdateAllocation,
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

  const methods = useForm<AllocationFormSchema>({
    resolver: zodResolver(allocationSchema),
  });

  const {
    handleSubmit,
    formState: { errors },
  } = methods;

  const onSubmit = handleSubmit(async (data) => {
    await mutateAsync({ ...data, userId });
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
          <ModalHeader>{t("allocation.create")}</ModalHeader>
          <ModalBody>
            <EquipmentInput
              input={{ id: "equipment", label: t("common.fields.equipment") }}
            />
            <Text
              input={{
                id: "startDate",
                type: "date",
                label: t("common.fields.startDate"),
                required: true,
              }}
            />
          </ModalBody>
          <ModalFooter>
            <Button
              onClick={onSubmit}
              colorScheme="blue"
              ml={3}
              isLoading={isPending}
              isDisabled={!methods.formState.isDirty}
            >
              {t("allocation.create")}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </FormProvider>
  );
};

export default AllocationForm;
