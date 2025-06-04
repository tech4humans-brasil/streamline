import { useCallback, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Flex, useToast } from "@chakra-ui/react";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { createOrUpdateEquipment, getEquipment } from "@apis/equipment";
import { IReturn } from "@interfaces/Equipment";
import { EquipmentForm } from "./components/EquipmentForm";
import { AllocationsTimeline } from "./components/AllocationsTimeline";
import { ReturnDetailsModal } from "./components/ReturnDetailsModal";

export default function Equipment() {
  const { t } = useTranslation();
  const toast = useToast();
  const navigate = useNavigate();
  const params = useParams<{ id?: string }>();
  const queryClient = useQueryClient();
  const [selectedReturn, setSelectedReturn] = useState<IReturn | null>(null);

  const handleBack = useCallback(() => {
    navigate(-1);
  }, [navigate]);

  const isEditing = !!params?.id;
  const id = params?.id ?? "";

  const { data: equipment, isLoading } = useQuery({
    queryKey: ["equipment", id],
    queryFn: getEquipment,
    enabled: isEditing,
  });

  const { mutateAsync, isPending } = useMutation({
    mutationFn: createOrUpdateEquipment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["equipments"] });
      toast({
        title: t(`equipment.${isEditing ? "updated" : "created"}`),
        status: "success",
        duration: 3000,
        isClosable: true,
        position: "top-right",
      });
      navigate(-1);
    },
    onError: () => {
      toast({
        title: t(`equipment.error`),
        status: "error",
        duration: 3000,
        isClosable: true,
        position: "top-right",
      });
    },
  });

  const handleCancel = useCallback(() => {
    navigate(-1);
  }, [navigate]);

  const handleViewReturn = (returnData?: IReturn | null) => {
    setSelectedReturn(returnData ?? null);
  };

  const handleCloseReturnModal = () => {
    setSelectedReturn(null);
  };

  return (
    <Flex
      w="100%"
      my="6"
      mx="auto"
      px="6"
      justify="center"
      direction="column"
      align="center"
    >
      <EquipmentForm
        equipment={equipment}
        onSubmit={mutateAsync}
        onCancel={handleCancel}
        onBack={handleBack}
        isEditing={isEditing}
        isSubmitting={isPending || isLoading}
      />

      {equipment?.allocations && (
        <AllocationsTimeline
          allocations={equipment.allocations}
          onViewReturn={handleViewReturn}
        />
      )}

      <ReturnDetailsModal
        returnData={selectedReturn}
        onClose={handleCloseReturnModal}
      />
    </Flex>
  );
}
