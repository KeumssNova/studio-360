// Contenu repris tel quel de la maquette Lovable du client (relevée le 2026-11-06,
// voir nova-brain/projets/Studio 360.md). Les prix ici ne servent qu'à remplir la base
// au premier démarrage : ensuite, ils se modifient dans /gestion.

import { PHOTOS_CLIENT } from "./photos-client.ts";

export type Categorie = "plateaux" | "bureaux";

export type OptionId = "cameras-3" | "cameras-6" | "eclairage" | "maquillage";

export type Espace = {
  slug: string;
  nom: string;
  studio?: string; // "Studio 1"...
  categorie: Categorie;
  accroche: string;
  equipements: string[];
  surface: string; // texte de la maquette, ex. "88 m² • 6 m de largeur • 11 m de longueur"
  photos: string[]; // chemins dans /public
  legendes?: (string | null)[]; // texte alternatif de chaque photo, tiré du nom de fichier du client
  og?: string; // image de partage 1200 x 630, faite par scripts/photos.ts
  options: OptionId[];
  prixHeure: number; // € HT
  prixJournee: number; // € HT, journée 8h-17h
  groupe?: string; // espaces identiques réservables séparément (les 3 cabines)
};

const TOUTES: OptionId[] = ["cameras-3", "cameras-6", "eclairage", "maquillage"];
const LEGERES: OptionId[] = ["eclairage", "maquillage"];

export const OPTIONS: { id: OptionId; nom: string; detail?: string; prix: number }[] = [
  { id: "cameras-3", nom: "3 caméras GH4 + régie", prix: 250 },
  { id: "cameras-6", nom: "6 caméras GH4 + régie", prix: 350 },
  { id: "eclairage", nom: "Éclairage supplémentaire PL-48 LED", detail: "3200K à 5700K", prix: 40 },
  { id: "maquillage", nom: "Maquillage, maquilleuse", detail: "1 h, par personne", prix: 100 },
];

// Les deux packs caméras s'excluent (6 caméras contient les 3) : choix de mise en forme, provisoire,
// la maquette les proposait en cases à cocher indépendantes. À confirmer avec le client.
export const OPTIONS_EXCLUSIVES: OptionId[][] = [["cameras-3", "cameras-6"]];

const cabine = (n: number): Espace => ({
  slug: `cabine-montage-${n}`,
  nom: `Cabine de montage ${n}`,
  categorie: "bureaux",
  accroche: "Une cabine individuelle pour monter vos vidéos au calme. Tarif par cabine.",
  equipements: ["1 bureau", "1 station de montage"],
  surface: "5 m²",
  photos: ["/espaces/s360-024.jpg", "/espaces/s360-025.jpg"],
  options: LEGERES,
  prixHeure: 30,
  prixJournee: 110,
  groupe: "cabines",
});

