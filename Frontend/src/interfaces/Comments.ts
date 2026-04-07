import IUser from "./User";

export type IComment = {
  _id: string;
  activity: string;
  user: Pick<IUser, "_id" | "name" | "email">;
  content: string;
  viewed: string[];
  isEdited: boolean;
  isSystem?: boolean;
  createdAt: string;
  updatedAt: string;
};

export default IComment;
