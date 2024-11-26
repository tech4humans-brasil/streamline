import IUser from "./User";

export interface IAllocation {
  _id: string;
  user: IUser;
  equipments: string[];
  startDate: Date | string;
  endDate?: Date | string;
  loanTermUrl?: string;
  returnNotes?: string;
  additionalNotes?: string;
}
