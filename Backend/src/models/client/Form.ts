import mongoose, { ObjectId, Schema } from "mongoose";

export enum IFormType {
  Created = "created",
  Interaction = "interaction",
  TimeTrigger = "time-trigger",
}

export type IForm = {
  _id: ObjectId | string;
  name: string;
  slug: string;
  initial_status: ObjectId | null;
  type: IFormType;
  period?: { open: string | null | Date; close: string | null | Date };
  active: boolean;
  description: string;
  published: ObjectId | string | null;
  institute: [ObjectId | string] | null;
  visibilities: [ObjectId | string] | null;
  workflow: ObjectId | string | null;
  project: ObjectId | string | null;
} & mongoose.Document;

export const schema = new Schema<IForm>(
  {
    name: { type: String, required: true, unique: true },
    initial_status: {
      type: Schema.Types.ObjectId,
      ref: "Status",
      default: null,
    },
    slug: { type: String, required: true, unique: true },
    type: {
      type: String,
      required: true,
      enum: Object.values(IFormType),
      index: -1,
    },
    active: { type: Boolean, required: true, default: true },
    period: { open: Date, close: Date },
    workflow: { type: Schema.Types.ObjectId, ref: "Workflow", default: null },
    description: { type: String, required: false, default: "" },
    published: { type: Schema.Types.ObjectId, ref: "FormDraft", default: null },
    institute: [
      { type: Schema.Types.ObjectId, ref: "Institute", default: null },
    ],
    visibilities: [{ type: Schema.Types.ObjectId, ref: "Institute", default: null }],
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
).index({ slug: 1, status: 1, "period.open": 1, "period.close": 1 });

export default class Form {
  conn: mongoose.Connection;

  constructor(conn: mongoose.Connection) {
    this.conn = conn;
  }

  model() {
    return this.conn.model<IForm>("Form", schema);
  }
}
