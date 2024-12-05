import { useCallback, useEffect } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Box,
  Button,
  Card,
  CardBody,
  CardHeader,
  Flex,
  useToast,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Heading,
} from "@chakra-ui/react";
import { NavLink, useNavigate, useParams } from "react-router-dom";
import Text from "@components/atoms/Inputs/Text";
import Select from "@components/atoms/Inputs/Select";
import { createOrUpdateEquipment, getEquipment } from "@apis/equipment";

import { useTranslation } from "react-i18next";
import CreatableSelect from "@components/atoms/Inputs/CreatableSelect";
import TextArea from "@components/atoms/Inputs/TextArea";
import { IEquipmentSituation, IEquipmentStatus } from "@interfaces/Equipment";
import { FaArrowLeft, FaEye } from "react-icons/fa";
import File from "@components/atoms/Inputs/File";

const Schema = z.object({
  _id: z.string().optional(),
  formName: z.string(),
  inventoryNumber: z.string(),
  equipmentType: z.string(),
  brandName: z.string().optional(),
  status: z.nativeEnum(IEquipmentStatus),
  situation: z.nativeEnum(IEquipmentSituation),
  modelDescription: z.string().optional(),
  serialNumber: z.string().optional(),
  additionalNotes: z.string().optional(),
  invoice: z
    .object({
      name: z.string(),
      url: z.string(),
      mimeType: z.string(),
      size: z.string(),
      containerName: z.string(),
    })
    .nullable(),
});

const equipmentTypes = [
  {
    label: "Notebook",
    value: "notebook",
  },
  {
    label: "Monitor",
    value: "monitor",
  },
  {
    label: "Suporte Notebook",
    value: "suporte-notebook",
  },
  {
    label: "Impressora",
    value: "impressora",
  },
  {
    label: "Headset",
    value: "headset",
  },
  {
    label: "Mouse e Teclado",
    value: "mouse-keyboard",
  },
  {
    label: "Mouse",
    value: "mouse",
  },
  {
    label: "Cadeira",
    value: "cadeira",
  },
  {
    label: "Mesa",
    value: "mesa",
  },
  {
    label: "Hub USB",
    value: "hub-usb",
  },
];

type EquipmentFormInputs = z.infer<typeof Schema>;

