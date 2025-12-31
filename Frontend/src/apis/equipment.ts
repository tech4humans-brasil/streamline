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
  | "legacyInventoryNumber"
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

type EquipmentInput = Omit<
  IEquipment,
  "_id" | "allocations" | "inventoryNumber" | "legacyInventoryNumber"
>;

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
  data: EquipmentInput
) => {
  const res = await api.post<reqEquipment>("/equipments", data);

  return res.data.data;
};

export const updateEquipment = async (
  id: string,
  data: EquipmentInput
) => {
  const res = await api.put<reqEquipment>(`/equipment/${id}`, data);

  return res.data.data;
};

export const createOrUpdateEquipment = async (
  data: EquipmentInput & { _id?: string }
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
