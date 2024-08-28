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
} from "@chakra-ui/react";
import { useNavigate, useParams } from "react-router-dom";
import Text from "@components/atoms/Inputs/Text";
import Select from "@components/atoms/Inputs/Select";
import {
  committedActivity,
  getActivity,
  getActivityForms,
} from "@apis/activity";
import TextArea from "@components/atoms/Inputs/TextArea";
import ActivityDetails from "@components/organisms/ActivityDetails";
import ActivityProvider from "@contexts/ActivityContext";
import { useTranslation } from "react-i18next";

const activitySchema = z.object({
  _id: z.string(),
  name: z.string().min(3, { message: "Nome deve ter no mínimo 3 caracteres" }),
  description: z
    .string()
    .min(3, { message: "Descrição deve ter no mínimo 3 caracteres" }),
  users: z
    .array(z.string())
    .nonempty({ message: "Selecione pelo menos um aluno" }),
});

type ActivityFormSchema = z.infer<typeof activitySchema>;

export default function ActivityCommit() {
  const { t } = useTranslation();
  const toast = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const params = useParams<{ id: string }>();
  const id = params.id ?? "";

  const { data: activity, isLoading } = useQuery({
    queryKey: ["activity", id],
    queryFn: getActivity,
  });

  const { data: formData, isLoading: isLoadingForms } = useQuery({
    queryKey: ["activity", "forms"],
    queryFn: getActivityForms,
  });

  const { mutateAsync, isPending } = useMutation({
    mutationFn: committedActivity,
    onSuccess: () => {
      toast({
        title: t("activityConfirm.success"),
        status: "success",
        duration: 3000,
        isClosable: true,
        position: "top-right",
      });
      queryClient.invalidateQueries({ queryKey: ["activities"] });
      queryClient.invalidateQueries({ queryKey: ["activity", id] });
      navigate(-1);
    },
    onError: () => {
      toast({
        title: t("activityConfirm.error"),
        status: "error",
        duration: 3000,
        isClosable: true,
        position: "top-right",
      });
    },
  });

  const methods = useForm<ActivityFormSchema>({
    resolver: zodResolver(activitySchema),
  });

  const {
    handleSubmit,
    reset,
    formState: { errors },
  } = methods;

  const onSubmit = handleSubmit(async (data) => {
    const response = confirm(t("activityConfirm.confirm"));

    if (response) {
      await mutateAsync(data);
    }
  });

  const handleCancel = useCallback(() => {
    navigate(-1);
  }, [navigate]);

  useEffect(() => {
    if (activity) {
      reset({
        ...activity,
        users: activity.users.map((user) => user._id),
      });
    }
  }, [activity, reset]);

  useEffect(() => {}, [errors]);

  return (
    <Flex
      w="100%"
      my="6"
      mx="auto"
      px="6"
      justify="center"
      direction="row"
      gap={9}
    >
      <ActivityProvider>
        <ActivityDetails
          activity={activity}
          minWidth={"50%"}
          overflowY={"auto"}
        />
      </ActivityProvider>
      <FormProvider {...methods}>
        <Card
          as="form"
          onSubmit={onSubmit}
          borderRadius={8}
          h="fit-content"
          w="100%"
          maxW="600px"
          position="sticky"
          top="5"
        >
          <CardHeader>
            <Box textAlign="center" fontSize="lg" fontWeight="bold">
              {t("activityConfirm.title")}
            </Box>
          </CardHeader>
          <CardBody display="flex" flexDirection="column" gap="4">
            <Text
              input={{
                id: "name",
                label: t("common.fields.name"),
                placeholder: "Nome",
                required: true,
              }}
            />

            <TextArea
              input={{
                id: "description",
                label: t("common.fields.description"),
                placeholder: t("input.enter.male", {
                  field: t("common.fields.description"),
                }),
                required: true,
              }}
            />

            <Select
              input={{
                id: "users",
                label: t("common.fields.students"),
                placeholder: t("input.enter.male", {
                  field: t("common.fields.students"),
                }),
                required: true,
                options: formData?.students ?? [],
              }}
              isLoading={isLoadingForms}
              isMulti
            />

            <Flex mt="8" justify="flex-end" gap="4">
              <Button
                mt={4}
                colorScheme="gray"
                variant="outline"
                onClick={handleCancel}
              >
                {t("activityConfirm.cancel")}
              </Button>
              <Button
                mt={4}
                colorScheme="blue"
                isLoading={isPending || isLoading}
                type="submit"
              >
                {t("activityConfirm.submit")}
              </Button>
            </Flex>
          </CardBody>
        </Card>
      </FormProvider>
    </Flex>
  );
}