const ESPACES_MAQUETTE: Espace[] = [
  {
    slug: "grand-plateau-tv",
    nom: "Grand Plateau TV",
    studio: "Studio 1",
    categorie: "plateaux",
    accroche:
      "Un véritable plateau TV polyvalent pour émissions, interviews, web TV, conférences, shootings et productions audiovisuelles.",
    equipements: ["Écran TV", "Chaises", "Fauteuils", "Éclairages", "Caméras", "Plateau TV 66 m²"],
    surface: "88 m² • 6 m de largeur • 11 m de longueur",
    photos: ["/espaces/s360-008.jpg", "/espaces/s360-009.jpg"],
    options: TOUTES,
    prixHeure: 120,
    prixJournee: 450,
  },
  {
    slug: "grand-fond-vert",
    nom: "Grand Fond Vert",
    studio: "Studio 3",
    categorie: "plateaux",
    accroche: "L'espace idéal pour les tournages sur fond vert, shootings photo et créations audiovisuelles.",
    equipements: ["Fond vert / cyclorama", "Éclairages photo", "Éclairages studio", "Caméra"],
    surface: "27 m² • 4,50 m x 5 m • cyclorama 22,5 m²",
    photos: ["/espaces/s360-010.jpg", "/espaces/s360-011.jpg"],
    options: LEGERES,
    prixHeure: 108,
    prixJournee: 450,
  },
  {
    slug: "petit-fond-vert",
    nom: "Petit Fond Vert",
    studio: "Studio 4",
    categorie: "plateaux",
    accroche:
      "Un studio compact et créatif, parfait pour interviews, contenus réseaux sociaux, portraits et petits tournages.",
    equipements: ["Fond vert", "Table noire", "Fauteuils roses", "Fauteuils blancs", "Petite table"],
    surface: "13 m²",
    photos: ["/espaces/s360-012.jpg", "/espaces/s360-013.jpg"],
    options: TOUTES,
    prixHeure: 80,
    prixJournee: 225,
  },
  {
    slug: "studio-podcast",
    nom: "Studio Podcast",
    studio: "Studio 5",
    categorie: "plateaux",
    accroche:
      "Un espace confortable pour podcasts vidéo, interviews, émissions, tables rondes et contenus digitaux.",
    equipements: ["Grande table", "Petite table", "Table haute", "Fauteuils noirs", "Chaise haute", "Microphones"],
    surface: "45 m² • 4,50 m de largeur • 11 m de longueur",
    photos: ["/espaces/s360-015.jpg", "/espaces/s360-016.jpg"],
    options: TOUTES,
    prixHeure: 110,
    prixJournee: 400,
  },
  {
    slug: "studio-enregistrement",
    nom: "Studio d'enregistrement",
    categorie: "plateaux",
    accroche: "Un studio dédié à l'enregistrement audio et vidéo : voix off, musique, mixage et montage son.",
    equipements: ["Station audio/vidéo iMac", "Monitoring", "Cabine d'enregistrement"],
    surface: "20 m²",
    photos: ["/espaces/s360-026.jpg", "/espaces/s360-027.jpg", "/espaces/s360-028.jpg", "/espaces/s360-029.jpg"],
    options: LEGERES,
    prixHeure: 60,
    prixJournee: 350,
  },
  {
    slug: "salle-formation-reunion",
    nom: "Salle de formation / réunion",
    categorie: "bureaux",
    accroche: "Une salle modulable pour vos formations, réunions d'équipe, ateliers et séminaires.",
    equipements: ["Espace modulable"],
    surface: "45 m²",
    photos: ["/espaces/s360-017.jpg", "/espaces/s360-018.jpg"],
    options: LEGERES,
    prixHeure: 100,
    prixJournee: 300,
  },
  {
    slug: "petit-bureau",
    nom: "Petit bureau",
    categorie: "bureaux",
    accroche: "Un bureau calme et équipé pour travailler à deux, en toute autonomie.",
    equipements: ["2 bureaux", "1 imprimante", "2 chaises"],
    surface: "13 m²",
    photos: ["/espaces/s360-019.jpg", "/espaces/s360-020.jpg"],
    options: LEGERES,
    prixHeure: 45,
    prixJournee: 200,
  },
  {
    slug: "grand-bureau",
    nom: "Grand bureau",
    categorie: "bureaux",
    accroche: "Un grand bureau pour une équipe de quatre, avec un espace de réunion intégré.",
    equipements: ["4 bureaux", "1 imprimante", "4 chaises", "1 bureau de réunion"],
    surface: "25 m²",
    photos: ["/espaces/s360-022.jpg", "/espaces/s360-023.jpg"],
    options: LEGERES,
    prixHeure: 45,
    prixJournee: 320,
  },
  cabine(1),
  cabine(2),
  cabine(3),
];

// Photos du client traitées par scripts/photos.ts : elles remplacent celles de la maquette, espace par espace
// (dossier au nom de l'espace, ou du groupe pour les cabines).
export const ESPACES: Espace[] = ESPACES_MAQUETTE.map((e) => {
  const client = PHOTOS_CLIENT[e.slug] ?? (e.groupe ? PHOTOS_CLIENT[e.groupe] : undefined);
  if (!client?.photos.length) return e;
  return { ...e, photos: client.photos.map((p) => p.src), legendes: client.photos.map((p) => p.alt), og: client.og };
});

export const CONTACT = {
  email: "studio360@gmail.com",
  // Adresse du studio, à fournir : sert au formulaire de rétractation envoyé par e-mail et, une fois complète,
  // aux données structurées LocalBusiness de l'accueil (Google demande une adresse postale détaillée).
  adresse: { rue: "", codePostal: "", ville: "" },
  instagram: "studio360", // à confirmer : le compte exact n'est pas vérifié
  instagramVerifie: false, // passer à true une fois le compte confirmé : il entre alors dans les données structurées
  devise: "Votre projet. Votre espace. Votre production.",
};

/** Adresse sur une ligne, ou chaîne vide tant qu'elle n'est pas complète. */
export function adresseTexte() {
  const { rue, codePostal, ville } = CONTACT.adresse;
  return rue && codePostal && ville ? `${rue}, ${codePostal} ${ville}` : "";
}

export function espaceParSlug(slug: string) {
  return ESPACES.find((e) => e.slug === slug);
}
