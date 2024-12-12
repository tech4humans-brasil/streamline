import { IUserRoles } from "./User";

export default interface JwtData {
  id: string;
  name: string;
  matriculation: string;
  email: string;
  roles: IUserRoles[];
  slug: string;
  client: string;
  permissions: string[];
  tutorials: string[];
}
