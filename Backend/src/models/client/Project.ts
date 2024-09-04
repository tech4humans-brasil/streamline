import mongoose, { ObjectId, Schema } from "mongoose";

export interface IProject extends mongoose.Document {
  _id: string;
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
}

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
