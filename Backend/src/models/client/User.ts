import mongoose, { ObjectId, Schema } from "mongoose";
import { IInstitute } from "./Institute";

export enum IUserRoles {
  admin = "admin",
  student = "student",
  external = "external",
  equipment = "equipment",
}

export enum IUserProviders {
  self = "self",
  google = "google",
}

export interface UserEquipmentAllocation {
  _id: ObjectId;
  equipment: string | ObjectId;
  endDate: Date | null;
  startDate: Date;
}

export type IUser = {
  _id: ObjectId;
  name: string;
  email: string;
  password: string;
  matriculation?: string;
  roles: IUserRoles[];
  allocations: mongoose.Types.DocumentArray<UserEquipmentAllocation>;
  institutes: mongoose.Types.DocumentArray<IInstitute>;
  active: boolean;
  providers: IUserProviders[];
  isExternal: boolean;
  tutorials: string[];
  last_login: Date | null;
  twoStepVerification: {
    code: string | null;
    expiration: Date | null;
  };
} & mongoose.Document;

const userEquipmentAllocationSchema = new Schema<UserEquipmentAllocation>({
  _id: { type: Schema.Types.ObjectId, auto: true },
  equipment: { type: Schema.Types.ObjectId, ref: "Equipment", required: true },
  startDate: { type: Date, required: true, default: Date.now },
  endDate: { type: Date, default: null },
})
  .index(
    { equipment: 1, endDate: 1 },
    {
      unique: true,
      partialFilterExpression: {
        endDate: null,
      },
    }
  )
  .index({ equipment: 1 });

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
    allocations: { type: [userEquipmentAllocationSchema], default: [] },
    matriculation: {
      type: String,
    },
    roles: [
      {
        type: String,
        required: true,
        enum: Object.values(IUserRoles),
        index: true,
      },
    ],
    institutes: [
      {
        type: instituteSchema,
        required: true,
      },
    ],
    providers: [
      {
        type: String,
        required: true,
        enum: Object.values(IUserProviders),
        default: IUserProviders.self,
      },
    ],
    tutorials: [{ type: String }],
    last_login: { type: Date, default: null },
    twoStepVerification: {
      code: { type: String, default: null },
      expiration: { type: Date, default: null },
    },
  },
  {
    timestamps: true,
  }
).pre<IUser>("save", function (next) {
  if (!this.isNew) {
    return next();
  }
  const year = new Date().getFullYear();
  const timestamp = new Date().getTime().toString().slice(-5);
  this.matriculation = `${year}${timestamp}`;
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
