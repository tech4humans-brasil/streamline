import mongoose, { Connection } from "mongoose";
import clientModels from "../models/client";
import adminModels from "../models/admin";

const { MONGO_URI, MONGO_PARAMS = "", MONGO_ADMIN_DB = "global" } = process.env;

if (!MONGO_URI) {
  throw new Error("Missing MONGO_URI environment variable");
}

const CON_STRING = MONGO_URI;
const CON_PARAMS = MONGO_PARAMS;

const mongoOptions: mongoose.ConnectOptions = {
  autoIndex: true,
  connectTimeoutMS: 10000,
  socketTimeoutMS: 1000,
};

const connectionMap = new Map<string, Connection>();

const handleConnect = (db: string) =>
  mongoose.createConnection(`${CON_STRING}/${db}?${CON_PARAMS}`, mongoOptions);

export function connect(db: string): Connection {
  if (connectionMap.has(db)) {
    return connectionMap.get(db);
  }

  const conn = handleConnect(db);
  const newConn = conn.useDb(db, { useCache: true });
  newConn.once("open", () => {
    console.log(`Connected to ${db} database`);
  });
  newConn.once("close", () => {
    connectionMap.delete(db);
    console.log(`Disconnected to ${db} database`);
  });

  Object.keys(clientModels).forEach((key) => {
    newConn.model(key, clientModels[key]);
  });

  connectionMap.set(db, newConn);

  return newConn;
}

export async function disconnect(conn: Connection): Promise<void> {
  if (!conn) {
    return;
  }

  await conn.close();
}

export async function connectAdmin(): Promise<Connection> {

  if (connectionMap.has(MONGO_ADMIN_DB)) {
    return connectionMap.get(MONGO_ADMIN_DB);
  }

  const conn = handleConnect(MONGO_ADMIN_DB);
  const newConn = conn.useDb(MONGO_ADMIN_DB);
  newConn.once("open", () => {
    console.log(`Connected to ${MONGO_ADMIN_DB} database`);
  });

  Object.keys(adminModels).forEach((key) => {
    newConn.model(key, adminModels[key]);
  });

  connectionMap.set(MONGO_ADMIN_DB, newConn);

  return newConn;
}

export async function disconnectAdmin(conn: Connection): Promise<void> {
  if (!conn) {
    return;
  }

  await conn.close();
}

export default {
  connect,
  disconnect,
  connectAdmin,
  disconnectAdmin,
};
