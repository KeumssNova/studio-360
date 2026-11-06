import type { Metadata, Viewport } from "next";
import { Archivo_Black, Montserrat } from "next/font/google";
import { Entete } from "@/components/Entete";
import { PiedDePage } from "@/components/PiedDePage";
import { SITE_URL } from "@/lib/config";
import { IMAGE_SITE, OG_BASE } from "@/lib/seo";
import "./globals.css";

// Polices de la maquette du client (relevées dans sa feuille de style) : Archivo Black pour les titres,
// Montserrat pour le texte. next/font les sert depuis le site, sans appel à Google chez le visiteur.
const titre = Archivo_Black({ weight: "400", subsets: ["latin"], variable: "--font-archivo-black", display: "swap" });
const texte = Montserrat({ subsets: ["latin"], variable: "--font-montserrat", display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: "Studio 360 : plateaux TV, studios et bureaux à louer", template: "%s · Studio 360" },
  description:
    "Plateau TV, fonds verts, studio podcast, studio d'enregistrement, salle de formation et bureaux à louer à l'heure ou à la journée. Réservation en ligne.",
  openGraph: { ...OG_BASE, images: IMAGE_SITE },
  // X lit les balises Open Graph quand ses propres balises manquent, sauf twitter:card qui choisit le format
  // (developer.x.com/cards/overview, consulté le 6 novembre 2026) : grande image plutôt que vignette.
  twitter: { card: "summary_large_image" },
  // Pas d'adresse canonique ici : elle serait héritée par toutes les pages. Chacune pose la sienne.
};

// #060606 : le fond oklch(12% 0 0) converti en sRGB (OKLab achromatique : L³, puis courbe sRGB).
export const viewport: Viewport = { themeColor: "#060606", colorScheme: "dark" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className={`${titre.variable} ${texte.variable}`}>
      <body className="flex min-h-dvh flex-col">
        <a href="#contenu" className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:rounded-sm focus:bg-or focus:px-4 focus:py-2 focus:text-sur-or">
          Aller au contenu
        </a>
        <Entete />
        <main id="contenu" className="flex-1">
          {children}
        </main>
        <PiedDePage />
      </body>
    </html>
  );
}
