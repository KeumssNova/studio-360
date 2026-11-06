import "server-only";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import type { Reservation } from "./reservations";
import { nomEspace } from "./reservations";
import { dateLongue, euros, horaire, LIBELLE_STATUT, LIBELLE_TYPE } from "./format";
import { CONTACT } from "@/data/catalogue";

// Les polices standard du PDF (Helvetica) couvrent l'encodage WinAnsi, donc les accents français
// et le signe € (spécification PDF 1.7, annexe D). Les espaces fines insécables que produit
// Intl.NumberFormat("fr-FR") n'y sont pas : on les remplace par des espaces simples.
const propre = (s: string) => s.replace(/[   ]/g, " ").replace(/[‘’]/g, "'");

const OR = rgb(0.95, 0.78, 0.29); // or du site (oklch 83% .15 88, converti)
const NOIR = rgb(0.06, 0.06, 0.06);
const GRIS = rgb(0.4, 0.4, 0.4);

export async function pdfReservation(r: Reservation) {
  const doc = await PDFDocument.create();
  doc.setTitle(`Studio 360, réservation ${r.ref}`);
  doc.setAuthor("Studio 360");
  const page = doc.addPage([595.28, 841.89]); // A4 en points (ISO 216)
  const normal = await doc.embedFont(StandardFonts.Helvetica);
  const gras = await doc.embedFont(StandardFonts.HelveticaBold);
  const logo = await doc.embedJpg(await readFile(path.join(process.cwd(), "public", "logo.jpg")));

  const M = 50;
  const L = 595.28 - 2 * M;
  let y = 841.89 - M;

  page.drawRectangle({ x: 0, y: 841.89 - 120, width: 595.28, height: 120, color: NOIR });
  page.drawImage(logo, { x: M, y: 841.89 - 105, width: 90, height: 90 });
  page.drawText("RÉCAPITULATIF DE RÉSERVATION", { x: M + 110, y: 841.89 - 55, size: 16, font: gras, color: OR });
  page.drawText(propre(`${r.ref}  ·  ${LIBELLE_STATUT[r.statut]}`), { x: M + 110, y: 841.89 - 78, size: 11, font: normal, color: rgb(1, 1, 1) });
  y = 841.89 - 150;

  const ligne = (g: string, d: string, opts: { taille?: number; grasD?: boolean } = {}) => {
    const t = opts.taille ?? 10.5;
    page.drawText(propre(g), { x: M, y, size: t, font: normal, color: GRIS });
    const texte = propre(d);
    const f = opts.grasD ? gras : normal;
    page.drawText(texte, { x: M + L - f.widthOfTextAtSize(texte, t), y, size: t, font: f, color: NOIR });
    y -= t + 9;
  };
  const titre = (t: string) => {
    y -= 8;
    page.drawText(propre(t.toUpperCase()), { x: M, y, size: 11, font: gras, color: NOIR });
    y -= 6;
    page.drawLine({ start: { x: M, y }, end: { x: M + L, y }, thickness: 1.2, color: OR });
    y -= 18;
  };
  const coupe = (texte: string, taille: number, largeur: number) => {
    const mots = propre(texte).split(/\s+/);
    const lignes: string[] = [];
    let cur = "";
    for (const m of mots) {
      const essai = cur ? `${cur} ${m}` : m;
      if (normal.widthOfTextAtSize(essai, taille) > largeur && cur) {
        lignes.push(cur);
        cur = m;
      } else cur = essai;
    }
    if (cur) lignes.push(cur);
    return lignes;
  };

  titre("Réservation");
  ligne("Espace", nomEspace(r.espace), { grasD: true });
  ligne("Date", dateLongue(r.date));
  ligne("Horaire", horaire(r.debut, r.fin));
  ligne("Demande envoyée le", new Intl.DateTimeFormat("fr-FR", { dateStyle: "long", timeStyle: "short", timeZone: "Europe/Paris" }).format(r.creeLe));

  titre("Client");
  ligne("Type", LIBELLE_TYPE[r.typeClient]);
  if (r.typeClient === "particulier")
    ligne("Location avant la fin du délai de rétractation", r.executionAvantDelai ? "demandée" : "non demandée");
  if (r.versionCgv) ligne("Conditions générales", `version du ${r.versionCgv}`);
  ligne("Nom", r.nom);
  if (r.structure) ligne(r.typeClient === "association" ? "Association" : "Société", r.structure);
  if (r.fonction) ligne("Fonction", r.fonction);
  if (r.siret) ligne("SIRET", r.siret);
  if (r.tva) ligne("TVA intracommunautaire", r.tva);
  ligne("E-mail", r.email);
  ligne("Téléphone", r.telephone);
  if (r.adresse) for (const [i, l] of coupe(r.adresse, 10.5, L * 0.6).entries()) ligne(i ? "" : "Adresse", l);

  titre("Montant");
  ligne("Location", `${euros(r.locationHt)} HT`);
  for (const o of r.lignesOptions)
    ligne(`${o.nom}${o.quantite > 1 ? ` x ${o.quantite}` : ""}`, `${euros(o.prix * 100 * o.quantite)} HT`);
  y -= 4;
  ligne("Total HT", euros(r.totalHt), { grasD: true });
  ligne("TVA 20 %", euros(r.montantTva));
  ligne("Total TTC", euros(r.totalTtc), { taille: 13, grasD: true });

  if (r.message) {
    titre("Message");
    for (const l of coupe(r.message, 10, L).slice(0, 8)) {
      page.drawText(l, { x: M, y, size: 10, font: normal, color: NOIR });
      y -= 14;
    }
  }

  const pied = [
    "Ce document récapitule une demande de réservation. Il ne vaut pas facture.",
    r.statut === "a_confirmer" ? "La réservation devient ferme après confirmation par le studio." : "",
    `Studio 360  ·  ${CONTACT.email}`,
  ].filter(Boolean);
  let yp = M + 10 + pied.length * 13;
  for (const p of pied) {
    page.drawText(propre(p), { x: M, y: yp, size: 9, font: normal, color: GRIS });
    yp -= 13;
  }

  return doc.save();
}
