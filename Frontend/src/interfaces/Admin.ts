import { FileUploaded } from "./Answer";

export interface IAdmin {
  _id: string;
  name: string;
  acronym: string;
  logo?: FileUploaded | null;
  icon?: FileUploaded | null;
  principal: boolean;
  domains: string[];
  config: {
    emailSender: string | null;
    google: {
      clientId: string | null;
    };
    clicksign: {
      apiKey: string | null;
    };
  };
}