export default function Equipment() {
  const { t } = useTranslation();
  const toast = useToast();
  const navigate = useNavigate();
  const params = useParams<{ id?: string }>();
  const queryClient = useQueryClient();

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

  const methods = useForm<EquipmentFormInputs>({
    resolver: zodResolver(Schema),
    defaultValues: equipment,
  });

  const {
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = methods;

  const onSubmit = handleSubmit(async (data) => {
    await mutateAsync(data);
  });

  const handleCancel = useCallback(() => {
    navigate(-1);
  }, [navigate]);

  useEffect(() => {
    if (equipment) {
      reset(equipment);
    }
  }, [equipment, reset]);

  useEffect(() => {}, [errors]);

  console.log(errors);

  const isAllocated = watch("status") === IEquipmentStatus.allocated;

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
      <FormProvider {...methods}>
        <Card
          as="form"
          onSubmit={onSubmit}
          borderRadius={8}
          h="fit-content"
          w="100%"
          maxW="1000px"
        >
          <CardHeader>
            <Flex direction="row" justify={"center"} align="center" gap={4}>
              <Button variant="ghost" onClick={handleBack} w="fit-content">
                <FaArrowLeft />
              </Button>
              <Heading size="lg">
                {t(`equipment.${isEditing ? "edit" : "create"}`)}
              </Heading>
            </Flex>
          </CardHeader>

          <CardBody display="flex" flexDirection="column" gap="4">
            <Flex justify="space-between" gap="4" direction={["column", "row"]}>
              <Text
                input={{
                  id: "formName",
                  label: t("common.fields.name"),
                  placeholder: t("common.fields.name"),
                  required: true,
                }}
              />
              <Text
                input={{
                  id: "inventoryNumber",
                  label: t("common.fields.inventoryNumber"),
                  placeholder: t("common.fields.inventoryNumber"),
                  required: true,
                }}
              />
            </Flex>
            <Flex justify="space-between" gap="4" direction={["column", "row"]}>
              <CreatableSelect
                input={{
                  id: "equipmentType",
                  label: t("common.fields.type"),
                  placeholder: t("common.fields.type"),
                  required: true,
                  options: equipmentTypes ?? [],
                }}
              />
              <Text
                input={{
                  id: "brandName",
                  label: t("common.fields.brand"),
                  placeholder: t("common.fields.brand"),
                }}
              />
            </Flex>

            <Flex justify="space-between" gap="4" direction={["column", "row"]}>
              <Text
                input={{
                  id: "serialNumber",
                  label: t("common.fields.serial"),
                  placeholder: t("common.fields.serial"),
                }}
              />

              <File
                input={{
                  id: "invoice",
                  label: t("common.fields.invoice"),
                  placeholder: t("common.fields.invoice"),
                }}
              />
            </Flex>

            <Flex justify="space-between" gap="4" direction={["column", "row"]}>
              <Select
                input={{
                  id: "status",
                  label: t("common.fields.status"),
                  placeholder: t("common.fields.status"),
                  options: [
                    { label: t("common.fields.allocated"), value: "allocated" },
                    { label: t("common.fields.available"), value: "available" },
                    { label: t("common.fields.discarded"), value: "discarded" },
                    { label: t("common.fields.office"), value: "office" },
                  ],
                }}
              />

              <Select
                input={{
                  id: "situation",
                  label: t("common.fields.situation"),
                  placeholder: t("common.fields.situation"),
                  options: [
                    { label: t("common.fields.new"), value: "new" },
                    { label: t("common.fields.used"), value: "used" },
                    { label: t("common.fields.broken"), value: "broken" },
                    { label: t("common.fields.damaged"), value: "damaged" },
                    { label: t("common.fields.lost"), value: "lost" },
                    { label: t("common.fields.discarded"), value: "discarded" },
                  ],
                }}
              />
            </Flex>

            <TextArea
              input={{
                id: "modelDescription",
                label: t("common.fields.description"),
                placeholder: t("common.fields.description"),
              }}
            />

            <TextArea
              input={{
                id: "additionalNotes",
                label: t("common.fields.notes"),
                placeholder: t("common.fields.notes"),
              }}
            />

            <Flex mt="8" justify="flex-end" gap="4">
              <Button
                mt={4}
                colorScheme="gray"
                variant="outline"
                onClick={handleCancel}
              >
                {t("common.cancel")}
              </Button>
              <Button
                mt={4}
                colorScheme="blue"
                isLoading={isPending || isLoading}
                isDisabled={isAllocated}
                type="submit"
              >
                {t("equipment.submit")}
              </Button>
            </Flex>
          </CardBody>
        </Card>
      </FormProvider>

      {equipment?.allocations && equipment.allocations.length > 0 && (
        <Card borderRadius={8} h="fit-content" w="100%" maxW="1000px" mt={4}>
          <CardHeader>
            <Box textAlign="center" fontSize="lg" fontWeight="bold">
              {t("equipment.allocations")}
            </Box>
          </CardHeader>
          <CardBody>
            <Table>
              <Thead>
                <Tr>
                  <Th>{t("common.fields.user")}</Th>
                  <Th>{t("common.fields.email")}</Th>
                  <Th>{t("common.fields.startDate")}</Th>
                  <Th>{t("common.fields.endDate")}</Th>
                  <Th>{t("common.fields.actions")}</Th>
                </Tr>
              </Thead>
              <Tbody>
                {equipment.allocations.map((allocation) => (
                  <Tr key={allocation.allocation}>
                    <Td>{allocation.user.name}</Td>
                    <Td>{allocation.user.email}</Td>
                    <Td>
                      {new Date(allocation.startDate).toLocaleDateString()}
                    </Td>
                    <Td>
                      {allocation.endDate
                        ? new Date(allocation.endDate).toLocaleDateString()
                        : t("common.fields.active")}
                    </Td>
                    <Td>
                      <NavLink
                        to={`/portal/allocations/${allocation.user._id}`}
                      >
                        <Button size="sm">
                          <FaEye />
                        </Button>
                      </NavLink>
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          </CardBody>
        </Card>
      )}
    </Flex>
  );
}
