import { pgTable, text, integer, boolean, timestamp, jsonb, index } from "drizzle-orm/pg-core";

// Ce qui se modifie dans /gestion. Le reste du contenu d'un espace (textes, photos) vit dans
// src/data/catalogue.ts.
export const espaces = pgTable("espaces", {
  slug: text("slug").primaryKey(),
  prixHeure: integer("prix_heure").notNull(), // € HT
  prixJournee: integer("prix_journee").notNull(),
  prixHeureSup: integer("prix_heure_sup").notNull(),
  reservable: boolean("reservable").notNull().default(true),
});

export const options = pgTable("options", {
  id: text("id").primaryKey(),
  prix: integer("prix").notNull(), // € HT
  active: boolean("active").notNull().default(true),
});

export type Statut = "a_confirmer" | "confirmee" | "refusee" | "annulee";
export type TypeClient = "particulier" | "societe" | "association";

export const reservations = pgTable(
  "reservations",
  {
    id: text("id").primaryKey(), // aléatoire, 128 bits : sert aussi de clé d'accès au récapitulatif
    ref: text("ref").notNull().unique(), // lisible, ex. S360-7K2QF
    espace: text("espace").notNull(),
    date: text("date").notNull(), // AAAA-MM-JJ, heure de Paris
    debut: integer("debut").notNull(),
    fin: integer("fin").notNull(),
    statut: text("statut").$type<Statut>().notNull().default("a_confirmer"),
    typeClient: text("type_client").$type<TypeClient>().notNull(),
    nom: text("nom").notNull(),
    email: text("email").notNull(), // en minuscules
    telephone: text("telephone").notNull(),
    adresse: text("adresse"),
    structure: text("structure"), // société ou association
    fonction: text("fonction"),
    siret: text("siret"),
    tva: text("tva"),
    message: text("message"),
    // Particulier : demande expresse que la location ait lieu avant la fin du délai de rétractation (art. L221-25).
    executionAvantDelai: boolean("execution_avant_delai").notNull().default(false),
    versionCgv: text("version_cgv"), // version des conditions générales acceptée à l'envoi (VERSION_CGV)
    // Conclusion du contrat (confirmation du studio) : point de départ du délai de rétractation (art. L221-18).
    confirmeeLe: timestamp("confirmee_le", { withTimezone: true }),
    // Annulation par un particulier dans le délai légal : c'est une rétractation (remboursement sous 14 jours, art. L221-24).
    retractation: boolean("retractation").notNull().default(false),
    lignesOptions: jsonb("lignes_options").$type<{ id: string; nom: string; prix: number; quantite: number }[]>().notNull(),
    locationHt: integer("location_ht").notNull(), // centimes
    optionsHt: integer("options_ht").notNull(),
    totalHt: integer("total_ht").notNull(),
    montantTva: integer("montant_tva").notNull(),
    totalTtc: integer("total_ttc").notNull(),
    noteStudio: text("note_studio"),
    creeLe: timestamp("cree_le", { withTimezone: true }).notNull().defaultNow(),
    majLe: timestamp("maj_le", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("reservations_espace_date").on(t.espace, t.date), index("reservations_email").on(t.email)],
);

export const blocages = pgTable(
  "blocages",
  {
    id: text("id").primaryKey(),
    espace: text("espace").notNull(), // slug, ou "*" pour tout le studio
    date: text("date").notNull(),
    debut: integer("debut").notNull(),
    fin: integer("fin").notNull(),
    motif: text("motif"),
    creeLe: timestamp("cree_le", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("blocages_date").on(t.date)],
);

export const jetonsConnexion = pgTable("jetons_connexion", {
  hash: text("hash").primaryKey(), // SHA-256 du jeton envoyé par e-mail : le jeton lui-même n'est jamais stocké
  email: text("email").notNull(),
  expireLe: timestamp("expire_le", { withTimezone: true }).notNull(),
  utiliseLe: timestamp("utilise_le", { withTimezone: true }),
  creeLe: timestamp("cree_le", { withTimezone: true }).notNull().defaultNow(),
});

export const sessions = pgTable("sessions", {
  hash: text("hash").primaryKey(),
  email: text("email").notNull(),
  expireLe: timestamp("expire_le", { withTimezone: true }).notNull(),
});

export const messages = pgTable("messages", {
  id: text("id").primaryKey(),
  nom: text("nom").notNull(),
  email: text("email").notNull(),
  sujet: text("sujet"),
  texte: text("texte").notNull(),
  creeLe: timestamp("cree_le", { withTimezone: true }).notNull().defaultNow(),
});
