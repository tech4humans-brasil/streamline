// @ts-nocheck

import { getUsersByRole } from "@apis/field";
import {
  Button,
  Flex,
  FormControl,
  FormLabel,
  useColorModeValue,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
  Text,
  Divider,
  Heading,
  Box,
} from "@chakra-ui/react";
import InputText from "@components/atoms/Inputs/Text";
import InfoTooltip from "@components/atoms/Inputs/InfoTooltip";
import Select from "@components/atoms/Inputs/Select";
import { zodResolver } from "@hookform/resolvers/zod";
import { IUserRoles } from "@interfaces/User";
import { useQuery } from "@tanstack/react-query";
import React, { useState, useCallback, useMemo, useEffect } from "react";
import {
  FormProvider,
  useFieldArray,
  useForm,
  useFormContext,
} from "react-hook-form";
import { FaTrashAlt, FaEdit } from "react-icons/fa";
import { z } from "zod";
import ErrorMessages from "../ErrorMessage";

const UserSchema = z.object({
  _id: z.string().optional(),
  name: z.string().min(3, "Digite um nome com no mínimo 3 caracteres"),
  email: z.string().email(),
  isExternal: z.boolean().default(true),
  institute: z.object({
    name: z.string().min(3, "Digite um nome com no mínimo 3 caracteres"),
    acronym: z.string(),
  }),
});

type IUserForm = z.infer<typeof UserSchema>;

interface UserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: IUserForm) => void;
  initialData?: IUserForm | null;
}

