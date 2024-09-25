import useAuth from "./hooks/useAuth";
import { publicRoutes, privateRoutes } from "./routes";
import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
  useLocation,
} from "react-router-dom";
import api from "./services/api";
import React, { useEffect, useMemo } from "react";
import ReactGA from "react-ga4";

function RequireAuth({ children }: { children: React.ReactNode }) {
  const [auth] = useAuth();
  const location = useLocation();

  if (!auth) {
    return <Navigate to={`/?redirect=${location.pathname}`} replace />;
  }

  return children;
}

function App() {
  const [auth, setAuth] = useAuth();
  const permissions = auth?.permissions ?? [];

  api.interceptors.response.use(
    (response) => {
      return response;
    },
    (error) => {
      if (error.response?.status === 401 && window.location.pathname !== "/") {
        window.location.href = "/";
        setAuth(null);
      }
      return Promise.reject(new Error(error));
    }
  );

  const privateRoutesPermitted = useMemo(() => {
    if(!permissions) return privateRoutes;

    return privateRoutes
      .map((route) => {
        if (route?.children?.length) {
          const children = route.children
            .map((child) => {
              if (!child.permission) {
                return child;
              }

              if (permissions.includes(child.permission)) {
                return child;
              }
            })
            .filter(Boolean);

          return {
            ...route,
            children,
          };
        }

        if (!route.permission) {
          return route;
        }

        if (permissions.includes(route.permission)) {
          return route;
        }
      })
      .filter(Boolean);
  }, [permissions]);

  console.log(privateRoutesPermitted);

  useEffect(() => {
    ReactGA.send({
      hitType: "pageview",
      page: window.location.pathname + window.location.search,
      title: window.location.pathname.replace("/", "-"),
    });
  }, []);

  return (
    <BrowserRouter>
      <Routes>
        {publicRoutes.map((route) => (
          <Route key={route.path} path={route.path} element={route.element} />
        ))}
        {privateRoutesPermitted.map((route) => (
          <Route
            key={route?.path}
            path={route?.path}
            element={<RequireAuth>{route?.element}</RequireAuth>}
          >
            {route?.children?.map((child) => (
              <Route
                key={`${route?.path}-${child?.path}`}
                path={child?.path}
                element={<RequireAuth>{child?.element}</RequireAuth>}
                index={child?.index}
              />
            ))}
          </Route>
        ))}
      </Routes>
    </BrowserRouter>
  );
}

export default App;
