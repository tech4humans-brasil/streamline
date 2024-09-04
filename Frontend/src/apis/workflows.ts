import IPagination from "@interfaces/Pagination";
import Response from "@interfaces/Response";
import IWorkflow from "@interfaces/Workflow";
import api from "@services/api";

export type ReqWorkflow = Response<IWorkflow>;

type ReqWorkflows = Response<
  {
    workflows: Pick<IWorkflow, "name" | "active" | "_id">[];
  } & IPagination
>;

export const getWorkflows = async ({
  queryKey: [, query],
}: {
  queryKey: string[];
}) => {
  const res = await api.get<ReqWorkflows>(`/workflows?${query}`);

  return res.data.data;
};

export const getWorkflow = async ({
  queryKey: [, id],
}: {
  queryKey: string[];
}) => {
  const res = await api.get<ReqWorkflow>(`/workflow/${id}`);

  return res.data.data;
};

export const createWorkflow = async (
  data: Pick<IWorkflow, "name" | "active">
) => {
  const res = await api.post<ReqWorkflow>("/workflow", data);

  return res.data.data;
};

export const updateWorkflow = async (data: IWorkflow) => {
  const res = await api.put<ReqWorkflow>(`/workflow/${data._id}`, data);

  return res.data.data;
};

export const createOrUpdateWorkflow = async (
  data: Pick<IWorkflow, "name" | "active"> & { _id?: string }
) => {
  if (data?._id) {
    return updateWorkflow(data as IWorkflow);
  }

  return createWorkflow(data);
};
