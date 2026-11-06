import { prixTtc } from "@/lib/format";

/** Prix TTC en petit sous un prix HT (voir prixTtc dans lib/format.ts pour la règle et sa source). */
export function PrixTtc({ ht, className = "" }: { ht: number; className?: string }) {
  return <span className={`block text-xs font-normal text-gris print:text-neutral-600 ${className}`}>{prixTtc(ht)} TTC</span>;
}
