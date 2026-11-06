import "server-only";
import { and, asc, desc, eq, inArray, or } from "drizzle-orm";
import { z } from "zod";
import { getDb, schema } from "./db";
import type { Statut } from "./db/schema";
import { ESPACES, adresseTexte, OPTIONS, OPTIONS_EXCLUSIVES, espaceParSlug, type OptionId } from "@/data/catalogue";
import {
  FERMETURE,
  OUVERTURE,
  chevauche,
  dateReservable,
  dateValide,
  devis,
  heuresPassees,
  heuresPrises,
  plageValide,
  type LigneOption,
  type Plage,
  VERSION_CGV,
  finDelaiRetractation,
  maintenantParis,
} from "./regles";
import { idAleatoire, refLisible } from "./ids";
import { envoyer, gabarit } from "./mail";
import { SITE_URL, STUDIO_EMAIL } from "./config";
import { dateLongue, euros, horaire, LIBELLE_STATUT, LIBELLE_TYPE } from "./format";

// Une demande « à confirmer » bloque son créneau autant qu'une réservation confirmée : sinon deux
// clients pourraient demander le même créneau et l'un des deux serait forcément déçu.
export const STATUTS_BLOQUANTS: Statut[] = ["a_confirmer", "confirmee"];

export type Reservation = typeof schema.reservations.$inferSelect;

/* ---------- Tarifs et options, tels que réglés dans /gestion ---------- */

export async function lireTarifs() {
  const db = await getDb();
  const [lignes, opts] = await Promise.all([db.select().from(schema.espaces), db.select().from(schema.options)]);
  const espaces = Object.fromEntries(lignes.map((l) => [l.slug, l]));
  const options = Object.fromEntries(opts.map((o) => [o.id, o]));
  return { espaces, options };
}

/** Options proposées pour un espace, au prix courant, seulement les actives. */
export async function optionsDe(slug: string) {
  const e = espaceParSlug(slug);
  if (!e) return [];
  const { options } = await lireTarifs();
  return OPTIONS.filter((o) => e.options.includes(o.id) && options[o.id]?.active !== false).map((o) => ({
    ...o,
    prix: options[o.id]?.prix ?? o.prix,
  }));
}

/* ---------- Disponibilités ---------- */

function plagesOccupees(tx: Awaited<ReturnType<typeof getDb>>, slug: string, date: string) {
  return Promise.all([
    tx
      .select({ id: schema.reservations.id, debut: schema.reservations.debut, fin: schema.reservations.fin })
      .from(schema.reservations)
      .where(
        and(
          eq(schema.reservations.espace, slug),
          eq(schema.reservations.date, date),
          inArray(schema.reservations.statut, STATUTS_BLOQUANTS),
        ),
      ),
    tx
      .select({ id: schema.blocages.id, debut: schema.blocages.debut, fin: schema.blocages.fin })
      .from(schema.blocages)
      .where(and(eq(schema.blocages.date, date), or(eq(schema.blocages.espace, slug), eq(schema.blocages.espace, "*")))),
  ]);
}

export async function heuresOccupees(slug: string, date: string) {
  const db = await getDb();
  const [resas, blocs] = await plagesOccupees(db, slug, date);
  return { prises: heuresPrises([...resas, ...blocs]), passees: heuresPassees(date) };
}

/* ---------- Création d'une demande ---------- */

const optionnel = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .transform((v) => (v ? v : undefined));

