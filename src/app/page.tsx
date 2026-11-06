import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "@phosphor-icons/react/dist/ssr";
import { CarteEspace } from "@/components/CarteEspace";
import { PrixTtc } from "@/components/PrixTtc";
import { CONTACT, OPTIONS } from "@/data/catalogue";
import { prix, prixTtc } from "@/lib/format";
import { FERMETURE, OUVERTURE } from "@/lib/regles";
import { lireTarifs } from "@/lib/reservations";
import { espacesVitrine, fiches } from "@/lib/vitrine";

// Accroche, sous-titre et ligne de verbes : textes de la maquette du client, gardés mot pour mot.
const MOTS_TITRE = ["Espaces", "Production", "Création", "Événements"];

export default async function Accueil() {
  const [liste, { options }] = await Promise.all([espacesVitrine(), lireTarifs()]);
  const plateaux = fiches(liste, "plateaux");
  const bureaux = fiches(liste, "bureaux");
  const prixMin = Math.min(...liste.map((e) => e.prixHeure));
  const opts = OPTIONS.filter((o) => options[o.id]?.active !== false).map((o) => ({ ...o, prix: options[o.id]?.prix ?? o.prix }));

  return (
    <>
      {/* Titre et image côte à côte : la maquette centrait tout ; l'anneau or reprend celui du logo. */}
      <section className="mx-auto grid max-w-6xl items-center gap-12 px-4 pt-14 pb-16 sm:px-6 md:pt-20 lg:grid-cols-[1.15fr_1fr] lg:gap-16">
        <div>
          <p className="surtitre">Plateaux TV · Studios · Bureaux</p>
          <h1 className="mt-5 text-[clamp(2.4rem,6.2vw,4.4rem)] leading-[0.98]">
            {MOTS_TITRE.map((m, i) => (
              <span key={m}>
                {m}
                {i < MOTS_TITRE.length - 1 && (
                  <span aria-hidden="true" className="text-or">
                    {" "}•{" "}
                  </span>
                )}
              </span>
            ))}
          </h1>
          <p className="mt-6 max-w-[48ch] text-lg leading-relaxed text-gris">
            Des espaces professionnels pour tourner, enregistrer, photographier, travailler et créer.
          </p>
          <p className="mt-4 text-sm font-semibold tracking-wide text-or">Tournez · Enregistrez · Photographiez · Formez · Réunissez · Créez</p>
          <div className="mt-9 flex flex-wrap gap-3">
            <Link href="/espaces" className="btn btn-or">
              Voir les espaces
            </Link>
            <Link href="/tarifs" className="btn btn-contour">
              Fiche tarifaire
            </Link>
          </div>
        </div>
        <div className="relative mx-auto w-full max-w-[460px]">
          <div aria-hidden="true" className="absolute -inset-4 rounded-full border border-filet" />
          <div className="relative aspect-square overflow-hidden rounded-full border-2 border-or">
            <Image
              src="/espaces/s360-008.jpg"
              alt="Le grand plateau TV du Studio 360"
              fill
              priority
              sizes="(min-width: 1024px) 460px, 90vw"
              className="object-cover"
            />
          </div>
        </div>
      </section>

      <section aria-label="En bref" className="border-y border-filet-neutre">
        <dl className="mx-auto grid max-w-6xl grid-cols-2 px-4 sm:px-6 md:grid-cols-4">
          {[
            { v: `${liste.length} espaces`, l: "plateaux, studios et bureaux" },
            { v: `${OUVERTURE}h à ${FERMETURE}h`, l: "à l'heure ou à la journée" },
            { v: `dès ${prix(prixMin)}`, l: `HT de l'heure, ${prixTtc(prixMin)} TTC` },
            { v: "1 h minimum", l: "réservation en ligne" },
          ].map((x, i) => (
            <div key={x.v} className={`py-6 ${i % 2 ? "pl-5" : "pr-5"} md:px-0 ${i ? "md:border-l md:border-filet-neutre md:pl-6" : ""}`}>
              <dt className="sr-only">{x.l}</dt>
              <dd className="chiffres font-titre text-xl uppercase">{x.v}</dd>
              <dd className="mt-1 text-sm text-gris">{x.l}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="mx-auto max-w-6xl px-4 pt-20 sm:px-6" aria-labelledby="titre-plateaux">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <h2 id="titre-plateaux" className="text-2xl sm:text-3xl">
            Plateaux &amp; studios
          </h2>
          <Link href="/espaces" className="inline-flex items-center gap-2 font-titre text-xs tracking-[0.08em] text-or uppercase hover:underline">
            Tous les espaces <ArrowRight size={14} weight="bold" />
          </Link>
        </div>
        <ul className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {plateaux.map((f) => (
            <li key={f.slug}>
              <CarteEspace f={f} />
            </li>
          ))}
        </ul>
      </section>

      <section className="mx-auto max-w-6xl px-4 pt-16 sm:px-6" aria-labelledby="titre-bureaux">
        <h2 id="titre-bureaux" className="text-2xl sm:text-3xl">
          Bureaux &amp; salles
        </h2>
        <ul className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {bureaux.map((f) => (
            <li key={f.slug}>
              <CarteEspace f={f} compacte />
            </li>
          ))}
        </ul>
      </section>

      <section className="mx-auto mt-24 max-w-6xl px-4 sm:px-6" aria-labelledby="titre-etapes">
        <div className="grid gap-10 border-t border-filet pt-12 lg:grid-cols-[1fr_2fr]">
          <div>
            <p className="surtitre">Réserver</p>
            <h2 id="titre-etapes" className="mt-3 text-2xl sm:text-3xl">
              Comment ça marche
            </h2>
          </div>
          <ol className="grid gap-8 sm:grid-cols-3">
            {[
              { t: "Choisissez", d: "L'espace, la date et le créneau, à l'heure ou à la journée, avec vos options." },
              { t: "Envoyez", d: "Votre demande part au studio. Vous recevez aussitôt le récapitulatif et son PDF." },
              { t: "C'est confirmé", d: "Le studio valide le créneau et vous prévient par e-mail." },
            ].map((e, i) => (
              <li key={e.t}>
                <span aria-hidden="true" className="chiffres font-titre text-4xl text-or">
                  0{i + 1}
                </span>
                <h3 className="mt-3 text-base">{e.t}</h3>
                <p className="mt-2 text-sm leading-relaxed text-gris">{e.d}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="mx-auto mt-20 max-w-6xl px-4 sm:px-6" aria-labelledby="titre-options">
        <div className="rounded-sm border border-filet bg-carte p-6 sm:p-8">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <h2 id="titre-options" className="text-xl sm:text-2xl">
              Options sur place
            </h2>
            <p className="text-sm text-gris">Selon l&apos;espace, à ajouter au moment de réserver.</p>
          </div>
          <ul className="mt-6 grid gap-x-10 sm:grid-cols-2">
            {opts.map((o) => (
              <li key={o.id} className="flex items-baseline justify-between gap-4 border-t border-filet-neutre py-4">
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
        </div>
      </section>

      <section className="mx-auto mt-20 max-w-6xl px-4 sm:px-6">
        <div className="flex flex-col items-start justify-between gap-6 border-y border-filet py-10 md:flex-row md:items-center">
          <div>
            <h2 className="text-xl sm:text-2xl">Un tournage sur plusieurs jours, un devis sur mesure</h2>
            <p className="mt-2 text-gris">
              Écrivez-nous :{" "}
              <a className="lien" href={`mailto:${CONTACT.email}`}>
                {CONTACT.email}
              </a>
            </p>
          </div>
          <Link href="/contact" className="btn btn-or">
            Nous contacter
          </Link>
        </div>
      </section>
    </>
  );
}
