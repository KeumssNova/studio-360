"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { annulerMaDemande } from "@/app/actions";

// Annulation en deux temps, dans la page : pas de window.confirm, qui bloque la page et se stylise mal.
//
// Pour un particulier, ce bouton sert aussi de « fonctionnalité de rétractation » (Code de la consommation,
// art. L221-21 et D221-5, version en vigueur depuis le 19 juin 2026, ordonnance n° 2026-2 et décret n° 2026-3
// du 5 janvier 2026). Ce que le décret demande, d'après la fiche de la CCI Paris Île-de-France :
// - un libellé « renoncer au contrat ici » ou équivalent sans ambiguïté, accessible pendant tout le délai ;
// - le rappel de l'identité du consommateur, du contrat visé et de l'adresse qui reçoit l'accusé de réception ;
// - une étape finale « confirmer la rétractation » ;
// - un accusé de réception sur support durable avec le contenu, la date et l'heure (e-mail, voir prevenirStatut).
// Le texte intégral du décret n'a pas été lu : à faire relire par un professionnel avant la mise en ligne.
export function BoutonAnnuler({
  id,
  particulier,
  details,
}: {
  id: string;
  particulier: boolean;
  details: { ref: string; nom: string; email: string; creneau: string };
}) {
  const router = useRouter();
  const [confirmer, setConfirmer] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const [enCours, demarrer] = useTransition();
  const libelle = particulier
    ? { ouvrir: "Renoncer au contrat ici", valider: "Confirmer la rétractation", enCours: "Envoi…" }
    : { ouvrir: "Annuler la réservation", valider: "Confirmer l'annulation", enCours: "Annulation…" };

  if (!confirmer)
    return (
      <button type="button" className="btn btn-discret" onClick={() => setConfirmer(true)}>
        {libelle.ouvrir}
      </button>
    );

  return (
    <div role="group" aria-labelledby={`annuler-${id}`} className="w-full rounded-sm border border-alerte p-4">
      <p id={`annuler-${id}`} className="text-sm font-semibold">
        {particulier ? "Vous renoncez à cette réservation" : "Annuler cette réservation"}
      </p>
      <dl className="chiffres mt-3 grid gap-1 text-sm sm:grid-cols-[auto_1fr] sm:gap-x-4">
        <dt className="text-gris">Nom</dt>
        <dd>{details.nom}</dd>
        <dt className="text-gris">Réservation</dt>
        <dd>
          {details.ref}, {details.creneau}
        </dd>
        <dt className="text-gris">Accusé de réception à</dt>
        <dd className="break-all">{details.email}</dd>
      </dl>
      <p className="mt-3 text-sm text-gris">Le créneau redevient libre pour les autres.</p>
      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          disabled={enCours}
          className="btn border border-alerte text-alerte-texte hover:bg-alerte hover:text-texte"
          onClick={() =>
            demarrer(async () => {
              const r = await annulerMaDemande(id);
              if (!r.ok) setErreur(r.erreur);
              else {
                setConfirmer(false);
                router.refresh();
              }
            })
          }
        >
          {enCours ? libelle.enCours : libelle.valider}
        </button>
        <button type="button" className="btn btn-discret" disabled={enCours} onClick={() => setConfirmer(false)}>
          Garder
        </button>
      </div>
      {erreur && (
        <p role="alert" className="mt-3 text-sm text-alerte-texte">
          {erreur}
        </p>
      )}
    </div>
  );
}
