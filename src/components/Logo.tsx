import Image from "next/image";

/** Logo rond fourni par le client, suivi du nom comme dans l'en-tête de la maquette. */
export function Logo({ taille = 36, avecNom = true }: { taille?: number; avecNom?: boolean }) {
  return (
    <span className="inline-flex items-center gap-2.5">
      <Image src="/logo.jpg" alt="" width={taille} height={taille} className="rounded-full" loading="eager" />
      {avecNom && <span className="font-titre text-[0.95rem] tracking-wide">STUDIO 360</span>}
    </span>
  );
}
