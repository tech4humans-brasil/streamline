import mongoose, { ObjectId, Schema } from "mongoose";

export interface IOIDCAuthorizationCode extends mongoose.Document {
  _id: ObjectId;
  code: string;
  clientId: string;
  userId: string;
  userEmail: string;
  userName: string;
  userSlug: string;
  redirectUri: string;
  scope: string;
  nonce?: string;
  state?: string;
  used: boolean;
  expiresAt: Date;
  createdAt: Date;
}

export const schema = new Schema<IOIDCAuthorizationCode>(
  {
    _id: { type: Schema.Types.ObjectId, auto: true },
    code: { 
      type: String, 
      required: true, 
      unique: true, 
      index: true 
    },
    clientId: { 
      type: String, 
      required: true,
      index: true
    },
    userId: { 
      type: String, 
      required: true 
    },
    userEmail: {
      type: String,
      required: true
    },
    userName: {
      type: String,
      required: true
    },
    userSlug: {
      type: String,
      required: true
    },
    redirectUri: { 
      type: String, 
      required: true 
    },
    scope: { 
      type: String, 
      required: true,
      default: "openid profile email"
    },
    nonce: { 
      type: String, 
      required: false 
    },
    state: { 
      type: String, 
      required: false 
    },
    used: { 
      type: Boolean, 
      default: false,
      index: true
    },
    expiresAt: { 
      type: Date, 
      required: true,
      index: true,
      expires: 0
    },
  },
  {
    timestamps: true,
  }
);

schema.index({ code: 1, used: 1 });

export default class OIDCAuthorizationCode {
  conn: mongoose.Connection;

  constructor(conn: mongoose.Connection) {
    this.conn = conn;
  }

  model() {
    return this.conn.model<IOIDCAuthorizationCode>("OIDCAuthorizationCode", schema);
  }
}
