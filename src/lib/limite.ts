import "server-only";
import { headers } from "next/headers";
import { and, eq, gte, lt, sql } from "drizzle-orm";
import { getDb, schema } from "./db";
import { sha256 } from "./ids";

// Limite de fréquence par adresse IP sur les formulaires publics, contre l'envoi en rafale par un robot
// (chaque demande envoie deux e-mails, et l'offre gratuite de Resend s'arrête à 100 e-mails par jour,
// resend.com/pricing lu le 6 novembre 2026).
// Seuils provisoires, sans source : à ajuster si un vrai client se fait bloquer (plusieurs personnes derrière
// la même connexion d'entreprise partagent une IP).
const SEUILS = {
  reservation: { max: 10, fenetreMs: 3600_000 },
  connexion: { max: 10, fenetreMs: 3600_000 },
  contact: { max: 5, fenetreMs: 3600_000 },
} as const;

export type ActionLimitee = keyof typeof SEUILS;

// Les lignes s'effacent après 24 h : c'est la durée annoncée dans la politique de confidentialité.
const CONSERVATION_MS = 24 * 3600_000;

// Adresse du visiteur. Sur Vercel, x-forwarded-for est réécrit par la plateforme, qui ne transmet pas l'en-tête
// envoyé par le client « to prevent IP spoofing », et x-real-ip vaut la même chose (vercel.com/docs/headers/
// request-headers, lu le 6 novembre 2026). Chez un autre hébergeur, vérifier que son proxy fait de même : sinon
// un robot peut changer d'IP à chaque requête en écrivant l'en-tête lui-même.
async function ipVisiteur() {
  const h = await headers();
  const xff = h.get("x-forwarded-for")?.split(",")[0]?.trim();
  return xff || h.get("x-real-ip")?.trim() || "inconnue";
}

/** Compte l'envoi et dit s'il passe. L'IP n'est stockée qu'en empreinte SHA-256, jamais en clair. */
export async function autoriser(action: ActionLimitee): Promise<boolean> {
  const { max, fenetreMs } = SEUILS[action];
  const cle = `${action}:${sha256(await ipVisiteur())}`;
  const db = await getDb();
  const maintenant = Date.now();
  await db.delete(schema.limites).where(lt(schema.limites.creeLe, new Date(maintenant - CONSERVATION_MS)));
  const [{ n }] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(schema.limites)
    .where(and(eq(schema.limites.cle, cle), gte(schema.limites.creeLe, new Date(maintenant - fenetreMs))));
  if (n >= max) return false;
  await db.insert(schema.limites).values({ cle });
  return true;
}

export const MESSAGE_LIMITE = "Trop d'envois depuis votre connexion. Réessayez dans une heure.";
