import { useCallback, useEffect } from "react";
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
  Flex,
  useToast,
} from "@chakra-ui/react";
import { useNavigate, useParams } from "react-router-dom";
import Text from "@components/atoms/Inputs/Text";
import Switch from "@components/atoms/Inputs/Switch";
import Select from "@components/atoms/Inputs/Select";
import { createOrUpdateUser, getUser, getUserForms } from "@apis/users";
import Password from "@components/atoms/Inputs/Password";
import { IUserRoles } from "@interfaces/User";
import Can from "@components/atoms/Can";
import { forgotPassword } from "@apis/auth";
import useAuth from "@hooks/useAuth";
import { useTranslation } from "react-i18next";

const Schema = z
  .object({
    name: z
      .string()
      .min(3, { message: "Nome deve ter no mínimo 3 caracteres" }),
    matriculation: z
      .string()
      .max(15, { message: "Matrícula deve ter no máximo 15 caracteres" })
      .optional(),
    email: z.string().email({ message: "Email inválido" }),
    roles: z.array(z.nativeEnum(IUserRoles)),
    isExternal: z.boolean().optional().default(false),
    institute: z.union([
      z.string(),
      z.object({
        _id: z.string(),
        acronym: z.string(),
        name: z.string(),
        active: z.boolean(),
      }),
    ]),
    active: z.boolean(),
    password: z.string().optional(),
    confirmPassword: z.string().optional(),
  })
  .refine(
    (data) => !data.isExternal || (data.isExternal && !data.matriculation),
    {
      message: "Matrícula não é necessária para usuários externos",
      path: ["matriculation"],
    }
  )
  .refine(
    (data) => !data.password || (data.password && data.password.length >= 6),
    {
      message: "Senha precisa ter no mínimo 6 caracteres",
      path: ["password"],
    }
  )
  .refine((data) => data.password === data.confirmPassword, {
    message: "Senhas não coincidem",
    path: ["confirmPassword"],
  });

type UniversityFormInputs = z.infer<typeof Schema>;

