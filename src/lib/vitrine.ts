import "server-only";
import { ESPACES, type Categorie, type Espace } from "@/data/catalogue";
import { PRIX_HEURE_SUP_DEFAUT } from "./regles";
import { lireTarifs } from "./reservations";

// Les pages publiques affichent les prix de la base (modifiables dans /gestion), pas ceux du catalogue.
export type EspaceVitrine = Espace & { prixHeureSup: number; reservable: boolean };
export type FicheVitrine = EspaceVitrine & { titre: string; nombre: number };

export async function espacesVitrine(): Promise<EspaceVitrine[]> {
  const { espaces } = await lireTarifs();
  return ESPACES.map((e) => {
    const t = espaces[e.slug];
    return {
      ...e,
      prixHeure: t?.prixHeure ?? e.prixHeure,
      prixJournee: t?.prixJournee ?? e.prixJournee,
      prixHeureSup: t?.prixHeureSup ?? PRIX_HEURE_SUP_DEFAUT,
      reservable: t?.reservable ?? true,
    };
  });
}

export async function espaceVitrine(slug: string) {
  return (await espacesVitrine()).find((e) => e.slug === slug);
}

const TITRES_GROUPES: Record<string, string> = { cabines: "Cabines de montage" };

/** Les espaces identiques (les 3 cabines) ne font qu'une fiche dans les listes. */
export function fiches(liste: EspaceVitrine[], categorie?: Categorie): FicheVitrine[] {
  const vus = new Set<string>();
  const out: FicheVitrine[] = [];
  for (const e of liste) {
    if (categorie && e.categorie !== categorie) continue;
    if (!e.groupe) {
      out.push({ ...e, titre: e.nom, nombre: 1 });
      continue;
    }
    if (vus.has(e.groupe)) continue;
    vus.add(e.groupe);
    const membres = liste.filter((x) => x.groupe === e.groupe);
    out.push({
      ...e,
      titre: TITRES_GROUPES[e.groupe] ?? e.nom,
      nombre: membres.length,
      prixHeure: Math.min(...membres.map((m) => m.prixHeure)),
      prixJournee: Math.min(...membres.map((m) => m.prixJournee)),
      reservable: membres.some((m) => m.reservable),
    });
  }
  return out;
}
