import { IAllocation } from "./Allocation";

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
  currentAllocation: IAllocation | null;
}
