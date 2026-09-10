import { useEffect, useRef, useState } from "react";
import { Center, Spinner, Stack, Text, Button } from "@chakra-ui/react";
import { useNavigate } from "react-router-dom";
import useAuth from "@hooks/useAuth";
import { completeLogin, takeRedirect } from "@services/oidc";

// Retorno do Keycloak no fluxo Authorization Code + PKCE. A biblioteca valida
// o `state` e troca o code pelo token; aqui só resta montar a sessão e sair da
// URL, que carrega code e state.
export default function Callback() {
  const navigate = useNavigate();
  const [, , setSession] = useAuth();
  const [error, setError] = useState<string | null>(null);
  const ran = useRef(false);

  useEffect(() => {
    // StrictMode monta duas vezes em desenvolvimento, e o code é de uso único:
    // a segunda troca falharia com invalid_grant.
    if (ran.current) {
      return;
    }
    ran.current = true;

    completeLogin()
      .then(async (user) => {
        await setSession(user.access_token);
        const target = takeRedirect();
        navigate(target && target !== "/" ? target : "/portal", {
          replace: true,
        });
      })
      .catch((err) => {
        console.error("[oidc] callback failed", err);
        setError(err?.message ?? "Falha ao concluir o login");
      });
  }, [navigate, setSession]);

  if (error) {
    return (
      <Center h="100vh">
        <Stack spacing={4} align="center" maxW="md" textAlign="center">
          <Text fontWeight="bold">Não foi possível concluir o login</Text>
          <Text fontSize="sm" color="gray.600">
            {error}
          </Text>
          <Button onClick={() => navigate("/", { replace: true })}>
            Voltar para o início
          </Button>
        </Stack>
      </Center>
    );
  }

  return (
    <Center h="100vh">
      <Stack spacing={4} align="center">
        <Spinner size="xl" />
        <Text>Concluindo o login…</Text>
      </Stack>
    </Center>
  );
}
