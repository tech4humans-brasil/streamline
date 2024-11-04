import IPagination from "@interfaces/Pagination";
import Response from "@interfaces/Response";
import IUser from "@interfaces/User";
import api from "@services/api";
import IInstitute from "@interfaces/Institute";

type User = Pick<
  IUser,
  | "_id"
  | "name"
  | "email"
  | "password"
  | "matriculation"
  | "institutes"
  | "roles"
  | "active"
  | "isExternal"
>;
type ReqUsers = Response<
  {
    users: (Omit<User, "institute"> & {
      institute: Pick<IInstitute, "_id" | "acronym">;
    })[];
  } & IPagination
>;
type ReqUser = Response<User>;

export const getUsers = async ({
  queryKey: [, query],
}: {
  queryKey: string[];
}) => {
  const res = await api.get<ReqUsers>(`/users?${query}`);

  return res.data.data;
};

export const getUser = async ({ queryKey: [, id] }: { queryKey: string[] }) => {
  const res = await api.get<ReqUser>(`/user/${id}`);

  return res.data.data;
};

export const createUser = async (
  data: Omit<User, "_id" | "password" | "institutes">
) => {
  const res = await api.post<ReqUser>("/user", data);

  return res.data.data;
};

export const updateUser = async (data: User) => {
  const res = await api.put<ReqUser>(`/user/${data._id}`, data);

  return res.data.data;
};

export const createOrUpdateUser = async (
  data: Omit<User, "_id" | "password" | "institutes"> & {
    _id?: string;
    password?: string;
    institutes: string[] | IInstitute[];
  }
) => {
  if (data?._id) {
    return updateUser(data as User);
  }

  return createUser(data);
};

type ReqUserForms = Response<{
  institutes: { label: string; options: { label: string; value: string }[] }[];
  roles: { label: string; value: string }[];
}>;
export const getUserForms = async () => {
  const res = await api.get<ReqUserForms>("/user/forms");

  return res.data.data;
};

type ReqTutorials = Response<{ tutorials: string[] }>;
export const updateTutorials = async (id: string, tutorial: string) => {
  const res = await api.get<ReqTutorials>(`/user/${id}/tutorial`, {
    params: { tutorial },
  });

  return res.data.data;
};
