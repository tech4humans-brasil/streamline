import Response from "@interfaces/Response";
import IActivity from "@interfaces/Activitiy";
import api from "@services/api";
import IUser from "@interfaces/User";
import IPagination from "@interfaces/Pagination";

type ReqActivity = Response<IActivity>;

type ReqActivities = Response<
  {
    activities: Pick<
      IActivity,
      "_id" | "name" | "status" | "users" | "protocol" | "finished_at"
    >[];
  } & IPagination
>;

export const getActivities = async ({
  queryKey: [, query],
}: {
  queryKey: string[];
}) => {
  const res = await api.get<ReqActivities>(`/activities?${query}`);

  return res.data.data;
};

export const getActivity = async ({
  queryKey: [, id],
}: {
  queryKey: string[];
}) => {
  const res = await api.get<Response<IActivity>>(`/activity/${id}`);

  return res.data.data;
};

type ReqFormForms = Response<{
  teachers: Pick<IUser, "_id" | "name" | "email" | "matriculation">[];
  students: { label: string; value: string }[];
}>;
export const getActivityForms = async () => {
  const res = await api.get<ReqFormForms>("/activity/forms");

  return res.data.data;
};

export const committedActivity = async (data: {
  users: [string, ...string[]];
  _id: string;
  name: string;
  description: string;
}) => {
  const res = await api.put<ReqActivity>(
    `/activity-committed/${data._id}`,
    data
  );

  return res.data.data;
};

export const setUserEvaluations = async ({
  activity,
  evaluation,
  data,
}: {
  activity: string;
  evaluation: string;
  data: {
    users: Pick<IUser, "name" | "email">[];
  };
}) => {
  const res = await api.put<ReqActivity>(
    `/activity/${activity}/board-definition/${evaluation}`,
    data
  );

  return res.data.data;
};

export const acceptActivity = async (data: {
  _id: string;
  accepted: "accepted" | "rejected";
}) => {
  const res = await api.put<ReqActivity>(`/activity-accept/${data._id}`, data);

  return res.data.data;
};

export const exportActivity = async (id: string) => {
  const res = await api.get<Response<{ url: string }>>(
    `/activity/${id}/export`
  );

  return res.data.data;
};