export const schemaDemande = z
  .object({
    espace: z.string(),
    date: z.string(),
    debut: z.coerce.number().int(),
    fin: z.coerce.number().int(),
    options: z.array(z.object({ id: z.string(), quantite: z.coerce.number().int().min(1).max(20) })).max(10),
    typeClient: z.enum(["particulier", "societe", "association"]),
    nom: z.string().trim().min(2, "Indiquez votre nom.").max(120),
    email: z.email("Adresse e-mail invalide.").max(200),
    // Format libre mais au moins 10 chiffres : un numéro français en compte 10 (plan de numérotation ARCEP).
    telephone: z
      .string()
      .trim()
      .max(30)
      .refine((t) => t.replace(/\D/g, "").length >= 10, "Numéro de téléphone invalide."),
    adresse: optionnel(300),
    structure: optionnel(160),
    fonction: optionnel(120),
    // SIRET : 14 chiffres (INSEE : SIREN sur 9 chiffres + NIC sur 5).
    siret: optionnel(20).refine((s) => !s || /^\d{14}$/.test(s.replace(/\s/g, "")), "Le SIRET compte 14 chiffres."),
    // TVA intracommunautaire : code pays sur 2 lettres puis 2 à 13 caractères (format VIES, Commission européenne).
    tva: optionnel(20).refine(
      (s) => !s || /^[A-Z]{2}[0-9A-Z]{2,13}$/.test(s.replace(/\s/g, "").toUpperCase()),
      "Numéro de TVA invalide.",
    ),
    message: optionnel(2000),
    cgv: z.literal(true, { error: "Acceptez les conditions générales pour envoyer la demande." }),
    executionAvantDelai: z.boolean().optional().default(false),
  })
  // Champs obligatoires repris de la maquette : nom de la société ou de l'association, le reste facultatif
  // (SIRET, TVA, fonction, adresse du siège).
  .superRefine((d, ctx) => {
    if (d.typeClient === "societe" && !d.structure)
      ctx.addIssue({ code: "custom", path: ["structure"], message: "Indiquez le nom de la société." });
    if (d.typeClient === "association" && !d.structure)
      ctx.addIssue({ code: "custom", path: ["structure"], message: "Indiquez le nom de l'association." });
    // Un particulier dispose de 14 jours pour se rétracter (art. L221-18). Pour qu'une location commence avant
    // la fin de ce délai, le professionnel doit recueillir sa demande expresse (art. L221-25). La date de
    // conclusion dépend de la confirmation du studio : la demande est donc recueillie pour toute réservation.
    if (d.typeClient === "particulier" && !d.executionAvantDelai)
      ctx.addIssue({
        code: "custom",
        path: ["executionAvantDelai"],
        message: "Cochez cette case pour que la location puisse avoir lieu à la date choisie.",
      });
  });

export type Demande = z.input<typeof schemaDemande>;
export type ResultatDemande =
  | { ok: true; id: string; ref: string }
  | { ok: false; erreur: string; champs?: Record<string, string> };

class ErreurMetier extends Error {}

