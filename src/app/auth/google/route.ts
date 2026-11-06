import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { GOOGLE_ACTIF, EN_PROD, SITE_URL } from "@/lib/config";
import { idAleatoire } from "@/lib/ids";
import { cheminSur } from "@/lib/auth";

// Connexion Google, flux « authorization code » d'OpenID Connect
// (developers.google.com/identity/openid-connect/openid-connect). NON TESTÉ : il faut un projet
// Google Cloud et ses identifiants (GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET). Sans eux, le bouton est masqué.
export async function GET(req: Request) {
  if (!GOOGLE_ACTIF) redirect("/connexion");
  const etat = idAleatoire(16);
  const retour = cheminSur(new URL(req.url).searchParams.get("retour"));
  (await cookies()).set("s360_google", JSON.stringify({ etat, retour }), {
    httpOnly: true,
    secure: EN_PROD,
    sameSite: "lax",
    path: "/auth/google",
    maxAge: 600,
  });
  const p = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID!,
    response_type: "code",
    scope: "openid email",
    redirect_uri: `${SITE_URL}/auth/google/retour`,
    state: etat, // contre la falsification de requête (même doc, « Create an anti-forgery state token »)
    prompt: "select_account",
  });
  redirect(`https://accounts.google.com/o/oauth2/v2/auth?${p}`);
}
