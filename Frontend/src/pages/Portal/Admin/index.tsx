import React, { useEffect } from "react";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Button,
  Card,
  CardBody,
  CardHeader,
  Flex,
  Heading,
  useToast,
} from "@chakra-ui/react";
import { useTranslation } from "react-i18next";
import Text from "@components/atoms/Inputs/Text";
import { showAdmin, updateAdmin } from "@apis/admin";
import File from "@components/atoms/Inputs/File";
import CreatableSelect from "@components/atoms/Inputs/CreatableSelect";
import Switch from "@components/atoms/Inputs/Switch";

const adminSchema = z.object({
  _id: z.string(),
  name: z.string().min(3, "Name must be at least 3 characters"),
  acronym: z.string().min(2, "Acronym must be at least 2 characters"),
  principal: z.boolean().default(true),
  logo: z
    .object({
      name: z.string(),
      url: z.string(),
      mimeType: z.string(),
      size: z.string(),
      containerName: z.string(),
    })
    .nullable(),
  icon: z
    .object({
      name: z.string(),
      url: z.string(),
      mimeType: z.string(),
      size: z.string(),
      containerName: z.string(),
    })
    .nullable(),
  domains: z.array(z.string().url()).min(1),
  config: z.object({
    emailSender: z.string().email().nullable(),
    google: z.object({
      clientId: z.string().nullable(),
    }),
    clicksign: z.object({
      apiKey: z.string().nullable(),
    }),
  }),
});

type AdminFormSchema = z.infer<typeof adminSchema>;

const Admin: React.FC = () => {
  const { t } = useTranslation();
  const toast = useToast();
  const queryClient = useQueryClient();

  const { data: adminData, isLoading } = useQuery({
    queryKey: ["admin"],
    queryFn: showAdmin,
  });

  const { mutateAsync, isPending } = useMutation({
    mutationFn: updateAdmin,
    onSuccess: () => {
      toast({
        title: t("admin.updated"),
        status: "success",
        duration: 3000,
        isClosable: true,
        position: "top-right",
      });
      queryClient.invalidateQueries({ queryKey: ["admin"] });
    },
    onError: () => {
      toast({
        title: t("admin.error"),
        status: "error",
        duration: 3000,
        isClosable: true,
        position: "top-right",
      });
    },
  });

  const methods = useForm<AdminFormSchema>({
    resolver: zodResolver(adminSchema),
    defaultValues: adminData ?? {},
  });

  const {
    handleSubmit,
    reset,
    formState: { errors },
  } = methods;

  const onSubmit = handleSubmit(async (data) => {
    await mutateAsync(data);
  });

  console.log(errors);

  useEffect(() => {
    if (adminData) {
      reset(adminData);
    }
  }, [adminData, reset]);

  return (
    <Flex w="100%" my="6" mx="auto" px="6" justify="center">
      <FormProvider {...methods}>
        <Card
          as="form"
          onSubmit={onSubmit}
          borderRadius={8}
          h="fit-content"
          w="100%"
          maxW="900px"
        >
          <CardHeader>
            <Heading
              fontSize="2xl"
              fontWeight="bold"
              w="100%"
              textAlign="center"
            >
              {t("admin.title")}
            </Heading>
          </CardHeader>
          <CardBody display="flex" flexDirection="column" gap="4">
            <Text
              input={{
                id: "name",
                label: t("admin.fields.name"),
                required: true,
              }}
            />
            <Text
              input={{
                id: "acronym",
                label: t("admin.fields.acronym"),
                required: true,
                isDisabled: true,
              }}
            />

            <Switch
              input={{
                id: "principal",
                label: t("admin.fields.principal"),
              }}
            />

            <CreatableSelect
              input={{
                id: "domains",
                label: t("admin.fields.domains"),
                required: true,
                options: [],
              }}
              isMulti
            />

            <File
              input={{
                id: "logo",
                label: t("admin.fields.logo"),
                required: true,
              }}
            />

            <File
              input={{
                id: "icon",
                label: t("admin.fields.icon"),
                required: true,
              }}
            />

            <Text
              input={{
                id: "config.emailSender",
                label: t("admin.fields.emailSender"),
              }}
            />
            <Text
              input={{
                id: "config.google.clientId",
                label: t("admin.fields.googleClientId"),
              }}
            />

            <Text
              input={{
                id: "config.clicksign.apiKey",
                label: t("admin.fields.clicksignApiKey"),
              }}
            />

            <Flex justify="flex-end" gap="4">
              <Button
                mt={4}
                colorScheme="gray"
                variant="outline"
                onClick={() => reset(adminData)}
              >
                {t("admin.cancel")}
              </Button>
              <Button
                mt={4}
                colorScheme="blue"
                isLoading={isPending || isLoading}
                type="submit"
              >
                {t("admin.submit")}
              </Button>
            </Flex>
          </CardBody>
        </Card>
      </FormProvider>
    </Flex>
  );
};

export default Admin;
