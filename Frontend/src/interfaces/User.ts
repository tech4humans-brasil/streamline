import IInstitute from "./Institute";

export enum IUserRoles {
  admin = "admin",
  student = "student",
  equipment = "equipment",
}

export interface UserEquipmentAllocation {
  _id: string;
  equipment: string;
  endDate?: Date | null | string;
  startDate?: Date | null | string;
}

type IUser = {
  _id: string;
  name: string;
  email: string;
  isExternal: boolean;
  password: string;
  matriculation?: string;
  institutes: Array<IInstitute>;
  active: boolean;
  roles: IUserRoles[];
  allocations: UserEquipmentAllocation[];
};

export default IUser;
