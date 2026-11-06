import "server-only";

export const SITE_URL = (process.env.SITE_URL || "http://localhost:3000").replace(/\/$/, "");
export const STUDIO_EMAIL = process.env.STUDIO_EMAIL || "studio360@gmail.com";
export const ADMINS = (process.env.ADMIN_EMAILS || "")
  .split(",")
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);
export const GOOGLE_ACTIF = Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
export const EN_PROD = process.env.NODE_ENV === "production";
