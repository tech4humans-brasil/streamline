import { IUserRoles } from "../models/client/User";
import { Role } from "./";

export const StudentRole: Role = {
  name: IUserRoles.student,
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
      permissions: ["read"],
    },
    {
      name: "workflow",
      permissions: ["read", "create", "update"],
    },
    {
      name: "workflowDraft",
      permissions: ["view","read", "create", "publish", "delete"],
    },
    {
      name: "email",
      permissions: ["read", "create", "update", "delete"],
    },
    {
      name: "status",
      permissions: ["read", "create", "update", "delete"],
    },
    {
      name: "form",
      permissions: ["read", "create", "update", "delete"],
    },
    {
      name: "formDraft",
      permissions: ["view", "read", "create", "publish", "delete"],
    },
    {
      name: "institute",
      permissions: ["read", "create", "update", "delete"],
    },
    {
      name: "project",
      permissions: ["view", "read", "create", "update", "delete"],
    },
    {
      name: "schedule",
      permissions: ["read", "create", "update", "delete"],
    },
  ],
};
