import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { FilePdf } from "@phosphor-icons/react/dist/ssr";
import { BadgeStatut } from "@/components/BadgeStatut";
import { BoutonAnnuler } from "@/components/BoutonAnnuler";
import { espaceParSlug } from "@/data/catalogue";
import { STUDIO_EMAIL } from "@/lib/config";
import { LIBELLE_TYPE, dateLongue, euros, horaire, majuscule } from "@/lib/format";
import { TAUX_TVA, estJournee, maintenantParis } from "@/lib/regles";
import { reservationParId } from "@/lib/reservations";

// Page privée : l'identifiant aléatoire (128 bits) fait office de clé, comme pour le PDF.
// Hors des moteurs de recherche (noindex ici, et /reservation exclu dans robots.ts).
export const metadata: Metadata = { title: "Votre réservation", robots: { index: false, follow: false } };

const MESSAGE = {
  a_confirmer: "Le studio a bien reçu votre demande. Vous recevrez un e-mail dès qu'il l'aura confirmée.",
  confirmee: "Votre réservation est confirmée. À bientôt au studio.",
  refusee: "Le studio n'a pas pu accepter cette demande.",
  annulee: "Cette réservation est annulée.",
} as const;

export default async function PageReservation({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const r = await reservationParId(id);
  if (!r) notFound();
  const e = espaceParSlug(r.espace);
  const ouverte = (r.statut === "a_confirmer" || r.statut === "confirmee") && r.date >= maintenantParis().date;

  return (
    <div className="mx-auto max-w-3xl px-4 pt-12 sm:px-6">
      <p className="surtitre chiffres">Réservation {r.ref}</p>
      <h1 className="mt-3 text-3xl leading-tight sm:text-4xl">{e?.nom ?? r.espace}</h1>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <BadgeStatut statut={r.statut} />
        {e?.studio && <span className="text-sm text-gris">{e.studio}</span>}
      </div>
      <p className="mt-5 max-w-[60ch] text-gris">{MESSAGE[r.statut]}</p>
      {r.noteStudio && (
        <p className="mt-4 rounded-sm border border-filet-neutre p-4 text-sm">
          <span className="font-semibold">Message du studio : </span>
          {r.noteStudio}
        </p>
      )}

      <div className="mt-10 grid gap-10 border-t border-filet pt-8 sm:grid-cols-2">
        <section aria-labelledby="t-creneau">
          <h2 id="t-creneau" className="text-base">
            Créneau
          </h2>
          <dl className="mt-4 space-y-3 text-sm">
            <Ligne t="Date">
              {majuscule(dateLongue(r.date))}
            </Ligne>
            <Ligne t="Horaires">
              {horaire(r.debut, r.fin)}
              {estJournee(r) ? ", journée complète" : ""}
            </Ligne>
            {r.lignesOptions.map((o) => (
              <Ligne key={o.id} t="Option">
                {o.nom}
                {o.quantite > 1 ? ` × ${o.quantite}` : ""}
              </Ligne>
            ))}
          </dl>
        </section>

        <section aria-labelledby="t-client">
          <h2 id="t-client" className="text-base">
            Vos coordonnées
          </h2>
          <dl className="mt-4 space-y-3 text-sm">
            <Ligne t="Profil">{LIBELLE_TYPE[r.typeClient]}</Ligne>
            {r.structure && <Ligne t={r.typeClient === "association" ? "Association" : "Société"}>{r.structure}</Ligne>}
            <Ligne t="Nom">{r.nom}</Ligne>
            <Ligne t="E-mail">{r.email}</Ligne>
            <Ligne t="Téléphone">{r.telephone}</Ligne>
          </dl>
        </section>
      </div>

      <section aria-labelledby="t-montant" className="mt-10 rounded-sm border border-filet bg-carte p-5 sm:p-6">
        <h2 id="t-montant" className="surtitre">
          Montant
        </h2>
        <dl className="chiffres mt-4 space-y-2 text-sm">
          <Ligne t="Location HT">{euros(r.locationHt)}</Ligne>
          {r.lignesOptions.map((o) => (
            <Ligne key={o.id} t={o.quantite > 1 ? `${o.nom} × ${o.quantite}` : o.nom}>
              {euros(o.prix * 100 * o.quantite)}
            </Ligne>
          ))}
          <Ligne t="Total HT">{euros(r.totalHt)}</Ligne>
          <Ligne t={`TVA (${TAUX_TVA * 100} %)`}>{euros(r.montantTva)}</Ligne>
        </dl>
        <div className="mt-4 flex items-baseline justify-between gap-4 border-t border-filet pt-4">
          <span className="font-titre text-sm uppercase">Total TTC</span>
          <span className="chiffres font-titre text-2xl text-or">{euros(r.totalTtc)}</span>
        </div>
        <p className="mt-3 text-xs text-gris">Aucun paiement en ligne. Une caution peut être demandée.</p>
      </section>

      <div className="mt-8 flex flex-wrap items-start gap-3">
        <a href={`/reservation/${r.id}/pdf`} className="btn btn-contour" target="_blank" rel="noopener">
          <FilePdf size={18} aria-hidden="true" /> Récapitulatif PDF
        </a>
        {ouverte && (
          <BoutonAnnuler
            id={r.id}
            particulier={r.typeClient === "particulier"}
            details={{ ref: r.ref, nom: r.nom, email: r.email, creneau: `${dateLongue(r.date)}, ${horaire(r.debut, r.fin)}` }}
          />
        )}
      </div>
      <p className="mt-6 text-sm text-gris">
        Une question sur ce créneau ? Écrivez à{" "}
        <a className="lien" href={`mailto:${STUDIO_EMAIL}?subject=${encodeURIComponent(`Réservation ${r.ref}`)}`}>
          {STUDIO_EMAIL}
        </a>
        . Conditions : <Link className="lien" href="/cgv">conditions générales</Link>.
      </p>
    </div>
  );
}

function Ligne({ t, children }: { t: string; children: React.ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <dt className="text-gris">{t}</dt>
      <dd className="text-right font-semibold">{children}</dd>
    </div>
  );
}
