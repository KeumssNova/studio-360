import type { Metadata } from "next";
import Link from "next/link";
import { AC, PageLegale } from "@/components/PageLegale";
import { STUDIO_EMAIL } from "@/lib/config";
import { FERMETURE, OUVERTURE, TAUX_TVA, VERSION_CGV } from "@/lib/regles";

export const metadata: Metadata = {
  title: "Conditions générales de location",
  description: "Réservation, prix, annulation, droit de rétractation et médiation pour la location des espaces Studio 360.",
};

// Sources vérifiées le 6 novembre 2026 (articles du Code de la consommation lus via french-business-law.com,
// qui reprend Légifrance avec les identifiants LEGIARTI, et fiches officielles) :
// - Information avant le contrat : art. L111-1 (consommateurs) et L221-5 (contrats à distance, version du
//   19 juin 2026, LEGIARTI000053310511). Entre professionnels : Code de commerce, art. L441-1.
// - Rétractation : L221-18 (14 jours à compter de la conclusion pour un service), L221-25 (demande expresse,
//   paiement au prorata), L221-28 1° (plus de rétractation une fois le service pleinement exécuté avec accord
//   exprès et reconnaissance de la perte du droit), L221-21 et D221-5 (fonctionnalité de rétractation en ligne,
//   en vigueur depuis le 19 juin 2026, voir components/BoutonAnnuler.tsx).
// - Location à date déterminée (L221-28 12°) : l'article vise l'hébergement, le transport de biens, la location
//   de voitures, la restauration et les loisirs. La location d'un studio n'y figure pas clairement : zone grise,
//   on applique donc le droit de rétractation. À trancher par un professionnel.
// - Médiation : L612-1 (le professionnel garantit un recours gratuit à un médiateur), L612-2 (réclamation écrite
//   au professionnel d'abord), L616-1 (coordonnées du médiateur sur le site et dans les conditions générales).
// - Prix TTC pour les particuliers : L112-1 (fiche DDPP des Hauts-de-Seine, voir lib/format.ts).
// - Pénalités de retard entre professionnels : Code de commerce, art. L441-10 II et D441-5 (indemnité de 40 €).
//   Lu seulement dans des sources secondaires (Lefebvre Dalloz, cabinets d'avocats) : texte officiel à vérifier.
// - Clause de juridiction : Code de procédure civile, art. 48, valable seulement entre commerçants.
// Les conditions d'annulation ci-dessous décrivent ce que le site fait aujourd'hui (annulation sans frais par le
// lien de la réservation, jusqu'au jour même). Provisoire : le studio doit fixer les siennes.
export default function Cgv() {
  return (
    <PageLegale surtitre="Informations légales" titre="Conditions générales de location" version={VERSION_CGV}>
      <h2>1. Objet</h2>
      <p>
        Ces conditions s&apos;appliquent à la location des espaces de Studio 360 (plateaux, studios, salles et bureaux) réservés sur
        ce site, par un particulier comme par un professionnel ou une association. Elles sont acceptées à l&apos;envoi de chaque
        demande. Le studio est exploité par <AC>dénomination sociale</AC>, dont les coordonnées figurent dans les{" "}
        <Link href="/mentions-legales">mentions légales</Link>.
      </p>

      <h2>2. Espaces et horaires</h2>
      <p>
        Chaque espace a sa fiche : surface, équipements, photos, prix et options. Le studio est ouvert de {OUVERTURE}h à {FERMETURE}h.
        On loue à l&apos;heure (1 heure minimum) ou à la journée, de {OUVERTURE}h à {FERMETURE}h. Pour plusieurs jours, le studio
        établit un devis sur demande.
      </p>

      <h2>3. Prix</h2>
      <p>
        Les prix sont indiqués hors taxes, avec le prix toutes taxes comprises à côté (TVA {TAUX_TVA * 100} %). La première heure est
        facturée au tarif horaire de l&apos;espace, chaque heure suivante au tarif d&apos;heure supplémentaire indiqué sur sa fiche, et
        le total ne dépasse jamais le tarif journée. Les options s&apos;ajoutent au prix indiqué. Le montant total, hors taxes et
        toutes taxes comprises, s&apos;affiche avant l&apos;envoi de la demande et figure sur le récapitulatif.{" "}
        <Link href="/tarifs">Fiche tarifaire</Link>.
      </p>
      <p>
        Une caution peut être demandée : <AC>montant, forme et conditions de restitution</AC>.
      </p>

      <h2>4. Réservation</h2>
      <ol>
        <li>Vous choisissez l&apos;espace, la date, le créneau et les options, puis vous remplissez vos coordonnées.</li>
        <li>Vous acceptez ces conditions et envoyez la demande. Le créneau est alors bloqué pour les autres.</li>
        <li>
          Le studio confirme ou refuse par e-mail. <strong>Le contrat est conclu à la confirmation du studio.</strong>
        </li>
      </ol>
      <p>
        Chaque demande a sa page, avec son récapitulatif en PDF. Le lien de cette page arrive par e-mail : gardez-le, il sert aussi à
        annuler.
      </p>

      <h2>5. Paiement</h2>
      <p>
        Rien ne se paie sur le site. Moment et moyens de paiement : <AC>à fixer par le studio (acompte, solde, virement, carte…)</AC>.
      </p>
      <p>
        Entre professionnels, tout retard de paiement entraîne des pénalités au taux de <AC>taux, au moins trois fois le taux
        d&apos;intérêt légal</AC> et une indemnité forfaitaire de 40 € pour frais de recouvrement (Code de commerce, art. L441-10 et
        D441-5).
      </p>

      <h2>6. Annulation</h2>
      <h3>Par vous</h3>
      <p>
        Vous pouvez annuler sans frais jusqu&apos;au jour de la location, depuis la page de votre réservation ou votre compte. Vous
        recevez une confirmation par e-mail. <AC>Conditions provisoires : le studio doit fixer son délai et ses frais
        d&apos;annulation</AC>.
      </p>
      <h3>Par le studio</h3>
      <p>
        Si le studio doit annuler une réservation confirmée, il vous prévient par e-mail. <AC>Remboursement des sommes déjà
        versées et délai</AC>.
      </p>

      <h2 id="retractation">7. Droit de rétractation (particuliers)</h2>
      <p>
        Si vous réservez en tant que particulier, vous disposez de 14 jours pour vous rétracter, sans motif ni frais, à compter de la
        confirmation du studio (Code de la consommation, art. L221-18).
      </p>
      <h3>Si la location a lieu pendant ce délai</h3>
      <p>
        Le formulaire vous demande de cocher une case pour que la location ait lieu à la date choisie, même avant la fin du délai
        (art. L221-25). Si vous vous rétractez après le début de la location, vous payez la part déjà réalisée, au prorata. Une fois
        la location entièrement réalisée, vous ne pouvez plus vous rétracter (art. L221-28, 1°).
      </p>
      <h3>Comment vous rétracter</h3>
      <ul>
        <li>
          Sur la page de votre réservation, bouton <strong>« Renoncer au contrat ici »</strong>, puis « Confirmer la rétractation ».
          Un accusé de réception vous est envoyé par e-mail avec la date et l&apos;heure (art. L221-21).
        </li>
        <li>
          Ou par e-mail à <a href={`mailto:${STUDIO_EMAIL}`}>{STUDIO_EMAIL}</a>, ou par courrier, avec une déclaration claire ou le
          formulaire ci-dessous.
        </li>
      </ul>
      {/* Formulaire type : annexe à l'article R221-1 du Code de la consommation, texte issu du décret
          n° 2014-1061. Une modification par le décret n° 2026-3 du 5 janvier 2026 n'a pas été vérifiée : à relire. */}
      <h3>Formulaire de rétractation</h3>
      <div className="mt-2 rounded-sm border border-filet-neutre p-4 text-sm">
        <p>(Complétez et renvoyez ce formulaire uniquement si vous souhaitez vous rétracter du contrat.)</p>
        <p>
          À l&apos;attention de <AC>dénomination sociale, adresse</AC>, {STUDIO_EMAIL} :
        </p>
        <p>
          Je vous notifie par la présente ma rétractation du contrat portant sur la prestation de services ci-dessous :
          <br />
          Location réservée le : …
          <br />
          Référence de la réservation : …
          <br />
          Nom : …
          <br />
          Adresse : …
          <br />
          Signature (uniquement pour un envoi sur papier) : …
          <br />
          Date : …
        </p>
      </div>

      <h2>8. Utilisation des espaces</h2>
      <p>
        <AC>Règlement à fournir par le studio : nombre de personnes, matériel, état des lieux, dégâts, assurance demandée, accès et
        horaires de montage</AC>
      </p>

      <h2>9. Données personnelles</h2>
      <p>
        Les informations de la demande servent à traiter votre réservation. Le détail est dans la{" "}
        <Link href="/confidentialite">politique de confidentialité</Link>.
      </p>

      <h2>10. Réclamation et médiation</h2>
      <p>
        Pour toute réclamation, écrivez d&apos;abord au studio : <a href={`mailto:${STUDIO_EMAIL}`}>{STUDIO_EMAIL}</a>.
      </p>
      <p>
        Particuliers : sans solution, vous pouvez saisir gratuitement le médiateur de la consommation du studio,{" "}
        <AC>nom, site internet et adresse du médiateur</AC> (Code de la consommation, art. L612-1 et L616-1).
      </p>
      <p>
        Professionnels : les litiges relèvent du <AC>tribunal compétent, à choisir</AC>.
      </p>

      <h2>11. Droit applicable</h2>
      <p>Ces conditions sont soumises au droit français.</p>
    </PageLegale>
  );
}