export default function User() {
  const { t } = useTranslation();
  const toast = useToast();
  const navigate = useNavigate();
  const params = useParams<{ id?: string }>();
  const queryClient = useQueryClient();
  const [auth] = useAuth();

  const isEditing = !!params?.id;
  const id = params?.id ?? "";

  const { data: user, isLoading } = useQuery({
    queryKey: ["user", id],
    queryFn: getUser,
    enabled: isEditing,
  });

  const { data: formsData, isLoading: isLoadingForms } = useQuery({
    queryKey: ["forms", "user"],
    queryFn: getUserForms,
    retryOnMount: false,
    staleTime: 1000 * 60 * 60,
  });

  const { mutateAsync, isPending } = useMutation({
    mutationFn: createOrUpdateUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      queryClient.invalidateQueries({ queryKey: ["forms"] });
      toast({
        title: t(`user.${isEditing ? "updated" : "created"}`),
        status: "success",
        duration: 3000,
        isClosable: true,
        position: "top-right",
      });
      navigate(-1);
    },
    onError: () => {
      toast({
        title: t(`user.error`),
        status: "error",
        duration: 3000,
        isClosable: true,
        position: "top-right",
      });
    },
  });

  const { mutateAsync: mutateAsyncReset, isPending: isPendingReset } =
    useMutation({
      mutationFn: forgotPassword,
      onSuccess: () => {
        toast({
          title: t(`user.reseted`),
          status: "success",
          duration: 3000,
          isClosable: true,
          position: "top-right",
        });
      },
      onError: () => {
        toast({
          title: t(`user.noReseted`),
          status: "error",
          duration: 3000,
          isClosable: true,
          position: "top-right",
        });
      },
    });

  const methods = useForm<UniversityFormInputs>({
    resolver: zodResolver(Schema),
    defaultValues: user ?? {
      isExternal: false,
      active: true,
    },
  });

  const {
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = methods;

  const isExternal = watch("isExternal");

  const onSubmit = handleSubmit(async (data) => {
    await mutateAsync(isEditing ? { ...data, _id: id } : data);
  });

  const handleCancel = useCallback(() => {
    navigate(-1);
  }, [navigate]);

  const handleResendEmail = useCallback(() => {
    if (!user?.email && !auth?.client) return;

    mutateAsyncReset({ email: user?.email ?? "", acronym: auth?.client ?? "" });
  }, [user]);

  useEffect(() => {
    if (user) {
      reset({
        ...user,
        // @ts-ignore
        institute: user.institute._id,
      });
    }
  }, [user, reset]);

  useEffect(() => {}, [errors]);

  return (
    <Flex w="100%" my="6" mx="auto" px="6" justify="center">
      <FormProvider {...methods}>
        <Card
          as="form"
          onSubmit={onSubmit}
          borderRadius={8}
          h="fit-content"
          w="100%"
          maxW="1000px"
        >
          <CardHeader>
            <Box textAlign="center" fontSize="lg" fontWeight="bold">
              {t(`user.${isEditing ? "edit" : "create"}`)}
            </Box>
          </CardHeader>
          <CardBody display="flex" flexDirection="column" gap="4">
            <Flex justify="space-between" gap="4" direction={["column", "row"]}>
              <Text
                input={{
                  id: "name",
                  label: t("common.fields.name"),
                  placeholder: t("common.fields.name"),
                  required: true,
                }}
              />
              <Switch
                input={{ id: "active", label: t("common.fields.active") }}
              />
            </Flex>
            <Flex justify="space-between" gap="4" direction={["column", "row"]}>
              {!isExternal && (
                <Text
                  input={{
                    id: "matriculation",
                    label: t("common.fields.matriculation"),
                    placeholder: t("common.fields.matriculation"),
                  }}
                />
              )}
              <Select
                input={{
                  id: "roles",
                  label: t("common.fields.profiles"),
                  placeholder: t("common.fields.profiles"),
                  required: true,
                  options: formsData?.roles ?? [],
                }}
                isLoading={isLoadingForms}
                isMulti
              />
              <Select
                input={{
                  id: "institute",
                  label: t("common.fields.institute"),
                  placeholder: t("common.fields.institute"),
                  required: true,
                  options: formsData?.institutes ?? [],
                }}
                isLoading={isLoadingForms}
              />
            </Flex>
            <Flex justify="space-between" gap="4" direction={["column", "row"]}>
              <Text
                input={{
                  id: "email",
                  label: t("common.fields.email"),
                  placeholder: t("common.fields.email"),
                  required: true,
                }}
              />

              <Switch
                input={{ id: "isExternal", label: t("common.fields.external") }}
              />
            </Flex>
            {isEditing && (
              <Flex
                justify="space-between"
                gap="4"
                direction={["column", "row"]}
              >
                <Password
                  input={{
                    id: "password",
                    label: t("common.fields.password"),
                    placeholder: t("common.fields.password"),
                  }}
                />
                <Password
                  input={{
                    id: "confirmPassword",
                    label: t("common.fields.confirmPassword"),
                    placeholder: t("common.fields.confirmPassword"),
                  }}
                />
              </Flex>
            )}

            <Flex mt="8" justify="flex-end" gap="4">
              <Button
                mt={4}
                colorScheme="gray"
                variant="outline"
                onClick={handleCancel}
              >
                {t("common.cancel")}
              </Button>

              {isEditing && (
                <Button
                  mt={4}
                  onClick={handleResendEmail}
                  isLoading={isPendingReset}
                >
                  {t("user.resendEmail")}
                </Button>
              )}
              <Can permission={isEditing ? "user.update" : "user.create"}>
                <Button
                  mt={4}
                  colorScheme="blue"
                  isLoading={isPending || isLoading}
                  type="submit"
                >
                  {t("user.submit")}
                </Button>
              </Can>
            </Flex>
          </CardBody>
        </Card>
      </FormProvider>
    </Flex>
  );
}
