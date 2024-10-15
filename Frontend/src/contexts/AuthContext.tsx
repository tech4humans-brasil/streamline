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
import publicRoutes from "../routes/public";

const publicPaths = publicRoutes.map((route) => route.path);

interface AuthContextType {
  token: JwtData | null;
  setToken: (token: string | null) => JwtData | undefined;
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
      localStorage.removeItem("token");
      setToken(null);
      api.defaults.headers["Authorization"] = "";
      queryClient.clear();
      window.location.href = `/?redirect=${location.pathname}`;
      return;
    }

    const decodedToken = jwtDecode<JwtData>(token);

    localStorage.setItem("token", token);

    api.defaults.headers["Authorization"] = `Bearer ${token}`;
    assistant.defaults.headers["Authorization"] = `Bearer ${token}`;

    setToken(decodedToken);

    return decodedToken;
  }, []);

  useLayoutEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      setTokenValue(token);
    } else if (publicPaths.includes(location.pathname)) {
      window.location.href = `/?redirect=${location.pathname}`;
    }
  }, [setTokenValue]);

  const providerValue = useMemo(
    () => ({ token, setToken: setTokenValue }),
    [token, setTokenValue]
  );

  return (
    <AuthContext.Provider value={providerValue}>
      {children}
    </AuthContext.Provider>
  );
}

export default AuthProvider;
