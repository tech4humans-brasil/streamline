import React, { useCallback } from "react";
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
} from "@chakra-ui/react";
import { useMutation } from "@tanstack/react-query";
import useAuth from "@hooks/useAuth";
import { FaCheckCircle, FaExclamationCircle } from "react-icons/fa";
import { AxiosError } from "axios";
import { useNavigate, useSearchParams } from "react-router-dom";
import InputText from "@components/atoms/Inputs/Text";
import Password from "@components/atoms/Inputs/Password";
import { login } from "@apis/auth";
import Icon from "@components/atoms/Icon";
import SwitchTheme from "@components/molecules/SwitchTheme";
import { useTranslation } from "react-i18next";
import LocaleSwap from "@components/atoms/LocaleSwap";
import { IUserRoles } from "@interfaces/User";
import GoogleAuth from "@components/molecules/GoogleAuth";

const schema = z.object({
  acronym: z
    .string()
    .min(2, "A sigla deve ter no mínimo 2 caracteres")
    .trim()
    .transform((v) => v.toLowerCase().replace(/ /g, "")),
  email: z.string().email("Insira um email válido"),
  password: z.string().min(6, "A senha deve ter no mínimo 6 dígitos"),
});

type FormData = z.infer<typeof schema>;

const Login: React.FC = () => {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();

  const redirect = searchParams.get("redirect") ?? "/portal";

  const methods = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const { handleSubmit } = methods;
  const toast = useToast();

  const [, setAuth] = useAuth();
  const navigate = useNavigate();

  const { mutateAsync, isPending } = useMutation({
    mutationFn: login,
    onSuccess: ({ data }) => {
      navigate(`/auth/two-step?redirect=${redirect}&token=${data.token}`);
    },
    onError: (error: AxiosError<{ message: string; statusCode: number }>) => {
      toast({
        title: "Erro ao fazer login",
        description: error.message,
        status: "error",
        duration: 9000,
        isClosable: true,
        icon: <FaExclamationCircle />,
      });
    },
  });

  const handleForgotPassword = useCallback(() => {
    navigate("/auth/forgot-password");
  }, [navigate]);

  const onSubmit = handleSubmit(async (data) => {
    await mutateAsync(data);
  });

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
              <Icon w="150px" />
            </Flex>

            <Text
              fontSize="2xl"
              fontWeight="bold"
              textAlign="center"
              color="text.primary"
            >
              {t("welcome.title")}
            </Text>
            <Text
              fontSize="sm"
              textAlign="center"
              color="text.secondary"
              maxW="400px"
            >
              {t("welcome.description")}
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
                <Icon w="60px" />
                <Text
                  fontSize="xl"
                  fontWeight="bold"
                  textAlign="center"
                  color="text.primary"
                >
                  Bem-vindo ao Edu Flow
                </Text>
              </Flex>
              <Divider my="5" />
            </Hide>

            <form onSubmit={onSubmit}>
              <Flex direction="column" gap="4">
                <InputText
                  input={{
                    id: "acronym",
                    label: t("common.fields.slug"),
                    placeholder: t("input.enter.male", {
                      field: t("common.fields.slug"),
                    }),
                  }}
                />

                <InputText
                  input={{
                    id: "email",
                    label: t("common.fields.email"),
                    placeholder: t("input.enter.male", {
                      field: t("common.fields.email"),
                    }),
                  }}
                />

                <Password
                  input={{
                    id: "password",
                    label: t("common.fields.password"),
                    placeholder: t("input.enter.female", {
                      field: t("common.fields.password"),
                    }),
                  }}
                />

                <Button
                  mt={4}
                  type="submit"
                  isLoading={isPending}
                  colorScheme="blue"
                >
                  {t("login.submit")}
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
                onClick={handleForgotPassword}
              >
                {t("login.forgot")}
              </Text>
            </Box>
            <Box mt={4}>
              <GoogleAuth />
            </Box>
          </CardBody>
        </Card>
      </FormProvider>
    </Box>
  );
};

export default Login;
