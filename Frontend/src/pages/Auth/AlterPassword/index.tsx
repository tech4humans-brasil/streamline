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
  Text,
  Flex,
} from "@chakra-ui/react";
import { useMutation } from "@tanstack/react-query";
import { FaCheckCircle, FaExclamationCircle } from "react-icons/fa";
import { AxiosError } from "axios";
import { useNavigate, useParams } from "react-router-dom";
import { alterPassword } from "@apis/auth";
import Password from "@components/atoms/Inputs/Password";
import { useTranslation } from "react-i18next";

const schema = z.object({
  password: z.string().min(6, "A senha deve ter no mínimo 6 caracteres"),
  confirmPassword: z.string().min(6, "A senha deve ter no mínimo 6 caracteres"),
  token: z.string(),
});

type FormData = z.infer<typeof schema>;

const AlterPassword: React.FC = () => {
  const { t } = useTranslation();

  const methods = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const { handleSubmit } = methods;

  const toast = useToast({
    isClosable: true,
  });

  const navigate = useNavigate();
  const params = useParams<{ token: string }>();

  const { mutateAsync, isPending } = useMutation({
    mutationFn: alterPassword,
    onSuccess: () => {
      toast({
        title: t("alterPassword.success"),
        status: "success",
        duration: 9000,
        isClosable: true,
        icon: <FaCheckCircle />,
      });
      navigate("/");
    },
    onError: (error: AxiosError<{ message: string; statusCode: number }>) => {
      toast({
        title: t("alterPassword.error"),
        description: error?.response?.data?.message ?? error.message,
        status: "error",
        duration: 9000,
        isClosable: true,
        icon: <FaExclamationCircle />,
      });
    },
  });

  const handleBackLogin = useCallback(() => {
    navigate("/");
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
      justifyContent="center"
      height="100vh"
      gap="10"
      bg={"bg.page"}
    >
      <FormProvider {...methods}>
        <Card
          p="10"
          w={{ base: "100%", md: "450px" }}
          boxShadow="lg"
          bg={"bg.card"}
        >
          <CardBody>
            <form onSubmit={onSubmit}>
              <Flex direction="column" gap="4">
                <Password
                  input={{
                    id: "password",
                    label: t("common.fields.newPassword"),
                    placeholder: t("input.enter.female", {
                      field: t("common.fields.newPassword"),
                    }),
                    required: true,
                  }}
                />

                <Password
                  input={{
                    id: "confirmPassword",
                    label: t("common.fields.confirmPassword"),
                    placeholder: t("input.enter.female", {
                      field: t("common.fields.confirmPassword"),
                    }),
                    required: true,
                  }}
                />

                <input
                  type="hidden"
                  value={params.token}
                  {...methods.register("token")}
                />

                <Button
                  mt={4}
                  type="submit"
                  isLoading={isPending}
                  colorScheme="blue"
                >
                  {t("alterPassword.submit")}
                </Button>
              </Flex>
            </form>

            <Box mt={4}>
              <Text
                as="span"
                color="blue.500"
                cursor="pointer"
                fontSize="sm"
                textDecor={"underline"}
                onClick={handleBackLogin}
              >
                {t("alterPassword.back")}
              </Text>
            </Box>
          </CardBody>
        </Card>
      </FormProvider>
    </Box>
  );
};

export default AlterPassword;
