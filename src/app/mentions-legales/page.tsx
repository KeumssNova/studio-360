import type { Metadata } from "next";
import Link from "next/link";
import { AC, PageLegale } from "@/components/PageLegale";
import { STUDIO_EMAIL } from "@/lib/config";
import { adressePage } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Mentions légales",
  description: "Éditeur, directeur de la publication et hébergeur du site Studio 360.",
  ...adressePage("/mentions-legales"),
};

// Contenu obligatoire : loi n° 2004-575 du 21 juin 2004 (LCEN), art. 1-1 (créé par la loi SREN
// n° 2024-449 du 21 mai 2024, ancien art. 6 III) et art. 19 pour un site qui vend des prestations.
// Liste reprise de la fiche F37351 de service-public (« Vérifié le 13 octobre 2026 ») pour une société :
// dénomination, forme juridique, capital, siège, e-mail, téléphone, numéro RCS ou RNE, numéro de TVA,
// directeur de la publication, nom, adresse et téléphone de l'hébergeur. Sanction prévue pour une
// personne morale : 375 000 € d'amende (même fiche).
// Pour une entreprise individuelle, la liste change (nom et prénom au lieu de la dénomination) :
// à reprendre une fois la forme juridique connue.
export default function MentionsLegales() {
  return (
    <PageLegale surtitre="Informations légales" titre="Mentions légales" version="6 novembre 2026">
      <h2>Éditeur du site</h2>
      <p>
        Le site est édité par <AC>dénomination sociale</AC>, <AC>forme juridique</AC> au capital de <AC>montant</AC> €, dont le
        siège est situé <AC>adresse du siège</AC>.
      </p>
      <ul>
        <li>
          Immatriculation : <AC>numéro RCS ou RNE</AC>
        </li>
        <li>
          Numéro de TVA intracommunautaire : <AC>numéro</AC>
        </li>
        <li>
          E-mail : <a href={`mailto:${STUDIO_EMAIL}`}>{STUDIO_EMAIL}</a>
        </li>
        <li>
          Téléphone : <AC>numéro</AC>
        </li>
      </ul>

      <h2>Directeur de la publication</h2>
      <p>
        <AC>nom et qualité du responsable, en principe le représentant légal</AC>
      </p>

      <h2>Hébergeur</h2>
      <p>
        <AC>nom, adresse et téléphone de l&apos;hébergeur, connus une fois l&apos;hébergement choisi</AC>
      </p>

      <h2>Photos et contenus</h2>
      {/* Code de la propriété intellectuelle, art. L122-4 : toute reproduction sans le consentement de
          l'auteur ou de ses ayants droit est illicite. Auteur des photos à confirmer avec le client. */}
      <p>
        Les photos, textes et logos du site appartiennent à Studio 360 ou à leurs auteurs (photos : <AC>auteur à confirmer</AC>).
        Leur reproduction sans accord écrit est interdite (Code de la propriété intellectuelle, art. L122-4).
      </p>

      <h2>Données personnelles et cookies</h2>
      <p>
        Ce que le site collecte, pourquoi et combien de temps : voir la <Link href="/confidentialite">politique de confidentialité</Link>.
      </p>

      <h2>Conditions de location</h2>
      <p>
        Réservations, annulation, rétractation et médiation : voir les <Link href="/cgv">conditions générales</Link>.
      </p>
    </PageLegale>
  );
}
