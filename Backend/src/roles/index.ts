import { AdminRole } from "./admin";
import { ExternalRole } from "./external";
import { StudentRole } from "./student";
import { EquipmentRole } from "./equipment";

export type IPermission<T> = {
  name: string;
  permissions: Array<T>;
};

export type Role = {
  name: string;
  permissions: Array<IPermission<string>>;
};

export const roles = [AdminRole, ExternalRole, StudentRole, EquipmentRole];
