import IPagination from "@interfaces/Pagination";
import Response from "@interfaces/Response";
import IStatus from "@interfaces/Status";
import api from "@services/api";

type Status = Pick<IStatus, "_id" | "name" | "type" | "order">;
type ReqStatuses = Response<{ statuses: Status[] } & IPagination>;
type ReqStatus = Response<Status>;

export const getStatuses = async ({
  queryKey: [, query],
}: {
  queryKey: string[];
}) => {
  const res = await api.get<ReqStatuses>(`/statuses?${query}`);	

  return res.data.data;
};

export const getStatus = async ({
  queryKey: [, id],
}: {
  queryKey: string[];
}) => {
  const res = await api.get<ReqStatus>(`/status/${id}`);

  return res.data.data;
};

export const createStatus = async (data: Omit<Status, "_id">) => {
  const res = await api.post<ReqStatus>("/status", data);

  return res.data.data;
};

export const updateStatus = async (data: Status) => {
  const res = await api.put<ReqStatus>(`/status/${data._id}`, data);

  return res.data.data;
};

export const createOrUpdateStatus = async (
  data: Omit<Status, "_id"> & { _id?: string },
) => {
  if (data?._id) {
    return updateStatus(data as Status);
  }

  return createStatus(data);
};
