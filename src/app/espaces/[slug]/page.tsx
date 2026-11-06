import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Check } from "@phosphor-icons/react/dist/ssr";
import { Galerie } from "@/components/Galerie";
import { PrixTtc } from "@/components/PrixTtc";
import { ESPACES, espaceParSlug } from "@/data/catalogue";
import { prix } from "@/lib/format";
import { FERMETURE, OUVERTURE } from "@/lib/regles";
import { optionsDe } from "@/lib/reservations";
import { espaceVitrine } from "@/lib/vitrine";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const e = espaceParSlug((await params).slug);
  if (!e) return {};
  return { title: e.studio ? `${e.nom}, ${e.studio}` : e.nom, description: e.accroche, openGraph: { images: [e.photos[0]] } };
}

const CATEGORIE = { plateaux: "Plateaux & studios", bureaux: "Bureaux & salles" } as const;

export default async function FicheEspace({ params }: Props) {
  const { slug } = await params;
  const e = await espaceVitrine(slug);
  if (!e) notFound();
  const options = await optionsDe(slug);
  const freres = e.groupe ? ESPACES.filter((x) => x.groupe === e.groupe) : [];

  return (
    <div className="mx-auto max-w-6xl px-4 pt-8 sm:px-6">
      <Link href="/espaces" className="inline-flex items-center gap-2 text-sm text-gris hover:text-or">
        <ArrowLeft size={16} /> Tous les espaces
      </Link>

      <div className="mt-6 grid gap-10 lg:grid-cols-[1.25fr_1fr] lg:gap-12">
        <Galerie photos={e.photos} nom={e.nom} />

        <div>
          <p className="surtitre">
            {CATEGORIE[e.categorie]}
            {e.studio ? ` · ${e.studio}` : ""}
          </p>
          <h1 className="mt-3 text-3xl leading-tight sm:text-4xl">{e.nom}</h1>
          <p className="mt-4 leading-relaxed text-gris">{e.accroche}</p>

          {freres.length > 1 && (
            <nav aria-label="Choisir la cabine" className="mt-6 flex flex-wrap gap-2">
              {freres.map((f) => (
                <Link
                  key={f.slug}
                  href={`/espaces/${f.slug}`}
                  aria-current={f.slug === e.slug ? "page" : undefined}
                  className={`btn ${f.slug === e.slug ? "btn-or" : "btn-discret"}`}
                >
                  {f.nom.replace("Cabine de montage", "Cabine")}
                </Link>
              ))}
            </nav>
          )}

          <dl className="mt-7 grid grid-cols-2 gap-3">
            <div className="rounded-sm border border-filet bg-carte p-4">
              <dt className="surtitre text-[0.68rem]">À l&apos;heure (HT)</dt>
              <dd className="chiffres mt-2 font-titre text-2xl">{prix(e.prixHeure)}</dd>
              <dd className="chiffres mt-1"><PrixTtc ht={e.prixHeure} /></dd>
            </div>
            <div className="rounded-sm border border-filet bg-carte p-4">
              <dt className="surtitre text-[0.68rem]">
                Journée {OUVERTURE}h à {FERMETURE}h (HT)
              </dt>
              <dd className="chiffres mt-2 font-titre text-2xl">{prix(e.prixJournee)}</dd>
              <dd className="chiffres mt-1"><PrixTtc ht={e.prixJournee} /></dd>
            </div>
          </dl>

          {e.reservable ? (
            <Link href={`/reserver/${e.slug}`} className="btn btn-or mt-4 w-full">
              Réserver
            </Link>
          ) : (
            <p className="mt-4 rounded-sm border border-filet-neutre p-4 text-sm text-gris">
              La réservation en ligne est fermée pour cet espace en ce moment.{" "}
              <Link className="lien" href="/contact">
                Contactez le studio
              </Link>
              .
            </p>
          )}
          <p className="mt-3 text-center text-xs text-gris">Demande confirmée par le studio. Aucun paiement en ligne.</p>
        </div>
      </div>

      <div className="mt-16 grid gap-x-12 gap-y-10 border-t border-filet pt-12 md:grid-cols-2">
        <section aria-labelledby="t-equip">
          <h2 id="t-equip" className="text-lg">
            Équipements &amp; mobilier inclus
          </h2>
          <ul className="mt-4 grid gap-2.5 sm:grid-cols-2">
            {e.equipements.map((x) => (
              <li key={x} className="flex items-start gap-2.5">
                <Check size={18} weight="bold" className="mt-0.5 shrink-0 text-or" aria-hidden="true" />
                {x}
              </li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="t-dim">
          <h2 id="t-dim" className="text-lg">
            Dimensions
          </h2>
          <p className="chiffres mt-4">{e.surface}</p>
        </section>

        <section aria-labelledby="t-horaires">
          <h2 id="t-horaires" className="text-lg">
            Horaires &amp; durées
          </h2>
          <ul className="mt-4 space-y-2 text-gris">
            <li>
              Ouvert de {OUVERTURE}h à {FERMETURE}h.
            </li>
            <li>
              Location à l&apos;heure (1 h minimum) ou à la journée ({OUVERTURE}h à {FERMETURE}h).
            </li>
            <li className="chiffres">
              Première heure à {prix(e.prixHeure)} HT, puis {prix(e.prixHeureSup)} HT par heure supplémentaire, plafonné au tarif
              journée.
            </li>
          </ul>
        </section>

        <section aria-labelledby="t-options">
          <h2 id="t-options" className="text-lg">
            Frais supplémentaires &amp; options
          </h2>
          {options.length ? (
            <ul className="mt-4">
              {options.map((o) => (
                <li key={o.id} className="flex items-baseline justify-between gap-4 border-b border-filet-neutre py-3">
                  <span>
                    {o.nom}
                    {o.detail && <span className="block text-xs text-gris">{o.detail}</span>}
                  </span>
                  <span className="chiffres shrink-0 text-right font-semibold">
                    {prix(o.prix)} HT
                    <PrixTtc ht={o.prix} />
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-4 text-gris">Aucune option pour cet espace.</p>
          )}
          <p className="mt-4 text-sm text-gris">Prix HT, TVA 20 % en sus. Une caution peut être demandée.</p>
        </section>
      </div>
    </div>
  );
}
