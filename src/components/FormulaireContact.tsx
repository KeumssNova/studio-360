"use client";

import { useActionState } from "react";
import { envoyerMessage, type EtatContact } from "@/app/actions";

export function FormulaireContact() {
  const [etat, action, enCours] = useActionState<EtatContact, FormData>(envoyerMessage, {});

  if (etat.ok)
    return (
      <div role="status" className="rounded-sm border border-succes p-6">
        <p className="font-titre text-lg uppercase">Message envoyé</p>
        <p className="mt-2 text-gris">Le studio vous répond par e-mail.</p>
      </div>
    );

  const v = etat.valeurs;
  return (
    // La clé remonte le formulaire à chaque réponse : les valeurs renvoyées par l'action redeviennent les valeurs par défaut.
    <form key={JSON.stringify(v ?? {})} action={action} className="space-y-5" noValidate>
      <div className="grid gap-5 sm:grid-cols-2">
        <Champ id="c-nom" nom="nom" label="Nom" autoComplete="name" requis valeur={v?.nom} />
        <Champ id="c-email" nom="email" label="E-mail" type="email" autoComplete="email" requis valeur={v?.email} />
      </div>
      <Champ id="c-sujet" nom="sujet" label="Sujet" valeur={v?.sujet} />
      <div>
        <label htmlFor="c-texte" className="etiquette">
          Message <span className="text-or" aria-hidden="true">*</span>
        </label>
        <textarea
          id="c-texte"
          name="texte"
          rows={6}
          required
          minLength={10}
          maxLength={5000}
          defaultValue={v?.texte}
          className="champ mt-2 min-h-36 resize-y"
          aria-invalid={etat.erreur ? true : undefined}
          aria-describedby={etat.erreur ? "c-erreur" : undefined}
        />
      </div>
      {/* Champ piège : invisible pour les visiteurs, rempli par les robots (action envoyerMessage). */}
      <div className="hidden" aria-hidden="true">
        <label htmlFor="c-site">Site</label>
        <input id="c-site" name="site" tabIndex={-1} autoComplete="off" />
      </div>
      {etat.erreur && (
        <p id="c-erreur" role="alert" className="text-sm text-alerte-texte">
          {etat.erreur}
        </p>
      )}
      <button type="submit" className="btn btn-or w-full sm:w-auto" disabled={enCours}>
        {enCours ? "Envoi…" : "Envoyer le message"}
      </button>
    </form>
  );
}

function Champ({
  id,
  nom,
  label,
  type = "text",
  autoComplete,
  requis,
  valeur,
}: {
  id: string;
  nom: string;
  label: string;
  type?: string;
  autoComplete?: string;
  requis?: boolean;
  valeur?: string;
}) {
  return (
    <div>
      <label htmlFor={id} className="etiquette">
        {label} {requis && <span className="text-or" aria-hidden="true">*</span>}
      </label>
      <input
        id={id}
        name={nom}
        type={type}
        required={requis}
        autoComplete={autoComplete}
        spellCheck={type === "email" ? false : undefined}
        defaultValue={valeur}
        className="champ mt-2"
      />
    </div>
  );
}
