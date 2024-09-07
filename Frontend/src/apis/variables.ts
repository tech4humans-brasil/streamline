import { IVariable } from "@interfaces/Project";
import Response from "@interfaces/Response";
import api from "@services/api";

type ReqProjects = Response<{ variables: IVariable[] }>;
type ReqProject = Response<IVariable>;

export const getVariables = async ({
  queryKey: [, id],
}: {
  queryKey: string[];
}) => {
  const res = await api.get<ReqProjects>(`/projects/${id}/variables`);

  return res.data.data;
};
export const updateVariable = async (
  id: string,
  data: { variables: (Omit<IVariable, "value"> & { value: string | null })[] }
) => {
  const res = await api.put<ReqProject>(`/projects/${id}/variables`, data);

  return res.data.data;
};

export const deleteVariable = async (id: string, name: string) => {
  const res = await api.delete(`/projects/${id}/variables/${name}`);

  return res.data;
};

export const createOrUpdateVariable = async (data: {
  project_id: string;
  variables: (Omit<IVariable, "value" | "_id"> & { value: string | null })[];
}) => {
  return updateVariable(data?.project_id, data);
};
