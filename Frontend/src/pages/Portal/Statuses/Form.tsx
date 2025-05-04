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
  CardProps,
  Flex,
  Heading,
  useToast,
} from "@chakra-ui/react";
import { useNavigate, useParams } from "react-router-dom";
import { getStatus, createOrUpdateStatus } from "@apis/status";
import Text from "@components/atoms/Inputs/Text";
import Select from "@components/atoms/Inputs/Select";
import Can from "@components/atoms/Can";
import { useTranslation } from "react-i18next";
import { FaArrowLeft } from "react-icons/fa";

const statusSchema = z.object({
  name: z.string().min(3, { message: "Nome deve ter no mínimo 3 caracteres" }),
  type: z.enum(["done", "progress", "canceled"]),
  project: z.string().optional().nullable(),
});

type StatusFormSchema = z.infer<typeof statusSchema>;

interface StatusFormProps extends CardProps {
  id?: string;
  isModal?: boolean;
}

const StatusForm: React.FC<StatusFormProps> = ({
  id = "",
  isModal,
  ...props
}) => {
  const { t } = useTranslation();
  const toast = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const params = useParams<{ project: string }>();
  const project = params?.project as string;

  const isEditing = !!id;

  const { data: status, isLoading } = useQuery({
    queryKey: ["status", id],
    queryFn: getStatus,
    enabled: isEditing,
  });

  const { mutateAsync, isPending } = useMutation({
    mutationFn: createOrUpdateStatus,
    onSuccess: () => {
      toast({
        title: t(`status.${isEditing ? "updated" : "created"}`),
        status: "success",
        duration: 3000,
        isClosable: true,
        position: "top-right",
      });
      queryClient.invalidateQueries({ queryKey: ["statuses"] });
      queryClient.invalidateQueries({ queryKey: ["forms"] });
      !isModal && navigate(-1);
    },
    onError: () => {
      toast({
        title: t(`status.error`),
        status: "error",
        duration: 3000,
        isClosable: true,
        position: "top-right",
      });
    },
  });

  const methods = useForm<StatusFormSchema>({
    resolver: zodResolver(statusSchema),
    defaultValues: status ?? {},
  });

  const {
    handleSubmit,
    reset,
    formState: { errors },
  } = methods;

  const onSubmit = handleSubmit(async (data) => {
    await mutateAsync(isEditing ? { ...data, _id: id } : data);
  });

  const handleCancel = useCallback(() => {
    reset(status);
  }, [status, reset]);

  useEffect(() => {
    if (status) {
      reset(status);
    }
  }, [status, reset]);

  useEffect(() => { }, [errors]);

  useEffect(() => {
    methods.setValue("project", project);
  }, [project]);

  return (
    <FormProvider {...methods}>
      <Card
        as="form"
        onSubmit={onSubmit}
        borderRadius={8}
        h="fit-content"
        w="100%"
        maxW="600px"
        {...props}
      >
        <CardHeader>
          <Flex align="center" justify="space-between">
            <Button
              variant="ghost"
              onClick={() => navigate(-1)}
              w="fit-content"
            >
              <FaArrowLeft />
            </Button>
            <Heading
              fontSize="2xl"
              fontWeight="bold"
              w="100%"
              textAlign="center"
            >
              {t(`status.${isEditing ? "edit" : "create"}`)}
            </Heading>
          </Flex>
        </CardHeader>
        <CardBody display="flex" flexDirection="column" gap="4">
          <Text
            input={{
              id: "name",
              label: t("common.fields.name"),
              required: true,
            }}
          />

          <Select
            input={{
              id: "type",
              label: t("common.fields.type"),
              required: true,
              options: [
                { label: t("common.fields.statusType.done"), value: "done" },
                {
                  label: t("common.fields.statusType.progress"),
                  value: "progress",
                },
                {
                  label: t("common.fields.statusType.canceled"),
                  value: "canceled",
                },
              ],
            }}
          />

          <Flex mt="8" justify="flex-end" gap="4">
            <Button
              mt={4}
              colorScheme="gray"
              variant="outline"
              onClick={handleCancel}
            >
              {t("status.cancel")}
            </Button>
            <Can permission={isEditing ? "status.update" : "status.create"}>
              <Button
                mt={4}
                colorScheme="blue"
                isLoading={isPending || isLoading}
                type="submit"
              >
                {t("status.submit")}
              </Button>
            </Can>
          </Flex>
        </CardBody>
      </Card>
    </FormProvider>
  );
};

export default StatusForm;
