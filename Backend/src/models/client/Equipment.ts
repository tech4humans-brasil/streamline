import mongoose, { Connection, Mongoose, Schema } from "mongoose";
import { IAllocation } from "./Allocation";

export enum IEquipmentStatus {
  allocated = "allocated",
  available = "available",
  discarded = "discarded",
  office = "office"
}

export enum IEquipmentSituation {
  new = "new",
  used = "used",
  broken = "broken",
  damaged = "damaged",
  lost = "lost",
  discarded = "discarded"
}

export interface IEquipment extends mongoose.Document {
  _id: mongoose.Types.ObjectId | string;
  formName: string;
  inventoryNumber: string;
  equipmentType: string;
  brandName?: string;
  status: IEquipmentStatus;
  situation: IEquipmentSituation;
  modelDescription?: string;
  serialNumber?: string;
  additionalNotes?: string;
  currentAllocation: IAllocation | null;
};

export const schema: Schema = new Schema<IEquipment>(
  {
    formName: { type: String, required: true },
    inventoryNumber: { type: String, required: true },
    equipmentType: { type: String, required: true },
    brandName: { type: String, required: false },
    status: { 
      type: String, 
      enum: Object.values(IEquipmentStatus),
      default: IEquipmentStatus.available,
    },
    situation: { 
      type: String, 
      enum: Object.values(IEquipmentSituation),
      default: IEquipmentSituation.new,
    },
    modelDescription: { type: String, required: false },
    serialNumber: { type: String, required: false },
    additionalNotes: { type: String, required: false },
    currentAllocation: { type: Object, default: null, required: false },
  },
  { timestamps: true }
);

class Equipment {
  conn: Connection;

  constructor(conn: Connection) {
    this.conn = conn;
  }

  model() {
    return this.conn.model<IEquipment>("Equipment", schema);
  }
}

export default Equipment;