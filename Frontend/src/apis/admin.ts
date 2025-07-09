import api from "@services/api";
import Response from "@interfaces/Response";
import { IAdmin } from "@interfaces/Admin";

type TemplateResponse = Response<IAdmin>;

type ConfigResponse = Response<IAdmin & { slugs: string[] }>;

export const showAdmin = async () => {
  const response = await api.get<TemplateResponse>("/instance");
  return response.data?.data;
};

export const updateAdmin = async (data: IAdmin) => {
  const response = await api.put<TemplateResponse>("/instance", data);
  return response.data?.data;
};

export const getConfigs = async ({
  queryKey: [, acronym],
}: {
  queryKey: ["config", string];
}) => {
  const response = await api.get<ConfigResponse>("/config", {
    params: {
      slug: acronym,
    },
  });
  return response.data?.data;
};
