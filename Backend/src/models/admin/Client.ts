import mongoose, { ObjectId, Schema } from "mongoose";
import { FileUploaded } from "../../services/upload";

export interface IAdminClient extends mongoose.Document {
  _id: ObjectId;
  name: string;
  acronym: string;
  logo: FileUploaded | null;
  config: {
    domain: string | null;
    emailSender: string | null;
    sendgrid: {
      apiKey: string | null;
    };
    google: {
      clientId: string | null;
    };
  };
}

export const schema = new Schema<IAdminClient>(
  {
    _id: { type: Schema.Types.ObjectId, auto: true },
    name: { type: String, required: true },
    acronym: { type: String, required: true },
    logo: { type: Object, required: false, default: null },
    config: {
      domain: { type: String, required: false, default: null },
      emailSender: { type: String, required: false, default: null },
      sendgrid: {
        apiKey: { type: String, required: false, default: null },
      },
      google: {
        clientId: { type: String, required: false, default: null },
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
