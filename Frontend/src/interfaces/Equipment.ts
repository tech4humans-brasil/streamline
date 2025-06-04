import { FileUploaded } from "./Answer";

export enum IEquipmentStatus {
  available = "available",
  allocated = "allocated",
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

export interface IUser {
  _id: string;
  name: string;
  email: string;
}

export interface IAllocation {
  allocation: string;
  user: IUser;
  startDate: string;
  endDate?: string;
  return?: IReturn;
}

export interface IReturn {
  description: string;
  checklist: {
    backup: {
      verifyFilesIncluded: "yes" | "no";
      secureBackup: "yes" | "no";
    };
    formattingCompleted: "yes" | "no";
  };
  physicalDamages: {
    additionalInfo: {
      hasPhysicalDamage: "yes" | "no";
      damageDetails?: string;
    };
    componentDamage: {
      hasComponentDamage: "yes" | "no";
      damageDetails?: string;
    };
    accessoriesReturned?: "yes" | "no";
  };
  createdBy?: IUser;
}

export interface IEquipment {
  _id: string;
  formName: string;
  inventoryNumber: string;
  equipmentType: string;
  brandName?: string;
  status: IEquipmentStatus;
  situation: IEquipmentSituation;
  modelDescription?: string;
  serialNumber?: string;
  additionalNotes?: string;
  allocations: IAllocation[];
  invoice?: FileUploaded | null;
}
