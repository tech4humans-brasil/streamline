import { FileUploaded } from "./Answer";

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

interface UserEquipmentAllocation {
  allocation: string;
  user: {
    _id: string;
    name: string;
    email: string;
  };
  endDate: Date | null;
  startDate: Date;
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
  allocations: UserEquipmentAllocation[];
  invoice: FileUploaded | null;
}
