import Response from "@interfaces/Response";
import IUser from "@interfaces/User";
import api from "@services/api";

type ReqUsers = Response<Omit<IUser, "password">[]>;

export const getUsersByRole = async () => {
  const res = await api.get<ReqUsers>(`/field/users`);

  return res.data.data;
};
