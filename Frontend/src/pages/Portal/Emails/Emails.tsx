import {
  Flex,
  Box,
  Heading,
  useToast,
  Card,
  Spinner,
  Button,
} from "@chakra-ui/react";
import Text from "@components/atoms/Inputs/Text";
import MdxEditor from "@components/organisms/EmailTemplate";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient, useMutation, useQuery } from "@tanstack/react-query";
import React, { useCallback, useEffect } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { useNavigate, useParams } from "react-router-dom";
import { z } from "zod";
import { createOrUpdateEmail, getEmail } from "@apis/email";
import EmailTemplateHook from "@components/organisms/EmailTemplate/hook";
import { FaArrowLeft, FaSave, FaTrashAlt } from "react-icons/fa";
import Can from "@components/atoms/Can";
import HelpArea from "@components/organisms/HelpArea";
import HelpSmartValues from "@docs/smart-values";
import { useTranslation } from "react-i18next";
import { getProjects } from "@apis/project";
import Select from "@components/atoms/Inputs/Select";

const emailSchema = z.object({
  slug: z
    .string()
    .regex(/^[A-Za-z]+([A-za-z0-9]+)+(-[A-Za-z0-9]+)*$/)
    .min(3, { message: "Nome deve ter no mínimo 3 caracteres" })
    .max(50, { message: "Nome deve ter no máximo 50 caracteres" }),
  subject: z
    .string()
    .min(3, { message: "Titulo deve ter no mínimo 3 caracteres" })
    .max(100, { message: "Titulo deve ter no máximo 50 caracteres" }),
  project: z.string().optional().nullable(),
});

type EmailFormSchema = z.infer<typeof emailSchema>;

const EmailTemplate: React.FC = () => {
  const { t } = useTranslation();
  const toast = useToast();
  const navigate = useNavigate();
  const params = useParams<{ id?: string; project: string }>();
  const queryClient = useQueryClient();
  const project = params?.project as string;

  const isEditing = !!params?.id;
  const id = params?.id ?? "";
  const { data: email, isLoading } = useQuery({
    queryKey: ["email", id],
    queryFn: getEmail,
    enabled: isEditing,
  });

  const { handleSave } = EmailTemplateHook({
    html: email?.htmlTemplate,
    css: email?.cssTemplate,
  });

  const { data: { projects = [] } = {}, isFetching: isFetchingProjects } =
    useQuery({
      queryKey: ["projects"],
      queryFn: getProjects,
      staleTime: 1000 * 60 * 5,
    });

  const { mutateAsync, isPending } = useMutation({
    mutationFn: createOrUpdateEmail,
    onSuccess: () => {
      toast({
        title: t(`email.${isEditing ? "edited" : "created"}`),
        status: "success",
        duration: 3000,
        isClosable: true,
        position: "top-right",
      });
      queryClient.invalidateQueries({ queryKey: ["emails"] });
      queryClient.invalidateQueries({ queryKey: ["forms"] });
      navigate(-1);
    },
    onError: () => {
      toast({
        title: t(`email.${isEditing ? "edited" : "created"}`),
        status: "error",
        duration: 3000,
        isClosable: true,
        position: "top-right",
      });
    },
  });

  const methods = useForm<EmailFormSchema>({
    resolver: zodResolver(emailSchema),
    defaultValues: email ?? {},
  });

  const {
    handleSubmit,
    formState: { errors },
    reset,
  } = methods;

  const onSubmit = handleSubmit(async (data) => {
    const htmlTemplate = handleSave();

    await mutateAsync({
      ...data,
      htmlTemplate: htmlTemplate.html,
      cssTemplate: htmlTemplate.css.toString(),
      _id: isEditing ? id : undefined,
    });
  });

  useEffect(() => { }, [errors]);

  useEffect(() => {
    reset(email);
  }, [email, reset]);

  const handleBack = useCallback(() => {
    navigate(-1);
  }, [navigate]);

  const handleCancel = useCallback(() => {
    reset(email);
  }, [reset, email]);

  useEffect(() => {
    methods.setValue("project", project);
  }, [project]);

  return (
    <Flex justify="center" align="center" w="100%" direction="column">
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
      >
        <Flex direction="row" gap="3" alignItems="center">
          <Heading size="md" fontWeight="bold">
            {t(`email.${isEditing ? "edit" : "create"}`)}
          </Heading>
          <Button
            colorScheme="blue"
            onClick={handleBack}
            variant="ghost"
            size="sm"
            title={t("common.back")}
          >
            <FaArrowLeft />
          </Button>
        </Flex>

        <Flex gap="2" align="center">
          <Button
            colorScheme="red"
            onClick={handleCancel}
            variant="outline"
            size="sm"
            title={t("email.cancel")}
          >
            <FaTrashAlt />
          </Button>

          <Can permission={isEditing ? "email.update" : "email.create"}>
            <Button
              colorScheme="green"
              onClick={onSubmit}
              size="sm"
              isLoading={isPending}
            >
              <FaSave /> &nbsp; {t("email.submit")}
            </Button>
          </Can>

          <HelpArea>
            <HelpSmartValues />
          </HelpArea>
        </Flex>
      </Card>

      <FormProvider {...methods}>
        <Box w="100%" h="100%" p="4">
          <Text
            input={{
              id: "slug",
              label: t("common.fields.slug"),
              placeholder: t("input.enter.male", {
                field: t("common.fields.slug"),
              }),
            }}
          />

          <Text
            input={{
              id: "subject",
              label: t("common.fields.subject"),
              placeholder: t("input.enter.male", {
                field: t("common.fields.subject"),
              }),
            }}
          />

          {!project && (
            <Select
              input={{
                id: "project",
                label: t("common.fields.project"),
                required: true,
                options: projects?.map((project) => ({
                  label: project.name,
                  value: project._id,
                })),
              }}
              isLoading={isFetchingProjects}
            />
          )}

          <Box mt="4">{isLoading ? <Spinner /> : <MdxEditor />}</Box>
        </Box>
      </FormProvider>
    </Flex>
  );
};

export default EmailTemplate;
