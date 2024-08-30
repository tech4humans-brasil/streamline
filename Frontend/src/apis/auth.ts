import api from "@services/api";
import Response from "@interfaces/Response";

type LoginResponse = Response<{ token: string }>;

export const login = async (data: {
  email: string;
  password: string;
  acronym: string;
}): Promise<LoginResponse> => {
  const response = await api.post<LoginResponse>("/auth/login", data);
  return response.data;
};

export const samlGoogle = async (data: {
  credential: string;
  client_id: string;
}): Promise<LoginResponse> => {
  const response = await api.post<LoginResponse>("/auth/google", data);
  return response.data;
};

export const forgotPassword = async (data: {
  email: string;
  acronym: string;
}): Promise<Response<unknown>> => {
  const response = await api.post<Response<unknown>>(
    "/auth/forgot-password",
    data
  );
  return response.data;
};

export const alterPassword = async (data: {
  password: string;
  confirmPassword: string;
  token: string;
}): Promise<Response<unknown>> => {
  const response = await api.post<Response<unknown>>(
    "/auth/alter-password",
    data,
    {
      headers: {
        Authorization: `Bearer ${data.token}`,
      },
    }
  );
  return response.data;
};
