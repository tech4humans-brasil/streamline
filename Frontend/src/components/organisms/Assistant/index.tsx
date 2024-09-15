import { getAssistantFormHelp } from "@apis/assistant";
import {
  Box,
  Button,
  Flex,
  IconButton,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalHeader,
  Textarea,
  useDisclosure,
} from "@chakra-ui/react";
import { useMutation } from "@tanstack/react-query";
import React, { useCallback, useState } from "react";
import { useFormContext } from "react-hook-form";
import { FaSave } from "react-icons/fa";
import { GoCopilot } from "react-icons/go";
import * as z from "zod";

const schema = z.object({
  description: z.string(),
});

const Assistant: React.FC = () => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [description, setDescription] = useState<string>("");
  const methods = useFormContext();

  const { mutateAsync, isPending } = useMutation({
    mutationFn: getAssistantFormHelp,
    onSuccess: (data) => {
      methods.reset(data);
    },
  });

  const onSubmit = useCallback(async () => {
    const isValid = schema.safeParse({ description });
    if (!isValid.success) {
      return;
    }

    try {
      await mutateAsync({ description });
    } catch (error) {
      console.error(error);
    }
  }, [description, mutateAsync]);

  return (
    <>
      <Box position="fixed" bottom="20" right="20" zIndex="1000">
        <IconButton
          icon={<GoCopilot fontSize="20px" />}
          aria-label="Assistant"
          bg="bg.card"
          size="lg"
          borderRadius="full"
          onClick={onOpen}
        />
      </Box>
      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalCloseButton />
        <ModalContent>
          <ModalHeader>AI First</ModalHeader>
          <ModalBody>
            <form onSubmit={onSubmit}>
              <Flex dir="row" align="center" gap={4}>
                <Textarea
                  name="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Descreva o que você deseja"
                />
                <Button onClick={onSubmit} isLoading={isPending}>
                  <FaSave />
                </Button>
              </Flex>
            </form>
          </ModalBody>
        </ModalContent>
      </Modal>
    </>
  );
};

export default Assistant;
