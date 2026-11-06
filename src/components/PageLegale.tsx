import type { ReactNode } from "react";

// Gabarit commun des pages légales (mentions légales, conditions générales, confidentialité).
// Les trois textes sont des projets : ce qui manque est entre crochets (composant AC) et un
// professionnel doit les relire avant la mise en ligne. L'avertissement reste affiché tant que c'est vrai.
export function PageLegale({
  surtitre,
  titre,
  version,
  children,
}: {
  surtitre: string;
  titre: string;
  version: string;
  children: ReactNode;
}) {
  return (
    <div className="mx-auto max-w-3xl px-4 pt-12 sm:px-6">
      <p className="surtitre">{surtitre}</p>
      <h1 className="mt-3 text-3xl leading-tight sm:text-5xl">{titre}</h1>
      <p className="mt-4 text-sm text-gris">Version du {version}.</p>
      <p role="note" className="mt-6 rounded-sm border border-alerte p-4 text-sm">
        Projet de texte. Les passages <span className="a-completer">soulignés en pointillés</span> restent à compléter par le
        studio, et l&apos;ensemble doit être relu par un professionnel du droit avant la mise en ligne.
      </p>
      <div className="prose-legale mt-4">{children}</div>
    </div>
  );
}

/** Information que le studio doit fournir, affichée entre crochets. */
export function AC({ children }: { children: ReactNode }) {
  return <span className="a-completer">[{children}]</span>;
}
