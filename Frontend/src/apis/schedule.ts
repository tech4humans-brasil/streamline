import IPagination from "@interfaces/Pagination";
import Response from "@interfaces/Response";
import { ISchedule } from "@interfaces/Schedule";
import api from "@services/api";

type Schedule = ISchedule;
type ReqSchedules = Response<
  {
    schedules: Pick<Schedule, "_id" | "name" | "expression" | "active">[];
  } & IPagination
>;
type ReqSchedule = Response<Schedule>;

export const getSchedules = async ({
  queryKey: [, query],
}: {
  queryKey: string[];
}) => {
  const res = await api.get<ReqSchedules>(`/schedules?${query}`);

  return res.data.data;
};

export const getSchedule = async ({
  queryKey: [, id],
}: {
  queryKey: string[];
}) => {
  const res = await api.get<ReqSchedule>(`/schedules/${id}`);

  return {
    ...res.data.data,
    start: new Date(res.data.data.start),
    end: res.data.data.end ? new Date(res.data.data.end) : null,
  };
};

export const createSchedule = async (
  data: Omit<Schedule, "_id" | "scheduled">
) => {
  const res = await api.post<ReqSchedule>("/schedules", data);

  return res.data.data;
};

export const updateSchedule = async (data: Omit<Schedule, "scheduled">) => {
  const res = await api.put<ReqSchedule>(`/schedules/${data._id}`, data);

  return res.data.data;
};

export const createOrUpdateSchedule = async (
  data: Omit<Schedule, "_id" | "scheduled"> & { _id?: string }
) => {
  data.end = data.end ? new Date(data.end) : null;
  if (data?._id) {
    return updateSchedule(data as Schedule);
  }

  return createSchedule(data);
};

type ReqScheduleForms = Response<{
  forms: { label: string; value: string }[];
  workflows: { label: string; value: string }[];
  projects: { label: string; value: string }[];
}>;
export const getScheduleForms = async ({
  queryKey: [, , id],
}: {
  queryKey: string[];
}) => {
  const res = await api.get<ReqScheduleForms>(`/schedules/forms`, {
    params: { project: id },
  });

  return res.data.data;
};
