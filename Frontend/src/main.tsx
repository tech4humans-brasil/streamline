import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.tsx";
import { ChakraProvider } from "@chakra-ui/react";
import Theme from "./styles/theme";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import AuthContext from "./contexts/AuthContext";
import "./styles/global.css";
import { isAxiosError } from "axios";
import { ErrorBoundary } from "react-error-boundary";
import FallbackRender from "./fallback-error";
import ReactGA from "react-ga4";
import "./i18n";

import.meta.env.VITE_GA_TOKEN && ReactGA.initialize(import.meta.env.VITE_GA_TOKEN);

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: (failureCount, error) => {
        if (
          isAxiosError(error) &&
          (error.response?.status === 404 ||
            error.response?.status === 403 ||
            error.response?.status === 401)
        )
          return false;
        if (failureCount < 2) return true;
        return false;
      },
    },
    mutations: {
      retry: false,
    },
  },
});

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ChakraProvider theme={Theme}>
      <ErrorBoundary FallbackComponent={FallbackRender}>
        <QueryClientProvider client={queryClient}>
          <AuthContext>
            <App />
          </AuthContext>
        </QueryClientProvider>
      </ErrorBoundary>
    </ChakraProvider>
  </React.StrictMode>
);
