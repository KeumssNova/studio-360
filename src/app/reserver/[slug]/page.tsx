import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "@phosphor-icons/react/dist/ssr";
import { FormulaireReservation } from "@/components/FormulaireReservation";
import { espaceParSlug } from "@/data/catalogue";
import { FERMETURE, HORIZON_JOURS, ajouterJours, maintenantParis } from "@/lib/regles";
import { optionsDe } from "@/lib/reservations";
import { OG_BASE, imagePartage } from "@/lib/seo";
import { espacesVitrine } from "@/lib/vitrine";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const e = espaceParSlug((await params).slug);
  if (!e) return {};
  return {
    title: `Réserver : ${e.nom}`,
    description: `Date, créneau et options pour ${e.nom}. Demande confirmée par le studio.`,
    alternates: { canonical: `/reserver/${e.slug}` },
    openGraph: { ...OG_BASE, images: imagePartage(e) },
  };
}

export default async function ReserverEspace({ params }: Props) {
  const { slug } = await params;
  const liste = await espacesVitrine();
  const e = liste.find((x) => x.slug === slug);
  if (!e) notFound();

  if (!e.reservable)
    return (
      <div className="mx-auto max-w-2xl px-4 pt-16 sm:px-6">
        <p className="surtitre">Réserver</p>
        <h1 className="mt-3 text-3xl">{e.nom}</h1>
        <p className="mt-5 text-gris">
          La réservation en ligne est fermée pour cet espace en ce moment.{" "}
          <Link className="lien" href="/contact">
            Contactez le studio
          </Link>{" "}
          pour une date.
        </p>
        <Link href="/reserver" className="btn btn-discret mt-8">
          Choisir un autre espace
        </Link>
      </div>
    );

  const options = await optionsDe(slug);
  const m = maintenantParis();
  // Après 16h, toutes les heures du jour sont entamées (heuresPassees) : le premier jour proposé est demain.
  const premierJour = m.heure < FERMETURE - 1 ? m.date : ajouterJours(m.date, 1);
  const freres = e.groupe ? liste.filter((x) => x.groupe === e.groupe && x.reservable).map((x) => ({ slug: x.slug, nom: x.nom })) : [];

  return (
    <div className="mx-auto max-w-6xl px-4 pt-8 sm:px-6">
      <Link href={`/espaces/${e.slug}`} className="inline-flex min-h-11 items-center gap-2 text-sm text-gris hover:text-or">
        <ArrowLeft size={16} /> Retour à la fiche
      </Link>
      <p className="surtitre mt-4">Réserver{e.studio ? ` · ${e.studio}` : ""}</p>
      <h1 className="mt-3 text-3xl leading-tight sm:text-4xl">{e.nom}</h1>

      <FormulaireReservation
        espace={{
          slug: e.slug,
          nom: e.nom,
          studio: e.studio,
          photo: e.photos[0],
          tarif: { prixHeure: e.prixHeure, prixJournee: e.prixJournee, prixHeureSup: e.prixHeureSup },
        }}
        options={options}
        premierJour={premierJour}
        dernierJour={ajouterJours(m.date, HORIZON_JOURS)}
        freres={freres}
      />
    </div>
  );
}
