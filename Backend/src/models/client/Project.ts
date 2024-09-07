import mongoose, { ObjectId, Schema } from "mongoose";
import { encrypt } from "../../utils/crypto";

export interface IVariable {
  _id?: string | ObjectId;
  name: string;
  type: "variable" | "secret";
  value: string;
}

export interface IProject extends mongoose.Document {
  _id: string | ObjectId;
  name: string;
  description: string;
  permissions: {
    type: "user" | "institute";
    user: ObjectId | string | null;
    institute: ObjectId | string | null;
    role: Array<"view" | "update" | "delete">;
    isOwner: boolean;
  }[];
  forms: ObjectId[];
  workflows: ObjectId[];
  status: ObjectId;
  variables: mongoose.Types.DocumentArray<IVariable>;
}

const variableSchema = new Schema<IVariable>({
  _id: { type: Schema.Types.ObjectId, auto: true },
  name: { type: String, required: true },
  type: { type: String, required: true, enum: ["variable", "secret"] },
  value: { type: String, required: true },
});

export const schema: Schema = new Schema(
  {
    name: { type: String, required: true, unique: true },
    description: { type: String, required: false },
    permissions: [
      {
        type: { type: String, required: true, enum: ["user", "institute"] },
        user: { type: Schema.Types.ObjectId, ref: "User", index: true },
        institute: {
          type: Schema.Types.ObjectId,
          ref: "Institute",
          index: true,
        },
        role: [
          {
            type: String,
            required: true,
            enum: ["view", "update", "delete"],
          },
        ],
      },
    ],
    forms: [{ type: Schema.Types.ObjectId, ref: "Form" }],
    workflows: [{ type: Schema.Types.ObjectId, ref: "Workflow" }],
    status: { type: Schema.Types.ObjectId, ref: "Status" },
    variables: [variableSchema],
  },
  {
    timestamps: true,
  }
);

export default class Project {
  conn: mongoose.Connection;

  constructor(conn: mongoose.Connection) {
    this.conn = conn;
  }

  model() {
    return this.conn.model<IProject>("Project", schema);
  }
}
