import {
  Button,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Text,
  useDisclosure,
  useToast,
} from "@chakra-ui/react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { deactivateProject } from "@apis/project";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router-dom";

const DeactivateProject: React.FC = () => {
  const { t } = useTranslation();
  const toast = useToast();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const params = useParams<{ project: string }>();

  const project = params.project;

  const { mutateAsync, isPending } = useMutation({
    mutationFn: deactivateProject,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      queryClient.invalidateQueries({ queryKey: ["project", project] });
      toast({
        title: t("project.deactivated"),
        status: "success",
        duration: 3000,
        isClosable: true,
      });
      onClose();
      navigate("/portal/projects");
    },
    onError: () => {
      toast({
        title: t("project.deactivateError"),
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    },
  });

  const handleDeactivate = async () => {
    if (project) {
      await mutateAsync(project);
    }
  };

  return (
    <>
      <Button onClick={onOpen} colorScheme="red">
        {t("project.deactivate")}
      </Button>

      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>{t("project.deactivateTitle")}</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Text>{t("project.deactivateConfirmation")}</Text>
          </ModalBody>
          <ModalFooter gap={4}>
            <Button onClick={onClose}>{t("common.cancel")}</Button>
            <Button
              colorScheme="red"
              onClick={handleDeactivate}
              isLoading={isPending}
            >
              {t("project.confirmDeactivate")}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
};

export default DeactivateProject;