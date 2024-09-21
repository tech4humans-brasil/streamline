import { FileUploaded } from "./Answer";
import IUser from "./User";

export enum FieldTypes {
  text = "text",
  number = "number",
  email = "email",
  password = "password",
  textarea = "textarea",
  checkbox = "checkbox",
  radio = "radio",
  select = "select",
  multiselect = "multiselect",
  date = "date",
  file = "file",
  placeholder = "placeholder",
  "time" = "time",
}

export type IField = {
  id: string;
  label: string;
  type:
    | "text"
    | "number"
    | "email"
    | "password"
    | "textarea"
    | "checkbox"
    | "radio"
    | "select"
    | "date"
    | "placeholder"
    | "multiselect"
    | "file"
    | "time"
    | "teacher";
  required?: boolean;
  predefined?: "teachers" | "students" | "institutions" | null;
  multi?: boolean;
  created?: boolean;
  value:
    | string
    | null
    | FileUploaded
    | Pick<IUser, "_id" | "name" | "matriculation" | "email">;
  visible: boolean;
  describe?: string | null;
  options?:
    | { label: string; value: string }[]
    | { label: string; options: { label: string; value: string }[] }[]
    | null;
  system?: boolean;
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
  };
};

export type IFormStatus = "draft" | "published";

type IFormDraft = {
  _id: string;
  owner: {
    _id: string;
    name: string;
  };
  status: IFormStatus;
  version: number;
  createdAt: string;
  parent: string;
  fields: IField[];
};

export default IFormDraft;
