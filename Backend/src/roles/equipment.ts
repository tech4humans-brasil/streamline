import { IUserRoles } from "../models/client/User";
import { Role } from ".";

export const EquipmentRole: Role = {
  name: IUserRoles.equipment,
  permissions: [
    {
      name: "equipment",
      permissions: ["view", "read", "create", "update"],
    },
    {
      name: "allocation",
      permissions: ["view", "read", "create", "update", "delete"],
    },
  ],
};
