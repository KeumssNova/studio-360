import type { Metadata } from "next";
import Link from "next/link";
import { CarteEspace } from "@/components/CarteEspace";
import type { Categorie } from "@/data/catalogue";
import { espacesVitrine, fiches } from "@/lib/vitrine";
import { adressePage } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Espaces",
  description: "Plateau TV, fonds verts, studio podcast, studio d'enregistrement, salle de formation, bureaux et cabines de montage.",
  ...adressePage("/espaces"),
};

const FILTRES: { v?: Categorie; texte: string }[] = [
  { texte: "Tous" },
  { v: "plateaux", texte: "Plateaux & studios" },
  { v: "bureaux", texte: "Bureaux & salles" },
];

export default async function Espaces({ searchParams }: { searchParams: Promise<{ categorie?: string }> }) {
  const { categorie } = await searchParams;
  const cat = categorie === "plateaux" || categorie === "bureaux" ? categorie : undefined;
  const liste = fiches(await espacesVitrine(), cat);

  return (
    <div className="mx-auto max-w-6xl px-4 pt-12 sm:px-6">
      <p className="surtitre">Studio 360</p>
      <h1 className="mt-3 text-3xl sm:text-5xl">Nos espaces</h1>
      <p className="mt-4 max-w-[60ch] text-gris">
        Chaque espace se loue à l&apos;heure, 1 h minimum, ou à la journée de 8h à 17h. Les prix sont hors taxes.
      </p>

      <nav aria-label="Filtrer les espaces" className="mt-8 flex flex-wrap gap-2">
        {FILTRES.map((f) => {
          const actif = f.v === cat;
          return (
            <Link
              key={f.texte}
              href={f.v ? `/espaces?categorie=${f.v}` : "/espaces"}
              aria-current={actif ? "page" : undefined}
              scroll={false}
              className={`btn ${actif ? "btn-or" : "btn-discret"}`}
            >
              {f.texte}
            </Link>
          );
        })}
      </nav>

      <ul className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {liste.map((f) => (
          <li key={f.slug}>
            <CarteEspace f={f} />
          </li>
        ))}
      </ul>
    </div>
  );
}
