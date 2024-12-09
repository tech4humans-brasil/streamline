import apiClient from "@services/api";
import Response from "@interfaces/Response";
import IUser, { UserEquipmentAllocation } from "@interfaces/User";
import { IEquipment, IReturn } from "@interfaces/Equipment";

type Allocation = UserEquipmentAllocation;
type ReqAllocations = Response<
  Pick<IUser, "_id" | "name" | "email"> & {
    allocations: Array<
      Omit<UserEquipmentAllocation, "equipment"> & { equipment: IEquipment }
    >;
  }
>;
type ReqAllocation = Response<Allocation>;

export const getAllocations = async ({
  queryKey: [, userId],
}: {
  queryKey: string[];
}) => {
  const response = await apiClient.get<ReqAllocations>(
    `user/${userId}/allocation`
  );
  return response.data.data;
};

export const getAllocation = async ({
  queryKey: [, userId, id],
}: {
  queryKey: string[];
}) => {
  const response = await apiClient.get<ReqAllocation>(
    `/user/${userId}/allocation/${id}`
  );

  return response.data.data;
};

export const createAllocation = async (
  userId: string,
  data: Omit<Allocation, "_id">
) => {
  const res = await apiClient.post(`user/${userId}/allocation`, data);
  return res.data;
};

export const updateAllocation = async ({
  userId,
  id,
  data,
}: {
  userId: string;
  id: string;
  data: Omit<IReturn, "createdBy">;
}) => {
  const res = await apiClient.put(`user/${userId}/allocation/${id}`, data);
  return res.data;
};

export const deallocate = async (id: string) => {
  const response = await apiClient.post(`/allocation/${id}/deallocate`, {});
  return response.data;
};

export const getUserAllocations = async (userId: string) => {
  const response = await apiClient.get("/allocations", {
    params: { user: userId },
  });
  return response.data.allocations;
};

export const createOrUpdateAllocation = async (
  data: Omit<Allocation, "_id"> & { userId: string }
) => {
  data.startDate = data.startDate ? new Date(data.startDate) : null;
  data.endDate = data.endDate ? new Date(data.endDate) : null;

  return createAllocation(data.userId, data);
};
