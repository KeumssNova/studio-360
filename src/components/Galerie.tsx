"use client";

import Image from "next/image";
import { useState } from "react";

export function Galerie({ photos, nom }: { photos: string[]; nom: string }) {
  const [i, setI] = useState(0);
  return (
    <div>
      <div className="relative aspect-video overflow-hidden rounded-sm border border-filet bg-sourdine">
        <Image
          key={photos[i]}
          src={photos[i]}
          alt={`${nom}, photo ${i + 1} sur ${photos.length}`}
          fill
          priority={i === 0}
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
