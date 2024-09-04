import IPagination from "@interfaces/Pagination";
import { IProject } from "@interfaces/Project";
import Response from "@interfaces/Response";
import api from "@services/api";

type Project = Pick<IProject, "_id" | "name" | "description" | "permissions">;
type ReqProjects = Response<{ projects: Project[] } & IPagination>;
type ReqProject = Response<IProject>;

export const getProjects = async ({
  queryKey: [, query],
}: {
  queryKey: string[];
}) => {
  const res = await api.get<ReqProjects>(`/projects?${query}`);

  return res.data.data;
};

export const getProject = async ({
  queryKey: [, id],
}: {
  queryKey: string[];
}) => {
  const res = await api.get<ReqProject>(`/projects/${id}`);

  return res.data.data;
};

export const createProject = async (
  data: Omit<Project, "_id" | "permissions">
) => {
  const res = await api.post<ReqProject>("/projects", data);

  return res.data.data;
};

export const updateProject = async (data: Project) => {
  const res = await api.put<ReqProject>(`/projects/${data._id}`, data);

  return res.data.data;
};

export const createOrUpdateProject = async (
  data: Omit<Project, "_id" | "permissions"> & { _id?: string }
) => {
  if (data?._id) {
    return updateProject(data as Project);
  }

  return createProject(data);
};

export const updatePermission = async (data: {
  _id: string;
  permissions: {
    _id: string;
    type: "user" | "institute";
    role: Array<"view" | "update" | "delete">;
    isOwner?: boolean;
  }[];
}) => {
  const res = await api.put<ReqProject>(
    `/projects/${data._id}/permissions`,
    data
  );

  return res.data.data;
};

export const getProjectForms = async () => {
  const res = await api.get<
    Response<
      {
        label: string;
        options: { value: string; label: string; type: "user" | "institute" }[];
      }[]
    >
  >(`/project/forms`);

  return res.data.data;
};
