import React, { useCallback, useEffect } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Button,
  Box,
  useToast,
  Card,
  CardBody,
  Hide,
  Text,
  Flex,
  Divider,
  Spinner,
} from "@chakra-ui/react";
import { useMutation } from "@tanstack/react-query";
import { FaExclamationCircle } from "react-icons/fa";
import { AxiosError } from "axios";
import { Navigate, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import InputText from "@components/atoms/Inputs/Text";
import Password from "@components/atoms/Inputs/Password";
import { register } from "@apis/auth";
import Icon from "@components/atoms/Icon";
import SwitchTheme from "@components/molecules/SwitchTheme";
import { useTranslation } from "react-i18next";
import LocaleSwap from "@components/atoms/LocaleSwap";
import { useConfig } from "@hooks/useConfig";

const schema = z.object({
  acronym: z
    .string()
    .min(2, "A sigla deve ter no mínimo 2 caracteres")
    .trim()
    .transform((v) => v.toLowerCase().replace(/ /g, "")),
  name: z
    .string()
    .min(3, "O nome deve ter no mínimo 3 caracteres")
    .max(255, "O nome deve ter no máximo 255 caracteres"),
  email: z.string().email("Insira um email válido"),
  password: z.string().min(6, "A senha deve ter no mínimo 6 dígitos"),
  confirmPassword: z.string().min(6, "A confirmação de senha deve ter no mínimo 6 dígitos"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "As senhas não coincidem",
  path: ["confirmPassword"],
});

type FormData = z.infer<typeof schema>;

const Register: React.FC = () => {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const { slug } = useLocation().state as { slug: string };


  const methods = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      acronym: slug,
    },
  });

  const { data: configData, isLoading: configLoading, isError } = useConfig(slug);
  const redirect = searchParams.get("redirect") ?? (configData?.config?.externalUsers?.redirect || "/portal");

  const { handleSubmit } = methods;
  const toast = useToast();

  const navigate = useNavigate();

  const { mutateAsync, isPending } = useMutation({
    mutationFn: register,
    onSuccess: ({ data }) => {
      toast({
        title: "Cadastro realizado com sucesso!",
        description: "Verifique seu email para mais informações.",
        status: "success",
        duration: 9000,
        isClosable: true,
      });
      navigate(`/auth/two-step?redirect=${redirect}&token=${data.token}`);
    },
    onError: (error: AxiosError<{ message: string; statusCode: number }>) => {
      toast({
        title: "Erro ao realizar cadastro",
        description: error.response?.data?.message || error.message,
        status: "error",
        duration: 9000,
        isClosable: true,
        icon: <FaExclamationCircle />,
      });
    },
  });

  const handleLogin = useCallback(() => {
    navigate("/");
  }, [navigate]);

  const onSubmit = handleSubmit(async (data) => {
    const { confirmPassword, ...registerData } = data;
    await mutateAsync(registerData);
  });

  useEffect(() => {
    if (configData) {
      methods.setValue("acronym", configData.acronym);
    }
  }, [configData]);

  if (configLoading) {
    return (
      <Box
        p={4}
        display="flex"
        flexDirection="row"
        alignItems="center"
        justifyContent="space-around"
        height="100vh"
        bg={"bg.page"}
      >
        <Spinner />
      </Box>
    );
  }

  if (isError) {
    return (
      <Navigate to="/404" replace />
    );
  }

  return (
    <Box
      p={4}
      display="flex"
      flexDirection="row"
      alignItems="center"
      justifyContent="space-around"
      height="100vh"
      bg={"bg.page"}
    >
      <FormProvider {...methods}>
        <Hide below="md">
          <Flex direction="column" gap="4" alignItems="center">
            <Flex alignItems="center" justifyContent="center">
              {configData?.logo ? (
                <img
                  src={configData.logo.url}
                  alt={configData.acronym}
                  width="250px"
                  height="150px"
                />
              ) : (
                <Icon w="150px" />
              )}
            </Flex>

            <Text
              fontSize="2xl"
              fontWeight="bold"
              textAlign="center"
              color="text.primary"
            >
              Criar Conta
            </Text>
            <Text
              fontSize="sm"
              textAlign="center"
              color="text.secondary"
              maxW="400px"
            >
              Preencha os dados abaixo para criar sua conta
            </Text>
            <SwitchTheme />
            <LocaleSwap />
          </Flex>
        </Hide>

        <Card
          p={[4, 10]}
          w={{ base: "100%", md: "450px" }}
          boxShadow="lg"
          bg={"bg.card"}
        >
          <CardBody>
            <Hide above="md">
              <Flex alignItems="center" justifyContent="center" gap="4">
                {configData?.icon ? (
                  <img
                    src={configData.icon.url}
                    alt={configData.acronym}
                    width="60px"
                  />
                ) : (
                  <Icon w="60px" />
                )}
                <Text
                  fontSize="xl"
                  fontWeight="bold"
                  textAlign="center"
                  color="text.primary"
                >
                  Criar Conta
                </Text>
              </Flex>
              <Divider my="5" />
            </Hide>

            <form onSubmit={onSubmit}>
              <Flex direction="column" gap="4">
                <InputText
                  input={{
                    id: "name",
                    label: "Nome completo",
                    placeholder: "Digite seu nome completo",
                    required: true,
                  }}
                />

                <InputText
                  input={{
                    id: "email",
                    label: t("common.fields.email"),
                    placeholder: t("input.enter.male", {
                      field: t("common.fields.email"),
                    }),
                    required: true,
                  }}
                />

                <Password
                  input={{
                    id: "password",
                    label: t("common.fields.password"),
                    placeholder: t("input.enter.female", {
                      field: t("common.fields.password"),
                    }),
                    required: true,
                  }}
                />

                <Password
                  input={{
                    id: "confirmPassword",
                    label: "Confirmar senha",
                    placeholder: "Confirme sua senha",
                    required: true,
                  }}
                />

                <Button
                  mt={4}
                  type="submit"
                  isLoading={isPending}
                  colorScheme="blue"
                >
                  Criar conta
                </Button>
              </Flex>
            </form>

            <Box mt={4} w={"100"}>
              <Text
                as="span"
                color="blue.500"
                cursor="pointer"
                fontSize="sm"
                textDecor={"underline"}
                onClick={handleLogin}
              >
                Já tem uma conta? Faça login
              </Text>
            </Box>
          </CardBody>
        </Card>
      </FormProvider>
    </Box>
  );
};

export default Register; 