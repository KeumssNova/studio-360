import type { Metadata } from "next";
import Link from "next/link";
import { BoutonImprimer } from "@/components/BoutonImprimer";
import { PrixTtc } from "@/components/PrixTtc";
import { surfaceCourte } from "@/components/CarteEspace";
import { CONTACT, OPTIONS } from "@/data/catalogue";
import { dateLongue, prix } from "@/lib/format";
import { FERMETURE, OUVERTURE, TAUX_TVA, maintenantParis } from "@/lib/regles";
import { lireTarifs } from "@/lib/reservations";
import { espacesVitrine, fiches, type FicheVitrine } from "@/lib/vitrine";

export const metadata: Metadata = {
  title: "Tarifs",
  description: "Fiche tarifaire du Studio 360 : prix à l'heure et à la journée de chaque espace, options et conditions.",
  alternates: { canonical: "/tarifs" },
};

// La maquette proposait une « fiche tarifaire » : ici une page qui s'imprime proprement
// (en-tête et pied masqués, fond blanc, voir @media print dans globals.css).
export default async function Tarifs() {
  const [liste, { options }] = await Promise.all([espacesVitrine(), lireTarifs()]);
  const opts = OPTIONS.filter((o) => options[o.id]?.active !== false).map((o) => ({ ...o, prix: options[o.id]?.prix ?? o.prix }));
  const heureSup = Math.min(...liste.map((e) => e.prixHeureSup));
  const memeHeureSup = liste.every((e) => e.prixHeureSup === heureSup);

  return (
    <div className="mx-auto max-w-4xl px-4 pt-12 sm:px-6 print:max-w-none print:px-0 print:pt-0">
      <p className="surtitre print:text-black">Studio 360</p>
      <h1 className="mt-3 text-3xl sm:text-5xl print:text-3xl">Fiche tarifaire</h1>
      <p className="mt-4 text-gris print:text-black">
        Prix hors taxes, TVA {TAUX_TVA * 100} % en sus, prix TTC en petit. À jour du {dateLongue(maintenantParis().date)}.
      </p>
      <div className="sans-impression mt-6 flex flex-wrap gap-3">
        <BoutonImprimer />
        <Link href="/reserver" className="btn btn-or">
          Réserver
        </Link>
      </div>

      <Tableau titre="Plateaux & studios" lignes={fiches(liste, "plateaux")} heureSup={!memeHeureSup} />
      <Tableau titre="Bureaux & salles" lignes={fiches(liste, "bureaux")} heureSup={!memeHeureSup} />

      <section aria-labelledby="t-options" className="mt-12 break-inside-avoid">
        <h2 id="t-options" className="text-lg">
          Options
        </h2>
        <ul className="mt-4 border-t border-filet-neutre print:border-neutral-400">
          {opts.map((o) => (
            <li key={o.id} className="flex items-baseline justify-between gap-4 border-b border-filet-neutre py-3 print:border-neutral-300">
              <span>
                {o.nom}
                {o.detail && <span className="block text-xs text-gris print:text-neutral-600">{o.detail}</span>}
              </span>
              <span className="chiffres shrink-0 text-right font-semibold">
                {prix(o.prix)} HT
                <PrixTtc ht={o.prix} />
              </span>
            </li>
          ))}
        </ul>
        <p className="mt-3 text-sm text-gris print:text-neutral-600">Selon l&apos;espace : chaque fiche indique les options proposées.</p>
      </section>

      <section aria-labelledby="t-conditions" className="mt-12 break-inside-avoid">
        <h2 id="t-conditions" className="text-lg">
          Conditions
        </h2>
        <ul className="mt-4 list-disc space-y-2 pl-5 text-gris marker:text-or print:text-black">
          <li>
            Ouvert de {OUVERTURE}h à {FERMETURE}h. Location à l&apos;heure, 1 h minimum, ou à la journée ({OUVERTURE}h à {FERMETURE}h).
          </li>
          <li className="chiffres">
            Première heure au tarif horaire de l&apos;espace
            {memeHeureSup ? `, puis ${prix(heureSup)} HT par heure supplémentaire` : ", puis le tarif d'heure supplémentaire indiqué"},
            plafonné au tarif journée.
          </li>
          <li>Une caution peut être demandée.</li>
          <li>La demande de réservation est confirmée par le studio. Aucun paiement en ligne.</li>
          <li>
            Plusieurs jours, devis sur mesure : {CONTACT.email}.
          </li>
        </ul>
      </section>
    </div>
  );
}

function Tableau({ titre, lignes, heureSup }: { titre: string; lignes: FicheVitrine[]; heureSup: boolean }) {
  return (
    <section aria-label={titre} className="mt-12 break-inside-avoid">
      <h2 className="text-lg">{titre}</h2>
      <div className="mt-4 overflow-x-auto">
        <table className="chiffres w-full min-w-[22rem] table-fixed text-left text-sm">
          <thead>
            <tr className="border-b border-filet text-xs text-gris uppercase print:border-neutral-400 print:text-neutral-600">
              <th scope="col" className="py-2 pr-3 font-semibold">
                Espace
              </th>
              <th scope="col" className="hidden w-24 py-2 pr-3 font-semibold sm:table-cell print:table-cell">
                Surface
              </th>
              <th scope="col" className="w-24 py-2 pr-3 text-right font-semibold sm:w-28">
                Heure
              </th>
              <th scope="col" className="w-24 py-2 pr-3 text-right font-semibold sm:w-28">
                Journée
              </th>
              {heureSup && (
                <th scope="col" className="w-24 py-2 text-right font-semibold sm:w-28">
                  Heure sup.
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {lignes.map((f) => (
              <tr key={f.slug} className="border-b border-filet-neutre print:border-neutral-300">
                <th scope="row" className="py-3 pr-3 font-normal">
                  <Link href={`/espaces/${f.slug}`} className="font-semibold hover:text-or print:no-underline">
                    {f.titre}
                  </Link>
                  {f.studio && <span className="block text-xs text-gris print:text-neutral-600">{f.studio}</span>}
                  {f.nombre > 1 && <span className="block text-xs text-gris print:text-neutral-600">{f.nombre} cabines, prix par cabine</span>}
                  {!f.reservable && <span className="block text-xs text-gris print:text-neutral-600">Sur demande</span>}
                </th>
                <td className="hidden py-3 pr-3 text-gris sm:table-cell print:table-cell print:text-black">{surfaceCourte(f.surface)}</td>
                <td className="py-3 pr-3 text-right font-semibold">
                  {prix(f.prixHeure)}
                  <PrixTtc ht={f.prixHeure} />
                </td>
                <td className="py-3 pr-3 text-right font-semibold">
                  {prix(f.prixJournee)}
                  <PrixTtc ht={f.prixJournee} />
                </td>
                {heureSup && (
                  <td className="py-3 text-right">
                    {prix(f.prixHeureSup)}
                    <PrixTtc ht={f.prixHeureSup} />
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
