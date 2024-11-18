import { IUserRoles } from "../models/client/User";
import { Role } from "./";

export const AdminRole: Role = {
  name: IUserRoles.admin,
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
        "delete",
        "board-definition",
        "committed",
        "accept",
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
    {
      name: "user",
      permissions: ["view", "read", "create", "update", "delete"],
    },
    {
      name: "workflow",
      permissions: ["view", "read", "create", "update", "delete", "script"],
    },
    {
      name: "workflowDraft",
      permissions: ["view", "read", "create", "publish", "delete"],
    },
    {
      name: "email",
      permissions: ["view", "read", "create", "update", "delete"],
    },
    {
      name: "status",
      permissions: ["view", "read", "create", "update", "delete"],
    },
    {
      name: "form",
      permissions: ["view", "read", "create", "update", "delete"],
    },
    {
      name: "formDraft",
      permissions: ["view", "read", "create", "publish", "delete"],
    },
    {
      name: "institute",
      permissions: ["view", "read", "create", "update", "delete"],
    },
    {
      name: "project",
      permissions: ["view", "read", "create", "update", "delete"],
    },
    {
      name: "schedule",
      permissions: ["view", "read", "create", "update", "delete"],
    },
  ],
};
