import { samlGoogle } from "@apis/auth";
import { Box, Button, Center, Spinner, useToast } from "@chakra-ui/react";
import useAuth from "@hooks/useAuth";
import {
  CredentialResponse,
  GoogleLogin,
  GoogleOAuthProvider,
} from "@react-oauth/google";
import { useMutation } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { useCallback, useState } from "react";
import { FaCheckCircle, FaExclamationCircle } from "react-icons/fa";
import { FcGoogle } from "react-icons/fc";
import { useNavigate, useSearchParams } from "react-router-dom";
import { isEnabled as oidcEnabled, login as oidcLogin } from "@services/oidc";

const GoogleAuth = ({ clientId = null, slug = null }: { clientId: string | null, slug: string | null }) => {
  const toast = useToast();
  const [, setAuth] = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [redirecting, setRedirecting] = useState(false);

  const redirect = searchParams.get("redirect") ?? "/portal";

  const { mutateAsync, isPending } = useMutation({
    mutationFn: samlGoogle,
    onSuccess: ({ data }) => {
      toast({
        title: "Login realizado com sucesso",
        status: "success",
        duration: 9000,
        isClosable: true,
        icon: <FaCheckCircle />,
      });
      setAuth(data.token);
      navigate(redirect);
    },
    onError: (error: AxiosError<{ message: string; statusCode: number }>) => {
      toast({
        title: "Erro ao fazer login",
        description: error.message,
        status: "error",
        duration: 9000,
        isClosable: true,
        icon: <FaExclamationCircle />,
      });
    },
  });

  const handleGoogleSuccess = useCallback(
    (credentialResponse: CredentialResponse) => {
      if (!credentialResponse.credential || !clientId) {
        return;
      }

      mutateAsync({
        credential: credentialResponse.credential,
        client_id: clientId,
        acronym: slug,
      });
    },
    [mutateAsync, slug]
  );

  const handleKeycloak = useCallback(async () => {
    setRedirecting(true);
    try {
      await oidcLogin(slug ?? "", redirect);
    } catch (error) {
      setRedirecting(false);
      toast({
        title: "Erro ao iniciar o login",
        description: (error as Error)?.message,
        status: "error",
        duration: 9000,
        isClosable: true,
        icon: <FaExclamationCircle />,
      });
    }
  }, [slug, redirect, toast]);

  // Com o Keycloak configurado, o botão passa a acionar o realm em vez do
  // client OAuth do Google. A experiência é a mesma: o `kc_idp_hint` faz o
  // Keycloak pular a própria tela e ir direto à conta Google.
  if (oidcEnabled()) {
    return (
      <Button
        w="100%"
        size="lg"
        variant="outline"
        leftIcon={<FcGoogle size={20} />}
        onClick={handleKeycloak}
        isLoading={redirecting}
        loadingText="Redirecionando…"
      >
        Entrar com Google
      </Button>
    );
  }

  // Caminho legado, mantido enquanto o AUTH_MODE do backend aceita os dois e
  // o cutoff do GV-1426 não aconteceu. Sai no GV-1695.
  if (!clientId) {
    return null;
  }

  return (
    <GoogleOAuthProvider clientId={clientId}>
      <GoogleLogin
        size="large"
        onSuccess={handleGoogleSuccess}
        onError={() => {
          toast({
            title: "Error",
            description: "Failed to login with Google",
            status: "error",
            duration: 3000,
            isClosable: true,
          });
        }}
        useOneTap
      />

      {isPending && (
        <Box
          position="absolute"
          top="0"
          left="0"
          right="0"
          bottom="0"
          bg="rgba(0, 0, 0, 0.5)"
        >
          <Center h="100%">
            <Spinner />
          </Center>
        </Box>
      )}
    </GoogleOAuthProvider>
  );
};

export default GoogleAuth;
