import { NotFoundPage } from "@pages/NotFound";
import { RouteType } from ".";

import Login from "@pages/Auth/Login";
import Register from "@pages/Auth/Register";
import ForgotPassword from "@pages/Auth/ForgotPassword";
import AlterPassword from "@pages/Auth/AlterPassword";
import TwoStep from "@pages/Auth/TwoStep";

const routes: RouteType = [
  {
    path: "/",
    element: <Login />,
  },
  {
    path: "/auth/register",
    element: <Register />,
  },
  {
    path: "/auth/forgot-password",
    element: <ForgotPassword />,
  },
  {
    path: "/auth/two-step",
    element: <TwoStep />,
  },
  {
    path: "/auth/alter-password/:token",
    element: <AlterPassword />,
  },
  {
    path: "*",
    element: <NotFoundPage />,
  },
];

export default routes;
