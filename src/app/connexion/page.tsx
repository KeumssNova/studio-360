import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { GoogleLogo } from "@phosphor-icons/react/dist/ssr";
import { FormulaireConnexion } from "@/components/FormulaireConnexion";
import { cheminSur, utilisateurCourant } from "@/lib/auth";
import { EN_PROD, GOOGLE_ACTIF } from "@/lib/config";

export const metadata: Metadata = { title: "Connexion", robots: { index: false } };

const ERREURS: Record<string, string> = {
  lien: "Ce lien de connexion n'est plus valable (déjà utilisé ou expiré). Demandez-en un nouveau.",
  google: "La connexion Google n'a pas abouti. Réessayez ou utilisez le lien par e-mail.",
};

export default async function Connexion({ searchParams }: { searchParams: Promise<{ retour?: string; erreur?: string }> }) {
  const { retour: brut, erreur } = await searchParams;
  const u = await utilisateurCourant();
  const retour = cheminSur(brut, u?.admin ? "/gestion" : "/compte");
  if (u) redirect(retour);

  return (
    <div className="mx-auto max-w-md px-4 pt-16 sm:px-6">
      <p className="surtitre">Mon compte</p>
      <h1 className="mt-3 text-3xl leading-tight sm:text-4xl">Connexion</h1>
      <p className="mt-4 text-gris">Retrouvez vos réservations, leur statut et leurs récapitulatifs.</p>
      {erreur && ERREURS[erreur] && (
        <p role="alert" className="mt-6 rounded-sm border border-alerte p-4 text-sm text-alerte-texte">
          {ERREURS[erreur]}
        </p>
      )}
      <div className="mt-8 rounded-sm border border-filet bg-carte p-5 sm:p-6">
        {GOOGLE_ACTIF && (
          <>
            <a href={`/auth/google?retour=${encodeURIComponent(retour)}`} className="btn btn-contour w-full">
              <GoogleLogo size={18} aria-hidden="true" /> Continuer avec Google
            </a>
            <p className="my-5 flex items-center gap-3 text-xs text-gris uppercase before:h-px before:flex-1 before:bg-filet-neutre after:h-px after:flex-1 after:bg-filet-neutre">
              ou
            </p>
          </>
        )}
        <FormulaireConnexion retour={retour} />
      </div>
      {!EN_PROD && (
        <p className="mt-6 text-xs text-gris">
          En local, aucun e-mail ne part : le lien arrive dans{" "}
          <Link href="/dev/boite" className="lien">
            la boîte de test
          </Link>
          .
        </p>
      )}
      <p className="mt-6 text-sm text-gris">
        Pas encore de réservation ?{" "}
        <Link href="/reserver" className="lien">
          Réserver un espace
        </Link>
        . Le compte se crée avec la première connexion.
      </p>
    </div>
  );
}
