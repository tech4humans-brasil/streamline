import mongoose, { ObjectId, Schema } from "mongoose";

export type IWorkflow = {
  _id: string;
  name: string;
  active: boolean;
  published: string;
  project: ObjectId | string | null;
  createdAt: string;
  updatedAt: string;
} & mongoose.Document;

export const schema: Schema = new Schema(
  {
    name: { type: String, required: true },
    published: {
      type: Schema.Types.ObjectId,
      ref: "WorkflowDraft",
      default: null,
    },
    active: { type: Boolean, default: false },
    project: {
      type: Schema.Types.ObjectId,
      ref: "Project",
      default: null,
      index: true,
    },
  },
  {
    timestamps: true,
  }
).index({ name: 1, version: 1 }, { unique: true });

export default class Workflow {
  conn: mongoose.Connection;

  constructor(conn: mongoose.Connection) {
    this.conn = conn;
  }

  model() {
    return this.conn.model<IWorkflow>("Workflow", schema);
  }
}
