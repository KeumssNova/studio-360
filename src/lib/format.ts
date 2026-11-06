import { TAUX_TVA } from "./regles.ts";

const eur = new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", minimumFractionDigits: 0, maximumFractionDigits: 2 });

/** Centimes vers « 1 080 € » ou « 12,50 € ». */
export const euros = (centimes: number) => eur.format(centimes / 100);
/** Euros entiers (prix du catalogue). */
export const prix = (e: number) => eur.format(e);

export function dateLongue(date: string) {
  return new Intl.DateTimeFormat("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }).format(
    new Date(`${date}T12:00:00Z`),
  );
}
export function dateCourte(date: string) {
  return new Intl.DateTimeFormat("fr-FR", { weekday: "short", day: "numeric", month: "short", timeZone: "UTC" }).format(
    new Date(`${date}T12:00:00Z`),
  );
}
export const horaire = (debut: number, fin: number) => `${debut}h à ${fin}h`;

export const LIBELLE_STATUT = {
  a_confirmer: "À confirmer",
  confirmee: "Confirmée",
  refusee: "Refusée",
  annulee: "Annulée",
} as const;

export const LIBELLE_TYPE = { particulier: "Particulier", societe: "Professionnel / Société", association: "Association" } as const;

export const majuscule = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

// Prix TTC à côté du prix HT : un particulier doit connaître le prix toutes taxes comprises avant de réserver
// (Code de la consommation, art. L112-1 ; « exprimés en euros et toutes taxes comprises », fiche « L'information
// sur les prix » de la DDPP des Hauts-de-Seine). Même calcul que devis() dans regles.ts : TVA arrondie au centime.
export const prixTtc = (e: number) => euros(e * 100 + Math.round(e * 100 * TAUX_TVA));
