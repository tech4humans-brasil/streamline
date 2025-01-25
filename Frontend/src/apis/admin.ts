import api from "@services/api";
import Response from "@interfaces/Response";
import { IAdmin } from "@interfaces/admin";

type TemplateResponse = Response<IAdmin>;

export const showAdmin = async () => {
  const response = await api.get<TemplateResponse>("/instance");
  return response.data?.data;
};

export const updateAdmin = async (data: IAdmin) => {
  const response = await api.put<TemplateResponse>("/instance", data);
  return response.data?.data;
};

export const getConfigs = async () => {
  const response = await api.get<TemplateResponse>("/config");
  return response.data?.data;
};
