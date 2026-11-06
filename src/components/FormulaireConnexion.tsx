"use client";

import { useActionState, useState } from "react";
import { demanderLien, type EtatConnexion } from "@/app/actions";

export function FormulaireConnexion({ retour }: { retour: string }) {
  const [etat, action, enCours] = useActionState<EtatConnexion, FormData>(demanderLien, {});
  // Champ contrôlé : React 19 vide le formulaire après l'action, l'adresse tapée doit rester en cas d'erreur.
  const [email, setEmail] = useState("");

  if (etat.ok)
    return (
      <div role="status" className="rounded-sm border border-succes p-5">
        <p className="font-semibold">Lien envoyé à {etat.email}</p>
        <p className="mt-2 text-sm text-gris">
          Ouvrez l&apos;e-mail et cliquez sur « Me connecter ». Le lien est valable 10 minutes et ne sert qu&apos;une fois. Rien
          reçu ? Regardez dans les indésirables.
        </p>
      </div>
    );

  return (
    <form action={action} className="space-y-4" noValidate>
      <input type="hidden" name="retour" value={retour} />
      <div>
        <label htmlFor="cx-email" className="etiquette">
          Adresse e-mail
        </label>
        <input
          id="cx-email"
          name="email"
          type="email"
          required
          autoComplete="email"
          inputMode="email"
          spellCheck={false}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="champ mt-2"
          aria-invalid={etat.erreur ? true : undefined}
          aria-describedby={etat.erreur ? "cx-erreur" : "cx-aide"}
        />
        <p id="cx-aide" className="mt-2 text-xs text-gris">
          Celle utilisée pour vos réservations. Pas de mot de passe : un lien de connexion arrive par e-mail.
        </p>
      </div>
      {/* Champ piège pour les robots (action demanderLien). */}
      <div className="hidden" aria-hidden="true">
        <label htmlFor="cx-site">Site</label>
        <input id="cx-site" name="site" tabIndex={-1} autoComplete="off" />
      </div>
      {etat.erreur && (
        <p id="cx-erreur" role="alert" className="text-sm text-alerte-texte">
          {etat.erreur}
        </p>
      )}
      <button type="submit" className="btn btn-or w-full" disabled={enCours}>
        {enCours ? "Envoi…" : "Recevoir mon lien de connexion"}
      </button>
    </form>
  );
}
