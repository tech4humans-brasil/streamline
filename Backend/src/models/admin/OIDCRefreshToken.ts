import mongoose, { ObjectId, Schema } from "mongoose";

export interface IOIDCRefreshToken extends mongoose.Document {
  _id: ObjectId;
  tokenHash: string;
  clientId: string;
  userId: string;
  userEmail: string;
  userName: string;
  userSlug: string;
  scope: string;
  revoked: boolean;
  expiresAt: Date;
  createdAt: Date;
}

export const schema = new Schema<IOIDCRefreshToken>(
  {
    _id: { type: Schema.Types.ObjectId, auto: true },
    tokenHash: { 
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
      required: true,
      index: true
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
    scope: { 
      type: String, 
      required: true,
      default: "openid profile email"
    },
    revoked: { 
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

schema.index({ tokenHash: 1, revoked: 1 });
schema.index({ userId: 1, clientId: 1 });

export default class OIDCRefreshToken {
  conn: mongoose.Connection;

  constructor(conn: mongoose.Connection) {
    this.conn = conn;
  }

  model() {
    return this.conn.model<IOIDCRefreshToken>("OIDCRefreshToken", schema);
  }
}
