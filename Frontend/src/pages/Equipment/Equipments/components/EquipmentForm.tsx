import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { FormProvider } from "react-hook-form";
import {
  Button,
  Card,
  CardBody,
  CardHeader,
  Flex,
  Heading,
} from "@chakra-ui/react";
import { useTranslation } from "react-i18next";
import { FaArrowLeft } from "react-icons/fa";
import Text from "@components/atoms/Inputs/Text";
import Select from "@components/atoms/Inputs/Select";
import CreatableSelect from "@components/atoms/Inputs/CreatableSelect";
import TextArea from "@components/atoms/Inputs/TextArea";
import File from "@components/atoms/Inputs/File";
import {
  IEquipmentSituation,
  IEquipmentStatus,
} from "@interfaces/Equipment";
import { equipmentTypes, techBrands } from "../constants";

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

type EquipmentFormInputs = z.infer<typeof Schema>;

interface EquipmentFormProps {
  equipment?: EquipmentFormInputs;
  onSubmit: (data: EquipmentFormInputs) => void;
  onCancel: () => void;
  onBack: () => void;
  isEditing: boolean;
  isSubmitting: boolean;
}

export function EquipmentForm({
  equipment,
  onSubmit,
  onCancel,
  onBack,
  isEditing,
  isSubmitting,
}: EquipmentFormProps) {
  const { t } = useTranslation();

  const methods = useForm<EquipmentFormInputs>({
    resolver: zodResolver(Schema),
    defaultValues: {
      ...equipment,
      status: equipment?.status ?? IEquipmentStatus.available,
    },
  });

  const {
    handleSubmit,
    watch,
  } = methods;

  const isAllocated = watch("status") === IEquipmentStatus.allocated;

  return (
    <FormProvider {...methods}>
      <Card
        as="form"
        onSubmit={handleSubmit(onSubmit)}
        borderRadius={8}
        h="fit-content"
        w="100%"
        maxW="1000px"
      >
        <CardHeader>
          <Flex direction="row" justify={"center"} align="center" gap={4}>
            <Button variant="ghost" onClick={onBack} w="fit-content">
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

          <Flex mt="8" justify="flex-end" gap="4">
            <Button
              mt={4}
              colorScheme="gray"
              variant="outline"
              onClick={onCancel}
            >
              {t("common.cancel")}
            </Button>
            <Button
              mt={4}
              colorScheme="blue"
              isLoading={isSubmitting}
              type="submit"
            >
              {t("equipment.submit")}
            </Button>
          </Flex>
        </CardBody>
      </Card>
    </FormProvider>
  );
} 