export enum ProjectRole {
  VIEW = "view",
  UPDATE = "update",
  DELETE = "delete",
}

export interface IProject {
  _id: string;
  name: string;
  description: string;
  permissions: {
    type: "user" | "institute";
    user: string | null;
    institute: string | null;
    role: Array<ProjectRole>;
    isOwner: boolean;
  }[];
  forms: string[];
  workflows: string[];
  status: string;
}

export interface IVariable {
  name: string;
  value: string;
  type: "variable" | "secret";
}
