import { memo, useCallback, useEffect } from "react";
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
  Divider,
  Flex,
  Heading,
  Spinner,
  useToast,
} from "@chakra-ui/react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import Text from "@components/atoms/Inputs/Text";
import { createOrUpdateWorkflow, getWorkflow } from "@apis/workflows";
import Switch from "@components/atoms/Inputs/Switch";
import { getWorkflowDrafts } from "@apis/workflowDraft";
import DraftItem from "@components/molecules/DraftItem";
import Can from "@components/atoms/Can";
import { useTranslation } from "react-i18next";
import { FaArrowLeft } from "react-icons/fa";

const statusSchema = z.object({
  name: z.string().min(3, { message: "Nome deve ter no mínimo 3 caracteres" }),
  active: z.boolean().default(true),
  project: z.string().optional().nullable(),
});

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

  const { data: workflow, isLoading } = useQuery({
    queryKey: ["workflow", id],
    queryFn: getWorkflow,
    enabled: isEditing,
  });

  const { mutateAsync, isPending } = useMutation({
    mutationFn: createOrUpdateWorkflow,
    onSuccess: (data) => {
      toast({
        title: t(`workflow.${isEditing ? "updated" : "created"}`),
        status: "success",
        duration: 3000,
        isClosable: true,
        position: "top-right",
      });
      queryClient.invalidateQueries({ queryKey: ["workflows"] });
      queryClient.invalidateQueries({ queryKey: ["forms"] });
      navigate(`/portal/workflow/${data._id}`);
    },
    onError: () => {
      toast({
        title: t("workflow.error"),
        status: "error",
        duration: 3000,
        isClosable: true,
        position: "top-right",
      });
    },
  });

  const methods = useForm<StatusFormSchema>({
    resolver: zodResolver(statusSchema),
    defaultValues: workflow ?? {},
  });

  const {
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = methods;

  const onSubmit = handleSubmit(async (data) => {
    await mutateAsync(isEditing ? { ...data, _id: id } : data);
  });

  const handleCancel = useCallback(() => {
    navigate(-1);
  }, [navigate]);

  useEffect(() => {
    if (workflow) {
      reset(workflow);
    }
  }, [workflow, reset]);

  useEffect(() => {}, [errors]);

  useEffect(() => {
    methods.setValue("project", project);
  }, [project]);

  return (
    <Flex w="100%" my="6" mx="auto" px="6" justify="center">
      <FormProvider {...methods}>
        <Card
          as="form"
          onSubmit={onSubmit}
          borderRadius={8}
          h="fit-content"
          w="100%"
          maxW="600px"
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
                {t(`workflow.${isEditing ? "edit" : "create"}`)}
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

            <Flex justify="flex-end" gap="4">
              <Button
                mt={4}
                colorScheme="gray"
                variant="outline"
                onClick={handleCancel}
              >
                {t("common.cancel")}
              </Button>
              <Can permission="workflow.create">
                <Button
                  mt={4}
                  colorScheme="blue"
                  isLoading={isPending || isLoading}
                  type="submit"
                  isDisabled={!isDirty}
                >
                  {t("workflow.submit")}
                </Button>
              </Can>
            </Flex>

            <Can permission="workflowDraft.view">
              {isEditing && <WorkflowVersions id={id} />}
            </Can>
          </CardBody>
        </Card>
      </FormProvider>
    </Flex>
  );
}

interface WorkflowVersionsProps {
  id: string;
}

const WorkflowVersions: React.FC<WorkflowVersionsProps> = memo(({ id }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const { data: workflowDrafts, isLoading: isLoadingDrafts } = useQuery({
    queryKey: ["workflow-draft", id],
    queryFn: getWorkflowDrafts,
  });

  const handleNewDraft = useCallback(() => {
    navigate(`/portal/workflow-draft/${id}`);
  }, [navigate, id]);

  const handleEditDraft = useCallback(
    (draftId: string) => {
      navigate(`/portal/workflow-draft/${id}/${draftId}/view`);
    },
    [navigate, id]
  );
  return (
    <Flex mt="8" justify="center" align="center" direction="column" gap="5">
      <Heading fontSize={"x-large"}>{t("workflow.versions")}</Heading>
      <Divider />

      {isLoadingDrafts && <Spinner />}

      <Flex direction="column" gap="5" wrap="wrap" w="100%">
        {!workflowDrafts?.workflows?.length && (
          <Button
            colorScheme="blue"
            variant="outline"
            onClick={handleNewDraft}
            isLoading={isLoadingDrafts}
          >
            {t("workflowDraft.create")}
          </Button>
        )}

        {workflowDrafts?.workflows?.map((draft) => (
          <DraftItem key={draft._id} draft={draft} onEdit={handleEditDraft} />
        ))}
      </Flex>
    </Flex>
  );
});
