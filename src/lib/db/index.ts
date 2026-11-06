import "server-only";
import { drizzle as drizzlePglite } from "drizzle-orm/pglite";
import { drizzle as drizzlePostgres } from "drizzle-orm/postgres-js";
import { sql } from "drizzle-orm";
import * as schema from "./schema";
import { ESPACES, OPTIONS } from "@/data/catalogue";
import { PRIX_HEURE_SUP_DEFAUT } from "@/lib/regles";

// Deux moteurs, même schéma :
// - sans DATABASE_URL : PGlite, un vrai Postgres compilé en WASM, stocké dans ./data/pglite.
//   Sert au travail local : aucun compte, aucun service à lancer.
// - avec DATABASE_URL : un Postgres hébergé (Supabase, Neon...), via le pilote postgres.js.
//   prepare: false est demandé par la doc Supabase pour son pooler en mode transaction
//   (supabase.com/docs/guides/database/connecting-to-postgres, "Disable prepared statements").

type Db = ReturnType<typeof drizzlePglite<typeof schema>>;

const globalPourDb = globalThis as unknown as { __s360db?: Promise<Db> };

async function creer(): Promise<Db> {
  const url = process.env.DATABASE_URL;
  let db: Db;
  if (url) {
    const postgres = (await import("postgres")).default;
    db = drizzlePostgres(postgres(url, { prepare: false, max: 5 }), { schema }) as unknown as Db;
  } else {
    const { PGlite } = await import("@electric-sql/pglite");
    const { mkdirSync } = await import("node:fs");
    mkdirSync("./data", { recursive: true });
    db = drizzlePglite(new PGlite("./data/pglite"), { schema });
  }
  await initialiser(db);
  return db;
}

export function getDb() {
  globalPourDb.__s360db ??= creer();
  return globalPourDb.__s360db;
}

// Tables créées au démarrage si absentes : le schéma reste petit, pas besoin d'outil de migration.
// Toute colonne ajoutée dans schema.ts doit l'être ici aussi (ALTER TABLE ... ADD COLUMN IF NOT EXISTS).
async function initialiser(db: Db) {
  const ddl = `
    CREATE TABLE IF NOT EXISTS espaces (
      slug text PRIMARY KEY,
      prix_heure integer NOT NULL,
      prix_journee integer NOT NULL,
      prix_heure_sup integer NOT NULL,
      reservable boolean NOT NULL DEFAULT true
    );
    CREATE TABLE IF NOT EXISTS options (
      id text PRIMARY KEY,
      prix integer NOT NULL,
      active boolean NOT NULL DEFAULT true
    );
    CREATE TABLE IF NOT EXISTS reservations (
      id text PRIMARY KEY,
      ref text NOT NULL UNIQUE,
      espace text NOT NULL,
      date text NOT NULL,
      debut integer NOT NULL,
      fin integer NOT NULL,
      statut text NOT NULL DEFAULT 'a_confirmer',
      type_client text NOT NULL,
      nom text NOT NULL,
      email text NOT NULL,
      telephone text NOT NULL,
      adresse text, structure text, fonction text, siret text, tva text, message text,
      lignes_options jsonb NOT NULL,
      location_ht integer NOT NULL,
      options_ht integer NOT NULL,
      total_ht integer NOT NULL,
      montant_tva integer NOT NULL,
      total_ttc integer NOT NULL,
      note_studio text,
      cree_le timestamptz NOT NULL DEFAULT now(),
      maj_le timestamptz NOT NULL DEFAULT now()
    );
    ALTER TABLE reservations ADD COLUMN IF NOT EXISTS execution_avant_delai boolean NOT NULL DEFAULT false;
    ALTER TABLE reservations ADD COLUMN IF NOT EXISTS version_cgv text;
    ALTER TABLE reservations ADD COLUMN IF NOT EXISTS confirmee_le timestamptz;
    ALTER TABLE reservations ADD COLUMN IF NOT EXISTS retractation boolean NOT NULL DEFAULT false;
    CREATE INDEX IF NOT EXISTS reservations_espace_date ON reservations (espace, date);
    CREATE INDEX IF NOT EXISTS reservations_email ON reservations (email);
    CREATE TABLE IF NOT EXISTS blocages (
      id text PRIMARY KEY,
      espace text NOT NULL,
      date text NOT NULL,
      debut integer NOT NULL,
      fin integer NOT NULL,
      motif text,
      cree_le timestamptz NOT NULL DEFAULT now()
    );
    CREATE INDEX IF NOT EXISTS blocages_date ON blocages (date);
    CREATE TABLE IF NOT EXISTS jetons_connexion (
      hash text PRIMARY KEY,
      email text NOT NULL,
      expire_le timestamptz NOT NULL,
      utilise_le timestamptz,
      cree_le timestamptz NOT NULL DEFAULT now()
    );
    CREATE TABLE IF NOT EXISTS sessions (
      hash text PRIMARY KEY,
      email text NOT NULL,
      expire_le timestamptz NOT NULL
    );
    CREATE TABLE IF NOT EXISTS messages (
      id text PRIMARY KEY,
      nom text NOT NULL,
      email text NOT NULL,
      sujet text,
      texte text NOT NULL,
      cree_le timestamptz NOT NULL DEFAULT now()
    );
    CREATE TABLE IF NOT EXISTS limites (
      cle text NOT NULL,
      cree_le timestamptz NOT NULL DEFAULT now()
    );
    CREATE INDEX IF NOT EXISTS limites_cle_date ON limites (cle, cree_le);
  `;
  // Une requête par instruction : le protocole étendu de Postgres n'en accepte qu'une à la fois.
  for (const instruction of ddl.split(";").map((x) => x.trim()).filter(Boolean)) {
    await db.execute(sql.raw(instruction));
  }
  // Remplit les prix au premier démarrage, sans écraser ce que le studio a modifié ensuite.
  for (const e of ESPACES) {
    await db
      .insert(schema.espaces)
      .values({ slug: e.slug, prixHeure: e.prixHeure, prixJournee: e.prixJournee, prixHeureSup: PRIX_HEURE_SUP_DEFAUT })
      .onConflictDoNothing();
  }
  for (const o of OPTIONS) {
    await db.insert(schema.options).values({ id: o.id, prix: o.prix }).onConflictDoNothing();
  }
}

export { schema };
