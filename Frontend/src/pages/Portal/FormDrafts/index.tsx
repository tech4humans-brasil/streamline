import { useCallback, useEffect, useState } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Box,
  Button,
  Card,
  CardBody,
  Center,
  Flex,
  Heading,
  useToast,
} from "@chakra-ui/react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import getTemplate from "./templates";
import {
  FaArrowLeft,
  FaEye,
  FaPen,
  FaPushed,
  FaSave,
  FaTrashAlt,
} from "react-icons/fa";
import FormEdit from "./components/Forms";
import formSchema, { formFormSchema } from "./schema";
import Preview from "./components/Preview";
import {
  createFormDraft,
  getFormDraft,
  publishFormDraft,
} from "@apis/formDraft";
import { AxiosError } from "axios";
import Can from "@components/atoms/Can";
import { useTranslation } from "react-i18next";
import Assistant from "@components/organisms/Assistant";

export default function FormDraft() {
  const { t } = useTranslation();
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const params = useParams<{ id?: string; form_id: string }>();
  const [isPreview, setPreview] = useState<boolean>(false);

  const formType = location.state?.formType as
    | "created"
    | "interaction"
    | "evaluated"
    | undefined;

  const isCreated = formType === "created";

  const isEditing = !!params?.id;
  const id = params?.id ?? "";

  const {
    data: formDraft,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["form-draft", id],
    queryFn: getFormDraft,
    enabled: isEditing,
    select(data) {
      return {
        ...data,
        type: formType,
      };
    },
  });

  const { mutateAsync, isPending } = useMutation({
    mutationFn: createFormDraft,
    onSuccess: (data) => {
      toast({
        title: t("formDraft.created"),
        status: "success",
        duration: 3000,
        isClosable: true,
        position: "top-right",
      });
      queryClient.invalidateQueries({ queryKey: ["form-drafts"] });
      navigate(`/portal/form-draft/${data.parent}/${data._id}`, {
        state: { formType },
      });
    },
    onError: () => {
      toast({
        title: t("formDraft.error"),
        status: "error",
        duration: 3000,
        isClosable: true,
        position: "top-right",
      });
    },
  });

  const { mutateAsync: mutateAsyncPublish, isPending: isPendingPublish } =
    useMutation({
      mutationFn: publishFormDraft,
      onSuccess: () => {
        toast({
          title: t("formDraft.published"),
          status: "success",
          duration: 3000,
          isClosable: true,
          position: "top-right",
        });
        queryClient.invalidateQueries({ queryKey: ["form-draft", id] });
      },
      onError: (error: AxiosError<{ message: string; statusCode: number }>) => {
        toast({
          title: t("formDraft.error"),
          description: error?.response?.data?.message ?? error.message,
          status: "error",
          duration: 3000,
          isClosable: true,
          position: "top-right",
        });
      },
    });

  const methods = useForm<formFormSchema>({
    resolver: zodResolver(formSchema),
    defaultValues: formDraft ?? getTemplate(formType),
  });

  const {
    handleSubmit,
    reset,
    getValues,
    formState: { isDirty, isValid },
  } = methods;

  console.log(methods.formState.errors);

  const onSubmit = handleSubmit(async (data) => {
    await mutateAsync({ ...data, parent: params.form_id ?? "" });
  });

  const handleCancel = useCallback(() => {
    reset(formDraft);
  }, [formDraft, reset]);

  const handlePreview = useCallback(() => {
    setPreview((prev) => !prev);
  }, [setPreview]);

  const handleBack = useCallback(() => {
    navigate(-1);
  }, [navigate]);

  const handlePublish = useCallback(() => {
    mutateAsyncPublish({
      _id: id,
      status: formDraft?.status === "draft" ? "published" : "draft",
    });
  }, [mutateAsyncPublish, id, formDraft?.status]);

  useEffect(() => {
    if (formDraft) {
      reset(formDraft);
    }
  }, [formDraft, reset]);

  if (isError || !formType) {
    return (
      <Center h="100vh" w="100%">
        <Heading>Erro ao carregar dados do formulário</Heading>
      </Center>
    );
  }

  return (
    <Flex w="100%" h="100%" direction="column" pb="10rem">
      <Card
        w="100%"
        display="flex"
        direction="row"
        borderRadius={0}
        justifyContent="space-between"
        alignItems="center"
        p="2"
        position="sticky"
        top="0"
        zIndex="sticky"
        bg="bg.navbar"
      >
        <Flex direction="row" gap="3" alignItems="center">
          <Heading size="md" fontWeight="bold">
            {t(`formDraft.${isEditing ? "edit" : "create"}`)}
          </Heading>
          <Button
            colorScheme="blue"
            onClick={handleBack}
            variant="ghost"
            size="sm"
            title={t("formDraft.back")}
          >
            <FaArrowLeft />
          </Button>
          {t("common.fields.version")}: #{formDraft?.version ?? 1}
        </Flex>

        <Flex gap="2" align="center">
          <Button
            colorScheme="red"
            onClick={handleCancel}
            variant="outline"
            size="sm"
            title="Descartar Alterações"
          >
            <FaTrashAlt />
          </Button>

          <Button
            colorScheme="blue"
            onClick={handlePreview}
            variant="outline"
            isDisabled={!isValid}
            size="sm"
            title={isPreview ? "Editar" : "Preview"}
          >
            {isPreview ? <FaPen /> : <FaEye />}
          </Button>

          <Can permission="formDraft.create">
            <Button
              colorScheme="green"
              isLoading={isPending}
              isDisabled={!isDirty}
              onClick={onSubmit}
              size="sm"
            >
              <FaSave /> &nbsp; {t("formDraft.submit")}
            </Button>
          </Can>

          <Can permission="formDraft.publish">
            <Button
              colorScheme="blue"
              onClick={handlePublish}
              variant="outline"
              size="sm"
              isDisabled={formDraft?.status === "published"}
              isLoading={isPendingPublish}
            >
              <Box as={FaPushed} transform="rotate(90deg)" /> &nbsp;
              {formDraft?.status === "published"
                ? t("formDraft.unPublish")
                : t("formDraft.publish")}
            </Button>
          </Can>
        </Flex>
      </Card>

      <Flex w="100%" my="6" mx="auto" px="6" justify="center">
        <Card
          as="form"
          onSubmit={onSubmit}
          borderRadius={8}
          h="fit-content"
          w="100%"
          maxW="1000px"
        >
          <CardBody display="flex" flexDirection="column" gap="4">
            {isPreview ? (
              // @ts-ignore
              <Preview form={getValues()} />
            ) : (
              <FormProvider {...methods}>
                <FormEdit
                  {...{ isEditing, isCreated, isLoading }}
                  formType={formType ?? "created"}
                />
                <Assistant />
              </FormProvider>
            )}
          </CardBody>
        </Card>
      </Flex>
    </Flex>
  );
}
