// Prépare les photos du client pour le site : npm run photos (ou npm run photos -- <dossier>).
//
// Entrée : photos-originales/<slug de l'espace>/ (ou <groupe>/ pour les trois cabines : photos-originales/cabines/),
// fichiers en JPEG, PNG, WebP ou TIFF, dans l'ordre voulu (tri naturel : 2 avant 10). Le dossier est ignoré par git.
// Sorties :
// - public/espaces/<clé>-<n>.jpg, les photos de la galerie et des cartes ;
// - public/og/<clé>.jpg, l'image de partage (Facebook, X, messageries) tirée de la première photo ;
// - src/data/photos-client.ts, la liste lue par le catalogue. Les espaces absents de ce passage gardent leurs photos.
// Le texte alternatif vient du nom de fichier : « 01-plateau-vu-de-la-regie.jpg » donne « Plateau vu de la regie ».
// Google conseille des noms de fichier courts et descriptifs, et un texte alternatif qui décrit l'image
// (developers.google.com/search/docs/appearance/google-images, lu le 6 novembre 2026).

import { mkdir, readdir, unlink, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import sharp from "sharp";
import { ESPACES } from "../src/data/catalogue.ts";
import { PHOTOS_CLIENT, type PhotoClient, type PhotosEspace } from "../src/data/photos-client.ts";

const RACINE = path.resolve(import.meta.dirname, "..");
const ENTREE = path.resolve(process.argv[2] ?? path.join(RACINE, "photos-originales"));
const SORTIE_PHOTOS = path.join(RACINE, "public", "espaces");
const SORTIE_OG = path.join(RACINE, "public", "og");
const MANIFESTE = path.join(RACINE, "src", "data", "photos-client.ts");

// Largeur des photos. Le plus grand emplacement est la galerie : 640 px CSS sur ordinateur (sizes de Galerie.tsx).
// Sur un écran de densité 2, le navigateur demande 1280 px et Next sert la taille suivante de sa liste deviceSizes,
// 1920 (nextjs.org/docs/app/api-reference/components/image, lu le 6 novembre 2026). 1920 couvre donc ce cas.
// Une photo plus petite n'est jamais agrandie (withoutEnlargement), elle est signalée.
const LARGEUR = 1920;
// Qualité JPEG du fichier source : provisoire, sans source. Next le réencode ensuite en WebP qualité 75
// (next.config.ts) : la source doit rester assez fine pour ne pas cumuler deux pertes visibles.
const QUALITE = 90;
// Image de partage : 1200 x 630, le format conseillé par Meta (developers.facebook.com/docs/sharing/webmasters/images,
// lu le 6 novembre 2026). Qualité 85 : provisoire, sans source.
const OG = { largeur: 1200, hauteur: 630, qualite: 85 };

const EXTENSIONS = new Set([".jpg", ".jpeg", ".png", ".webp", ".tif", ".tiff"]);
// Noms donnés par les appareils photo et les téléphones : ils ne décrivent rien, pas de texte alternatif tiré du nom.
const NOM_APPAREIL = /^(img|dsc|dscn|dji|pxl|gopr|mvi|_mg|photo|image)[-_ ]?\d+/i;

const cles = new Set(ESPACES.flatMap((e) => [e.slug, ...(e.groupe ? [e.groupe] : [])]));
const alertes: string[] = [];

function texteAlternatif(fichier: string): string | null {
  const nom = path.parse(fichier).name;
  if (NOM_APPAREIL.test(nom)) return null;
  const texte = nom
    .replace(/^\d+[\s._-]*/, "")
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return texte ? texte[0].toUpperCase() + texte.slice(1) : null;
}

async function traiterDossier(cle: string): Promise<PhotosEspace | null> {
  const dossier = path.join(ENTREE, cle);
  const fichiers = (await readdir(dossier))
    .filter((f) => EXTENSIONS.has(path.extname(f).toLowerCase()))
    .sort((a, b) => a.localeCompare(b, "fr", { numeric: true }));
  const ignores = (await readdir(dossier)).filter((f) => !EXTENSIONS.has(path.extname(f).toLowerCase()) && !f.startsWith("."));
  for (const f of ignores) alertes.push(`${cle}/${f} : ignoré, format non pris en charge. Une photo HEIC d'iPhone s'exporte en JPEG.`);
  if (!fichiers.length) {
    alertes.push(`${cle} : aucune photo lisible, l'espace garde celles de la maquette.`);
    return null;
  }

  // Les anciennes sorties de cette clé partent d'abord : une photo retirée du dossier disparaît aussi du site.
  for (const f of await readdir(SORTIE_PHOTOS)) {
    if (new RegExp(`^${cle}-\\d+\\.jpg$`).test(f)) await unlink(path.join(SORTIE_PHOTOS, f));
  }

  const photos: PhotoClient[] = [];
  let premiere = "";
  for (const fichier of fichiers) {
    const source = path.join(dossier, fichier);
    const n = photos.length + 1;
    const nomSortie = `${cle}-${n}.jpg`;
    try {
      // Sans withMetadata, sharp retire toutes les métadonnées (EXIF, donc la position GPS du téléphone) et convertit
      // en sRGB (lib/index.d.ts de sharp 0.35). autoOrient applique l'orientation EXIF avant de la retirer.
      const info = await sharp(source)
        .autoOrient()
        .resize({ width: LARGEUR, withoutEnlargement: true })
        .jpeg({ quality: QUALITE, mozjpeg: true })
        .toFile(path.join(SORTIE_PHOTOS, nomSortie));
      const alt = texteAlternatif(fichier);
      if (!alt) alertes.push(`${cle}/${fichier} : nom d'appareil, pas de description. Renommer le fichier en décrivant la photo.`);
      if (info.width < LARGEUR) alertes.push(`${cle}/${fichier} : ${info.width} px de large, moins que ${LARGEUR} : floue sur grand écran.`);
      if (info.height > info.width) alertes.push(`${cle}/${fichier} : photo en hauteur, recadrée en 16:9 dans la galerie.`);
      photos.push({ src: `/espaces/${nomSortie}`, alt, largeur: info.width, hauteur: info.height });
      premiere ||= source;
    } catch (err) {
      alertes.push(`${cle}/${fichier} : illisible (${(err as Error).message}). L'exporter en JPEG.`);
    }
  }
  if (!photos.length) return null;

  // Image de partage : recadrage sur la zone la plus riche (« attention » : contraste, couleurs, peau, d'après la
  // documentation de sharp), plutôt qu'au centre.
  const meta = await sharp(premiere).metadata();
  if (meta.autoOrient.width < OG.largeur) alertes.push(`${cle} : première photo de moins de ${OG.largeur} px, image de partage agrandie.`);
  await sharp(premiere)
    .autoOrient()
    .resize({ width: OG.largeur, height: OG.hauteur, fit: "cover", position: sharp.strategy.attention })
    .jpeg({ quality: OG.qualite, mozjpeg: true })
    .toFile(path.join(SORTIE_OG, `${cle}.jpg`));

  return { photos, og: `/og/${cle}.jpg` };
}

async function main() {
  if (!existsSync(ENTREE)) {
    console.error(`Dossier introuvable : ${ENTREE}\nCréer photos-originales/<slug>/ pour chaque espace. Slugs : ${[...cles].join(", ")}`);
    process.exit(1);
  }
  await mkdir(SORTIE_PHOTOS, { recursive: true });
  await mkdir(SORTIE_OG, { recursive: true });

  const resultat: Record<string, PhotosEspace> = { ...PHOTOS_CLIENT };
  const dossiers = (await readdir(ENTREE, { withFileTypes: true })).filter((d) => d.isDirectory()).map((d) => d.name);
  for (const cle of dossiers.sort()) {
    if (!cles.has(cle)) {
      alertes.push(`${cle} : dossier inconnu, ignoré. Slugs attendus : ${[...cles].join(", ")}`);
      continue;
    }
    const r = await traiterDossier(cle);
    if (r) {
      resultat[cle] = r;
      console.log(`${cle} : ${r.photos.length} photo(s)`);
    }
  }

  const contenu =
    "// Fichier écrit par scripts/photos.ts (npm run photos) : ne pas le modifier à la main.\n" +
    "// Vide tant que les photos du client n'ont pas été traitées : le site garde alors celles de la maquette.\n\n" +
    "export type PhotoClient = { src: string; alt: string | null; largeur: number; hauteur: number };\n" +
    "export type PhotosEspace = { photos: PhotoClient[]; og: string };\n\n" +
    `export const PHOTOS_CLIENT: Record<string, PhotosEspace> = ${JSON.stringify(resultat, null, 2)};\n`;
  await writeFile(MANIFESTE, contenu, "utf8");

  if (alertes.length) console.log(`\nÀ vérifier :\n- ${alertes.join("\n- ")}`);
  console.log(`\nListe écrite : ${path.relative(RACINE, MANIFESTE)}. Relancer le site pour voir les photos.`);
}

await main();
