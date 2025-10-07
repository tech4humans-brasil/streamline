import mongoose, { ObjectId, Schema } from "mongoose";
import { FileUploaded } from "../../services/upload";

export interface IAdminClient extends mongoose.Document {
  _id: ObjectId;
  name: string;
  acronym: string;
  logo: FileUploaded | null;
  icon: FileUploaded | null;
  principal: boolean;
  config: {
    emailSender: string | null;
    sendgrid: {
      apiKey: string | null;
    };
    google: {
      clientId: string | null;
    };
    clicksign: {
      apiKey: string | null;
    };
    externalUsers: {
      allow: boolean;
      redirect: string | null;
    }
  };
}

export const schema = new Schema<IAdminClient>(
  {
    _id: { type: Schema.Types.ObjectId, auto: true },
    name: { type: String, required: true },
    acronym: { type: String, required: true },
    logo: { type: Object, required: false, default: null },
    icon: { type: Object, required: false, default: null },
    principal: { type: Boolean, required: false, default: true },
    config: {
      emailSender: { type: String, required: false, default: null },
      sendgrid: {
        apiKey: { type: String, required: false, default: null },
      },
      google: {
        clientId: { type: String, required: false, default: null },
      },
      clicksign: {
        apiKey: { type: String, required: false, default: null },
      },
      externalUsers: {
        allow: { type: Boolean, required: false, default: false },
        redirect: { type: String, required: false, default: null },
      },
    },
  },
  {
    timestamps: true,
  }
);

export default class AdminClient {
  conn: mongoose.Connection;

  constructor(conn: mongoose.Connection) {
    this.conn = conn;
  }

  model() {
    return this.conn.model<IAdminClient>("Client", schema);
  }
}
