import type { MetadataRoute } from "next";
import { ESPACES } from "@/data/catalogue";
import { SITE_URL } from "@/lib/config";

// Plan du site pour les moteurs de recherche (convention de fichier sitemap.ts de Next.js, format sitemaps.org).
// Seulement les pages publiques : les pages de réservation privées, le compte et la gestion n'y sont pas.
export default function sitemap(): MetadataRoute.Sitemap {
  const pages = ["", "/espaces", "/tarifs", "/reserver", "/contact", "/cgv", "/mentions-legales", "/confidentialite"];
  return [
    ...pages.map((p) => ({ url: `${SITE_URL}${p}` })),
    ...ESPACES.map((e) => ({ url: `${SITE_URL}/espaces/${e.slug}` })),
  ];
}
