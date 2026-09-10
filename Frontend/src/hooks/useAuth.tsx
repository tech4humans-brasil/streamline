import React from "react";
import { AuthContext } from "@contexts/AuthContext";
import JwtData from "@interfaces/JwtData";

export default function useAuth(): [
  JwtData | null,
  (token: string | null) => JwtData | undefined,
  (accessToken: string) => Promise<JwtData | undefined>,
] {
  const context = React.useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within a AuthProvider");
  }
  return [context.token, context.setToken, context.setSession];
}
