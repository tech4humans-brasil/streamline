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
import Can from "@components/atoms/Can";
import { useTranslation } from "react-i18next";
import { createOrUpdateProject, getProject } from "@apis/project";

const Schema = z.object({
  name: z.string().min(3, { message: "Nome deve ter no mínimo 3 caracteres" }),
  description: z
    .string()
    .min(3, { message: "Descrição deve ter no mínimo 3 caracteres" }),
});

type UniversityFormInputs = z.infer<typeof Schema>;

export default function Project() {
  const { t } = useTranslation();
  const toast = useToast();
  const navigate = useNavigate();
  const params = useParams<{ id?: string }>();
  const queryClient = useQueryClient();

  const isEditing = !!params?.id;
  const id = params?.id ?? "";

  const { data: institute, isLoading } = useQuery({
    queryKey: ["project", id],
    queryFn: getProject,
    enabled: isEditing,
  });

  const { mutateAsync, isPending } = useMutation({
    mutationFn: createOrUpdateProject,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["institutes"] });
      toast({
        title: t(`institute.${isEditing ? "updated" : "created"}`),
        status: "success",
        duration: 3000,
        isClosable: true,
        position: "top-right",
      });
      navigate(-1);
    },
    onError: () => {
      toast({
        title: t(`institute.${isEditing ? "updated" : "created"}`),
        status: "error",
        duration: 3000,
        isClosable: true,
        position: "top-right",
      });
    },
  });

  const metohods = useForm<UniversityFormInputs>({
    resolver: zodResolver(Schema),
  });

  const {
    handleSubmit,
    reset,
    formState: { errors },
  } = metohods;

  const onSubmit = handleSubmit(async (data) => {
    await mutateAsync(isEditing ? { ...data, _id: id } : data);
  });

  const handleCancel = useCallback(() => {
    navigate(-1);
  }, [navigate]);

  useEffect(() => {
    if (institute) {
      reset({
        ...institute,
      });
    }
  }, [institute, reset]);

  useEffect(() => {}, [errors]);

  return (
    <Flex w="100%" my="6" mx="auto" px="6" justify="center">
      <FormProvider {...metohods}>
        <Card
          as="form"
          onSubmit={onSubmit}
          borderRadius={8}
          h="fit-content"
          w="100%"
          maxW="600px"
        >
          <CardHeader>
            <Box textAlign="center" fontSize="lg" fontWeight="bold">
              {t(`project.${isEditing ? "edit" : "create"}`)}
            </Box>
          </CardHeader>
          <CardBody display="flex" flexDirection="column" gap="4">
            <Text
              input={{
                id: "name",
                label: t("common.fields.name"),
                required: true,
              }}
            />

            <Text
              input={{
                id: "description",
                label: t("common.fields.description"),
                required: true,
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
              <Can
                permission={isEditing ? "institute.update" : "institute.create"}
              >
                <Button
                  mt={4}
                  colorScheme="blue"
                  isLoading={isPending || isLoading}
                  type="submit"
                >
                  {t("project.submit")}
                </Button>
              </Can>
            </Flex>
          </CardBody>
        </Card>
      </FormProvider>
    </Flex>
  );
}
