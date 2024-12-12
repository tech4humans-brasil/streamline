import Select from "@components/atoms/Inputs/Select";
import { useQuery } from "@tanstack/react-query";
import React, { useMemo } from "react";
import { getAvailableEquipments } from "@apis/equipment";

interface InputEquipmentProps {
  input: {
    id: string;
    label: string;
    describe?: string | null;
    multi?: boolean;
    required?: boolean;
  };
}

const InputEquipment: React.FC<InputEquipmentProps> = ({ input }) => {
  const { data: equipments, isLoading } = useQuery({
    queryKey: ["equipments"],
    queryFn: getAvailableEquipments,
  });

  const equipmentOptions = useMemo(() => {
    if (!equipments?.equipments) return [];

    const groupedEquipments = equipments?.equipments?.reduce((acc, e) => {
      const group = acc[e.equipmentType] || [];
      group.push({
        label: `${e.brandName} - ${e.inventoryNumber}`,
        value: e._id,
      });
      acc[e.equipmentType] = group;
      return acc;
    }, {} as Record<string, { label: string; value: string }[]>);

    return Object.entries(groupedEquipments).map(
      ([equipmentType, options]) => ({
        label: equipmentType,
        options,
      })
    );
  }, [equipments]);

  return (
    <Select
      input={{
        id: input.id,
        label: input.label,
        options: equipmentOptions,
      }}
      isLoading={isLoading}
    />
  );
};

export default InputEquipment;
