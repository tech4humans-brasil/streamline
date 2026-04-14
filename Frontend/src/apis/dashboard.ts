import IPagination from "@interfaces/Pagination";
import Response from "@interfaces/Response";
import IActivity, { IActivityStepStatus } from "@interfaces/Activitiy";
import api from "@services/api";
import IForm from "@interfaces/Form";
import IStatus from "@interfaces/Status";

type Activity = Pick<
  IActivity,
  | "_id"
  | "name"
  | "description"
  | "createdAt"
  | "updatedAt"
  | "protocol"
  | "state"
  | "form_draft"
  | "finished_at"
  | "status"
> & {
  users: {
    _id: string;
    name: string;
    matriculation: string;
  }[];
  assignee?: IActivity["assignee"];
  form: {
    name: string;
    slug: string;
  };
};

type ReqMyActivities = Response<{
  activities: Activity[];
} & IPagination>;


export const getMyActivities = async ({
  queryKey: [, params],
}: {
  queryKey: string[];
}) => {
  const res = await api.get<ReqMyActivities>(`/dashboard/my-activities?${params}`);

  return res.data.data;
};

interface IOpenForm {
  institute: {
    _id: string;
    name: string;
    acronym: string;
  } | null;
  forms: Pick<
    IForm,
    | "_id"
    | "name"
    | "slug"
    | "description"
    | "period"
    | "published"
    | "categories"
    | "visibilities"
    | "url"
    | "type"
    | "sla"
  >[];
}

export const getOpenForms = async ({
  queryKey: [, page = "1", limit = "10"],
}: {
  queryKey: string[];
}) => {
  const res = await api.get<Response<IOpenForm[]>>("/dashboard/open-forms", {
    params: { page, limit },
  });

  return res.data.data;
};

export const getApprovedActivities = async ({
  queryKey: [, page = "1", limit = "10"],
}: {
  queryKey: string[];
}) => {
  const res = await api.get<ReqMyActivities>("/dashboard/approved-activities", {
    params: { page, limit },
  });

  return res.data.data;
};

export const getMyActivitiesPendingAcceptance = async ({
  queryKey: [, page = "1", limit = "10"],
}: {
  queryKey: string[];
}) => {
  const res = await api.get<ReqMyActivities>(
    "/dashboard/my-pending-activities",
    {
      params: { page, limit },
    }
  );

  return res.data.data;
};

type DashboardPendingInteractionItem = Pick<
  IActivity,
  "_id" | "name" | "description" | "protocol" | "users" | "due_date" | "updatedAt"
> & {
  assignee?: IActivity["assignee"];
  form?: Pick<IForm, "_id" | "name" | "description" | "slug" | "period" | "project">;
  answerStatus: IActivityStepStatus;
  ticketStatus: IStatus;
};

type ReqMyActivitiesPendingInteractions = Response<DashboardPendingInteractionItem[]>;

type DashboardPendingEvaluationItem = Pick<
  IActivity,
  "_id" | "name" | "description" | "protocol" | "users" | "due_date" | "status" | "updatedAt"
> & {
  form: Pick<IForm, "_id" | "name" | "description" | "slug" | "period">;
  status: "idle" | "pending" | "approved" | "rejected";
};

type ReqMyActivitiesPendingEvaluations = Response<DashboardPendingEvaluationItem[]>;

export const getMyActivitiesPendingInteractions = async ({
  queryKey: [, page = "1", limit = "10"],
}: {
  queryKey: string[];
}) => {
  const res = await api.get<ReqMyActivitiesPendingInteractions>(
    "/dashboard/my-pending-interactions",
    {
      params: { page, limit },
    }
  );

  return res.data.data;
};

export const getMyActivitiesPendingEvaluations = async ({
  queryKey: [, page = "1", limit = "10"],
}: {
  queryKey: string[];
}) => {
  const res = await api.get<ReqMyActivitiesPendingEvaluations>(
    "/dashboard/my-pending-evaluations",
    {
      params: { page, limit },
    }
  );

  return res.data.data;
};

export const getMyActivitiesTracking = async ({
  queryKey: [, page = "1", limit = "10"],
}: {
  queryKey: string[];
}) => {
  const res = await api.get<ReqMyActivities>(
    "/dashboard/my-activity-tracking",
    {
      params: { page, limit },
    }
  );

  return res.data.data;
};
