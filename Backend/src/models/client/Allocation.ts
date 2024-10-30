import mongoose, { ObjectId, Schema } from "mongoose";
import { IUser } from "./User";

export interface IAllocation extends mongoose.Document {
  _id: ObjectId;
  user: IUser;
  equipments: ObjectId[] | string[];
  startDate: Date;
  endDate?: Date;
  loanTermUrl?: string;
};

export const schema: Schema = new Schema<IAllocation>(
  {
    user: { type: Object, required: true },
    equipments: [{ 
      type: Schema.Types.ObjectId, 
      ref: "Equipment", 
      required: true 
    }],
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: false },
    loanTermUrl: { type: String, required: false },
  },
  {
    timestamps: true,
  }
);

export default class Allocation {
  conn: mongoose.Connection;

  constructor(conn: mongoose.Connection) {
    this.conn = conn;
  }

  model() {
    return this.conn.model<IAllocation>("Allocation", schema);
  }
}