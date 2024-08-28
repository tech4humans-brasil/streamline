import mongoose, { ObjectId, Schema } from "mongoose";
import { IInstitute } from "./Institute";

export enum IUserRoles {
  admin = "admin",
  student = "student",
  teacher = "teacher",
}

export type IUser = {
  _id: ObjectId;
  name: string;
  email: string;
  password: string;
  matriculation?: string;
  activities: ObjectId[];
  roles: IUserRoles[];
  institute: IInstitute;
  active: boolean;
  isExternal: boolean;
  tutorials: string[];
} & mongoose.Document;

export const instituteSchema = new Schema<IInstitute>({
  name: { type: String, required: true },
  acronym: { type: String, required: true },
  active: { type: Boolean, default: true },
});

export const schema: Schema = new Schema<IUser>(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, index: true },
    password: { type: String, required: true },
    active: { type: Boolean, default: true, index: true },
    isExternal: { type: Boolean, default: false, index: true },
    matriculation: {
      type: String,
    },
    activities: [{ type: Schema.Types.ObjectId, ref: "Activity" }],
    roles: [
      {
        type: String,
        required: true,
        enum: Object.values(IUserRoles),
        index: true,
      },
    ],
    institute: {
      type: Object,
      required: true,
    },
    tutorials: [{ type: String }],
  },
  {
    timestamps: true,
  }
).pre("save", function (next) {
  if (this.isExternal) {
    this.matriculation = null;
  }

  next();
});

export default class User {
  conn: mongoose.Connection;

  constructor(conn: mongoose.Connection) {
    this.conn = conn;
  }

  model() {
    return this.conn.model<IUser>("User", schema);
  }
}
