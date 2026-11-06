import { randomBytes, createHash } from "node:crypto";

export const idAleatoire = (octets = 16) => randomBytes(octets).toString("base64url");
export const sha256 = (s: string) => createHash("sha256").update(s).digest("hex");

// Base 32 de Crockford, sans I, L, O, U : se lit et se dicte au téléphone sans confusion
// (crockford.com/base32.html).
const ALPHABET = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";
export function refLisible() {
  const b = randomBytes(6);
  let s = "";
  for (let i = 0; i < 6; i++) s += ALPHABET[b[i] % 32];
  return `S360-${s}`;
}
