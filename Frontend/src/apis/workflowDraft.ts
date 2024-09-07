import IPagination from "@interfaces/Pagination";
import Response from "@interfaces/Response";
import IWorkflowDraft from "@interfaces/WorkflowDraft";
import api from "@services/api";
import { ReactFlowJsonObject } from "reactflow";

export type ReqWorkflow = Response<
  ReactFlowJsonObject & Omit<IWorkflowDraft, "steps">
>;

type ReqWorkflows = Response<
  {
    workflows: Pick<
      IWorkflowDraft,
      "status" | "_id" | "version" | "owner" | "createdAt"
    >[];
  } & IPagination
>;

export const getWorkflowDrafts = async ({
  queryKey: [, workflow_id],
}: {
  queryKey: string[];
}) => {
  const res = await api.get<ReqWorkflows>(`/workflow-drafts/${workflow_id}`);

  return res.data.data;
};

export const getWorkflowDraft = async ({
  queryKey: [, id],
}: {
  queryKey: string[];
}) => {
  const res = await api.get<ReqWorkflow>(`/workflow-draft/${id}`);

  return res.data.data;
};

export const createWorkflow = async (
  data: Pick<IWorkflowDraft, "steps" | "viewport" | "parent">
) => {
  const res = await api.post<ReqWorkflow>(
    `/workflow-draft/${data.parent}`,
    data
  );

  return res.data.data;
};

export const publishUnpublish = async (
  data: Pick<IWorkflowDraft, "_id" | "status">
) => {
  const res = await api.patch<ReqWorkflow>(`/workflow-draft/${data._id}`, data);

  return res.data.data;
};

export const createOrUpdateWorkflow = async (
  data: Pick<IWorkflowDraft, "steps" | "viewport" | "parent">
) => {
  return createWorkflow(data);
};

type ReqWorkflowForms = Response<{
  statuses: { label: string; options: { label: string; value: string }[] }[];
  emails: { label: string; value: string }[];
  users: { label: string; value: string }[];
  workflows: { label: string; value: string }[];
  forms: {
    interaction: { label: string; value: string }[];
    created: { label: string; value: string }[];
  };
}>;

export const getWorkflowDraftForms = async ({
  queryKey: [, , id],
}: {
  queryKey: string[];
}) => {
  const res = await api.get<ReqWorkflowForms>("/workflows-draft/forms", {
    params: {
      workflow: id,
    },
  });

  return res.data.data;
};
