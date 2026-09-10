import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";
import { isEnabled as oidcEnabled, renew } from "./oidc";

const BASE_URL = import.meta.env.VITE_BASE_URL ?? "http://localhost:7071/api";

const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

type RetriableConfig = InternalAxiosRequestConfig & { _retried?: boolean };

let onSessionLost: (() => void) | null = null;

// O App registra aqui o que fazer quando não há mais como recuperar a sessão.
// Antes o tratamento de 401 vivia no corpo do componente e registrava um
// interceptor novo a cada render, que iam se acumulando.
export const setSessionLostHandler = (handler: () => void) => {
  onSessionLost = handler;
};

export const applyAuth = (accessToken: string, tenant: string) => {
  api.defaults.headers["Authorization"] = `Bearer ${accessToken}`;
  api.defaults.headers["x-tenant"] = tenant;
};

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const status = error.response?.status;
    const config = error.config as RetriableConfig | undefined;

    if (status !== 401 || !config) {
      return Promise.reject(error);
    }

    // Um 401 no caminho do Keycloak quase sempre é token expirado, não sessão
    // perdida. Vale uma renovação e uma nova tentativa antes de deslogar.
    if (oidcEnabled() && !config._retried) {
      config._retried = true;

      const user = await renew();

      if (user?.access_token) {
        const tenant = (api.defaults.headers["x-tenant"] as string) ?? "";
        applyAuth(user.access_token, tenant);
        config.headers.set("Authorization", `Bearer ${user.access_token}`);
        return api.request(config);
      }
    }

    if (window.location.pathname !== "/") {
      onSessionLost?.();
    }

    return Promise.reject(error);
  }
);

export default api;
