import { memo, useCallback, useEffect } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Button,
  Card,
  CardBody,
  CardHeader,
  Divider,
  Flex,
  Heading,
  Spinner,
  useToast,
} from "@chakra-ui/react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import Text from "@components/atoms/Inputs/Text";
import Switch from "@components/atoms/Inputs/Switch";
import DraftItem from "@components/molecules/DraftItem";
import { getFormDrafts } from "@apis/formDraft";
import { createOrUpdateForm, getForm, getFormForms } from "@apis/form";
import TextArea from "@components/atoms/Inputs/TextArea";
import Select from "@components/atoms/Inputs/Select";
import Can from "@components/atoms/Can";
import { FaArrowLeft } from "react-icons/fa";
import { useTranslation } from "react-i18next";
import { IFormType } from "@interfaces/Form";

const statusSchema = z
  .object({
    name: z.string().min(3, "Nome precisa ter pelo menos 3 caracteres"),
    slug: z.string().nullable().default(null),
    status: z.enum(["draft", "published"]).default("draft"),
    initial_status: z.string().optional().nullable(),
    type: z.enum(["created", "external", "interaction", "time-trigger"]),
    workflow: z.string().optional().nullable(),
    period: z.object({
      open: z.string().nullable(),
      close: z.string().nullable(),
    }),
    active: z.boolean().default(true),
    project: z.string().optional().nullable(),
    url: z.string().optional().nullable().default(null),
    description: z
      .string()
      .max(512, "O tamanho máximo é 512 caracteres")
      .min(3, "Minimo 3 letras"),
    institute: z.array(z.string()).optional().nullable(),
    visibilities: z.array(z.string()).optional().nullable(),
  })
  .refine(
    (data) => {
      if (["external", "time-trigger"].includes(data.type)) {
        return true;
      }

      if (!data.slug) return false;

      return data.slug?.length > 3;
    },
    {
      message: "Slug inválido, necessário ter pelo menos 3 caracteres",
      path: ["slug"],
    }
  )
  .refine(
    (data) => {
      if (!data.slug) return true;

      return data.type !== "time-trigger"
        ? RegExp(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).exec(data.slug)
        : true;
    },
    {
      message: "Slug inválido, utilize apenas letras e números e -",
      path: ["slug"],
    }
  )
  .refine(
    (data) => {
      if (data.type === "external") {
        if (!data.url) return false;

        return RegExp(/^(https?|http):\/\/[^\s$.?#].[^\s]*$/gm).test(data.url);
      }
      return true;
    },
    {
      message: "É necessário informar a URL",
      path: ["url"],
    }
  )
  .refine(
    (data) => {
      if (data.type === "created") {
        return !!data.workflow;
      }
      return true;
    },
    {
      message: "É necessário selecionar um workflow",
      path: ["workflow"],
    }
  )
  .refine(
    (data) => {
      if (["created", "time-trigger"].includes(data.type)) {
        return !!data.initial_status;
      }
      return true;
    },
    {
      message: "É necessário selecionar um status inicial",
      path: ["initial_status"],
    }
  )
  .refine(
    (data) => {
      if (["created", "time-trigger"].includes(data.type)) {
        return !!data.visibilities;
      }
      return true;
    },
    {
      message:
        "É necessário selecionar um grupo que irá visualizar as atividades",
      path: ["visibilities"],
    }
  );

type StatusFormSchema = z.infer<typeof statusSchema>;

export default function Workflow() {
  const { t } = useTranslation();
  const toast = useToast();
  const navigate = useNavigate();
  const params = useParams<{ id?: string }>();
  const queryClient = useQueryClient();
  const location = useLocation();

  const project = location.state?.project as string | undefined;

  const isEditing = !!params?.id;
  const id = params?.id ?? "";

  const { data: form, isLoading } = useQuery({
    queryKey: ["form", id],
    queryFn: getForm,
    enabled: isEditing,
  });

  const { data: formsData, isLoading: isLoadingForms } = useQuery({
    queryKey: ["forms", "forms"],
    queryFn: getFormForms,
    retryOnMount: false,
    staleTime: 1000 * 60 * 60,
  });

  const { mutateAsync, isPending } = useMutation({
    mutationFn: createOrUpdateForm,
    onSuccess: (data) => {
      toast({
        title: t(`form.${isEditing ? "updated" : "created"}`),
        status: "success",
        duration: 3000,
        isClosable: true,
        position: "top-right",
      });
      queryClient.invalidateQueries({ queryKey: ["workflows"] });
      queryClient.invalidateQueries({ queryKey: ["forms"] });
      navigate(`/portal/form/${data._id}`);
    },
    onError: () => {
      toast({
        title: t("form.error"),
        status: "error",
        duration: 3000,
        isClosable: true,
        position: "top-right",
      });
    },
  });

  const methods = useForm<StatusFormSchema>({
    resolver: zodResolver(statusSchema),
    defaultValues: form ?? {},
  });

  const {
    handleSubmit,
    reset,
    formState: { errors, isDirty },
    watch,
  } = methods;

  const onSubmit = handleSubmit(async (data) => {
    // @ts-ignore
    await mutateAsync(isEditing ? { ...data, _id: id } : data);
  });

  const handleCancel = useCallback(() => {
    navigate(-1);
  }, [navigate]);

  useEffect(() => {
    if (form) {
      reset(form);
    }
  }, [form, reset]);

  useEffect(() => {}, [errors]);

  useEffect(() => {
    methods.setValue("project", project);
  }, [project]);

  console.log("errors", errors);

  const formType = watch("type");
  const isCreated = formType === "created";
  const isInteraction = formType === "interaction";
  const isTimerTrigger = formType === "time-trigger";
  const isExternal = formType === "external";

  return (
    <Flex w="100%" my="6" mx="auto" px="6" justify="center">
      <FormProvider {...methods}>
        <Card
          as="form"
          onSubmit={onSubmit}
          borderRadius={8}
          h="fit-content"
          w="100%"
          maxW="900px"
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
                {t(`form.${isEditing ? "edit" : "create"}`)}
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

            <Switch
              input={{
                id: "active",
                label: t("common.fields.active"),
              }}
            />

            <Select
              input={{
                id: "type",
                label: t("common.fields.type"),
                required: true,
                options: Object.values(IFormType).map((type) => ({
                  label: t(`form.type.${type}`),
                  value: type,
                })),
                isDisabled: isEditing,
              }}
            />

            {["created", "interaction"].includes(formType) && (
              <Text
                input={{
                  id: "slug",
                  label: t("common.fields.slug"),
                  required: true,
                }}
              />
            )}

            <Flex gap="4">
              {(isCreated || isTimerTrigger) && (
                <Select
                  input={{
                    id: "initial_status",
                    label: t("common.fields.initialStatus"),
                    required: true,
                    options: formsData?.status ?? [],
                  }}
                  isLoading={isLoadingForms}
                />
              )}

              {!isInteraction && (
                <Select
                  input={{
                    id: "visibilities",
                    label: t("common.fields.visibilities"),
                    options: formsData?.institutes ?? [],
                    required: true,
                  }}
                  isLoading={isLoadingForms}
                  isMulti
                />
              )}
            </Flex>

            {isExternal && (
              <Text
                input={{
                  id: "url",
                  label: t("common.fields.url"),
                  required: true,
                }}
              />
            )}

            <Flex gap="4" direction={["column", "row"]}>
              {isCreated && (
                <>
                  <Select
                    input={{
                      id: "workflow",
                      label: t("common.fields.workflow"),
                      required: true,
                      options: formsData?.workflows ?? [],
                    }}
                    isLoading={isLoadingForms}
                  />
                  <Select
                    input={{
                      id: "institute",
                      label: t("common.fields.whocansee"),
                      options: formsData?.institutes ?? [],
                    }}
                    isLoading={isLoadingForms}
                    isMulti
                  />
                </>
              )}
            </Flex>

            <TextArea
              input={{
                id: "description",
                label: t("common.fields.description"),
                required: true,
              }}
            />

            {!isTimerTrigger && (
              <Flex gap="4" mb="5">
                <Text
                  input={{
                    id: "period.open",
                    label: "Abertura",
                    placeholder: "Abertura",
                    type: "date",
                    describe: "Data de abertura do formulário",
                  }}
                />

                <Text
                  input={{
                    id: "period.close",
                    label: "Fechamento",
                    placeholder: "Fechamento",
                    type: "date",
                    describe: "Data de fechamento do formulário",
                  }}
                />
              </Flex>
            )}

            <Flex justify="flex-end" gap="4">
              <Button
                mt={4}
                colorScheme="gray"
                variant="outline"
                onClick={handleCancel}
              >
                {t("form.cancel")}
              </Button>
              <Can permission={isEditing ? "form.update" : "form.create"}>
                <Button
                  mt={4}
                  colorScheme="blue"
                  isLoading={isPending || isLoading}
                  type="submit"
                  isDisabled={!isDirty}
                >
                  {t("form.submit")}
                </Button>
              </Can>
            </Flex>

            <Can permission="formDraft.view">
              {isEditing && !isExternal && (
                <FormVersions id={id} formType={formType} />
              )}
            </Can>
          </CardBody>
        </Card>
      </FormProvider>
    </Flex>
  );
}

interface FormVersionsProps {
  id: string;
  formType: string;
}

const FormVersions: React.FC<FormVersionsProps> = memo(({ id, formType }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const { data: formDrafts, isLoading: isLoadingDrafts } = useQuery({
    queryKey: ["form-drafts", id],
    queryFn: getFormDrafts,
  });

  const handleNewDraft = useCallback(() => {
    navigate(`/portal/form-draft/${id}`, {
      state: { formType },
    });
  }, [navigate, id, formType]);

  const handleEditDraft = useCallback(
    (draftId: string) => {
      navigate(`/portal/form-draft/${id}/${draftId}`, {
        state: { formType },
      });
    },
    [navigate, id, formType]
  );
  return (
    <Flex mt="8" justify="center" align="center" direction="column" gap="5">
      <Heading fontSize={"x-large"}>{t("form.drafts")}</Heading>
      <Divider />

      {isLoadingDrafts && <Spinner />}

      <Flex direction="column" gap="5" wrap="wrap" w="100%">
        {!formDrafts?.forms?.length && (
          <Can permission="formDraft.create">
            <Button
              colorScheme="blue"
              variant="outline"
              onClick={handleNewDraft}
              isLoading={isLoadingDrafts}
            >
              {t("form.newDraft")}
            </Button>
          </Can>
        )}

        {formDrafts?.forms?.map((draft) => (
          <DraftItem key={draft._id} draft={draft} onEdit={handleEditDraft} />
        ))}
      </Flex>
    </Flex>
  );
});
