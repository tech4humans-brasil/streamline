import crypto from "node:crypto";

const secretKey = "eb7c9ee0017e5797ff9fd99c3e470376bddad49d2b33286d82955ac0826958a3"

if (!secretKey) {
  throw new Error("JWT_SECRET is missing");
}

export function encrypt(text) {
  const algorithm = "aes-256-ctr";
  const iv = crypto.randomBytes(16);

  const cipher = crypto.createCipheriv(
    algorithm,
    Buffer.from(secretKey, "hex"),
    iv
  );
  let encrypted = cipher.update(text);
  encrypted = Buffer.concat([encrypted, cipher.final()]);

  return iv.toString("hex") + ":" + encrypted.toString("hex");
}

export function decrypt(encryptedText) {
  const algorithm = "aes-256-ctr";
  const [iv, encrypted] = encryptedText.split(":");

  const decipher = crypto.createDecipheriv(
    algorithm,
    Buffer.from(secretKey, "hex"),
    Buffer.from(iv, "hex")
  );
  let decrypted = decipher.update(Buffer.from(encrypted, "hex"));
  decrypted = Buffer.concat([decrypted, decipher.final()]);

  return decrypted.toString();
}

export default {
  encrypt,
  decrypt,
};
