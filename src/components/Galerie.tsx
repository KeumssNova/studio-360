"use client";

import Image from "next/image";
import { useState } from "react";

// Texte alternatif : la légende du client si son nom de fichier en donnait une, sinon le nom de l'espace.
// Google : l'attribut alt est le plus important pour le référencement des images, il doit décrire la photo
// (developers.google.com/search/docs/appearance/google-images, lu le 6 novembre 2026).
export function Galerie({ photos, nom, legendes }: { photos: string[]; nom: string; legendes?: (string | null)[] }) {
  const [i, setI] = useState(0);
  return (
    <div>
      <div className="relative aspect-video overflow-hidden rounded-sm border border-filet bg-sourdine">
        <Image
          key={photos[i]}
          src={photos[i]}
          alt={legendes?.[i] ? `${nom} : ${legendes[i]}` : `${nom}, photo ${i + 1} sur ${photos.length}`}
          fill
          preload={i === 0}
          sizes="(min-width: 1024px) 640px, 100vw"
          className="object-cover"
        />
      </div>
      {photos.length > 1 && (
        <ul className="mt-3 grid grid-cols-4 gap-3" aria-label="Autres photos">
          {photos.map((p, n) => (
            <li key={p}>
              <button
                type="button"
                onClick={() => setI(n)}
                aria-label={`Afficher la photo ${n + 1}`}
                aria-pressed={n === i}
                className={`relative block aspect-video w-full overflow-hidden rounded-sm border transition-colors ${n === i ? "border-or" : "border-filet-neutre opacity-70 hover:opacity-100"}`}
              >
                <Image src={p} alt="" fill sizes="150px" className="object-cover" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
