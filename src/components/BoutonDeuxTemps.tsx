"use client";

import { useState } from "react";

// Bouton d'envoi en deux temps pour les actions qui préviennent le client (refus, annulation) ou effacent
// (déblocage) : un premier clic arme, le second envoie. Pas de window.confirm, qui bloque la page.
export function BoutonDeuxTemps({
  name,
  value,
  children,
  confirmation,
}: {
  name?: string;
  value?: string;
  children: React.ReactNode;
  confirmation: string;
}) {
  const [arme, setArme] = useState(false);
  if (!arme)
    return (
      <button type="button" className="btn btn-discret" onClick={() => setArme(true)}>
        {children}
      </button>
    );
  return (
    <span className="inline-flex flex-wrap gap-2">
      <button type="submit" name={name} value={value} className="btn border border-alerte text-alerte-texte hover:bg-alerte hover:text-texte">
        {confirmation}
      </button>
      <button type="button" className="btn btn-discret" onClick={() => setArme(false)}>
        Retour
      </button>
    </span>
  );
}
