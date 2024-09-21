import mongoose, { ObjectId, Schema } from "mongoose";
export type IScheduled = {
  _id: ObjectId | string;
  activity: ObjectId | string;
  scheduled: Date;
  finished: boolean;
  status: ScheduleStatus;
  retries?: number;
  active: boolean;
};

export type ISchedule = {
  _id: ObjectId | string;
  name: string;
  project: ObjectId | string;
  workflow: ObjectId | string;
  form: ObjectId | string;
  timezone: string;
  start: Date;
  end: Date | null;
  advanced: boolean;
  expression: string;
  repeat: number | null;
  active: boolean;
  scheduled: mongoose.Types.DocumentArray<IScheduled>;
} & mongoose.Document;

export enum ScheduleStatus {
  PENDING = "pending",
  STARTED = "started",
  COMPLETED = "completed",
  FAILED = "failed",
  CANCELED = "canceled",
}

const scheduledSchema = new Schema<IScheduled>(
  {
    activity: { type: Schema.Types.ObjectId, ref: "Activity", default: null },
    scheduled: { type: Date, required: true },
    finished: { type: Boolean, default: false },
    status: {
      type: String,
      enum: Object.values(ScheduleStatus),
      default: ScheduleStatus.PENDING,
    },
    retries: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export const schema = new Schema<ISchedule>(
  {
    name: { type: String, required: true },
    project: { type: Schema.Types.ObjectId, ref: "Project", required: true },
    workflow: { type: Schema.Types.ObjectId, ref: "Workflow", required: true },
    form: { type: Schema.Types.ObjectId, ref: "Form", required: true },
    start: { type: Date, required: true },
    timezone: { type: String, required: true },
    end: { type: Date, default: null },
    advanced: { type: Boolean, default: false },
    expression: { type: String, required: true },
    repeat: { type: Number, required: true, default: null },
    active: { type: Boolean, default: true },
    scheduled: [scheduledSchema],
  },
  {
    timestamps: true,
  }
).index({ active: 1, "scheduled.finished": 1, "scheduled.scheduled": -1 });

export default class Scheduled {
  conn: mongoose.Connection;

  constructor(conn: mongoose.Connection) {
    this.conn = conn;
  }

  model() {
    return this.conn.model<ISchedule>("Schedule", schema);
  }
}
