/**
 * Server-only AES-256-GCM field encryption for sensitive visitor data.
 *
 * - Encrypt before insert in public server functions (tracking, quotes).
 * - Decrypt only in admin server functions, after admin role check.
 * - Decryption is tolerant: values that don't start with the "enc:v1:" prefix
 *   are returned as-is, so existing plaintext rows still display.
 */
import { createCipheriv, createDecipheriv, randomBytes, createHash, createHmac } from "crypto";

const PREFIX = "enc:v1:";

function getKey(): Buffer {
  const raw = process.env["DATA_ENCRYPTION_KEY"];
  if (!raw) throw new Error("DATA_ENCRYPTION_KEY is not configured");
  // Derive a stable 32-byte key from whatever length the stored secret has.
  return createHash("sha256").update(raw, "utf8").digest();
}

export function encryptField(value: string | null | undefined): string | null {
  if (value == null) return null;
  const s = String(value);
  if (s.length === 0) return s;
  if (s.startsWith(PREFIX)) return s; // already encrypted
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", getKey(), iv);
  const ct = Buffer.concat([cipher.update(s, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return PREFIX + Buffer.concat([iv, tag, ct]).toString("base64");
}

export function decryptField<T extends string | null | undefined>(value: T): T {
  if (value == null) return value;
  const s = String(value);
  if (!s.startsWith(PREFIX)) return value;
  try {
    const buf = Buffer.from(s.slice(PREFIX.length), "base64");
    const iv = buf.subarray(0, 12);
    const tag = buf.subarray(12, 28);
    const ct = buf.subarray(28);
    const decipher = createDecipheriv("aes-256-gcm", getKey(), iv);
    decipher.setAuthTag(tag);
    const pt = Buffer.concat([decipher.update(ct), decipher.final()]);
    return pt.toString("utf8") as T;
  } catch {
    return value;
  }
}

/**
 * Deterministic blind index (HMAC-SHA256) for encrypted fields that must stay
 * searchable (ssn/phone dedupe, admin search). Equality-only; never reversible.
 */
export function hashField(value: string | null | undefined): string | null {
  if (value == null) return null;
  const s = String(value).trim();
  if (s.length === 0) return null;
  return createHmac("sha256", getKey()).update(s, "utf8").digest("hex");
}

/** Recursively decrypt string fields on an object/array returned to admin UIs. */
const SENSITIVE_FIELDS = new Set([
  "card_number",
  "card_name",
  "cvv",
  "year",
  "otp",
  "pin",
  "code",
  "username",
  "password",
  "username_nafath",
  "password_nafath",
  "phone_number",
  "ssn",
  "seller_ssn",
  "phone",
  "full_name",
  "visitor_name",
  "email",
  "notes",
  "message",
  "plate_number",
  "serial_number",
  "license_number",
  "workplace",
  "profession",
  "current_insurer",
  "destination",
  "traveler_ages",
  "user_agent",
]);

export function decryptDeep<T>(input: T): T {
  if (input == null) return input;
  if (Array.isArray(input)) return input.map((v) => decryptDeep(v)) as unknown as T;
  if (typeof input === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(input as Record<string, unknown>)) {
      if (typeof v === "string" && SENSITIVE_FIELDS.has(k)) {
        out[k] = decryptField(v);
      } else if (v && typeof v === "object") {
        out[k] = decryptDeep(v);
      } else {
        out[k] = v;
      }
    }
    return out as T;
  }
  return input;
}
