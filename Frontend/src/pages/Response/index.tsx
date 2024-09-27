import React, { memo, useMemo } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
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
} from "@chakra-ui/react";
import { getFormBySlug } from "@apis/form";
import Inputs from "@components/atoms/Inputs";
import { zodResolver } from "@hookform/resolvers/zod";
import convertToZodSchema from "@utils/convertToZodSchema";
import { responseForm } from "@apis/response";
import DraftHandle from "./DraftHandle";
import { FaArrowLeft } from "react-icons/fa";

interface ResponseProps {
  isPreview?: boolean;
}

const Response: React.FC<ResponseProps> = memo(() => {
  const params = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();

  const activity_id = location.state?.activity_id as string | undefined;

  const {
    data: form,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["form", params.slug ?? ""],
    queryFn: getFormBySlug,
  });

  const schema = useMemo(() => {
    if (!form) return null;
    return convertToZodSchema(form.published?.fields ?? []);
  }, [form]);

  const methods = useForm({
    // @ts-ignore
    resolver: zodResolver(schema),
  });

  const { handleSubmit } = methods;

  console.log("form", methods.formState.errors);

  const { mutateAsync, isPending: isSubmitting } = useMutation({
    mutationFn: responseForm,
    onSuccess: () => {
      toast({
        title: `Formulário respondido com sucesso`,
        status: "success",
        duration: 3000,
        isClosable: true,
        position: "top-right",
      });
      navigate(-1);
    },
    onError: () => {
      toast({
        title: `Erro ao responder formulário`,
        status: "error",
        duration: 3000,
        isClosable: true,
        position: "top-right",
      });
    },
  });

  const onSubmit = handleSubmit(async (data) => {
    try {
      if (!form) return;
      await mutateAsync({
        form,
        activity_id,
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
          <Button colorScheme="blue" onClick={() => navigate("/portal")}>
            Voltar
          </Button>
        </Text>
      </Center>
    );
  }

  if (form?.type !== "created" && !activity_id) {
    return (
      <Center h="100vh">
        <Box>
          <Text>Formulário sem atividade</Text>
          <Text>
            <Button colorScheme="blue" onClick={() => navigate("/portal")}>
              Voltar
            </Button>
          </Text>
        </Box>
      </Center>
    );
  }

  return (
    <Box p={4} minH="100vh" bg={"bg.page"}>
      <Center>
        <Box bg={"bg.card"} w="xl" borderRadius="md" boxShadow="md" p={4}>
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
            <DraftHandle
              form_id={form?._id}
              activity_id={activity_id}
              isSubmitting={isSubmitting}
            />
            <form onSubmit={onSubmit}>
              <Flex direction="column" align="center" justify="center" gap="3">
                <Inputs fields={form?.published?.fields ?? []} />

                <Stack direction="row" justifyContent="flex-end" mt={4}>
                  <Button
                    type="submit"
                    colorScheme="blue"
                    isLoading={isSubmitting}
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

export default Response;
