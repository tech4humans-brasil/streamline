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
  return: IReturn | null;
  createdBy: {
    _id: mongoose.Types.ObjectId | string;
    name: string;
    email: string;
    matriculation: string;
  };
}

export interface IReturn {
  description: string;
  checklist: {
    backup: {
      backupToDrive: boolean;
      verifyFilesIncluded: boolean;
      secureBackup: boolean;
    };
    formattingCompleted: boolean;
  };
  physicalDamages: {
    additionalInfo: {
      hasPhysicalDamage: boolean;
      damageDetails: string | null;
    };
    componentDamage: {
      hasComponentDamage: boolean;
      damageDetails: string | null;
    };
    accessoriesReturned: boolean;
  };
  createdBy: {
    _id: mongoose.Types.ObjectId | string;
    name: string;
    email: string;
    matriculation: string;
  };
}

const ReturnSchema = new mongoose.Schema<IReturn>({
  description: {
    type: String,
    required: true,
  },
  checklist: {
    backup: {
      backupToDrive: { type: String, default: false },
      verifyFilesIncluded: { type: String, default: false },
      secureBackup: { type: String, default: false },
    },
    formattingCompleted: { type: String, default: false },
  },
  physicalDamages: {
    additionalInfo: {
      hasPhysicalDamage: { type: String, default: false },
      damageDetails: { type: String, default: null },
    },
    componentDamage: {
      hasComponentDamage: { type: String, default: false },
      damageDetails: { type: String, default: null },
    },
    accessoriesReturned: { type: String, default: true },
  },
  createdBy: {
    _id: { type: Schema.Types.ObjectId, required: true },
    name: { type: String, required: true },
    email: { type: String, required: true },
    matriculation: { type: String, required: true },
  },
});

const userEquipmentAllocationSchema = new Schema<UserEquipmentAllocation>({
  allocation: { type: Schema.Types.ObjectId, required: true },
  user: { type: userSchema, required: true },
  startDate: { type: Date, required: true, default: Date.now },
  endDate: { type: Date, default: null },
  createdBy: {
    _id: { type: Schema.Types.ObjectId, required: true },
    name: { type: String, required: true },
    email: { type: String, required: true },
    matriculation: { type: String, required: true },
  },
  return: { type: ReturnSchema, required: false },
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
    inventoryNumber: { type: String, required: true, index: true },
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
  .index({ inventoryNumber: 1, equipmentType: 1 }, { unique: true })
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
