import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/config";

// Les pages privées restent hors des moteurs de recherche. robots.txt n'est pas une protection (RFC 9309,
// « Security Considerations ») : ces pages sont protégées par la connexion ou par un lien aléatoire, et portent aussi noindex.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/gestion", "/compte", "/reservation/", "/connexion", "/auth/", "/api/", "/dev/"],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
