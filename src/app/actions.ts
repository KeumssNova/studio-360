"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { cheminSur, envoyerLienConnexion, fermerSession, utilisateurCourant, validerJeton } from "@/lib/auth";
import {
  ajouterBlocage,
  changerStatut,
  creerDemande,
  enregistrerMessage,
  modifierOption,
  modifierTarif,
  reservationParId,
  supprimerBlocage,
  type ResultatDemande,
} from "@/lib/reservations";
import type { Statut } from "@/lib/db/schema";
import { FERMETURE, OUVERTURE, maintenantParis } from "@/lib/regles";

// Les Server Actions sont des points d'entrée publics : chacune revérifie qui appelle
// (doc Next.js 16, guides/data-security, « Authentication and authorization »).

/* ---------- Réservation ---------- */

export async function envoyerDemande(donnees: unknown): Promise<ResultatDemande> {
  return creerDemande(donnees);
}

// Le lien privé de la réservation (identifiant aléatoire de 128 bits, envoyé seulement au client) suffit à annuler,
// sans connexion : la rétractation d'un particulier doit être « facile, directe et permanente » (art. L221-21 du
// Code de la consommation, version du 19 juin 2026). L'accusé de réception part à l'adresse de la demande, donc
// le client voit toute annulation faite avec son lien.
export async function annulerMaDemande(id: string) {
  const r = await reservationParId(id);
  if (!r) return { ok: false as const, erreur: "Réservation introuvable." };
  if (r.statut !== "a_confirmer" && r.statut !== "confirmee") return { ok: false as const, erreur: "Déjà close." };
  if (r.date < maintenantParis().date) return { ok: false as const, erreur: "La date est passée." };
  const res = await changerStatut(id, "annulee", undefined, "client");
  revalidatePath("/compte");
  revalidatePath(`/reservation/${id}`);
  return res;
}

/* ---------- Connexion ---------- */

export type EtatConnexion = { ok?: boolean; erreur?: string; email?: string };

export async function demanderLien(_: EtatConnexion, f: FormData): Promise<EtatConnexion> {
  const email = z.email().safeParse(String(f.get("email") ?? "").trim());
  if (!email.success) return { erreur: "Adresse e-mail invalide." };
  if (f.get("site")) return { ok: true, email: email.data }; // champ piège rempli : un robot, on fait semblant
  const r = await envoyerLienConnexion(email.data, String(f.get("retour") ?? ""));
  return r.ok ? { ok: true, email: email.data } : { erreur: r.erreur };
}

export async function confirmerConnexion(f: FormData) {
  const ok = await validerJeton(String(f.get("jeton") ?? ""));
  if (!ok) redirect("/connexion?erreur=lien");
  redirect(cheminSur(String(f.get("retour") ?? "")));
}

export async function seDeconnecter() {
  await fermerSession();
  redirect("/");
}

/* ---------- Contact ---------- */

// Les valeurs reviennent avec l'erreur : React 19 vide le formulaire après une action, le visiteur
// ne doit pas retaper son message.
export type EtatContact = { ok?: boolean; erreur?: string; valeurs?: { nom: string; email: string; sujet: string; texte: string } };

const schemaContact = z.object({
  nom: z.string().trim().min(2).max(120),
  email: z.email().max(200),
  sujet: z.string().trim().max(160).optional(),
  texte: z.string().trim().min(10).max(5000),
});

export async function envoyerMessage(_: EtatContact, f: FormData): Promise<EtatContact> {
  if (f.get("site")) return { ok: true };
  const m = schemaContact.safeParse({
    nom: f.get("nom"),
    email: String(f.get("email") ?? "").trim(),
    sujet: f.get("sujet") || undefined,
    texte: f.get("texte"),
  });
  if (!m.success)
    return {
      erreur: "Remplissez votre nom, une adresse e-mail valide et un message d'au moins 10 caractères.",
      valeurs: {
        nom: String(f.get("nom") ?? ""),
        email: String(f.get("email") ?? ""),
        sujet: String(f.get("sujet") ?? ""),
        texte: String(f.get("texte") ?? ""),
      },
    };
  await enregistrerMessage(m.data);
  return { ok: true };
}

/* ---------- Gestion (réservé aux adresses de ADMIN_EMAILS) ---------- */

async function exigerAdmin() {
  const u = await utilisateurCourant();
  if (!u?.admin) throw new Error("Accès réservé au studio.");
}

const entier = (v: FormDataEntryValue | null) => {
  const n = Number(v);
  if (!Number.isInteger(n) || n < 0 || n > 100000) throw new Error("Montant invalide.");
  return n;
};

export async function majStatut(f: FormData) {
  await exigerAdmin();
  const statut = String(f.get("statut")) as Statut;
  if (!["a_confirmer", "confirmee", "refusee", "annulee"].includes(statut)) throw new Error("Statut inconnu.");
  const note = f.get("note");
  const r = await changerStatut(String(f.get("id")), statut, note === null ? undefined : String(note).slice(0, 1000));
  revalidatePath("/gestion");
  if (!r.ok) redirect(`/gestion?erreur=${encodeURIComponent(r.erreur)}`);
}

export async function majTarif(f: FormData) {
  await exigerAdmin();
  await modifierTarif(String(f.get("slug")), {
    prixHeure: entier(f.get("prixHeure")),
    prixJournee: entier(f.get("prixJournee")),
    prixHeureSup: entier(f.get("prixHeureSup")),
    reservable: f.get("reservable") === "on",
  });
  revalidatePath("/", "layout");
}

export async function majOption(f: FormData) {
  await exigerAdmin();
  await modifierOption(String(f.get("id")), { prix: entier(f.get("prix")), active: f.get("active") === "on" });
  revalidatePath("/", "layout");
}

export async function bloquer(f: FormData) {
  await exigerAdmin();
  const journee = f.get("journee") === "on";
  const r = await ajouterBlocage({
    espace: String(f.get("espace")),
    date: String(f.get("date")),
    debut: journee ? OUVERTURE : Number(f.get("debut")),
    fin: journee ? FERMETURE : Number(f.get("fin")),
    motif: String(f.get("motif") ?? "").slice(0, 200),
  });
  revalidatePath("/gestion");
  if (!r.ok) redirect(`/gestion?onglet=blocages&erreur=${encodeURIComponent(r.erreur)}`);
}

export async function debloquer(f: FormData) {
  await exigerAdmin();
  await supprimerBlocage(String(f.get("id")));
  revalidatePath("/gestion");
}
