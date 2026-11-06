import type { Metadata } from "next";
import { ESPACES, type Espace } from "@/data/catalogue";

// Next remplace en entier l'objet openGraph d'un parent dès qu'une page définit le sien : chaque page part donc
// de cette base pour garder le type, la langue et le nom du site.
export const OG_BASE = { type: "website", locale: "fr_FR", siteName: "Studio 360" } as const;

// Image de partage : celle faite par scripts/photos.ts (1200 x 630, le format conseillé par Meta,
// developers.facebook.com/docs/sharing/webmasters/images lu le 6 novembre 2026), sinon la première photo.
export function imagePartage(e: Espace): NonNullable<Metadata["openGraph"]>["images"] {
  return e.og ? [{ url: e.og, width: 1200, height: 630, alt: e.nom }] : [{ url: e.photos[0], alt: e.nom }];
}

export const IMAGE_SITE = imagePartage(ESPACES[0]);

// Adresse d'une page : la canonique et og:url, toujours la même. og:url fait partie des quatre propriétés
// obligatoires du protocole Open Graph, avec og:title, og:type et og:image (ogp.me, lu le 6 novembre 2026).
// Le chemin est relatif : Next le rend absolu avec metadataBase (layout.tsx), comme la canonique.
export function adressePage(chemin: string, images = IMAGE_SITE): Pick<Metadata, "alternates" | "openGraph"> {
  return { alternates: { canonical: chemin }, openGraph: { ...OG_BASE, url: chemin, images } };
}
