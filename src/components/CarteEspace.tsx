import Image from "next/image";
import Link from "next/link";
import { prix, prixTtc } from "@/lib/format";
import type { FicheVitrine } from "@/lib/vitrine";

export const surfaceCourte = (surface: string) => surface.split("•")[0].trim();

// Carte de la maquette : photo, titre en capitales, « 88 m² • dès 120 € HT/h », filet or.
export function CarteEspace({ f, compacte = false }: { f: FicheVitrine; compacte?: boolean }) {
  return (
    <Link
      href={`/espaces/${f.slug}`}
      className="group flex h-full flex-col overflow-hidden rounded-sm border border-filet bg-carte transition-colors duration-200 hover:border-or"
    >
      <div className="relative aspect-video overflow-hidden bg-sourdine">
        <Image
          src={f.photos[0]}
          alt=""
          fill
          sizes={compacte ? "(min-width: 1024px) 270px, (min-width: 640px) 50vw, 100vw" : "(min-width: 1024px) 360px, (min-width: 640px) 50vw, 100vw"}
          className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.03]"
        />
        {f.nombre > 1 && (
          <span className="absolute top-3 left-3 rounded-sm bg-fond/85 px-2 py-1 text-xs font-semibold">{f.nombre} cabines</span>
        )}
        {!f.reservable && (
          <span className="absolute top-3 right-3 rounded-sm bg-fond/85 px-2 py-1 text-xs font-semibold text-gris">Sur demande</span>
        )}
      </div>
      <div className={compacte ? "flex flex-1 flex-col p-4" : "flex flex-1 flex-col p-5"}>
        {f.studio && <p className="surtitre">{f.studio}</p>}
        <h3 className={`mt-1 leading-tight ${compacte ? "text-base" : "text-lg"}`}>{f.titre}</h3>
        <p className="chiffres mt-auto pt-3 text-sm text-gris">
          {surfaceCourte(f.surface)} <span aria-hidden="true" className="text-or">•</span> dès{" "}
          <span className="font-semibold text-texte">{prix(f.prixHeure)}</span> HT/h, {prixTtc(f.prixHeure)} TTC
        </p>
      </div>
    </Link>
  );
}
