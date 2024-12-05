import IPagination from "@interfaces/Pagination";
import Response from "@interfaces/Response";
import api from "@services/api";
import { IEquipment } from "@interfaces/Equipment";

type Equipment = Pick<
  IEquipment,
  | "_id"
  | "brandName"
  | "equipmentType"
  | "inventoryNumber"
  | "situation"
  | "status"
  | "allocations"
>;

type ReqEquipments = Response<
  {
    equipments: Equipment[];
  } & IPagination
>;

type reqEquipment = Response<IEquipment>;

export const getEquipments = async ({
  queryKey: [, query],
}: {
  queryKey: string[];
}) => {
  const res = await api.get<ReqEquipments>(`/equipments?${query}`);

  return res.data.data;
};

export const getEquipment = async ({
  queryKey: [, id],
}: {
  queryKey: string[];
}) => {
  const res = await api.get<reqEquipment>(`/equipments/${id}`);

  return res.data.data;
};

export const createEquipment = async (
  data: Omit<IEquipment, "_id" | "allocations">
) => {
  const res = await api.post<reqEquipment>("/equipments", data);

  return res.data.data;
};

export const updateEquipment = async (
  id: string,
  data: Omit<IEquipment, "_id" | "allocations">
) => {
  const res = await api.put<reqEquipment>(`/equipment/${id}`, data);

  return res.data.data;
};

export const createOrUpdateEquipment = async (
  data: Omit<IEquipment, "_id" | "allocations"> & { _id?: string }
) => {
  if (data._id) {
    return updateEquipment(data._id, data);
  }

  return createEquipment(data);
};

export const equipmentsForms = async () => {
  const res = await api.get<
    Response<{
      types: string[];
      brandNames: string[];
      status: string[];
      situation: string[];
    }>
  >("/equipment/forms");

  return res.data.data;
};

export const getAvailableEquipments = async () => {
  const response = await api.get<ReqEquipments>("/equipments", {
    params: { status: "available", limit: 10000 },
  });
  return response.data.data;
};