export async function creerDemande(brut: unknown): Promise<ResultatDemande> {
  const analyse = schemaDemande.safeParse(brut);
  if (!analyse.success) {
    const champs: Record<string, string> = {};
    for (const i of analyse.error.issues) champs[String(i.path[0] ?? "formulaire")] ??= i.message;
    return { ok: false, erreur: "Vérifiez les champs signalés.", champs };
  }
  const d = analyse.data;
  const espace = espaceParSlug(d.espace);
  if (!espace) return { ok: false, erreur: "Espace inconnu." };
  const plage: Plage = { debut: d.debut, fin: d.fin };
  if (!plageValide(plage)) return { ok: false, erreur: `Choisissez un créneau entre ${OUVERTURE}h et ${FERMETURE}h.` };
  if (!dateReservable(d.date)) return { ok: false, erreur: "Cette date n'est pas réservable." };
  if (heuresPassees(d.date).some((h) => h >= plage.debut && h < plage.fin))
    return { ok: false, erreur: "Ce créneau est déjà passé." };

  // Options : seulement celles de l'espace, une fois chacune, packs exclusifs respectés.
  const ids = d.options.map((o) => o.id);
  if (new Set(ids).size !== ids.length) return { ok: false, erreur: "Option en double." };
  for (const id of ids)
    if (!espace.options.includes(id as OptionId)) return { ok: false, erreur: "Option non proposée pour cet espace." };
  for (const groupe of OPTIONS_EXCLUSIVES)
    if (groupe.filter((g) => ids.includes(g)).length > 1) return { ok: false, erreur: "Choisissez un seul pack caméras." };

  const db = await getDb();
  try {
    const cree = await db.transaction(async (tx) => {
      // Verrou sur la ligne de l'espace : deux demandes simultanées sur le même espace passent l'une
      // après l'autre, la seconde voit la première (PostgreSQL, SELECT ... FOR UPDATE).
      const [tarif] = await tx.select().from(schema.espaces).where(eq(schema.espaces.slug, espace.slug)).for("update");
      if (!tarif || !tarif.reservable) throw new ErreurMetier("Cet espace n'est pas réservable en ce moment.");

      const opts = ids.length ? await tx.select().from(schema.options).where(inArray(schema.options.id, ids)) : [];
      const lignes: LigneOption[] = d.options.map((o) => {
        const ligne = opts.find((x) => x.id === o.id);
        const cat = OPTIONS.find((x) => x.id === o.id)!;
        if (!ligne || !ligne.active) throw new ErreurMetier(`L'option « ${cat.nom} » n'est plus proposée.`);
        // Seul le maquillage se compte « par personne » (maquette) ; les autres options valent 1.
        return { id: cat.id, nom: cat.nom, prix: ligne.prix, quantite: cat.id === "maquillage" ? o.quantite : 1 };
      });

      const [resas, blocs] = await plagesOccupees(tx as unknown as Awaited<ReturnType<typeof getDb>>, espace.slug, d.date);
      if ([...resas, ...blocs].some((p) => chevauche(p, plage)))
        throw new ErreurMetier("Ce créneau vient d'être pris. Choisissez-en un autre.");

      const m = devis(tarif, plage, lignes);
      const id = idAleatoire(16);
      const ref = refLisible();
      const pro = d.typeClient !== "particulier";
      await tx.insert(schema.reservations).values({
        id,
        ref,
        espace: espace.slug,
        date: d.date,
        debut: plage.debut,
        fin: plage.fin,
        typeClient: d.typeClient,
        nom: d.nom,
        email: d.email.trim().toLowerCase(),
        telephone: d.telephone,
        adresse: d.adresse,
        structure: pro ? d.structure : undefined,
        fonction: pro ? d.fonction : undefined,
        siret: pro ? d.siret?.replace(/\s/g, "") : undefined,
        tva: pro ? d.tva?.replace(/\s/g, "").toUpperCase() : undefined,
        message: d.message,
        executionAvantDelai: d.typeClient === "particulier" && d.executionAvantDelai,
        versionCgv: VERSION_CGV,
        lignesOptions: lignes,
        locationHt: m.locationHt,
        optionsHt: m.optionsHt,
        totalHt: m.totalHt,
        montantTva: m.tva,
        totalTtc: m.totalTtc,
      });
      return { id, ref };
    });
    const r = await reservationParId(cree.id);
    if (r) await prevenirCreation(r);
    return { ok: true, ...cree };
  } catch (e) {
    if (e instanceof ErreurMetier) return { ok: false, erreur: e.message };
    throw e;
  }
}

/* ---------- Lecture ---------- */

export async function reservationParId(id: string) {
  if (!/^[A-Za-z0-9_-]{10,40}$/.test(id)) return null;
  const db = await getDb();
  const [r] = await db.select().from(schema.reservations).where(eq(schema.reservations.id, id));
  return r ?? null;
}

export async function reservationsDe(email: string) {
  const db = await getDb();
  return db
    .select()
    .from(schema.reservations)
    .where(eq(schema.reservations.email, email.toLowerCase()))
    .orderBy(desc(schema.reservations.date), desc(schema.reservations.debut));
}

export async function toutesReservations() {
  const db = await getDb();
  return db.select().from(schema.reservations).orderBy(asc(schema.reservations.date), asc(schema.reservations.debut));
}

/* ---------- Changement de statut ---------- */

