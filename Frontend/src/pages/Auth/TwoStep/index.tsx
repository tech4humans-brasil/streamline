import React, { useEffect, useMemo } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Button,
  Box,
  Card,
  CardBody,
  Text,
  Flex,
  Divider,
} from "@chakra-ui/react";
import { useMutation } from "@tanstack/react-query";
import useAuth from "@hooks/useAuth";
import { FaCheckCircle, FaExclamationCircle } from "react-icons/fa";
import { AxiosError } from "axios";
import { useNavigate, useSearchParams } from "react-router-dom";
import { twoStepValidate } from "@apis/auth";
import Icon from "@components/atoms/Icon";
import { useTranslation } from "react-i18next";
import PinInput from "@components/atoms/Inputs/PinInput";
import { jwtDecode } from "jwt-decode";
import { useToast } from "@chakra-ui/react";
import { useConfig } from "@hooks/useConfig";

const schema = z.object({
  verificationCode: z.string().min(6, "O código deve ter no mínimo 6 dígitos"),
});

type FormData = z.infer<typeof schema>;

const TwoStep: React.FC = () => {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();

  const redirect = searchParams.get("redirect") ?? "/portal";
  const resetToken = searchParams.get("token");

  const { data } = useConfig();

  const methods = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const { handleSubmit } = methods;

  const [, setAuth] = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

  const { mutateAsync, isPending } = useMutation({
    mutationFn: twoStepValidate,
    onSuccess: ({ data }) => {
      toast({
        title: "Login efetuado com sucesso",
        status: "success",
        duration: 9000,
        isClosable: true,
        icon: <FaCheckCircle />,
      });
      const user = setAuth(data.token);
      navigate(
        `${!user?.tutorials.includes("first-page") ? "/welcome" : redirect}`
      );
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

  const onSubmit = handleSubmit(async (data: FormData) => {
    await mutateAsync({
      verificationCode: data.verificationCode,
      token: resetToken,
    });
  });

  const decodedToken = useMemo(() => {
    if (!resetToken) return null;
    return jwtDecode<{ email: string }>(resetToken);
  }, [resetToken]);

  useEffect(() => {
    if (!resetToken) {
      navigate("/auth/login");
    }
  }, [resetToken, navigate]);

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
        <Card
          p={[4, 10]}
          w={{ base: "100%", md: "450px" }}
          boxShadow="lg"
          bg={"bg.card"}
        >
          <CardBody>
            <Flex
              alignItems="center"
              justifyContent="center"
              direction="column"
            >
              {data?.logo ? (
                <img src={data.logo?.url} alt="Logo" width="150px" />
              ) : (
                <Icon width="60px" />
              )}
              <Text
                fontSize="xl"
                fontWeight="bold"
                textAlign="center"
                color="text.primary"
              >
                Email enviado para {decodedToken?.email}
              </Text>
            </Flex>
            <Divider my="5" />
            <form onSubmit={onSubmit}>
              <Flex direction="column" gap="4">
                <PinInput
                  input={{
                    id: "verificationCode",
                    label: "Código de verificação",
                    required: true,
                    options: [],
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
          </CardBody>
        </Card>
      </FormProvider>
    </Box>
  );
};

export default TwoStep;
