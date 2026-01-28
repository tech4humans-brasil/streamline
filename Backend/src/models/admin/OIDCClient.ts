import mongoose, { ObjectId, Schema } from "mongoose";

export interface IOIDCClient extends mongoose.Document {
  _id: ObjectId;
  clientId: string;
  clientSecret: string;
  name: string;
  description?: string;
  redirectUris: string[];
  scopes: string[];
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export const schema = new Schema<IOIDCClient>(
  {
    _id: { type: Schema.Types.ObjectId, auto: true },
    clientId: { 
      type: String, 
      required: true, 
      unique: true, 
      index: true 
    },
    clientSecret: { 
      type: String, 
      required: true 
    },
    name: { 
      type: String, 
      required: true 
    },
    description: { 
      type: String, 
      required: false 
    },
    redirectUris: [{ 
      type: String, 
      required: true 
    }],
    scopes: [{ 
      type: String, 
      default: ["openid", "profile", "email"] 
    }],
    active: { 
      type: Boolean, 
      default: true 
    },
  },
  {
    timestamps: true,
  }
);

export default class OIDCClient {
  conn: mongoose.Connection;

  constructor(conn: mongoose.Connection) {
    this.conn = conn;
  }

  model() {
    return this.conn.model<IOIDCClient>("OIDCClient", schema);
  }
}
