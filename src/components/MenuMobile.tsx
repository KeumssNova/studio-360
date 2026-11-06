"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { List, X } from "@phosphor-icons/react";

export function MenuMobile({ liens }: { liens: { href: string; texte: string }[] }) {
  const [ouvert, setOuvert] = useState(false);
  const chemin = usePathname();
  const [cheminVu, setCheminVu] = useState(chemin);
  // Referme le menu quand on change de page (motif « ajuster l'état pendant le rendu », doc React).
  if (chemin !== cheminVu) {
    setCheminVu(chemin);
    setOuvert(false);
  }
  useEffect(() => {
    if (!ouvert) return;
    const echap = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOuvert(false);
    };
    window.addEventListener("keydown", echap);
    return () => window.removeEventListener("keydown", echap);
  }, [ouvert]);
  return (
    <div className="md:hidden">
      <button
        type="button"
        className="grid size-11 place-items-center rounded-sm border border-filet-neutre"
        aria-expanded={ouvert}
        aria-controls="menu-mobile"
        aria-label={ouvert ? "Fermer le menu" : "Ouvrir le menu"}
        onClick={() => setOuvert((o) => !o)}
      >
        {ouvert ? <X size={20} /> : <List size={20} />}
      </button>
      {ouvert && (
        <nav id="menu-mobile" aria-label="Navigation principale" className="absolute inset-x-0 top-16 border-b border-filet bg-fond px-4 pt-2 pb-6">
          <ul className="divide-y divide-filet-neutre">
            {liens.map((l) => (
              <li key={l.href}>
                <Link href={l.href} className="block py-4 font-titre text-sm tracking-[0.06em] uppercase">
                  {l.texte}
                </Link>
              </li>
            ))}
          </ul>
          <Link href="/reserver" className="btn btn-or mt-4 w-full">
            Réserver
          </Link>
        </nav>
      )}
    </div>
  );
}