export async function changerStatut(id: string, statut: Statut, note?: string, par: "studio" | "client" = "studio") {
  const db = await getDb();
  const avant = await reservationParId(id);
  if (!avant) return { ok: false as const, erreur: "Réservation introuvable." };
  if (avant.statut === statut && note === undefined) return { ok: true as const };
  // Annulation par un particulier d'un contrat conclu, dans le délai légal : rétractation (art. L221-18 et L221-19).
  const retractation =
    par === "client" &&
    statut === "annulee" &&
    avant.typeClient === "particulier" &&
    avant.statut === "confirmee" &&
    avant.confirmeeLe !== null &&
    maintenantParis().date <= finDelaiRetractation(maintenantParis(avant.confirmeeLe).date);
  try {
    await db.transaction(async (tx) => {
      // Remettre en jeu une demande refusée ou annulée : le créneau a pu être repris entre-temps.
      if (STATUTS_BLOQUANTS.includes(statut) && !STATUTS_BLOQUANTS.includes(avant.statut)) {
        await tx.select().from(schema.espaces).where(eq(schema.espaces.slug, avant.espace)).for("update");
        const [resas, blocs] = await plagesOccupees(tx as unknown as Awaited<ReturnType<typeof getDb>>, avant.espace, avant.date);
        if ([...resas.filter((p) => p.id !== id), ...blocs].some((p) => chevauche(p, avant)))
          throw new ErreurMetier("Le créneau est déjà occupé.");
      }
      await tx
        .update(schema.reservations)
        .set({
          statut,
          majLe: new Date(),
          ...(statut === "confirmee" && avant.statut !== "confirmee" ? { confirmeeLe: new Date() } : {}),
          ...(retractation ? { retractation: true } : {}),
          ...(note !== undefined ? { noteStudio: note || null } : {}),
        })
        .where(eq(schema.reservations.id, id));
    });
  } catch (e) {
    if (e instanceof ErreurMetier) return { ok: false as const, erreur: e.message };
    throw e;
  }
  const apres = await reservationParId(id);
  if (apres && apres.statut !== avant.statut) await prevenirStatut(apres, par);
  return { ok: true as const };
}

/* ---------- E-mails ---------- */

export const nomEspace = (slug: string) => {
  const e = espaceParSlug(slug);
  return e ? (e.studio ? `${e.nom} (${e.studio})` : e.nom) : slug;
};

function resume(r: Reservation) {
  return [
    `Référence : ${r.ref}`,
    `Espace : ${nomEspace(r.espace)}`,
    `Date : ${dateLongue(r.date)}, ${horaire(r.debut, r.fin)}`,
    ...r.lignesOptions.map((o) => `Option : ${o.nom}${o.quantite > 1 ? ` x ${o.quantite}` : ""}`),
    `Total : ${euros(r.totalHt)} HT, ${euros(r.totalTtc)} TTC`,
  ];
}

// Un e-mail qui échoue ne doit pas faire perdre la réservation, déjà enregistrée : on le note et on continue.
async function sansBloquer(p: Promise<unknown>) {
  try {
    await p;
  } catch (e) {
    console.error("[mail]", e);
  }
}

async function prevenirCreation(r: Reservation) {
  const lien = `${SITE_URL}/reservation/${r.id}`;
  const client = gabarit(
    "Demande de réservation reçue",
    [
      `Bonjour ${r.nom}, nous avons bien reçu votre demande. Le studio vous confirme la réservation par e-mail.`,
      ...resume(r),
      "Votre récapitulatif PDF est disponible depuis le lien ci-dessous.",
    ],
    { texte: "Voir ma réservation", lien },
  );
  const studio = gabarit(
    `Nouvelle demande ${r.ref}`,
    [
      ...resume(r),
      `Client : ${r.nom}${r.structure ? `, ${r.structure}` : ""} (${LIBELLE_TYPE[r.typeClient]})`,
      `Contact : ${r.email}, ${r.telephone}`,
      ...(r.message ? [`Message : ${r.message}`] : []),
    ],
    { texte: "Ouvrir la gestion", lien: `${SITE_URL}/gestion` },
  );
  await sansBloquer(envoyer({ a: r.email, sujet: `Demande reçue, ${r.ref}`, ...client }));
  await sansBloquer(
    envoyer({ a: STUDIO_EMAIL, sujet: `Nouvelle demande ${r.ref}, ${nomEspace(r.espace)}`, repondreA: r.email, ...studio }),
  );
}

