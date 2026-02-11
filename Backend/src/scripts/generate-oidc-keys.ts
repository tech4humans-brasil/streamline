/**
 * Script to generate OIDC signing keys for environment variables
 * 
 * Usage:
 *   npx ts-node src/scripts/generate-oidc-keys.ts
 * 
 * This script generates RSA keys and outputs them in a format ready
 * to be added to your local.settings.json or Azure App Settings.
 */

import * as crypto from "crypto";

async function main() {
  console.log("🔐 OIDC Key Generator\n");

  // Generate new RSA key pair
  console.log("🔑 Generating RSA-2048 key pair...\n");
  const { publicKey, privateKey } = crypto.generateKeyPairSync("rsa", {
    modulusLength: 2048,
    publicKeyEncoding: {
      type: "spki",
      format: "pem",
    },
    privateKeyEncoding: {
      type: "pkcs8",
      format: "pem",
    },
  });

  const publicKeyPem = publicKey;
  const privateKeyPem = privateKey;

  // Generate a unique key ID
  const kid = crypto.randomBytes(8).toString("hex");

  // Escape newlines for env var format
  const publicKeyEnv = publicKeyPem.replace(/\n/g, "\\n");
  const privateKeyEnv = privateKeyPem.replace(/\n/g, "\\n");

  console.log("=".repeat(70));
  console.log("📋 Add these to your local.settings.json (in the \"Values\" object):");
  console.log("=".repeat(70));
  console.log(`
    "OIDC_KEY_ID": "${kid}",
    "OIDC_PUBLIC_KEY": "${publicKeyEnv}",
    "OIDC_PRIVATE_KEY": "${privateKeyEnv}"
`);
  console.log("=".repeat(70));
  console.log("\n📋 Or for Azure App Settings / .env file:\n");
  console.log(`OIDC_KEY_ID=${kid}`);
  console.log(`OIDC_PUBLIC_KEY=${publicKeyEnv}`);
  console.log(`OIDC_PRIVATE_KEY=${privateKeyEnv}`);
  console.log("\n" + "=".repeat(70));
  console.log("✅ Done! Add the env vars and restart your backend.");
  console.log("=".repeat(70));
}

main().catch((err) => {
  console.error("❌ Error:", err);
  process.exit(1);
});
