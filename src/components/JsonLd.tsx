// Données structurées en JSON-LD, comme le montre le guide Next.js (nextjs.org/docs/app/guides/json-ld, lu le
// 6 novembre 2026) : balise script dans la page, avec « < » échappé pour qu'un texte ne puisse pas fermer la balise.
export function JsonLd({ donnees }: { donnees: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(donnees).replace(/</g, "\u003c") }}
    />
  );
}
