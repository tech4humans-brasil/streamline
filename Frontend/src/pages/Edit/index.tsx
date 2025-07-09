import React, { memo, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useMutation, useQuery } from "@tanstack/react-query";
import { FormProvider, useForm } from "react-hook-form";
import {
  Button,
  Stack,
  Text,
  Center,
  Box,
  Spinner,
  useToast,
  Divider,
  Flex,
  useColorModeValue,
} from "@chakra-ui/react";
import Inputs from "@components/atoms/Inputs";
import { zodResolver } from "@hookform/resolvers/zod";
import convertToZodSchema from "@utils/convertToZodSchema";
import { updateResponseForm } from "@apis/response";
import { getActivity } from "@apis/activity";
import { getForm } from "@apis/form";
import { FaArrowLeft } from "react-icons/fa";
import IActivity from "@interfaces/Activitiy";

interface ResponseProps {
  isPreview?: boolean;
}

const EditResponse: React.FC<ResponseProps> = memo(() => {
  const params = useParams<{ id: string }>();
  const navigate = useNavigate();
  const toast = useToast();
  const bg = useColorModeValue("gray.50", "gray.700");
  const bgWrapper = useColorModeValue("gray.200", "gray.900");

  const {
    data: activity,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["activity", params.id ?? ""],
    queryFn: getActivity,
  });

  const { data: form } = useQuery({
    queryKey: ["form", activity?.form?._id ?? ""],
    queryFn: getForm,
    enabled: !!activity?.form,
  });

  const answer = useMemo(() => {
    return activity?.form_draft?.fields.reduce<
      Record<string, IActivity["form_draft"]["fields"][0]["value"]>
    >((acc, field) => {
      if (!field.value || acc[field.id]) return acc;
      acc[field.id] = field.value;
      return acc;
    }, {});
  }, [activity?.form_draft?.fields]);

  const methods = useForm({
    resolver: zodResolver(
      convertToZodSchema(activity?.form_draft?.fields ?? [])
    ),
    defaultValues: answer,
  });

  const {
    handleSubmit,
    reset,
    formState: { isDirty },
  } = methods;

  useEffect(() => {
    reset(answer);
  }, [answer, reset]);

  const { mutateAsync, isPending: isSubmitting } = useMutation({
    mutationFn: updateResponseForm,
    onSuccess: () => {
      toast({
        title: `Formulário respondido com sucesso`,
        status: "success",
        duration: 3000,
        isClosable: true,
      });
      navigate(-1);
    },
    onError: () => {
      toast({
        title: `Erro ao responder formulário`,
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    },
  });

  const onSubmit = handleSubmit(async (data) => {
    try {
      if (!params.id) return;
      await mutateAsync({
        activity_id: params?.id,
        data,
      });
    } catch (error) {
      console.log("Form validation failed:", error);
    }
  });

  if (isLoading) {
    return (
      <Center h="100vh">
        <Spinner size="xl" />
      </Center>
    );
  }

  if (isError) {
    return (
      <Center h="100vh" flexDirection="column">
        <Text>Formulário não encontrado ou não está mais disponível</Text>
        <Text>
          <Button colorScheme="blue" onClick={() => navigate(-1)}>
            Voltar
          </Button>
        </Text>
      </Center>
    );
  }

  return (
    <Box p={4} minH="100vh" bg={bgWrapper}>
      <Center>
        <Box bg={bg} w="xl" p={4} borderRadius="md" boxShadow="md">
          <Flex align="center" justify="space-between">
            <Button
              variant="ghost"
              onClick={() => navigate(-1)}
              w="fit-content"
            >
              <FaArrowLeft />
            </Button>
            <Text fontSize="2xl" fontWeight="bold" w="100%" textAlign="center">
              {form?.name}
            </Text>
          </Flex>
          <Box mb={4} mt={2}>
            <Text>{form?.description}</Text>
            <Divider my={4} />
          </Box>
          <FormProvider {...methods}>
            <form onSubmit={onSubmit}>
              <Flex direction="column" align="center" justify="center" gap="3">
                <Inputs fields={activity?.form_draft?.fields ?? []} />

                <Stack direction="row" justifyContent="flex-end" mt={4}>
                  <Button
                    type="submit"
                    colorScheme="blue"
                    isLoading={isSubmitting}
                    isDisabled={!isDirty}
                  >
                    Enviar
                  </Button>
                </Stack>
              </Flex>
            </form>
          </FormProvider>
        </Box>
      </Center>
    </Box>
  );
});

export default EditResponse;
