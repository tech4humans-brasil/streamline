import mongoose, { ObjectId, Schema } from "mongoose";

export enum CallbackStatus {
  IDLE = "idle",
  DONE = "done",
  CANCELED = "canceled",
}

export interface ICallback extends mongoose.Document {
  _id: string;
  activity: ObjectId | string;
  workflow: ObjectId | string;
  step: ObjectId | string;
  status: CallbackStatus;
}

export const schema: Schema = new Schema(
  {
    activity: {
      type: Schema.Types.ObjectId,
      ref: "Activity",
      required: true,
      index: true,
    },
    workflow: {
      type: Schema.Types.ObjectId,
      ref: "ActivityWorkflow",
      required: true,
    },
    step: {
      type: Schema.Types.ObjectId,
      ref: "ActivityStep",
      required: true,
    },
    status: {
      type: String,
      required: true,
      enum: ["idle", "done", "canceled"],
      default: "idle",
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
    return this.conn.model<ICallback>("Callback", schema);
  }
}
