import { equipmentsForms, getEquipments } from "@apis/equipment";
import { Box, Button, Flex, Heading, Text as ChakraText, Tooltip } from "@chakra-ui/react";
import Can from "@components/atoms/Can";
import Select from "@components/atoms/Inputs/Select";
import Text from "@components/atoms/Inputs/Text";
import Filter from "@components/organisms/Filter";
import Pagination from "@components/organisms/Pagination";
import Table from "@components/organisms/Table";
import { useQuery } from "@tanstack/react-query";
import React, { memo, useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { BiEdit, BiRefresh } from "react-icons/bi";
import { useNavigate, useSearchParams } from "react-router-dom";
import { equipmentTypes, techBrands } from "./constants";
import { formatEquipmentId } from "@utils/formatEquipmentId";

const columns = [
  {
    key: "inventoryNumber",
    label: "id",
  },
  {
    key: "equipmentType",
    label: "common.fields.type",
  },
  {
    key: "brandName",
    label: "common.fields.brand",
  },
  {
    key: "status",
    label: "common.fields.status",
  },
  {
    key: "action",
    label: "common.fields.actions",
  },
];

const Action = memo((user: { _id: string }) => {
  const navigate = useNavigate();

  const handleEdit = useCallback(() => {
    navigate(`/portal/equipment/${user._id}`);
  }, [navigate, user._id]);

  return (
    <div>
      <Button mr={2} onClick={handleEdit} size="sm">
        <BiEdit size={20} />
      </Button>
    </div>
  );
});

const Create = memo(() => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const handleCreate = useCallback(() => {
    navigate(`/portal/equipment`);
  }, [navigate]);

  return (
    <div>
      <Can permission="equipment.create">
        <Button colorScheme="blue" mr={2} onClick={handleCreate} size="sm">
          {t("equipment.create")}
        </Button>
      </Can>
    </div>
  );
});

const Equipments: React.FC = () => {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();

  const {
    data: { equipments, pagination } = {},
    isFetching,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["equipments", searchParams.toString()],
    queryFn: getEquipments,
  });

  const { data: forms, isFetching: isFetchingForms } = useQuery({
    queryKey: ["equipments", "forms"],
    queryFn: equipmentsForms,
  });

  const data = useMemo(() => {
    if (!equipments) return [];

    const typeMap = new Map(equipmentTypes.map((i) => [i.value, i.label]));
    const brandMap = new Map(techBrands.map((i) => [i.value, i.label]));

    return equipments.map((equipment) => {
      const formattedId = formatEquipmentId(equipment.equipmentType, equipment.inventoryNumber);
      
      return {
        ...equipment,
        // Mostrar inventoryNumber com prefixo (ex: NTB-123) e legacyInventoryNumber se existir
        inventoryNumber: equipment.legacyInventoryNumber ? (
          <Flex align="center" gap={2}>
            <Tooltip label="ID Único" hasArrow>
              <ChakraText fontWeight="bold">{formattedId}</ChakraText>
            </Tooltip>
            <Tooltip label="ID Legado" hasArrow>
              <ChakraText 
                fontSize="sm" 
                color="gray.500"
                cursor="help"
              >
                ({equipment.legacyInventoryNumber})
              </ChakraText>
            </Tooltip>
          </Flex>
        ) : (
          <ChakraText fontWeight="bold">{formattedId}</ChakraText>
        ),
        equipmentType: typeMap.get(equipment.equipmentType) || equipment.equipmentType,
        brandName: (equipment.brandName && brandMap.get(equipment.brandName)) || equipment.brandName,
        status: t(`common.fields.${equipment.status}`),
        action: <Action {...equipment} />,
      };
    });
  }, [equipments, t]);

  return (
    <Box width="100%" p={[4, 10]}>
      <Heading>{t("equipments.title")}</Heading>
      <Flex justifyContent="flex-end" mt="4" width="100%">
        <Button
          onClick={() => refetch()}
          mr={2}
          size="sm"
          isLoading={isFetching}
        >
          <BiRefresh size={20} />
        </Button>
        <Create />
      </Flex>

      <Filter.Container>
        <Text
          input={{
            label: "ID",
            id: "inventoryNumber",
          }}
        />

        <Text
          input={{
            label: "ID Legado",
            id: "legacyInventoryNumber",
          }}
        />

        <Text
          input={{
            label: t("common.fields.serial"),
            id: "serialNumber",
          }}
        />

        <Select
          input={{
            label: t("common.fields.type"),
            id: "equipmentType",
            options:
              forms?.types?.map((type) => {
                const typeConfig = equipmentTypes.find((et) => et.value === type);
                return {
                  label: typeConfig?.label || type,
                  value: type,
                };
              }) || [],
          }}
          isLoading={isFetchingForms}
        />

        <Select
          input={{
            label: t("common.fields.brand"),
            id: "brandName",
            options:
              forms?.brandNames?.map((brand) => {
                const brandConfig = techBrands.find((tb) => tb.value === brand);
                return {
                  label: brandConfig?.label || brand,
                  value: brand,
                };
              }) || [],
          }}
          isLoading={isFetchingForms}
        />

        <Select
          input={{
            label: t("common.fields.status"),
            id: "status",
            options:
              forms?.status?.map((status) => ({
                label: t(`common.fields.${status}`),
                value: status,
              })) || [],
          }}
          isLoading={isFetchingForms}
        />

        <Select
          input={{
            label: t("common.fields.situation"),
            id: "situation",
            options:
              forms?.situation?.map((situation) => ({
                label: t(`common.fields.${situation}`),
                value: situation,
              })) || [],
          }}
          isLoading={isFetchingForms}
        />
      </Filter.Container>

      <Flex
        justifyContent="center"
        alignItems="center"
        mt="4"
        width="100%"
        p="4"
        borderRadius="md"
        direction="column"
        bg={"bg.card"}
      >
        <Table columns={columns} data={data} />
        <Pagination pagination={pagination} isLoading={isFetching} />
      </Flex>
      {isError && (
        <Flex justifyContent="center" alignItems="center" mt="4" width="100%">
          <Heading color="red.500">{t("table.error")}</Heading>
        </Flex>
      )}
    </Box>
  );
};

export default Equipments;
