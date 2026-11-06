import type { NextConfig } from "next";

// next.config ne peut pas importer lib/config.ts (marqué "server-only") : on lit l'environnement ici.
// Les en-têtes sont figés au build : SITE_URL doit donc être défini au moment du build de production.
const EN_DEV = process.env.NODE_ENV !== "production";
const EN_HTTPS = (process.env.SITE_URL ?? "").startsWith("https://");

// Politique de sécurité du contenu, variante sans nonce du guide Next.js
// (nextjs.org/docs/app/guides/content-security-policy, lu le 6 novembre 2026). Les nonces forcent le rendu
// dynamique de toutes les pages : le site garde ses pages statiques et accepte 'unsafe-inline' pour les scripts
// d'hydratation de Next, comme le guide l'indique pour ce cas.
// - 'unsafe-eval' seulement en développement : React s'en sert pour le débogage (même guide).
// - Aucune ressource externe : polices auto-hébergées par next/font, photos dans /public, pas de mesure
//   d'audience. Le bouton Google est un lien (GET), pas un formulaire : form-action 'self' ne le bloque pas.
// - frame-ancestors 'none' remplace X-Frame-Options pour les navigateurs récents (OWASP, voir plus bas).
// - upgrade-insecure-requests seulement en https, sinon le site local en http casserait.
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${EN_DEV ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' blob: data:",
  "font-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  ...(EN_HTTPS ? ["upgrade-insecure-requests"] : []),
].join("; ");

// Valeurs de l'OWASP HTTP Headers Cheat Sheet (cheatsheetseries.owasp.org, lue le 6 novembre 2026).
const entetes = [
  { key: "Content-Security-Policy", value: csp },
  // OWASP : « X-Frame-Options: DENY », pour les navigateurs qui ignorent frame-ancestors.
  { key: "X-Frame-Options", value: "DENY" },
  // OWASP : « X-Content-Type-Options: nosniff ».
  { key: "X-Content-Type-Options", value: "nosniff" },
  // OWASP : « Referrer-Policy: strict-origin-when-cross-origin ». En plus, le lien privé d'une réservation
  // (/reservation/<jeton>) ne part jamais en entier vers un autre site.
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // OWASP : couper les fonctions du navigateur dont le site ne se sert pas.
  { key: "Permissions-Policy", value: "geolocation=(), camera=(), microphone=()" },
  // OWASP : « Cross-Origin-Opener-Policy: same-origin ». Pas de COEP ni de CORP : le site n'a pas besoin
  // d'isolation entre origines, et CORP same-site empêcherait les images du site de s'afficher dans les e-mails.
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
  // OWASP conseille de ne pas envoyer X-XSS-Protection (ou de le mettre à 0) : on ne l'envoie pas.
  // OWASP : HSTS « max-age=63072000; includeSubDomains; preload ». On garde max-age seul : le domaine n'est pas
  // choisi, et includeSubDomains ou preload engagent tous ses sous-domaines (OWASP demande de comprendre HSTS
  // avant de les activer). À revoir une fois le domaine connu. Seulement en https.
  ...(EN_HTTPS ? [{ key: "Strict-Transport-Security", value: "max-age=63072000" }] : []),
];

const nextConfig: NextConfig = {
  // PGlite charge ses fichiers WASM et data depuis node_modules au démarrage : il reste un paquet
  // Node externe, non empaqueté (à vérifier au premier build : provisoire, sans source écrite).
  serverExternalPackages: ["@electric-sql/pglite"],
  // OWASP : supprimer X-Powered-By, qui annonce la technologie du serveur.
  poweredByHeader: false,
  async headers() {
    return [{ source: "/:path*", headers: entetes }];
  },
  // Images (nextjs.org/docs/app/api-reference/components/image, lu le 6 novembre 2026) : on garde les valeurs
  // par défaut, écrites ici pour qu'elles se voient.
  // - qualities [75] : la valeur par défaut, une seule qualité donc une seule variante en cache par largeur.
  // - formats : WebP par défaut, que la doc conseille de garder (chaque format en plus est mis en cache à part,
  //   et compte une transformation de plus chez Vercel).
  // - minimumCacheTTL : défaut de 4 h, la doc conseille de le garder bas faute d'invalidation.
  images: {
    qualities: [75],
  },
};

export default nextConfig;
