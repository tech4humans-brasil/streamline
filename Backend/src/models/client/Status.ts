import mongoose, { ObjectId, Schema } from "mongoose";

export enum StatusType {
  PROGRESS = "progress",
  DONE = "done",
  CANCELED = "canceled",
}

export interface IStatus extends mongoose.Document {
  _id: string;
  name: string;
  type: StatusType;
  project: ObjectId | string | null;
}

export const schema: Schema = new Schema(
  {
    name: { type: String, required: true, unique: true },
    type: {
      type: String,
      required: true,
      enum: ["progress", "done", "canceled"],
    },
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
);

export default class Status {
  conn: mongoose.Connection;

  constructor(conn: mongoose.Connection) {
    this.conn = conn;
  }

  model() {
    return this.conn.model<IStatus>("Status", schema);
  }
}
