import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { GOOGLE_ACTIF, SITE_URL } from "@/lib/config";
import { ouvrirSessionGoogle } from "@/lib/auth";

// Retour de Google. NON TESTÉ, voir ../route.ts.
// Le jeton d'identité vient directement de l'endpoint de Google en HTTPS, avec notre secret : la doc
// Google dit qu'on peut alors s'y fier sans vérifier sa signature (« Obtain user information from the
// ID token »). On contrôle tout de même l'émetteur, le destinataire, l'expiration et l'adresse confirmée.
export async function GET(req: Request) {
  if (!GOOGLE_ACTIF) redirect("/connexion");
  const url = new URL(req.url);
  const jar = await cookies();
  const memo = jar.get("s360_google")?.value;
  jar.delete({ name: "s360_google", path: "/auth/google" });
  let attendu: { etat: string; retour: string } | null = null;
  try {
    attendu = memo ? JSON.parse(memo) : null;
  } catch {}
  const code = url.searchParams.get("code");
  if (!attendu || !code || url.searchParams.get("state") !== attendu.etat) redirect("/connexion?erreur=google");

  const r = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      redirect_uri: `${SITE_URL}/auth/google/retour`,
      grant_type: "authorization_code",
    }),
  });
  if (!r.ok) redirect("/connexion?erreur=google");
  const { id_token } = (await r.json()) as { id_token?: string };
  const charge = id_token ? JSON.parse(Buffer.from(id_token.split(".")[1], "base64url").toString("utf8")) : null;
  const valide =
    charge &&
    ["https://accounts.google.com", "accounts.google.com"].includes(charge.iss) &&
    charge.aud === process.env.GOOGLE_CLIENT_ID &&
    charge.exp * 1000 > Date.now() &&
    charge.email_verified === true &&
    typeof charge.email === "string";
  if (!valide) redirect("/connexion?erreur=google");
  await ouvrirSessionGoogle(charge.email);
  redirect(attendu.retour);
}
