import { getProjectForms, updatePermission } from "@apis/project";
import {
  Avatar,
  Button,
  Divider,
  Flex,
  IconButton,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalOverlay,
  Tag,
  Text,
  useDisclosure,
} from "@chakra-ui/react";
import { zodResolver } from "@hookform/resolvers/zod";
import { IProject } from "@interfaces/Project";
import { useMutation, useQuery } from "@tanstack/react-query";
import React, { useCallback, useEffect, useMemo } from "react";
import { FormProvider, useFieldArray, useForm } from "react-hook-form";
import { FaPlus, FaShare, FaTrash } from "react-icons/fa";
import { z } from "zod";
import Select from "../Inputs/Select";
import { useTranslation } from "react-i18next";
import { useSearchParams } from "react-router-dom";

const schema = z
  .object({
    "select-item": z.string().nullable().optional(),
    permissions: z.array(
      z.object({
        _id: z.string(),
        label: z.string(),
        type: z.enum(["user", "institute"]),
        role: z.array(z.enum(["view", "update", "delete"])),
        isOwner: z.boolean().default(false),
      })
    ),
  })
  .refine((data) => {
    const hasUser = data.permissions.some((p) => (p.type = "user"));

    if (!hasUser) {
      return false;
    }

    return true;
  });

type IItem = z.infer<typeof schema>;

interface ShareProjectProps {
  permissions: IProject["permissions"];
}

const ShareProject: React.FC<ShareProjectProps> = ({ permissions = [] }) => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [searchParams] = useSearchParams();

  const project = searchParams.get("project");

  const { data: forms } = useQuery({
    queryKey: ["project", "forms"],
    queryFn: getProjectForms,
    staleTime: 1000 * 60 * 10,
    retry: false,
  });

  const { mutateAsync, isPending } = useMutation({
    mutationFn: updatePermission,
  });

  const allOptions = useMemo(() => {
    if (!forms) return [];

    return forms.flatMap((form) => form.options);
  }, [forms]);

  const methods = useForm<IItem>({
    resolver: zodResolver(schema),
  });

  const { control, handleSubmit, watch } = methods;

  const { fields, append, remove } = useFieldArray({
    control,
    name: "permissions",
    rules: {
      maxLength: {
        value: 10,
        message: "Max length is 10f",
      },
      minLength: {
        value: 2,
        message: "Min length is 1",
      },
      required: {
        value: true,
        message: "Selecione pelo menos um usuário",
      },
    },
  });

  const onSubmit = handleSubmit((data) => {
    if (!project) return;

    mutateAsync({
      _id: project,
      permissions: data.permissions,
    });
  });

  const selected = watch("select-item");

  console.log(methods.formState.errors);

  const handleAppend = useCallback(() => {
    const option = allOptions?.find((form) => form.value === selected);

    methods.setValue("select-item", null);

    if (!option) return;

    append({
      _id: option.value,
      label: option.label,
      type: option.type,
      role: ["update"],
      isOwner: false,
    });
  }, [append, selected]);

  useEffect(() => {
    const defaultValues = permissions.map((permission) => ({
      _id: permission.user ?? permission.institute ?? "",
      label: allOptions.find(
        (option) =>
          option.value === permission.user ||
          option.value === permission.institute
      )?.label,
      type: permission.type,
      role: permission.role,
      isOwner: permission.isOwner,
    }));

    methods.reset({
      "select-item": null,
      permissions: defaultValues,
    });
  }, [permissions, allOptions, methods, isOpen]);

  if (!forms) return null;

  return (
    <>
      <IconButton
        aria-label="Share project"
        icon={<FaShare />}
        onClick={onOpen}
      />

      <FormProvider {...methods}>
        <Modal isOpen={isOpen} onClose={onClose} size={"lg"}>
          <ModalOverlay />
          <ModalCloseButton />
          <ModalContent>
            <ModalBody>
              <form onSubmit={onSubmit}>
                <Flex direction="row" alignItems="end" gap={3} mt="2">
                  <Select
                    input={{
                      id: "select-item",
                      label: "Selecione um usuário",
                      options: forms,
                    }}
                  />
                  <Button onClick={handleAppend}>
                    <FaPlus />
                  </Button>
                </Flex>

                <Flex direction="column" gap={3} mt={5}>
                  {fields.map((field, index) => (
                    <PermissionField
                      key={field._id}
                      index={index}
                      field={field}
                      remove={remove}
                    />
                  ))}
                </Flex>
              </form>
            </ModalBody>
            <ModalFooter>
              <Button
                type="submit"
                isLoading={isPending}
                colorScheme="blue"
                isDisabled={!methods.formState.isDirty}
              >
                Salvar
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
      </FormProvider>
    </>
  );
};

export default ShareProject;

const PermissionField: React.FC<{
  index: number;
  field: IItem["permissions"][0] & { label: string };
  remove: (index: number) => void;
}> = ({ index, field, remove }) => {
  const { t } = useTranslation();

  return (
    <>
      <Flex
        direction="row"
        gap={3}
        alignItems="center"
        p={2}
        borderRadius="md"
        justify="space-between"
      >
        <Flex direction="row" gap={3} alignItems="center">
          <Avatar name={field.label} size="sm" />
          <Text>{field.label}</Text>
        </Flex>

        <Flex direction="row" gap={3}>
          <Tag size={"sm"}>{t(`common.fields.${field.type}`)}</Tag>
          <IconButton
            aria-label="Remove"
            icon={<FaTrash />}
            onClick={() => remove(index)}
            size="sm"
          />
        </Flex>
      </Flex>
      <Divider />
    </>
  );
};
