import Link from "next/link";

export default function Introuvable() {
  return (
    <div className="mx-auto max-w-3xl px-4 pt-20 pb-10 sm:px-6">
      <p className="surtitre">Erreur 404</p>
      <h1 className="mt-3 text-3xl leading-tight sm:text-5xl">Page introuvable</h1>
      <p className="mt-5 max-w-[50ch] text-gris">Cette adresse ne mène à aucune page. Le lien est peut-être incomplet, ou la page a été déplacée.</p>
      <div className="mt-8 flex flex-wrap gap-3">
        <Link href="/espaces" className="btn btn-or">
          Voir les espaces
        </Link>
        <Link href="/" className="btn btn-contour">
          Accueil
        </Link>
      </div>
    </div>
  );
}
