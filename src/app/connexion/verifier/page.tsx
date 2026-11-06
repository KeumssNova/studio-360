import type { Metadata } from "next";
import { confirmerConnexion } from "@/app/actions";
import { cheminSur } from "@/lib/auth";

export const metadata: Metadata = { title: "Connexion", robots: { index: false, follow: false } };

// Le lien de l'e-mail mène ici, et la connexion ne se fait qu'au clic sur le bouton (POST).
// Raison : certaines messageries et antivirus ouvrent les liens d'un e-mail pour les analyser ;
// un GET qui consommerait le jeton grillerait le lien avant que la personne clique. Problème documenté par
// Supabase (docs Auth, Email templates, « Email prefetching », exemple : Safe Links de Microsoft Defender),
// qui recommande la même parade : une page intermédiaire avec un bouton.
export default async function Verifier({ searchParams }: { searchParams: Promise<{ jeton?: string; retour?: string }> }) {
  const { jeton = "", retour } = await searchParams;
  return (
    <div className="mx-auto max-w-md px-4 pt-16 sm:px-6">
      <p className="surtitre">Mon compte</p>
      <h1 className="mt-3 text-3xl leading-tight sm:text-4xl">Connexion</h1>
      <p className="mt-4 text-gris">Un dernier clic pour ouvrir votre espace.</p>
      <form action={confirmerConnexion} className="mt-8">
        <input type="hidden" name="jeton" value={jeton} />
        <input type="hidden" name="retour" value={cheminSur(retour)} />
        <button type="submit" className="btn btn-or w-full">
          Me connecter
        </button>
      </form>
    </div>
  );
}
