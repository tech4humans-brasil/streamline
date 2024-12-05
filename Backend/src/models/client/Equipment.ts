import mongoose, { Connection, Schema } from "mongoose";
import { FileUploaded } from "../../services/upload";

export enum IEquipmentStatus {
  allocated = "allocated",
  available = "available",
  discarded = "discarded",
  office = "office",
}

export enum IEquipmentSituation {
  new = "new",
  used = "used",
  broken = "broken",
  damaged = "damaged",
  lost = "lost",
  discarded = "discarded",
}

interface UserSchema {
  _id: mongoose.Types.ObjectId | string;
  name: string;
  email: string;
}

const userSchema = new Schema({
  _id: { type: Schema.Types.ObjectId, ref: "User", required: true },
  name: { type: String, required: true },
  email: { type: String, required: true },
  matriculation: { type: String, required: false },
});

interface UserEquipmentAllocation {
  allocation: mongoose.Types.ObjectId | string;
  user: UserSchema;
  endDate: Date | null;
  startDate: Date;
}

const userEquipmentAllocationSchema = new Schema<UserEquipmentAllocation>({
  allocation: { type: Schema.Types.ObjectId, required: true },
  user: { type: userSchema, required: true },
  startDate: { type: Date, required: true, default: Date.now },
  endDate: { type: Date, default: null },
})
  .index(
    { equipment: 1, endDate: 1 },
    {
      unique: true,
      partialFilterExpression: {
        endDate: null,
      },
    }
  )
  .index({ equipment: 1 });

export interface IEquipment extends mongoose.Document {
  _id: mongoose.Types.ObjectId | string;
  formName: string;
  inventoryNumber: string;
  equipmentType: string;
  brandName?: string;
  status: IEquipmentStatus;
  situation: IEquipmentSituation;
  invoice: FileUploaded | null;
  modelDescription?: string;
  serialNumber?: string;
  additionalNotes?: string;
  allocations: mongoose.Types.DocumentArray<UserEquipmentAllocation>;
}

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
    invoice: { type: Object, required: false },
    modelDescription: { type: String, required: false },
    serialNumber: { type: String, required: false },
    additionalNotes: { type: String, required: false },
    allocations: { type: [userEquipmentAllocationSchema], default: [] },
  },
  { timestamps: true }
)
  .index({ inventoryNumber: 1 }, { unique: true })
  .index({ createdAt: 1 })
  .index({ situation: 1 })
  .index({ status: 1 })
  .index({ equipmentType: 1 });

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
