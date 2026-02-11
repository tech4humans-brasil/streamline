/**
 * Script to register an OIDC client
 * 
 * Usage:
 *   npx ts-node src/scripts/register-oidc-client.ts
 * 
 * Or add to package.json scripts:
 *   "register-client": "ts-node src/scripts/register-oidc-client.ts"
 */

import * as crypto from "crypto";
import * as bcrypt from "bcrypt";
import mongoose from "mongoose";
import * as fs from "fs";
import * as path from "path";

// Load environment variables from local.settings.json (Azure Functions format)
const settingsPath = path.join(__dirname, "../../local.settings.json");
if (fs.existsSync(settingsPath)) {
  const settings = JSON.parse(fs.readFileSync(settingsPath, "utf-8"));
  if (settings.Values) {
    Object.assign(process.env, settings.Values);
  }
}

const MONGO_URI = process.env.MONGO_URI;
const MONGO_PARAMS = process.env.MONGO_PARAMS || "";
const MONGO_ADMIN_DB = process.env.MONGO_ADMIN_DB || "global";

if (!MONGO_URI) {
  console.error("❌ MONGO_URI environment variable is required");
  process.exit(1);
}

// OIDC Client schema (same as in models/admin/OIDCClient.ts)
const OIDCClientSchema = new mongoose.Schema({
  clientId: { type: String, required: true, unique: true, index: true },
  clientSecret: { type: String, required: true },
  name: { type: String, required: true },
  description: { type: String },
  redirectUris: [{ type: String, required: true }],
  scopes: [{ type: String, default: ["openid", "profile", "email"] }],
  allowedSlugs: {
    type: [String],
    required: true,
    validate: {
      validator: (v: string[]) => Array.isArray(v) && v.length > 0,
      message: "allowedSlugs must contain at least one slug",
    },
  },
  active: { type: Boolean, default: true },
}, { timestamps: true });

// ============================================
// CONFIGURE YOUR CLIENT HERE
// ============================================
const CLIENT_CONFIG = {
  clientId: "responsibilities-manager",
  name: "Responsibilities Manager",
  description: "Application for managing responsibilities",
  redirectUris: [
    "http://localhost:7071/api/auth/callback",
    "https://dev-resp-manager-services.azurewebsites.net/api/auth/callback",
    // Add more redirect URIs if needed (e.g., production URL)
  ],
  scopes: ["openid", "profile", "email"],
  /** Tenant slugs this client is allowed to use. Required; at least one. */
  allowedSlugs: ["tech4h"], // e.g. ["acme", "contoso"]
};
// ============================================

async function main() {
  console.log("🔐 OIDC Client Registration Script\n");

  // Generate a secure client secret
  const clientSecret = crypto.randomBytes(32).toString("hex");
  const hashedSecret = await bcrypt.hash(clientSecret, 10);

  console.log("📋 Client Configuration:");
  console.log(`   Client ID:     ${CLIENT_CONFIG.clientId}`);
  console.log(`   Name:          ${CLIENT_CONFIG.name}`);
  console.log(`   Redirect URIs: ${CLIENT_CONFIG.redirectUris.join(", ")}`);
  console.log(`   Scopes:        ${CLIENT_CONFIG.scopes.join(", ")}`);
  if (!CLIENT_CONFIG.allowedSlugs?.length) {
    console.error("❌ allowedSlugs is required and must contain at least one slug");
    process.exit(1);
  }
  console.log(`   Allowed slugs: ${CLIENT_CONFIG.allowedSlugs.join(", ")}`);
  console.log("");

  // Connect to MongoDB
  console.log("🔌 Connecting to MongoDB...");
  const conn = await mongoose.createConnection(
    `${MONGO_URI}/${MONGO_ADMIN_DB}?${MONGO_PARAMS}`
  ).asPromise();

  const OIDCClient = conn.model("OIDCClient", OIDCClientSchema);

  // Check if client already exists
  const existing = await OIDCClient.findOne({ clientId: CLIENT_CONFIG.clientId });
  if (existing) {
    console.log("⚠️  Client already exists. Updating...");
    existing.name = CLIENT_CONFIG.name;
    existing.description = CLIENT_CONFIG.description;
    existing.redirectUris = CLIENT_CONFIG.redirectUris;
    existing.scopes = CLIENT_CONFIG.scopes;
    existing.allowedSlugs = CLIENT_CONFIG.allowedSlugs;
    existing.clientSecret = hashedSecret;
    existing.active = true;
    await existing.save();
    console.log("✅ Client updated successfully!");
  } else {
    // Create new client
    await OIDCClient.create({
      clientId: CLIENT_CONFIG.clientId,
      clientSecret: hashedSecret,
      name: CLIENT_CONFIG.name,
      description: CLIENT_CONFIG.description,
      redirectUris: CLIENT_CONFIG.redirectUris,
      scopes: CLIENT_CONFIG.scopes,
      allowedSlugs: CLIENT_CONFIG.allowedSlugs,
      active: true,
    });
    console.log("✅ Client created successfully!");
  }

  console.log("\n" + "=".repeat(60));
  console.log("🔑 CLIENT SECRET (save this - it won't be shown again!):");
  console.log("=".repeat(60));
  console.log(`\n   ${clientSecret}\n`);
  console.log("=".repeat(60));
  console.log("\n📝 Add this to your responsibilities-manager local.settings.json:\n");
  console.log(`   "OIDC_CLIENT_ID": "${CLIENT_CONFIG.clientId}",`);
  console.log(`   "OIDC_CLIENT_SECRET": "${clientSecret}",`);
  console.log("");

  await conn.close();
  console.log("👋 Done!");
  process.exit(0);
}

main().catch((err) => {
  console.error("❌ Error:", err);
  process.exit(1);
});
