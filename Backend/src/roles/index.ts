import { AdminRole } from "./admin";
import { TeacherRole } from "./teacher";
import { StudentRole } from "./student";

export type IPermission<T> = {
  name: string;
  permissions: Array<T>;
};

export type Role = {
  name: string;
  permissions: Array<IPermission<string>>;
};

export const roles = [AdminRole, TeacherRole, StudentRole];
