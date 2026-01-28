import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Box,
  Card,
  CardBody,
  Text,
  Flex,
  Spinner,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  useToast,
  Hide,
  Divider,
} from "@chakra-ui/react";
import { useSearchParams, Navigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { AxiosError } from "axios";
import {
  CredentialResponse,
  GoogleLogin,
  GoogleOAuthProvider,
} from "@react-oauth/google";
import { FaExclamationCircle } from "react-icons/fa";
import { useTranslation } from "react-i18next";
import Icon from "@components/atoms/Icon";
import SwitchTheme from "@components/molecules/SwitchTheme";
import LocaleSwap from "@components/atoms/LocaleSwap";
import { useConfig } from "@hooks/useConfig";
import { oidcCallback } from "@apis/auth";

interface OIDCParams {
  clientId: string;
  redirectUri: string;
  scope: string;
  state?: string;
  nonce?: string;
}

const OIDC_STORAGE_KEY = "oidc_auth_params";

const OAuthLogin: React.FC = () => {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const toast = useToast();
  const [error, setError] = useState<string | null>(null);

  // Get OIDC encoded string from URL or sessionStorage (fallback for COOP issues)
  const oidcEncoded = useMemo(() => {
    const fromUrl = searchParams.get("oidc");
    if (fromUrl) {
      return fromUrl;
    }
    // Fallback to sessionStorage if URL param is missing (COOP/popup issues)
    return sessionStorage.getItem(OIDC_STORAGE_KEY);
  }, [searchParams]);

  // Decode OIDC parameters
  const oidcParams = useMemo<OIDCParams | null>(() => {
    if (!oidcEncoded) {
      return null;
    }

    try {
      const decoded = atob(oidcEncoded.replace(/-/g, "+").replace(/_/g, "/"));
      return JSON.parse(decoded);
    } catch {
      return null;
    }
  }, [oidcEncoded]);

  // Store OIDC params in sessionStorage for fallback (handles COOP popup issues)
  useEffect(() => {
    const fromUrl = searchParams.get("oidc");
    const slugFromUrl = searchParams.get("slug");
    
    if (fromUrl) {
      sessionStorage.setItem(OIDC_STORAGE_KEY, fromUrl);
      if (slugFromUrl) {
        sessionStorage.setItem(OIDC_STORAGE_KEY + "_slug", slugFromUrl);
      }
    }
  }, [searchParams]);

  // Extract slug/acronym from URL params or sessionStorage
  const acronym = useMemo(() => {
    const slugParam = searchParams.get("slug");
    if (slugParam) return slugParam;
    // Fallback to sessionStorage
    return sessionStorage.getItem(OIDC_STORAGE_KEY + "_slug") || undefined;
  }, [searchParams]);

  // Get configuration (including Google client ID)
  const { data: configData, isLoading: configLoading, isError } = useConfig(acronym);

  // Mutation for OIDC callback
  const { mutateAsync, isPending } = useMutation({
    mutationFn: oidcCallback,
    onSuccess: ({ data }) => {
      // Redirect to the client's redirect_uri with the authorization code
      window.location.href = data.redirect_uri;
    },
    onError: (error: AxiosError<{ error_description?: string; message?: string }>) => {
      const errorMessage = error.response?.data?.error_description || 
                          error.response?.data?.message || 
                          error.message;
      setError(errorMessage);
      toast({
        title: "Authentication Error",
        description: errorMessage,
        status: "error",
        duration: 9000,
        isClosable: true,
        icon: <FaExclamationCircle />,
      });
    },
  });

  // Handle successful Google authentication
  const handleGoogleSuccess = useCallback(
    async (credentialResponse: CredentialResponse) => {
      if (!credentialResponse.credential || !configData?.config?.google?.clientId || !oidcParams) {
        return;
      }

      // Use oidcEncoded from URL or sessionStorage fallback
      if (!oidcEncoded) {
        setError("Missing OIDC parameters");
        return;
      }

      await mutateAsync({
        credential: credentialResponse.credential,
        client_id: configData.config.google.clientId,
        acronym: configData.acronym,
        oidc: oidcEncoded,
      });

      // Clean up sessionStorage after successful auth
      sessionStorage.removeItem(OIDC_STORAGE_KEY);
      sessionStorage.removeItem(OIDC_STORAGE_KEY + "_slug");
    },
    [mutateAsync, configData, oidcParams, oidcEncoded]
  );

  // Handle Google authentication error
  const handleGoogleError = useCallback(() => {
    toast({
      title: "Google Login Error",
      description: "Failed to authenticate with Google. Please try again.",
      status: "error",
      duration: 5000,
      isClosable: true,
    });
  }, [toast]);

  // Show error if OIDC params are missing
  if (!oidcParams) {
    return (
      <Box
        p={4}
        display="flex"
        flexDirection="column"
        alignItems="center"
        justifyContent="center"
        height="100vh"
        bg="bg.page"
      >
        <Alert
          status="error"
          variant="subtle"
          flexDirection="column"
          alignItems="center"
          justifyContent="center"
          textAlign="center"
          height="200px"
          maxW="500px"
          borderRadius="md"
        >
          <AlertIcon boxSize="40px" mr={0} />
          <AlertTitle mt={4} mb={1} fontSize="lg">
            Requisição inválida
          </AlertTitle>
          <AlertDescription maxWidth="sm">
            Parâmetros OIDC faltando ou invpalidos. Começe o fluxo de login a partir da aplicação.
          </AlertDescription>
        </Alert>
      </Box>
    );
  }

  // Show loading state while fetching config
  if (configLoading) {
    return (
      <Box
        p={4}
        display="flex"
        flexDirection="row"
        alignItems="center"
        justifyContent="center"
        height="100vh"
        bg="bg.page"
      >
        <Spinner size="xl" />
      </Box>
    );
  }

  // Redirect to 404 if config not found
  if (isError || !configData) {
    return <Navigate to="/404" replace />;
  }

  const googleClientId = configData?.config?.google?.clientId;

  return (
    <Box
      p={4}
      display="flex"
      flexDirection="row"
      alignItems="center"
      justifyContent="space-around"
      height="100vh"
      bg="bg.page"
    >
      <Hide below="md">
        <Flex direction="column" gap="4" alignItems="center">
          <Flex alignItems="center" justifyContent="center">
            {configData?.logo ? (
              <img
                src={configData.logo.url}
                alt={configData.acronym}
                width="250px"
                height="150px"
              />
            ) : (
              <Icon w="150px" />
            )}
          </Flex>

          <Text
            fontSize="2xl"
            fontWeight="bold"
            textAlign="center"
            color="text.primary"
          >
            {t("welcome.title")}
          </Text>
          <Text
            fontSize="sm"
            textAlign="center"
            color="text.secondary"
            maxW="400px"
          >
            Entre para autorizar o acesso à sua conta.
          </Text>
          <SwitchTheme />
          <LocaleSwap />
        </Flex>
      </Hide>

      <Card
        p={[4, 10]}
        w={{ base: "100%", md: "450px" }}
        boxShadow="lg"
        bg="bg.card"
      >
        <CardBody>
          <Hide above="md">
            <Flex alignItems="center" justifyContent="center" gap="4">
              {configData?.icon ? (
                <img
                  src={configData.icon.url}
                  alt={configData.acronym}
                  width="60px"
                />
              ) : (
                <Icon w="60px" />
              )}
              <Text
                fontSize="xl"
                fontWeight="bold"
                textAlign="center"
                color="text.primary"
              >
                {t("welcome.title")}
              </Text>
            </Flex>
            <Divider my="5" />
          </Hide>

          <Flex direction="column" gap="6" alignItems="center">
            <Text fontSize="lg" fontWeight="medium" textAlign="center" color="text.primary">
              Entre para continuar
            </Text>

            <Text fontSize="sm" textAlign="center" color="text.secondary">
              Uma aplicação está pedindo acesso à sua conta.
              Entre com o Google para autorizar.
            </Text>

            {error && (
              <Alert status="error" borderRadius="md">
                <AlertIcon />
                <AlertDescription fontSize="sm">{error}</AlertDescription>
              </Alert>
            )}

            {googleClientId ? (
              <GoogleOAuthProvider clientId={googleClientId}>
                <Box position="relative">
                  <GoogleLogin
                    size="large"
                    onSuccess={handleGoogleSuccess}
                    onError={handleGoogleError}
                    text="signin_with"
                    shape="rectangular"
                    width="300"
                  />

                  {isPending && (
                    <Box
                      position="absolute"
                      top="0"
                      left="0"
                      right="0"
                      bottom="0"
                      bg="rgba(255, 255, 255, 0.8)"
                      display="flex"
                      alignItems="center"
                      justifyContent="center"
                      borderRadius="md"
                    >
                      <Spinner />
                    </Box>
                  )}
                </Box>
              </GoogleOAuthProvider>
            ) : (
              <Alert status="warning" borderRadius="md">
                <AlertIcon />
                <AlertDescription fontSize="sm">
                  Autenticação pelo Google não está configurada pela organização.
                </AlertDescription>
              </Alert>
            )}

            <Text fontSize="xs" textAlign="center" color="text.muted" maxW="300px">
              Ao entrar, você autoriza a aplicação a acessar suas informações básicas de usuário.
            </Text>
          </Flex>
        </CardBody>
      </Card>
    </Box>
  );
};

export default OAuthLogin;
