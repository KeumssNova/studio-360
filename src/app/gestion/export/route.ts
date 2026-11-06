import { utilisateurCourant } from "@/lib/auth";
import { LIBELLE_STATUT, LIBELLE_TYPE } from "@/lib/format";
import { nomEspace, toutesReservations } from "@/lib/reservations";

// Export de toutes les réservations pour la compta du studio. Format CSV « à la française » :
// point-virgule comme séparateur et BOM UTF-8, pour qu'Excel en français ouvre le fichier sans
// mélanger les colonnes ni casser les accents (séparateur de liste de Windows en français : « ; »).
// Guillemets doublés selon la RFC 4180, section 2.
export async function GET() {
  const u = await utilisateurCourant();
  if (!u?.admin) return new Response("Introuvable", { status: 404 });
  const resas = await toutesReservations();
  const cellule = (v: unknown) => {
    let s = v == null ? "" : String(v);
    // Une cellule qui commence par = + - @ serait lue comme une formule par Excel (injection CSV, OWASP).
    if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
    return `"${s.replace(/"/g, '""')}"`;
  };
  const montant = (c: number) => (c / 100).toFixed(2).replace(".", ",");
  // Heure de Paris, lisible par Excel comme une date : « 2026-11-06 19:58 » (sv-SE donne l'ordre ISO).
  const heureParis = new Intl.DateTimeFormat("sv-SE", { dateStyle: "short", timeStyle: "short", timeZone: "Europe/Paris" });
  const entetes = [
    "Référence", "Statut", "Espace", "Date", "Début", "Fin", "Profil", "Structure", "Nom", "E-mail", "Téléphone",
    "SIRET", "TVA intracom.", "Adresse", "Options", "Location HT", "Options HT", "Total HT", "TVA", "Total TTC", "Reçue le (heure de Paris)",
    "Location avant la fin du délai de rétractation", "Conditions générales acceptées", "Confirmée le (heure de Paris)",
    "Rétractation",
  ];
  const lignes = resas.map((r) =>
    [
      r.ref, LIBELLE_STATUT[r.statut], nomEspace(r.espace), r.date, `${r.debut}h`, `${r.fin}h`, LIBELLE_TYPE[r.typeClient],
      r.structure, r.nom, r.email, r.telephone, r.siret, r.tva, r.adresse,
      r.lignesOptions.map((o) => (o.quantite > 1 ? `${o.nom} x ${o.quantite}` : o.nom)).join(", "),
      montant(r.locationHt), montant(r.optionsHt), montant(r.totalHt), montant(r.montantTva), montant(r.totalTtc),
      heureParis.format(r.creeLe),
      // Ne concerne que les particuliers (Code de la consommation, art. L221-25).
      r.typeClient === "particulier" ? (r.executionAvantDelai ? "Demandée" : "Non demandée") : "",
      r.versionCgv ? `Version du ${r.versionCgv}` : "",
      r.confirmeeLe ? heureParis.format(r.confirmeeLe) : "",
      r.retractation ? "Oui" : "",
    ]
      .map(cellule)
      .join(";"),
  );
  const corps = "﻿" + [entetes.map(cellule).join(";"), ...lignes].join("\r\n");
  return new Response(corps, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="reservations-studio-360.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
