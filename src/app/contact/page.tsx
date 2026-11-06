import type { Metadata } from "next";
import Link from "next/link";
import { EnvelopeSimple, InstagramLogo, Clock } from "@phosphor-icons/react/dist/ssr";
import { FormulaireContact } from "@/components/FormulaireContact";
import { CONTACT } from "@/data/catalogue";
import { STUDIO_EMAIL } from "@/lib/config";
import { FERMETURE, OUVERTURE } from "@/lib/regles";

export const metadata: Metadata = {
  title: "Contact",
  description: "Écrire au Studio 360 : question, devis sur plusieurs jours, visite des espaces.",
  alternates: { canonical: "/contact" },
};

export default function Contact() {
  return (
    <div className="mx-auto grid max-w-6xl gap-12 px-4 pt-12 sm:px-6 lg:grid-cols-[1fr_1.4fr] lg:gap-20">
      <div>
        <p className="surtitre">Contact</p>
        <h1 className="mt-3 text-3xl leading-tight sm:text-5xl">Parlons de votre projet</h1>
        <p className="mt-5 max-w-[50ch] text-gris">
          Une question, un tournage sur plusieurs jours, une visite avant de réserver : écrivez au studio. Pour un créneau précis,{" "}
          <Link href="/reserver" className="lien">
            la réservation en ligne
          </Link>{" "}
          montre les disponibilités en direct.
        </p>
        <ul className="mt-8 space-y-4 text-sm">
          <li className="flex items-center gap-3">
            <EnvelopeSimple size={20} className="text-or" aria-hidden="true" />
            <a href={`mailto:${STUDIO_EMAIL}`} className="lien">
              {STUDIO_EMAIL}
            </a>
          </li>
          {/* Compte Instagram repris de la maquette, à confirmer avec le client avant la mise en ligne. */}
          <li className="flex items-center gap-3">
            <InstagramLogo size={20} className="text-or" aria-hidden="true" />
            <a href={`https://www.instagram.com/${CONTACT.instagram}/`} className="lien" target="_blank" rel="noopener">
              @{CONTACT.instagram}
            </a>
          </li>
          <li className="flex items-center gap-3">
            <Clock size={20} className="text-or" aria-hidden="true" />
            <span>
              Ouvert de {OUVERTURE}h à {FERMETURE}h
            </span>
          </li>
        </ul>
      </div>
      <section aria-label="Formulaire de contact" className="rounded-sm border border-filet bg-carte p-5 sm:p-8">
        <FormulaireContact />
      </section>
    </div>
  );
}
