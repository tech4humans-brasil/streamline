import {
  createContext,
  useState,
  ReactNode,
  useCallback,
  useMemo,
  useLayoutEffect,
} from "react";
import JwtData from "@interfaces/JwtData";
import { jwtDecode } from "jwt-decode";
import api from "@services/api";
import { useQueryClient } from "@tanstack/react-query";
import assistant from "@services/assistant";
import {
  isEnabled as oidcEnabled,
  getUser as getOidcUser,
  getTenant,
  logout as oidcLogout,
} from "@services/oidc";

interface AuthContextType {
  token: JwtData | null;
  setToken: (token: string | null) => JwtData | undefined;
  setSession: (accessToken: string) => Promise<JwtData | undefined>;
}

export const AuthContext = createContext<AuthContextType | undefined>(
  undefined
);

interface AuthProviderProps {
  children: ReactNode;
}

function AuthProvider({ children }: Readonly<AuthProviderProps>) {
  const [token, setToken] = useState<JwtData | null>(null);
  const queryClient = useQueryClient();

  const setTokenValue = useCallback((token: string | null) => {
    if (!token) {
      sessionStorage.removeItem("token");
      setToken(null);
      api.defaults.headers["Authorization"] = "";
      assistant.defaults.headers["Authorization"] = "";
      queryClient.clear();

      if (oidcEnabled()) {
        // Logout RP-initiated: encerra a sessão no Keycloak, não só no
        // navegador. Descartar o token local deixava a sessão viva no IdP, e o
        // próximo login entrava sozinho sem pedir nada.
        void oidcLogout().catch((error) => {
          console.error("[oidc] logout failed", error);
          window.location.href = "/";
        });
        return;
      }

      window.location.href = `/?redirect=${location.pathname}`;
      return;
    }

    const decodedToken = jwtDecode<JwtData>(token);

    sessionStorage.setItem("token", token);

    api.defaults.headers["Authorization"] = `Bearer ${token}`;
    assistant.defaults.headers["Authorization"] = `Bearer ${token}`;

    setToken(decodedToken);

    return decodedToken;
  }, []);

  // Caminho do Keycloak. O access token carrega identidade, não os campos de
  // domínio por tenant, então a sessão vem de GET /api/auth/session em vez de
  // sair de um jwtDecode. O contrato de `token` continua sendo o JwtData.
  const setSession = useCallback(async (accessToken: string) => {
    const tenant = getTenant();

    api.defaults.headers["Authorization"] = `Bearer ${accessToken}`;
    assistant.defaults.headers["Authorization"] = `Bearer ${accessToken}`;
    api.defaults.headers["x-tenant"] = tenant;
    assistant.defaults.headers["x-tenant"] = tenant;

    const { data } = await api.get<{ data: JwtData }>("/auth/session");
    const session = data?.data;

    if (!session) {
      return undefined;
    }

    setToken(session);

    return session;
  }, []);

  useLayoutEffect(() => {
    const token = sessionStorage.getItem("token");

    if (token) {
      setTokenValue(token);
      return;
    }

    if (oidcEnabled()) {
      // Sessão OIDC já estabelecida sobrevive ao reload: o oidc-client-ts
      // guarda o usuário no sessionStorage.
      getOidcUser()
        .then((user) => {
          if (user?.access_token && !user.expired) {
            return setSession(user.access_token);
          }
          return undefined;
        })
        .catch(() => undefined)
        .then((session) => {
          if (
            !session &&
            !location.pathname.startsWith("/auth") &&
            location.pathname !== "/"
          ) {
            window.location.href = `/?redirect=${location.pathname}`;
          }
        });
      return;
    }

    if (
      !location.pathname.startsWith("/auth") &&
      location.pathname !== "/"
    ) {
      window.location.href = `/?redirect=${location.pathname}`;
    }
  }, [setTokenValue, setSession]);

  const providerValue = useMemo(
    () => ({ token, setToken: setTokenValue, setSession }),
    [token, setTokenValue, setSession]
  );

  return (
    <AuthContext.Provider value={providerValue}>
      {children}
    </AuthContext.Provider>
  );
}

export default AuthProvider;
