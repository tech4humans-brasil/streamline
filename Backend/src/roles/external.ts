import { IUserRoles } from "../models/client/User";
import { Role } from ".";

export const ExternalRole: Role = {
  name: IUserRoles.external,
  permissions: [
    {
      name: "dashboard",
      permissions: ["view"],
    },
    {
      name: "activity",
      permissions: [
        "view",
        "create",
        "update",
        "read",
      ],
    },
    {
      name: "response",
      permissions: ["create", "read", "update", "delete"],
    },
    {
      name: "answer",
      permissions: ["view", "create", "read"],
    },
    {
      name: "comment",
      permissions: ["view", "create", "read", "update", "delete"],
    },
  ],
};
