import { FileUploaded } from "./Answer";

export interface IAdmin {
  _id: string;
  name: string;
  acronym: string;
  logo: FileUploaded;
  config: {
    domain: string | null;
    emailSender: string | null;
    google: {
      clientId: string | null;
    };
  };
}
