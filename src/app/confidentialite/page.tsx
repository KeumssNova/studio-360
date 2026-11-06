import type { Metadata } from "next";
import Link from "next/link";
import { AC, PageLegale } from "@/components/PageLegale";
import { STUDIO_EMAIL } from "@/lib/config";
import { adressePage } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Politique de confidentialité",
  description: "Données collectées par le site Studio 360, pourquoi, combien de temps, et vos droits.",
  ...adressePage("/confidentialite"),
};

// Contenu : RGPD (règlement UE 2016/679), art. 13 (information au moment de la collecte : responsable,
// finalités, base légale, destinataires, transferts hors UE, durée de conservation, droits, réclamation
// auprès de la CNIL) et art. 6.1 pour les bases légales. Page séparée des conditions générales et
// accessible depuis toutes les pages (lien dans le pied de page), comme le demande la fiche F37351 de
// service-public.
// Cookies : loi Informatique et Libertés, art. 82, et FAQ de la CNIL du 29 avril 2026 : un cookie
// d'authentification est exempté de consentement, donc pas de bandeau. L'article 82 n'impose pas d'en
// informer, la CNIL le recommande : d'où la section Cookies.
// Ce qui est décrit ici est relevé dans le code (lib/db, lib/auth.ts, auth/google). Le modifier si le code change.
// Les durées de conservation ne sont pas encore fixées : aujourd'hui, réservations et messages restent en base
// sans limite. Le studio doit les choisir (référentiels de la CNIL), puis le site doit les appliquer.
export default function Confidentialite() {
  return (
    <PageLegale surtitre="Informations légales" titre="Politique de confidentialité" version="6 novembre 2026">
      <h2>Responsable du traitement</h2>
      <p>
        <AC>dénomination sociale et adresse</AC>, joignable à <a href={`mailto:${STUDIO_EMAIL}`}>{STUDIO_EMAIL}</a>.
      </p>

      <h2>Ce que le site collecte, et pourquoi</h2>
      <h3>Demande de réservation</h3>
      <p>
        Profil (particulier, société ou association), nom, e-mail, téléphone, et selon le profil structure, fonction, SIRET, numéro de
        TVA et adresse, votre message, ainsi que l&apos;espace, le créneau et les options choisis. Ces données servent à traiter la
        demande, à vous prévenir de sa confirmation et à établir le récapitulatif. Base légale : le contrat de location et les
        mesures prises à votre demande avant sa conclusion (RGPD, art. 6.1 b). Une partie est gardée pour la comptabilité du
        studio : obligation légale (art. 6.1 c).
      </p>
      <h3>Formulaire de contact</h3>
      <p>
        Nom, e-mail, sujet et message, pour vous répondre. Base légale : l&apos;intérêt légitime du studio à répondre aux questions
        qu&apos;on lui pose (art. 6.1 f).
      </p>
      <h3>Connexion à votre compte</h3>
      <p>
        Votre e-mail, pour vous envoyer un lien de connexion et retrouver vos réservations. Avec « Continuer avec Google », le site
        ne reçoit de Google que votre adresse e-mail et la confirmation qu&apos;elle est vérifiée. Base légale : le service de compte
        que vous demandez (art. 6.1 b).
      </p>
      <h3>Protection contre les envois en masse</h3>
      <p>
        Quand vous envoyez une demande, un message ou une demande de lien de connexion, le site garde une empreinte de votre
        adresse IP (une suite de caractères calculée à partir d&apos;elle, sans l&apos;adresse elle-même) et l&apos;heure de
        l&apos;envoi. Elle sert seulement à limiter le nombre d&apos;envois par heure depuis une même connexion, contre les
        robots. Base légale : l&apos;intérêt légitime du studio à protéger son site (art. 6.1 f).
      </p>
      <p>Le site ne fait aucune mesure d&apos;audience, aucune publicité, et ne vend ni ne prête vos données.</p>

      <h2>Qui y a accès</h2>
      <ul>
        <li>Les personnes du studio chargées des réservations.</li>
        <li>
          L&apos;hébergeur du site : <AC>nom</AC>.
        </li>
        <li>
          Le prestataire qui envoie les e-mails du site : <AC>nom</AC>.
        </li>
        <li>Google, seulement si vous choisissez de vous connecter avec Google.</li>
      </ul>
      <p>
        Transferts hors de l&apos;Union européenne : <AC>à compléter selon l&apos;hébergeur et le prestataire d&apos;e-mail, avec la
        garantie qui encadre le transfert</AC>.
      </p>

      <h2>Combien de temps</h2>
      <ul>
        <li>Lien de connexion : valable 10 minutes, utilisable une seule fois.</li>
        <li>Session : 30 jours, ou jusqu&apos;à la déconnexion.</li>
        <li>Empreinte de l&apos;adresse IP : 24 heures au plus, puis effacée.</li>
        <li>
          Réservations : <AC>durée à fixer, puis archivage limité aux pièces comptables</AC>.
        </li>
        <li>
          Messages du formulaire de contact : <AC>durée à fixer</AC>.
        </li>
      </ul>

      <h2>Vos droits</h2>
      <p>
        Vous pouvez accéder à vos données, les faire corriger ou effacer, limiter leur utilisation, vous y opposer, et les récupérer
        dans un format lisible (RGPD, art. 15 à 21). Écrivez à <a href={`mailto:${STUDIO_EMAIL}`}>{STUDIO_EMAIL}</a>. Si la réponse
        ne vous satisfait pas, vous pouvez adresser une réclamation à la CNIL (<a href="https://www.cnil.fr">cnil.fr</a>).
      </p>

      <h2 id="cookies">Cookies</h2>
      <p>Le site pose deux cookies, tous deux nécessaires à la connexion, et aucun autre. Ils ne demandent pas votre accord.</p>
      <ul>
        <li>
          <strong>s360_session</strong> : vous garde connecté. Posé à la connexion, il dure 30 jours ou jusqu&apos;à la déconnexion.
        </li>
        <li>
          <strong>s360_google</strong> : protège la connexion avec Google contre la falsification. Posé seulement si vous cliquez sur
          « Continuer avec Google », il dure 10 minutes.
        </li>
      </ul>
      <p>
        Les polices et les photos sont servies par le site lui-même : afficher une page n&apos;envoie rien à un autre service. Pour
        les conditions de location, voir les <Link href="/cgv">conditions générales</Link>.
      </p>
    </PageLegale>
  );
}
