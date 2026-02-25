import React, { useCallback, useState } from "react";
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
  Input,
  useToast,
} from "@chakra-ui/react";
import useAuth from "@hooks/useAuth";
import { useTranslation } from "react-i18next";
import Can from "@components/atoms/Can";
import { generateApiToken } from "@apis/auth";

const AvatarMenu: React.FC = () => {
  const { t } = useTranslation();
  const toast = useToast();
  const navigate = useNavigate();
  const { isOpen, onOpen, onClose } = useDisclosure();

  const [auth, setAuth] = useAuth();
  const [apiToken, setApiToken] = useState<string | null>(null);
  const [apiTokenExpiresAt, setApiTokenExpiresAt] = useState<string | null>(null);
  const [apiTokenLoading, setApiTokenLoading] = useState(false);
  const [apiTokenError, setApiTokenError] = useState<string | null>(null);

  const userName = auth?.name;
  const roles = auth?.roles ?? [];
  const matriculation = auth?.matriculation;
  const email = auth?.email;
  const photo_url = auth?.photo_url?.url;

  const handleLogout = useCallback(() => {
    setAuth(null);
    navigate("/");
  }, [setAuth, navigate]);

  const handleGenerateApiToken = useCallback(async () => {
    setApiTokenLoading(true);
    setApiTokenError(null);
    setApiToken(null);
    setApiTokenExpiresAt(null);
    try {
      const res = await generateApiToken();
      if (res?.data?.token) {
        setApiToken(res.data.token);
        setApiTokenExpiresAt(res.data.expiresAt ?? null);
        toast({
          title: t("profile.apiToken.generated"),
          status: "success",
          isClosable: true,
        });
      }
    } catch {
      setApiTokenError(t("profile.apiToken.error"));
      toast({
        title: t("profile.apiToken.error"),
        status: "error",
        isClosable: true,
      });
    } finally {
      setApiTokenLoading(false);
    }
  }, [t, toast]);

  const handleCopyApiToken = useCallback(() => {
    if (!apiToken) return;
    navigator.clipboard.writeText(apiToken);
    toast({
      title: t("profile.apiToken.copied"),
      status: "success",
      isClosable: true,
    });
  }, [apiToken, t, toast]);

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
  }, [userName, matriculation, roles, email, t]);

  return (
    <div id="profile-menu">
      <Flex align="center" gap={2} onClick={onOpen} cursor="pointer">
        <Avatar
          name={userName ?? "Usuário"}
          src={photo_url ?? undefined}
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
                src={photo_url ?? undefined}
                size="sm"
              />
              <Text fontWeight="bold">{userName}</Text>
            </Flex>
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            {userDetails()}
            <Divider my={2} />
            <Text fontSize="xs" color="gray.600" _dark={{ color: "gray.400" }} mb={2}>
              {t("profile.apiToken.description")}
            </Text>
            <Button
              colorScheme="blue"
              variant="outline"
              size="sm"
              mb={2}
              onClick={handleGenerateApiToken}
              isLoading={apiTokenLoading}
              loadingText={t("profile.apiToken.generate")}
            >
              {t("profile.apiToken.generate")}
            </Button>
            {apiTokenError && (
              <Text fontSize="sm" color="red.500" mb={2}>
                {apiTokenError}
              </Text>
            )}
            {apiToken && (
              <Flex flexDir="column" gap={2} mb={4}>
                <Input
                  value={apiToken}
                  readOnly
                  size="sm"
                  fontFamily="mono"
                  fontSize="xs"
                />
                <Button size="sm" variant="outline" onClick={handleCopyApiToken}>
                  {t("profile.apiToken.copy")}
                </Button>
                {apiTokenExpiresAt && (
                  <Text fontSize="xs" color="gray.500">
                    {t("profile.apiToken.expiresAt")}:{" "}
                    {new Date(apiTokenExpiresAt).toLocaleString()}
                  </Text>
                )}
              </Flex>
            )}
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
