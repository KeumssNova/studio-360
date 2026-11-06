import "server-only";
import { cookies } from "next/headers";
import { and, eq, gt, gte, isNull, lt, sql } from "drizzle-orm";
import { getDb, schema } from "./db";
import { idAleatoire, sha256 } from "./ids";
import { ADMINS, EN_PROD, SITE_URL, STUDIO_EMAIL } from "./config";
import { envoyer, gabarit } from "./mail";

// Connexion sans mot de passe : un lien à usage unique envoyé par e-mail.
// Le jeton et l'identifiant de session ne sont stockés qu'en empreinte SHA-256 : une fuite de la
// base ne donne accès à aucun compte (OWASP Session Management Cheat Sheet).

export const COOKIE = "s360_session";
// Lien valable 10 minutes : NIST SP 800-63B, §5.1.3.2 (secret envoyé hors bande, 10 min au plus).
const DUREE_LIEN_MS = 10 * 60 * 1000;
// Session de 30 jours : NIST SP 800-63B, §4.1.3 (niveau AAL1, réauthentification au moins tous les 30 jours).
const DUREE_SESSION_MS = 30 * 24 * 3600 * 1000;
// Au plus 5 liens par adresse et par heure, contre l'envoi en rafale. Provisoire, sans source.
const LIENS_PAR_HEURE = 5;

export const normaliserEmail = (e: string) => e.trim().toLowerCase();
export const estAdmin = (email: string) => ADMINS.includes(normaliserEmail(email));

/** Chemin de retour interne seulement (pas de redirection ouverte vers un autre site). */
export function cheminSur(retour: string | null | undefined, defaut = "/compte") {
  return retour && retour.startsWith("/") && !retour.startsWith("//") && !retour.startsWith("/\\") ? retour : defaut;
}

export async function envoyerLienConnexion(emailBrut: string, retour?: string) {
  const email = normaliserEmail(emailBrut);
  const db = await getDb();
  const [{ n }] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(schema.jetonsConnexion)
    .where(and(eq(schema.jetonsConnexion.email, email), gte(schema.jetonsConnexion.creeLe, new Date(Date.now() - 3600_000))));
  if (n >= LIENS_PAR_HEURE) return { ok: false as const, erreur: "Trop de demandes pour cette adresse. Réessayez dans une heure." };

  const jeton = idAleatoire(32);
  await db.insert(schema.jetonsConnexion).values({ hash: sha256(jeton), email, expireLe: new Date(Date.now() + DUREE_LIEN_MS) });
  const lien = `${SITE_URL}/connexion/verifier?jeton=${jeton}&retour=${encodeURIComponent(cheminSur(retour))}`;
  const { html, texte } = gabarit(
    "Votre lien de connexion",
    [
      "Cliquez sur le bouton ci-dessous pour vous connecter à votre espace Studio 360.",
      "Le lien est valable 10 minutes et ne sert qu'une fois. Si vous n'avez rien demandé, ignorez ce message.",
    ],
    { texte: "Me connecter", lien },
  );
  try {
    await envoyer({ a: email, sujet: "Votre lien de connexion Studio 360", html, texte });
  } catch (e) {
    console.error("[mail]", e);
    return { ok: false as const, erreur: `L'e-mail n'a pas pu partir. Réessayez dans un instant ou écrivez à ${STUDIO_EMAIL}.` };
  }
  return { ok: true as const };
}

async function ouvrirSession(email: string) {
  const db = await getDb();
  const id = idAleatoire(32);
  const expireLe = new Date(Date.now() + DUREE_SESSION_MS);
  await db.insert(schema.sessions).values({ hash: sha256(id), email, expireLe });
  // Nettoyage au passage : sessions et jetons expirés.
  await db.delete(schema.sessions).where(lt(schema.sessions.expireLe, new Date()));
  await db.delete(schema.jetonsConnexion).where(lt(schema.jetonsConnexion.expireLe, new Date(Date.now() - 24 * 3600_000)));
  (await cookies()).set(COOKIE, id, {
    httpOnly: true,
    secure: EN_PROD,
    sameSite: "lax", // lax et non strict : le lien arrive depuis la messagerie, une navigation venue d'ailleurs
    path: "/",
    expires: expireLe,
  });
}

/** Consomme le jeton (une seule fois) et ouvre la session. */
export async function validerJeton(jeton: string) {
  const db = await getDb();
  const [ligne] = await db
    .update(schema.jetonsConnexion)
    .set({ utiliseLe: new Date() })
    .where(
      and(
        eq(schema.jetonsConnexion.hash, sha256(jeton)),
        isNull(schema.jetonsConnexion.utiliseLe),
        gt(schema.jetonsConnexion.expireLe, new Date()),
      ),
    )
    .returning({ email: schema.jetonsConnexion.email });
  if (!ligne) return false;
  await ouvrirSession(ligne.email);
  return true;
}

/** Après une connexion Google vérifiée (adresse confirmée par Google). */
export async function ouvrirSessionGoogle(email: string) {
  await ouvrirSession(normaliserEmail(email));
}

export type Utilisateur = { email: string; admin: boolean };

export async function utilisateurCourant(): Promise<Utilisateur | null> {
  const id = (await cookies()).get(COOKIE)?.value;
  if (!id) return null;
  const db = await getDb();
  const [s] = await db
    .select({ email: schema.sessions.email })
    .from(schema.sessions)
    .where(and(eq(schema.sessions.hash, sha256(id)), gt(schema.sessions.expireLe, new Date())));
  return s ? { email: s.email, admin: estAdmin(s.email) } : null;
}

export async function fermerSession() {
  const jar = await cookies();
  const id = jar.get(COOKIE)?.value;
  if (id) {
    const db = await getDb();
    await db.delete(schema.sessions).where(eq(schema.sessions.hash, sha256(id)));
  }
  jar.delete(COOKIE);
}
