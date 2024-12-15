import { useCallback, useEffect, useState } from "react";
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
  Text as TextChakra,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Heading,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  ModalFooter,
} from "@chakra-ui/react";
import { NavLink, useNavigate, useParams } from "react-router-dom";
import Text from "@components/atoms/Inputs/Text";
import Select from "@components/atoms/Inputs/Select";
import { createOrUpdateEquipment, getEquipment } from "@apis/equipment";

import { useTranslation } from "react-i18next";
import CreatableSelect from "@components/atoms/Inputs/CreatableSelect";
import TextArea from "@components/atoms/Inputs/TextArea";
import {
  IEquipmentSituation,
  IEquipmentStatus,
  IReturn,
} from "@interfaces/Equipment";
import { FaArrowLeft, FaEye, FaReply } from "react-icons/fa";
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
    .optional()
    .nullable(),
});

const techBrands = [
  { value: "apple", label: "Apple" },
  { value: "asus", label: "Asus" },
  { value: "acer", label: "Acer" },
  { value: "dell", label: "Dell" },
  { value: "hp", label: "HP" },
  { value: "lenovo", label: "Lenovo" },
  { value: "msi", label: "MSI" },
  { value: "samsung", label: "Samsung" },
  { value: "lg", label: "LG" },
  { value: "sony", label: "Sony" },
  { value: "toshiba", label: "Toshiba" },
  { value: "razer", label: "Razer" },
  { value: "logitech", label: "Logitech" },
  { value: "corsair", label: "Corsair" },
  { value: "hyperx", label: "HyperX" },
  { value: "steelseries", label: "SteelSeries" },
  { value: "coolermaster", label: "Cooler Master" },
  { value: "gigabyte", label: "Gigabyte" },
  { value: "nvidia", label: "NVIDIA" },
  { value: "amd", label: "AMD" },
  { value: "intel", label: "Intel" },
  { value: "microsoft", label: "Microsoft" },
  { value: "huawei", label: "Huawei" },
  { value: "xiaomi", label: "Xiaomi" },
  { value: "oneplus", label: "OnePlus" },
  { value: "anker", label: "Anker" },
  { value: "tp-link", label: "TP-Link" },
  { value: "netgear", label: "Netgear" },
  { value: "sandisk", label: "SanDisk" },
  { value: "kingston", label: "Kingston" },
  { value: "seagate", label: "Seagate" },
  { value: "western-digital", label: "Western Digital" },
  { value: "synology", label: "Synology" },
  { value: "qnap", label: "QNAP" },
  { value: "epson", label: "Epson" },
  { value: "canon", label: "Canon" },
  { value: "brother", label: "Brother" },
  { value: "benq", label: "BenQ" },
  { value: "viewsonic", label: "ViewSonic" },
  { value: "philips", label: "Philips" },
  { value: "zowie", label: "Zowie" },
  { value: "thermaltake", label: "Thermaltake" },
  { value: "evga", label: "EVGA" },
  { value: "adata", label: "ADATA" },
  { value: "crucial", label: "Crucial" },
  { value: "beats", label: "Beats by Dre" },
  { value: "bose", label: "Bose" },
  { value: "jbl", label: "JBL" },
  { value: "sony-audio", label: "Sony (Áudio)" },
  { value: "sennheiser", label: "Sennheiser" },
  { value: "plantronics", label: "Plantronics" },
  { value: "astro", label: "Astro Gaming" },
];

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

  const methods = useForm<EquipmentFormInputs>({
    resolver: zodResolver(Schema),
    defaultValues: {
      ...equipment,
      status: equipment?.status ?? IEquipmentStatus.available,
    },
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

  const handleViewReturn = (returnData: IReturn | null) => {
    setSelectedReturn(returnData);
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
              <CreatableSelect
                input={{
                  id: "brandName",
                  label: t("common.fields.brand"),
                  placeholder: t("common.fields.brand"),
                  options: techBrands ?? [],
                  required: true,
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
                  required: false,
                }}
              />
            </Flex>

            <Flex justify="space-between" gap="4" direction={["column", "row"]}>
              {isEditing && (
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
                    isDisabled: isAllocated,
                  }}
                />
              )}

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
                      <Flex justify="center" gap={2} direction="row">
                        <NavLink
                          to={`/portal/allocations/${allocation.user._id}`}
                        >
                          <Button size="sm">
                            <FaEye />
                          </Button>
                        </NavLink>
                        {allocation.return && (
                          <Button
                            size="sm"
                            onClick={() => handleViewReturn(allocation?.return)}
                          >
                            <FaReply />
                          </Button>
                        )}
                      </Flex>
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          </CardBody>
        </Card>
      )}
      <Modal isOpen={!!selectedReturn} onClose={handleCloseReturnModal}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>{t("allocation.returnDetails")}</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            {selectedReturn && (
              <Flex direction="column" gap={2}>
                <TextChakra>{t("common.fields.description")}:</TextChakra>
                <TextChakra>
                  <strong>{selectedReturn.description}</strong>
                </TextChakra>

                <TextChakra>{t("common.fields.backupToDrive")}:</TextChakra>
                <TextChakra>
                  <strong>
                    {t(
                      `common.fields.${selectedReturn.checklist.backup.backupToDrive}`
                    )}
                  </strong>
                </TextChakra>

                <TextChakra>
                  {t("common.fields.verifyFilesIncluded")}:
                </TextChakra>
                <TextChakra>
                  <strong>
                    {t(
                      `common.fields.${selectedReturn.checklist.backup.verifyFilesIncluded}`
                    )}
                  </strong>
                </TextChakra>

                <TextChakra>{t("common.fields.secureBackup")}:</TextChakra>
                <TextChakra>
                  <strong>
                    {t(
                      `common.fields.${selectedReturn.checklist.backup.secureBackup}`
                    )}
                  </strong>
                </TextChakra>

                <TextChakra>
                  {t("common.fields.formattingCompleted")}:
                </TextChakra>
                <TextChakra>
                  <strong>
                    {t(
                      `common.fields.${selectedReturn.checklist.formattingCompleted}`
                    )}
                  </strong>
                </TextChakra>

                <TextChakra>{t("common.fields.hasPhysicalDamage")}:</TextChakra>
                <TextChakra>
                  <strong>
                    {t(
                      `common.fields.${selectedReturn.physicalDamages.additionalInfo.hasPhysicalDamage}`
                    )}
                  </strong>
                </TextChakra>

                <TextChakra>{t("common.fields.damageDetails")}:</TextChakra>
                <TextChakra>
                  <strong>
                    {
                      selectedReturn.physicalDamages.additionalInfo
                        .damageDetails
                    }
                  </strong>
                </TextChakra>

                <TextChakra>
                  {t("common.fields.hasComponentDamage")}:
                </TextChakra>
                <TextChakra>
                  <strong>
                    {t(
                      `common.fields.${selectedReturn.physicalDamages.componentDamage.hasComponentDamage}`
                    )}
                  </strong>
                </TextChakra>

                <TextChakra>{t("common.fields.damageDetails")}:</TextChakra>
                <TextChakra>
                  <strong>
                    {
                      selectedReturn.physicalDamages.componentDamage
                        .damageDetails
                    }
                  </strong>
                </TextChakra>

                <TextChakra>
                  {t("common.fields.accessoriesReturned")}:
                </TextChakra>
                <TextChakra>
                  <strong>
                    {t(
                      `common.fields.${selectedReturn.physicalDamages.accessoriesReturned}`
                    )}
                  </strong>
                </TextChakra>
              </Flex>
            )}
          </ModalBody>
          <ModalFooter justifyContent="space-between">
            <TextChakra fontSize="sm" opacity={0.8}>
              {selectedReturn?.createdBy?.name}{" "}
              {selectedReturn?.createdBy?.email}
            </TextChakra>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Flex>
  );
}
