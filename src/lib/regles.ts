// Règles de location et de prix. Fonctions pures : testées dans tests/regles.test.ts.
//
// Source des règles : la maquette du client (fiche espace et récapitulatif de /reserver) :
//   « Ouvert de 8h à 17h. Location à l'heure (1 h minimum) ou à la journée (8h–17h). »
//   « 1 h minimum • + 40 € / heure supplémentaire • plafonné au tarif journée. »
// Lecture retenue, littérale et À CONFIRMER avec le client : la première heure au tarif horaire de
// l'espace, chaque heure suivante à 40 € HT, le tout plafonné au tarif journée.
// Exemple, Grand Plateau TV (120 € / 450 €) : 1 h = 120, 3 h = 200, 9 h = 450 (journée).
//
// TVA : taux normal de 20 % (Code général des impôts, art. 278), celui de la maquette.

import type { OptionId } from "../data/catalogue.ts";

export const OUVERTURE = 8; // 8h
export const FERMETURE = 17; // 17h
export const TAUX_TVA = 0.2;
export const PRIX_HEURE_SUP_DEFAUT = 40; // € HT, maquette
export const HORIZON_JOURS = 548; // 18 mois de réservation à l'avance. Provisoire, sans source : à confirmer.

export type Tarif = { prixHeure: number; prixJournee: number; prixHeureSup: number };
export type Plage = { debut: number; fin: number }; // heures entières, fin exclue
export type LigneOption = { id: OptionId; nom: string; prix: number; quantite: number };

export function estJournee(p: Plage) {
  return p.debut === OUVERTURE && p.fin === FERMETURE;
}

export function plageValide(p: Plage) {
  return (
    Number.isInteger(p.debut) &&
    Number.isInteger(p.fin) &&
    p.debut >= OUVERTURE &&
    p.fin <= FERMETURE &&
    p.fin - p.debut >= 1
  );
}

/** Prix de la location seule, en euros HT. */
export function prixLocation(t: Tarif, p: Plage): number {
  if (!plageValide(p)) throw new Error("Plage horaire invalide");
  if (estJournee(p)) return t.prixJournee;
  const heures = p.fin - p.debut;
  return Math.min(t.prixHeure + t.prixHeureSup * (heures - 1), t.prixJournee);
}

/** Montants en centimes, pour éviter les arrondis de flottants. */
export function devis(t: Tarif, p: Plage, options: LigneOption[]) {
  const locationHt = prixLocation(t, p) * 100;
  const optionsHt = options.reduce((s, o) => s + o.prix * 100 * o.quantite, 0);
  const totalHt = locationHt + optionsHt;
  const tva = Math.round(totalHt * TAUX_TVA);
  return { locationHt, optionsHt, totalHt, tva, totalTtc: totalHt + tva };
}

export function chevauche(a: Plage, b: Plage) {
  return a.debut < b.fin && b.debut < a.fin;
}

/** Heures h dont le créneau [h, h+1) est pris par au moins une plage. */
export function heuresPrises(plages: Plage[]): number[] {
  const prises = new Set<number>();
  for (const p of plages) for (let h = Math.max(p.debut, OUVERTURE); h < Math.min(p.fin, FERMETURE); h++) prises.add(h);
  return [...prises].sort((a, b) => a - b);
}

/** Date et heure à Paris, quel que soit le fuseau du serveur (les hébergeurs tournent en UTC). */
export function maintenantParis(d = new Date()) {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-CA", {
      timeZone: "Europe/Paris",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      hourCycle: "h23",
    })
      .formatToParts(d)
      .map((x) => [x.type, x.value]),
  );
  return { date: `${parts.year}-${parts.month}-${parts.day}`, heure: Number(parts.hour) };
}

export function ajouterJours(date: string, n: number) {
  const d = new Date(`${date}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

export function dateValide(date: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return false;
  const d = new Date(`${date}T12:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === date;
}

/** Heures déjà passées aujourd'hui (une heure entamée n'est plus réservable). */
export function heuresPassees(date: string, maintenant = maintenantParis()): number[] {
  if (date < maintenant.date) return range(OUVERTURE, FERMETURE);
  if (date > maintenant.date) return [];
  return range(OUVERTURE, Math.min(FERMETURE, maintenant.heure + 1));
}

export function dateReservable(date: string, maintenant = maintenantParis()) {
  return dateValide(date) && date >= maintenant.date && date <= ajouterJours(maintenant.date, HORIZON_JOURS);
}

export function range(a: number, b: number) {
  return Array.from({ length: Math.max(0, b - a) }, (_, i) => a + i);
}

// Version des conditions générales publiées sur /cgv. À changer à chaque modification du texte :
// chaque réservation garde la version acceptée, pour savoir quel texte s'applique en cas de litige.
export const VERSION_CGV = "6 novembre 2026";

/* ---------- Délai de rétractation (particuliers) ---------- */

// Dimanche de Pâques, algorithme grégorien anonyme (Meeus, Jones, Butcher), repris dans
// J. Meeus, « Astronomical Algorithms », chap. 8. Rend AAAA-MM-JJ.
export function paques(annee: number) {
  const a = annee % 19;
  const b = Math.floor(annee / 100);
  const c = annee % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const mois = Math.floor((h + l - 7 * m + 114) / 31);
  const jour = ((h + l - 7 * m + 114) % 31) + 1;
  return `${annee}-${String(mois).padStart(2, "0")}-${String(jour).padStart(2, "0")}`;
}

// Fêtes légales : Code du travail, art. L3133-1 (1er janvier, lundi de Pâques, 1er mai, 8 mai, Ascension,
// lundi de Pentecôte, 14 juillet, 15 août, 1er novembre, 11 novembre, 25 décembre). L'Alsace-Moselle en a deux
// de plus (art. L3134-13) : à ajouter si le studio s'y trouve. Les jours « chômés » propres à une entreprise
// ne se calculent pas.
export function jourFerie(date: string) {
  const annee = Number(date.slice(0, 4));
  const p = paques(annee);
  const fixes = ["01-01", "05-01", "05-08", "07-14", "08-15", "11-01", "11-11", "12-25"].map((j) => `${annee}-${j}`);
  return [...fixes, ajouterJours(p, 1), ajouterJours(p, 39), ajouterJours(p, 50)].includes(date);
}

/**
 * Dernier jour (AAAA-MM-JJ, heure de Paris) pour se rétracter d'un contrat conclu le jour donné.
 * Code de la consommation, art. L221-18 (14 jours) et L221-19 (Légifrance, LEGIARTI000032226840, lu le
 * 6 novembre 2026) : le jour de la conclusion n'est pas compté, le délai finit à la dernière heure du dernier
 * jour, et s'il expire un samedi, un dimanche ou un jour férié, il va jusqu'au premier jour ouvrable suivant.
 */
export function finDelaiRetractation(conclusion: string) {
  let fin = ajouterJours(conclusion, 14);
  const weekEnd = (d: string) => [0, 6].includes(new Date(`${d}T12:00:00Z`).getUTCDay());
  while (weekEnd(fin) || jourFerie(fin)) fin = ajouterJours(fin, 1);
  return fin;
}
