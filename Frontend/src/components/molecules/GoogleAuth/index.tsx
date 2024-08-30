import { samlGoogle } from "@apis/auth";
import { Box, Center, Spinner, useToast } from "@chakra-ui/react";
import useAuth from "@hooks/useAuth";
import { IUserRoles } from "@interfaces/JwtData";
import {
  CredentialResponse,
  GoogleLogin,
  GoogleOAuthProvider,
} from "@react-oauth/google";
import { useMutation } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { useCallback } from "react";
import { FaCheckCircle, FaExclamationCircle } from "react-icons/fa";
import { useNavigate } from "react-router-dom";

const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

const GoogleAuth = () => {
  const toast = useToast();
  const [, setAuth] = useAuth();
  const navigate = useNavigate();

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
      const user = setAuth(data.token);
      navigate(
        `${
          user?.roles.includes(IUserRoles.admin) &&
          !user.tutorials.includes("first-page")
            ? "/welcome"
            : "/portal"
        }`
      );
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
      if (!credentialResponse.credential) {
        return;
      }

      mutateAsync({
        credential: credentialResponse.credential,
        client_id: clientId,
      });
    },
    [mutateAsync]
  );

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