const UserModal: React.FC<UserModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
}) => {
  const methods = useForm<IUserForm>({
    resolver: zodResolver(UserSchema),
    defaultValues: initialData,
  });

  const { handleSubmit: handleSubmitForm, reset } = methods;

  const handleSubmit = handleSubmitForm((data) => {
    onSubmit({
      ...data,
      isExternal: true,
    });
    reset();
    onClose();
  });

  const handleClose = useCallback(() => {
    reset();
    onClose();
  }, [reset, onClose]);

  useEffect(() => {
    reset(initialData);
  }, [initialData, reset]);

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>
          {initialData ? "Editar Professor" : "Criar Novo Professor"}
        </ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <FormProvider {...methods}>
            <Flex direction="column" gap="4">
              <InputText input={{ id: "name", label: "Nome" }} />
              <InputText input={{ id: "email", label: "Email" }} />
              <Divider />
              <Heading as={"h5"} fontSize={"lg"}>
                Instituto
              </Heading>
              <InputText input={{ id: "institute.name", label: "Nome" }} />
              <InputText input={{ id: "institute.acronym", label: "Sigla" }} />
            </Flex>
          </FormProvider>
        </ModalBody>
        <ModalFooter>
          <Button colorScheme="blue" onClick={handleSubmit} mr={3}>
            Salvar
          </Button>
          <Button colorScheme="gray" mr={3} onClick={handleClose}>
            Cancelar
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

interface InputUserProps {
  input: {
    id: string;
    label: string;
    describe?: string | null;
    multi?: boolean;
    created?: boolean;
    required?: boolean;
  };
}

const InputUser: React.FC<InputUserProps> = ({ input }) => {
  const { data: teachers, isLoading } = useQuery({
    queryKey: ["field", "users"],
    queryFn: getUsersByRole,
    retry: false,
    staleTime: 1000 * 60 * 10,
  });

  const {
    control,
    watch,
    formState: { errors },
    setValue,
  } = useFormContext();

  const { fields, append, remove, update } = useFieldArray({
    control,
    name: input.id,
    rules: {
      maxLength: {
        value: input.multi ? 10 : 1,
        message: "Max length is 10f",
      },
      minLength: {
        value: input.required ? 1 : 0,
        message: "Min length is 1",
      },
      required: {
        value: input.required ?? false,
        message: "Selecione um professor",
      },
    },
  });
  const [editableUser, setEditableUser] = useState<IUserForm | null>(null);
  const { isOpen, onOpen, onClose } = useDisclosure();

  const openEditModal = (user: IUserForm | null) => {
    setEditableUser(user);
    onOpen();
  };

  const closeEditModal = () => {
    setEditableUser(null);
    onClose();
  };

  const handleUserSubmit = useCallback(
    (data: IUserForm) => {
      if (editableUser) {
        update(
          fields.findIndex((field) => field.email === editableUser?.email),
          data
        );
      } else {
        append(data);
      }
      setEditableUser(null);
    },
    [append, update, fields, editableUser]
  );

  const selectedTeacherId = watch(`${input.id}-select-user`);
  const teachersData = useMemo(
    () =>
      teachers
        ?.filter((teacher) =>
          fields.every((field) => field?.email !== teacher.email)
        )
        ?.map((teacher) => ({
          value: teacher._id,
          label: `${teacher.name} - ${teacher.matriculation}`,
        })),
    [teachers, fields]
  );

  const appendExistingUser = useCallback(() => {
    const teacher = teachers?.find((t) => t._id === selectedTeacherId);
    if (teacher) {
      append(teacher);
      setValue(`${input.id}-select-user`, "");
    }
  }, [teachers, selectedTeacherId, append, setValue, input.id]);

  return (
    <FormControl id={input.id} isInvalid={!!errors?.[input.id]}>
      <Flex align="start" gap="4" direction={"column"} mb="4">
        <FormLabel>{input?.label}</FormLabel>
        <Flex align="end" gap="4" w="100%">
          <InfoTooltip describe={input?.describe} />
          <Select
            input={{
              id: `${input.id}-select-user`,
              label: "Selecione um professor",
              options: teachersData ?? [],
              placeholder: "Selecione um professor",
            }}
            isLoading={isLoading}
          />
          <Button
            onClick={appendExistingUser}
            colorScheme="blue"
            isDisabled={
              !selectedTeacherId ||
              fields.length >= 10 ||
              (!input.multi && !!fields.length)
            }
          >
            Adicionar
          </Button>
        </Flex>
        {input?.created && (
          <Button
            onClick={() => openEditModal(null)}
            colorScheme="blue"
            size="sm"
            isDisabled={
              fields.length >= 10 || (!input.multi && !!fields.length)
            }
          >
            Adicionar Novo Professor
          </Button>
        )}
      </Flex>
      <ErrorMessages id={input.id} />
      <UserModal
        isOpen={isOpen}
        onClose={closeEditModal}
        onSubmit={handleUserSubmit}
        initialData={editableUser}
      />

      {fields.map((field, index) => (
        <ItemUser
          key={index}
          index={index}
          field={field}
          remove={remove}
          edit={() => openEditModal(field)}
        />
      ))}
    </FormControl>
  );
};

const ItemUser: React.FC<{
  index: number;
  field: IUserForm;
  remove: (index: number) => void;
  edit: () => void;
}> = ({ index, field, remove, edit }) => {
  const bg = useColorModeValue("gray.300", "gray.600");
  const isNewUser = field.isExternal;

  return (
    <Flex
      key={index}
      p="4"
      direction={["column", "row"]}
      borderRadius="md"
      align="center"
      border="1px"
      borderColor={bg}
      mt="4"
    >
      <Flex direction="row" flex="1" justify="space-between" align="center">
        <Box w="70%">
          <Text fontWeight="bold" noOfLines={1}>
            {field.name}
          </Text>
          <Text noOfLines={1} fontSize="sm" title={field.email}>
            {field.email}
          </Text>
          <Text>{field?.matriculation}</Text>
        </Box>
        <Box w="30%">
          <Text textAlign={"right"} noOfLines={1}>
            {field.institute?.acronym}{" "}
          </Text>
        </Box>
      </Flex>
      <div>
        {isNewUser && (
          <Button
            colorScheme="blue"
            onClick={edit}
            ml="4"
            size="sm"
            variant="ghost"
          >
            <FaEdit />
          </Button>
        )}
        <Button
          colorScheme="red"
          onClick={() => remove(index)}
          ml="4"
          size="sm"
          variant="ghost"
        >
          <FaTrashAlt />
        </Button>
      </div>
    </Flex>
  );
};

export default InputUser;
