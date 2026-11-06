import type { Statut } from "@/lib/db/schema";
import { LIBELLE_STATUT } from "@/lib/format";

// Couleur et texte ensemble : le statut ne passe jamais par la couleur seule (WCAG 1.4.1).
const TEINTE: Record<Statut, string> = {
  a_confirmer: "border-or text-or",
  confirmee: "border-succes text-succes",
  refusee: "border-alerte text-alerte-texte",
  annulee: "border-filet-neutre text-gris",
};

export function BadgeStatut({ statut }: { statut: Statut }) {
  return (
    <span className={`inline-flex items-center rounded-sm border px-2 py-0.5 text-xs font-semibold whitespace-nowrap ${TEINTE[statut]}`}>
      {LIBELLE_STATUT[statut]}
    </span>
  );
}
