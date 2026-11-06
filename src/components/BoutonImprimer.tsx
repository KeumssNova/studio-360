"use client";

import { Printer } from "@phosphor-icons/react";

export function BoutonImprimer() {
  return (
    <button type="button" onClick={() => window.print()} className="btn btn-contour">
      <Printer size={18} aria-hidden="true" /> Imprimer ou enregistrer en PDF
    </button>
  );
}