const PHRASE_STATUT: Record<Statut, string> = {
  a_confirmer: "Votre demande est de nouveau en attente de confirmation.",
  confirmee: "Votre réservation est confirmée.",
  refusee: "Nous ne pouvons pas accepter votre demande sur ce créneau.",
  annulee: "Votre réservation est annulée.",
};

// Confirmation du contrat à un particulier : art. L221-13 du Code de la consommation (Légifrance,
// LEGIARTI000044563210, en vigueur depuis le 28 mai 2022). Sur support durable, avant le début de la location :
// les informations de l'art. L221-5 et le formulaire type de rétractation. Un lien vers une page ne suffit pas
// (CJUE, 5 juillet 2012, Content Services, C-49/11) : le texte est donc dans l'e-mail lui-même.
// Formulaire : annexe à l'art. R221-1, même texte que sur /cgv.
function confirmationParticulier(r: Reservation) {
  const adresse = adresseTexte() || "[adresse postale du studio, à compléter]";
  return [
    `Conditions générales acceptées : version du ${r.versionCgv ?? VERSION_CGV}, consultables sur ${SITE_URL}/cgv.`,
    `Droit de rétractation : vous pouvez vous rétracter pendant 14 jours à compter de cette confirmation, soit jusqu'au ${dateLongue(finDelaiRetractation(maintenantParis(r.confirmeeLe ?? new Date()).date))} inclus, sans motif ni frais (art. L221-18 et L221-19). Depuis la page de votre réservation, bouton « Renoncer au contrat ici », ou en nous écrivant, par exemple avec le formulaire ci-dessous.`,
    ...(r.executionAvantDelai
      ? [
          `Vous avez demandé, le ${HORODATAGE.format(r.creeLe)}, que la location ait lieu à la date choisie même avant la fin de ce délai. Si vous vous rétractez après son début, vous payez la part déjà réalisée. Une fois la location entièrement réalisée, vous ne pouvez plus vous rétracter (art. L221-25 et L221-28).`,
        ]
      : []),
    "Formulaire de rétractation (à compléter et renvoyer uniquement si vous souhaitez vous rétracter du contrat) :",
    `À l'attention de Studio 360, ${adresse}, ${STUDIO_EMAIL} : Je vous notifie par la présente ma rétractation du contrat portant sur la prestation de services ci-dessous. Location réservée le : … Référence de la réservation : ${r.ref}. Nom : … Adresse : … Signature (uniquement pour un envoi sur papier) : … Date : …`,
  ];
}

const HORODATAGE = new Intl.DateTimeFormat("fr-FR", { dateStyle: "long", timeStyle: "short", timeZone: "Europe/Paris" });

