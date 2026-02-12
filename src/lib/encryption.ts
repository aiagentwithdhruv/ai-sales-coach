/**
 * AES-256-GCM Encryption for User API Keys
 *
 * Uses a server-side secret (API_KEY_ENCRYPTION_SECRET env var)
 * to encrypt/decrypt user-provided API keys at rest.
 */

import crypto from "crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12;
const TAG_LENGTH = 16;

function getEncryptionKey(): Buffer {
  const secret = process.env.API_KEY_ENCRYPTION_SECRET;
  if (!secret) {
    throw new Error("API_KEY_ENCRYPTION_SECRET environment variable is not set");
  }
  // Hash the secret to ensure it's exactly 32 bytes
  return crypto.createHash("sha256").update(secret).digest();
}

/**
 * Encrypt a plaintext string.
 * Returns a base64-encoded string containing: IV + ciphertext + auth tag
 */
export function encrypt(plaintext: string): string {
  const key = getEncryptionKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  const encrypted = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ]);

  const tag = cipher.getAuthTag();

  // Combine: IV (12) + encrypted + tag (16)
  const combined = Buffer.concat([iv, encrypted, tag]);
  return combined.toString("base64");
}

/**
 * Decrypt a base64-encoded encrypted string.
 * Expects the format produced by encrypt(): IV + ciphertext + auth tag
 */
export function decrypt(encryptedBase64: string): string {
  const key = getEncryptionKey();
  const combined = Buffer.from(encryptedBase64, "base64");

  const iv = combined.subarray(0, IV_LENGTH);
  const tag = combined.subarray(combined.length - TAG_LENGTH);
  const ciphertext = combined.subarray(IV_LENGTH, combined.length - TAG_LENGTH);

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(tag);

  const decrypted = Buffer.concat([
    decipher.update(ciphertext),
    decipher.final(),
  ]);

  return decrypted.toString("utf8");
}

/**
 * Get the last 4 characters of a key for display hint.
 * e.g., "sk-proj-abc...xK9f" → "...xK9f"
 */
export function getKeyHint(rawKey: string): string {
  if (rawKey.length <= 4) return "...****";
  return "..." + rawKey.slice(-4);
}
