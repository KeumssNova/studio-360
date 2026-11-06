import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "@phosphor-icons/react/dist/ssr";
import { surfaceCourte } from "@/components/CarteEspace";
import { prix, prixTtc } from "@/lib/format";
import { espacesVitrine } from "@/lib/vitrine";
import { adressePage } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Réserver",
  description: "Choisissez un espace, une date et un créneau, à l'heure ou à la journée. Demande confirmée par le studio.",
  ...adressePage("/reserver"),
};

const GROUPES = [
  { v: "plateaux", titre: "Plateaux & studios" },
  { v: "bureaux", titre: "Bureaux & salles" },
] as const;

export default async function Reserver() {
  const liste = await espacesVitrine();

  return (
    <div className="mx-auto max-w-4xl px-4 pt-12 sm:px-6">
      <p className="surtitre">Réserver</p>
      <h1 className="mt-3 text-3xl sm:text-5xl">Quel espace ?</h1>
      <p className="mt-4 max-w-[60ch] text-gris">
        Choisissez l&apos;espace, puis la date et le créneau. La demande part au studio, qui la confirme par e-mail.
      </p>

      {GROUPES.map((g) => (
        <section key={g.v} aria-labelledby={`g-${g.v}`} className="mt-12">
          <h2 id={`g-${g.v}`} className="text-lg">
            {g.titre}
          </h2>
          <ul className="mt-4 divide-y divide-filet-neutre border-y border-filet-neutre">
            {liste
              .filter((e) => e.categorie === g.v)
              .map((e) => {
                const contenu = (
                  <>
                    <span className="relative aspect-video w-24 shrink-0 overflow-hidden rounded-sm bg-sourdine sm:w-32">
                      <Image src={e.photos[0]} alt="" fill sizes="128px" className="object-cover" />
                    </span>
                    <span className="min-w-0 flex-1">
                      {e.studio && <span className="surtitre block text-[0.65rem]">{e.studio}</span>}
                      <span className="block font-titre leading-tight uppercase">{e.nom}</span>
                      <span className="chiffres mt-1 block text-sm text-gris">
                        {surfaceCourte(e.surface)} <span aria-hidden="true">•</span> {prix(e.prixHeure)} HT/h ({prixTtc(e.prixHeure)} TTC){" "}
                        <span aria-hidden="true">•</span> {prix(e.prixJournee)} HT la journée ({prixTtc(e.prixJournee)} TTC)
                      </span>
                    </span>
                  </>
                );
                return (
                  <li key={e.slug}>
                    {e.reservable ? (
                      <Link href={`/reserver/${e.slug}`} className="group flex items-center gap-4 py-4">
                        {contenu}
                        <ArrowRight
                          size={20}
                          weight="bold"
                          aria-hidden="true"
                          className="shrink-0 text-gris transition-[color,translate] group-hover:translate-x-0.5 group-hover:text-or"
                        />
                      </Link>
                    ) : (
                      <div className="flex items-center gap-4 py-4 opacity-60">
                        {contenu}
                        <Link href="/contact" className="shrink-0 text-xs font-semibold text-gris underline">
                          Sur demande
                        </Link>
                      </div>
                    )}
                  </li>
                );
              })}
          </ul>
        </section>
      ))}
    </div>
  );
}
