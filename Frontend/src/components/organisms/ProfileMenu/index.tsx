import React, { useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Avatar,
  Button,
  Divider,
  Flex,
  Text,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  useDisclosure,
  Hide,
} from "@chakra-ui/react";
import useAuth from "@hooks/useAuth";
import { useTranslation } from "react-i18next";
import Can from "@components/atoms/Can";

const AvatarMenu: React.FC = () => {
  const { t } = useTranslation();

  const navigate = useNavigate();
  const { isOpen, onOpen, onClose } = useDisclosure();

  const [auth, setAuth] = useAuth();

  const userName = auth?.name;
  const roles = auth?.roles ?? [];
  const matriculation = auth?.matriculation;
  const email = auth?.email;

  const handleLogout = useCallback(() => {
    setAuth(null);
    navigate("/");
  }, [setAuth, navigate]);

  const userDetails = useCallback(() => {
    return (
      <Flex flexDir="column" alignItems="start">
        <Flex flexDir="row" alignItems="center" gap={1}>
          <Text mb={2} fontWeight="bold" fontSize="md">
            {userName}
          </Text>
          <Text mb={2} fontSize="sm" opacity={0.7}>
            #{matriculation}
          </Text>
        </Flex>
        <Flex flexDir="row" alignItems="center" gap={1}>
          <Text mb={2} fontSize="sm">
            {t("common.fields.profile")}:
          </Text>
          <Text mb={2} fontSize="sm" fontWeight="bold">
            {roles?.map((role) => t(`role.${role}`)).join(", ")}
          </Text>
        </Flex>
        <Flex flexDir="row" alignItems="center" gap={1}>
          <Text mb={2} fontSize="sm">
            {t("common.fields.email")}:
          </Text>
          <Text mb={2} fontSize="sm" fontWeight="bold">
            {email}
          </Text>
        </Flex>
      </Flex>
    );
  }, [userName, matriculation, roles, email]);

  return (
    <div id="profile-menu">
      <Flex align="center" gap={2} onClick={onOpen} cursor="pointer">
        <Avatar
          name={userName ?? "Usuário"}
          src="https://bit.ly/broken-link"
          size="sm"
        />
        <Hide above="md">
          <Text fontWeight="bold">{userName}</Text>
        </Hide>
      </Flex>
      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>
            <Flex align="center" gap={2}>
              <Avatar
                name={userName ?? "Usuário"}
                src="https://bit.ly/broken-link"
                size="sm"
              />
              <Text fontWeight="bold">{userName}</Text>
            </Flex>
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            {userDetails()}
            <Divider my={2} />
            <Button colorScheme="blue" size="sm" onClick={handleLogout}>
              {t("button.logout")}
            </Button>
            <Can permission={"admin.read"}>
              <Button
                colorScheme="blue"
                variant="outline"
                ml={2}
                size="sm"
                onClick={() => navigate("/portal/admin")}
              >
                {t("admin.button")}
              </Button>
            </Can>
          </ModalBody>
        </ModalContent>
      </Modal>
    </div>
  );
};

export default AvatarMenu;
