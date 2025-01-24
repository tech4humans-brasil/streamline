import { useCallback, useEffect } from "react";
import { FormProvider, useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Box,
  Button,
  CardProps,
  Divider,
  Flex,
  IconButton,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalOverlay,
  Spinner,
  useDisclosure,
  useToast,
} from "@chakra-ui/react";
import Text from "@components/atoms/Inputs/Text";
import Can from "@components/atoms/Can";
import { useTranslation } from "react-i18next";
import { createOrUpdateVariable, getVariables } from "@apis/variables";
import { useParams } from "react-router-dom";
import { FaLock, FaPlus, FaTrash, FaUnlock } from "react-icons/fa";

const variableSchema = z.object({
  variables: z.array(
    z
      .object({
        _id: z.string().optional(),
        name: z
          .string()
          .min(3, { message: "Nome deve ter no mínimo 3 caracteres" }),
        type: z.enum(["variable", "secret"]),
        value: z.string().nullable(),
      })
      .refine((data) => {
        if (data.type === "secret" && !data.value) {
          return true;
        }

        return true;
      })
      .refine((data) => {
        if (data.type === "variable" && !data.value) {
          return false;
        }

        return true;
      })
  ),
});

type VariableFormSchema = z.infer<typeof variableSchema>;

interface VariableFormProps extends CardProps {}

const VariableForm: React.FC<VariableFormProps> = () => {
  const { t } = useTranslation();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const toast = useToast();
  const queryClient = useQueryClient();
  const params = useParams<{ project: string }>();

  const project = params.project;

  const {
    data: variables,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["variables", project ?? ""],
    queryFn: getVariables,
    enabled: !!project,
  });

  const methods = useForm<VariableFormSchema>({
    resolver: zodResolver(variableSchema),
    defaultValues: {
      variables: variables?.variables ?? [],
    },
  });

  const { mutateAsync, isPending } = useMutation({
    mutationFn: createOrUpdateVariable,
    onSuccess: (data) => {
      toast({
        title: t("variables.saved"),
        status: "success",
        duration: 3000,
        isClosable: true,
        position: "top-right",
      });
      queryClient.setQueryData(["variables", project ?? ""], data);
      methods.reset(data);
    },
    onError: () => {
      toast({
        title: t("variables.error"),
        status: "error",
        duration: 3000,
        isClosable: true,
        position: "top-right",
      });
    },
  });

  console.log(methods.formState.errors);

  const { fields, append, remove } = useFieldArray({
    control: methods.control,
    name: "variables",
  });

  const onSubmit = methods.handleSubmit(async (data) => {
    await mutateAsync({
      project_id: project ?? "",
      variables: data.variables,
    });
  });

  const handleAddVariable = useCallback(() => {
    append({ name: "", type: "variable", value: "" });
  }, [append]);

  const handleRemoveVariable = useCallback(
    (index: number) => {
      remove(index);
    },
    [remove]
  );

  const handleAlterType = useCallback(
    (index: number) => {
      const type = methods.watch(`variables.${index}.type`);
      methods.setValue(
        `variables.${index}.type`,
        type === "variable" ? "secret" : "variable"
      );
    },
    [methods]
  );

  const handleCancel = useCallback(() => {
    onClose();
    methods.reset();
  }, [onClose, methods]);

  useEffect(() => {
    methods.reset({ variables: variables?.variables ?? [] });
  }, [variables]);

  return (
    <>
      <Button onClick={onOpen} isDisabled={isError}>
        Cadastrar Variáveis
      </Button>
      <Modal isOpen={isOpen} onClose={onClose} size={"3xl"}>
        <ModalOverlay />
        <ModalContent>
          <ModalCloseButton />
          <ModalBody>
            <FormProvider {...methods}>
              <form onSubmit={onSubmit} id="variable-form">
                <Box textAlign="center" fontSize="lg" fontWeight="bold">
                  {t("variables.create")}
                </Box>

                <Divider my={4} />

                <Flex justify="flex-end" mt={4}>
                  <IconButton
                    aria-label="add"
                    icon={<FaPlus />}
                    colorScheme="blue"
                    onClick={handleAddVariable}
                  />
                </Flex>

                <Flex direction="column" gap={4}>
                  {isLoading && (
                    <Flex justify="center">
                      <Spinner />
                    </Flex>
                  )}

                  {fields.map((field, index) => (
                    <Flex key={field.id} gap={4} alignItems="end">
                      <Text
                        input={{
                          id: `variables.${index}.name`,
                          label: t("variables.name"),
                          required: true,
                        }}
                      />
                      <Text
                        input={{
                          id: `variables.${index}.value`,
                          label: t("variables.value"),
                          placeholder:
                            methods.watch(`variables.${index}.type`) ===
                            "secret"
                              ? "********"
                              : "",
                          required:
                            methods.watch(`variables.${index}.type`) ===
                            "variable",
                        }}
                      />

                      <IconButton
                        aria-label="alter"
                        variant="outline"
                        icon={
                          methods.watch(`variables.${index}.type`) ===
                          "variable" ? (
                            <FaUnlock />
                          ) : (
                            <FaLock />
                          )
                        }
                        isDisabled={
                          methods.watch(`variables.${index}.type`) ===
                            "secret" &&
                          !!methods.watch(`variables.${index}._id`)
                        }
                        colorScheme="blue"
                        onClick={() => handleAlterType(index)}
                      />

                      <IconButton
                        aria-label="delete"
                        icon={<FaTrash />}
                        colorScheme="red"
                        onClick={() => handleRemoveVariable(index)}
                      />
                    </Flex>
                  ))}
                </Flex>
                <Flex mt="8" justify="flex-end" gap="4" direction="row">
                  <Can permission="variables.create">
                    <Button
                      mt={4}
                      colorScheme="blue"
                      isLoading={isPending}
                      type="submit"
                      isDisabled={!methods.formState.isDirty}
                    >
                      {t("variables.submit")}
                    </Button>
                  </Can>
                </Flex>
              </form>
            </FormProvider>
          </ModalBody>
          <ModalFooter gap={4}>
            <Button onClick={handleCancel}>{t("variables.cancel")}</Button>
            <Button
              type="submit"
              form="variable-form"
              colorScheme="blue"
              isLoading={isPending}
              isDisabled={!methods.formState.isDirty}
            >
              {t("variables.submit")}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
};

export default VariableForm;
