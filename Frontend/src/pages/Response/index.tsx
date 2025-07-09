import React, { memo, useMemo } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useMutation, useQuery } from "@tanstack/react-query";
import { FormProvider, useForm } from "react-hook-form";
import {
  Button,
  Text,
  Center,
  Box,
  Spinner,
  useToast,
  Divider,
  Flex,
  Card,
  Grid,
  VStack,
} from "@chakra-ui/react";
import { getFormBySlug } from "@apis/form";
import Inputs from "@components/atoms/Inputs";
import { zodResolver } from "@hookform/resolvers/zod";
import convertToZodSchema from "@utils/convertToZodSchema";
import { responseForm } from "@apis/response";
import DraftHandle from "./DraftHandle";
import { FaArrowLeft } from "react-icons/fa";
import { useTranslation } from "react-i18next";

interface ResponseProps {
  isPreview?: boolean;
}

const Response: React.FC<ResponseProps> = memo(() => {
  const params = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();
  const { t } = useTranslation();

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
    onSuccess: (data) => {
      toast({
        title: `Formulário respondido com sucesso`,
        status: "success",
        duration: 3000,
        isClosable: true,
      });
      navigate(`/portal/activity/${data._id}`);
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
      <Card
        p={[0, 6]}
        borderRadius="2xl"
        minWidth={"60%"}
        boxShadow={"lg"}
        h="100%"
        bg="bg.card"
      >
        <Flex justify="center" align="center" h="100%">
          <Spinner />
        </Flex>
      </Card>
    );
  }

  if (isError) {
    return (
      <Box w="90%" mx="auto" py={6} maxW="7xl">
        <Center flexDirection="column" minH="50vh">
          <Text fontSize="lg" mb={4}>Formulário não encontrado ou não está mais disponível</Text>
          <Button colorScheme="blue" onClick={() => navigate("/portal")}>
            Voltar
          </Button>
        </Center>
      </Box>
    );
  }

  if (form?.type !== "created" && !activity_id) {
    return (
      <Box w="90%" mx="auto" py={6} maxW="7xl">
        <Center flexDirection="column" minH="50vh">
          <Text fontSize="lg" mb={4}>Formulário sem atividade</Text>
          <Button colorScheme="blue" onClick={() => navigate("/portal")}>
            Voltar
          </Button>
        </Center>
      </Box>
    );
  }

  return (
    <Box w="90%" mx="auto" py={6} maxW="4xl">
      <Flex alignItems="center" mb={6} position="sticky">
        <Button
          variant="ghost"
          size="sm"
          leftIcon={<FaArrowLeft />}
          mr={4}
          onClick={() => navigate(-1)}
        >
          Voltar
        </Button>
      </Flex>

      <Grid templateColumns="1fr" gap={6}>
        <VStack spacing={6} align="stretch">
          {/* Card principal do formulário */}
          <Card>
            <Box p={6}>
              <Text fontSize={["lg", "2xl"]} fontWeight="bold">
                {form?.name}
              </Text>
              <Text fontSize={["sm", "md"]} mb={4} color="gray.400" mt={2}>
                {form?.description}
              </Text>
              <Divider my={4} />

              <FormProvider {...methods}>
                <DraftHandle
                  form_id={form?._id}
                  activity_id={activity_id}
                  isSubmitting={isSubmitting}
                />
                <form onSubmit={onSubmit}>
                  <VStack spacing={4} align="stretch">
                    <Inputs fields={form?.published?.fields ?? []} />

                    <Flex justify="center" mt={6}>
                      <Button
                        type="submit"
                        colorScheme="blue"
                        isLoading={isSubmitting}
                        size={["sm", "md"]}
                        w="40%"
                      >
                        Enviar
                      </Button>
                    </Flex>
                  </VStack>
                </form>
              </FormProvider>
            </Box>
          </Card>
        </VStack>


      </Grid>
    </Box>
  );
});

export default Response;
