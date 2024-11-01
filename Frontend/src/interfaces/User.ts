import IInstitute from "./Institute";

export enum IUserRoles {
  admin = "admin",
  student = "student",
  teacher = "teacher",
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
};

export default IUser;
