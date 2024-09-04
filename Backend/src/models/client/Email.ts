import mongoose, { Schema } from "mongoose";

export interface IEmail extends mongoose.Document {
  _id: string;
  slug: string;
  subject: string;
  htmlTemplate: string;
  cssTemplate: string;
  project: string | mongoose.Types.ObjectId;
}

export const schema = new Schema<IEmail>(
  {
    slug: { type: String, required: true, unique: true },
    subject: { type: String, required: true },
    htmlTemplate: { type: String, required: true },
    cssTemplate: { type: String, required: true },
    project: { type: Schema.Types.ObjectId, ref: "Project" },
  },
  {
    timestamps: true,
  }
);

export default class Email {
  conn: mongoose.Connection;

  constructor(conn: mongoose.Connection) {
    this.conn = conn;
  }

  model() {
    return this.conn.model<IEmail>("Email", schema);
  }
}
