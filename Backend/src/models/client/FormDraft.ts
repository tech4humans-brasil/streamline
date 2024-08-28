import mongoose, { ObjectId, Schema } from "mongoose";
import { IUser } from "./User";
import { FileUploaded } from "../../services/upload";

export enum FieldTypes {
  Text = "text",
  Number = "number",
  Email = "email",
  Password = "password",
  Textarea = "textarea",
  Radio = "radio",
  Select = "select",
  MultiSelect = "multiselect",
  Checkbox = "checkbox",
  Date = "date",
  File = "file",
  Evaluated = "evaluated",
  Teacher = "teacher",
}

export enum IFormStatus {
  Draft = "draft",
  Published = "published",
}

type UserMap = Pick<IUser, "_id" | "name" | "matriculation" | "email">;
export type IValue =
  | string
  | number
  | boolean
  | Array<string>
  | UserMap
  | UserMap[]
  | FileUploaded;

export type IField = {
  id: string;
  type: FieldTypes;
  required?: boolean;
  visible: boolean;
  system?: boolean;
  multi?: boolean;
  created?: string;
  value: any;
  options?:
    | { label: string; value: string }[]
    | { label: string; options: { label: string; value: string }[] }[];
  validation?: { min?: number; max?: number; pattern?: string };
  describe?: string;
  weight?: number;
  label?: string;
  placeholder?: string;
  create: boolean;
};

export type IFormDraft = {
  _id: string | ObjectId;
  status: IFormStatus;
  parent: ObjectId | string;
  owner: ObjectId | string;
  fields: IField[];
  version: number;
  createdAt: string;
  updatedAt: string;
} & mongoose.Document;

export const schema = new Schema<IFormDraft>(
  {
    status: {
      type: String,
      enum: Object.values(IFormStatus),
      default: IFormStatus.Draft,
    },
    parent: { type: Schema.Types.ObjectId, ref: "Form", required: true },
    owner: { type: Schema.Types.ObjectId, ref: "User", required: true },
    version: { type: Number, required: true, default: 1 },
    fields: [
      {
        id: { type: String, required: true },
        type: {
          type: String,
          required: true,
          enum: Object.values(FieldTypes),
        },
        weight: { type: Number, required: false },
        label: { type: String, required: false, default: "" },
        multi: { type: Boolean, required: false },
        created: { type: Boolean, required: false },
        placeholder: { type: String, required: false, default: "" },
        required: { type: Boolean, required: false },
        visible: { type: Boolean, required: false },
        system: { type: Boolean, required: false, default: false },
        describe: { type: String, required: false, default: null },
        value: { type: Object, required: false, default: null },
        options: {
          type: [
            {
              label: { type: String, required: true },
              value: { type: String, required: true },
            },
          ],
          required: false,
          default: null,
        },
        validation: {
          min: { type: Number, required: false },
          max: { type: Number, required: false },
          pattern: { type: String, required: false },
        },
      },
    ],
  },
  {
    timestamps: true,
  }
)
  .index({ parent: 1, status: 1 })
  .index({ parent: 1, version: 1 }, { unique: true }).index({ version: -1 });

export default class FormDraft {
  conn: mongoose.Connection;

  constructor(conn: mongoose.Connection) {
    this.conn = conn;
  }

  model() {
    return this.conn.model<IFormDraft>("FormDraft", schema);
  }
}
