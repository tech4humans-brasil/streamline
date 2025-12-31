import mongoose, { Schema, Document } from "mongoose";

export interface ICounter extends Document {
  _id: string;
  seq: number;
}

export const schema: Schema<ICounter> = new Schema<ICounter>({
  _id: { type: String, required: true },
  seq: { type: Number, default: 0 },
});

export default class Counter {
  conn: mongoose.Connection;

  constructor(conn: mongoose.Connection) {
    this.conn = conn;
  }

  model() {
    return this.conn.model<ICounter>("Counter", schema);
  }
}