async function prevenirStatut(r: Reservation, par: "studio" | "client") {
  const lien = `${SITE_URL}/reservation/${r.id}`;
  if (par === "client") {
    const fin = r.confirmeeLe ? finDelaiRetractation(maintenantParis(r.confirmeeLe).date) : null;
    // Rétractation : remboursement de toutes les sommes versées au plus tard 14 jours après en avoir été informé
    // (art. L221-24). Location déjà commencée à la demande du client : il paie la part réalisée (art. L221-25).
    const detail = r.retractation
      ? [
          `Rétractation d'un particulier, dans le délai légal (contrat conclu le ${dateLongue(maintenantParis(r.confirmeeLe!).date)}, délai jusqu'au ${dateLongue(fin!)} inclus).`,
          "Les sommes déjà versées se remboursent au plus tard 14 jours après aujourd'hui (Code de la consommation, art. L221-24).",
          ...(maintenantParis().date >= r.date
            ? ["La location a lieu aujourd'hui ou a déjà eu lieu : si elle avait commencé, le client paie la part réalisée (art. L221-25)."]
            : []),
        ]
      : [];
    const titre = r.retractation ? `Rétractation du client, ${r.ref}` : `Annulation par le client, ${r.ref}`;
    const studio = gabarit(titre, [...detail, ...resume(r)], {
      texte: "Ouvrir la gestion",
      lien: `${SITE_URL}/gestion`,
    });
    await sansBloquer(
      envoyer({ a: STUDIO_EMAIL, sujet: `${r.retractation ? "Rétractation" : "Annulation"} ${r.ref}`, repondreA: r.email, ...studio }),
    );
  }
  // Annulation par le client : l'e-mail tient lieu d'accusé de réception sur support durable, avec le contenu
  // de la déclaration, sa date et son heure (art. L221-21 et D221-5 du Code de la consommation, juin 2026).
  const accuse =
    par === "client"
      ? [
          `Accusé de réception : ${r.nom} a ${r.retractation ? "exercé son droit de rétractation pour" : "renoncé à"} la réservation ${r.ref} depuis le site, le ${HORODATAGE.format(new Date())} (heure de Paris).`,
          ...(r.retractation ? ["Les sommes déjà versées vous seront remboursées au plus tard dans les 14 jours (art. L221-24)."] : []),
        ]
      : [];
  const client = gabarit(
    r.retractation ? "Rétractation enregistrée" : `Réservation ${LIBELLE_STATUT[r.statut].toLowerCase()}`,
    [
      r.retractation ? "Votre rétractation est enregistrée et la réservation est annulée." : PHRASE_STATUT[r.statut],
      ...accuse,
      ...resume(r),
      ...(r.noteStudio ? [`Message du studio : ${r.noteStudio}`] : []),
      ...(r.statut === "confirmee" && r.typeClient === "particulier" ? confirmationParticulier(r) : []),
    ],
    { texte: "Voir ma réservation", lien },
  );
  await sansBloquer(envoyer({ a: r.email, sujet: `${r.retractation ? "Rétractation enregistrée" : LIBELLE_STATUT[r.statut]}, ${r.ref}`, repondreA: STUDIO_EMAIL, ...client }));
}

/* ---------- Gestion ---------- */

export async function modifierTarif(
  slug: string,
  v: { prixHeure: number; prixJournee: number; prixHeureSup: number; reservable: boolean },
) {
  if (!ESPACES.some((e) => e.slug === slug)) return;
  const db = await getDb();
  await db.update(schema.espaces).set(v).where(eq(schema.espaces.slug, slug));
}

export async function modifierOption(id: string, v: { prix: number; active: boolean }) {
  if (!OPTIONS.some((o) => o.id === id)) return;
  const db = await getDb();
  await db.update(schema.options).set(v).where(eq(schema.options.id, id));
}

export async function ajouterBlocage(v: { espace: string; date: string; debut: number; fin: number; motif?: string }) {
  if (v.espace !== "*" && !espaceParSlug(v.espace)) return { ok: false as const, erreur: "Espace inconnu." };
  if (!dateValide(v.date)) return { ok: false as const, erreur: "Date invalide." };
  if (!plageValide(v)) return { ok: false as const, erreur: "Plage horaire invalide." };
  const db = await getDb();
  await db.insert(schema.blocages).values({ id: idAleatoire(12), ...v, motif: v.motif || null });
  return { ok: true as const };
}

export async function supprimerBlocage(id: string) {
  const db = await getDb();
  await db.delete(schema.blocages).where(eq(schema.blocages.id, id));
}

export async function blocagesAVenir(depuis: string) {
  const db = await getDb();
  const tous = await db.select().from(schema.blocages).orderBy(asc(schema.blocages.date), asc(schema.blocages.debut));
  return tous.filter((b) => b.date >= depuis);
}

export async function messagesRecus() {
  const db = await getDb();
  return db.select().from(schema.messages).orderBy(desc(schema.messages.creeLe));
}

export async function enregistrerMessage(m: { nom: string; email: string; sujet?: string; texte: string }) {
  const db = await getDb();
  await db.insert(schema.messages).values({ id: idAleatoire(12), ...m, sujet: m.sujet || null });
  const { html, texte } = gabarit(`Message de ${m.nom}`, [
    `De : ${m.nom} <${m.email}>`,
    ...(m.sujet ? [`Sujet : ${m.sujet}`] : []),
    m.texte,
  ]);
  await sansBloquer(envoyer({ a: STUDIO_EMAIL, sujet: `Contact : ${m.sujet || m.nom}`, repondreA: m.email, html, texte }));
}
