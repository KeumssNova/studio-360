import Link from "next/link";
import { utilisateurCourant } from "@/lib/auth";
import { Logo } from "./Logo";
import { MenuMobile } from "./MenuMobile";
import { LienNav } from "./LienNav";

// Même navigation que la maquette : Espaces, Tarifs, Contact, Mon compte, bouton Réserver en or.
export async function Entete() {
  const u = await utilisateurCourant();
  const liens = [
    { href: "/espaces", texte: "Espaces" },
    { href: "/tarifs", texte: "Tarifs" },
    { href: "/contact", texte: "Contact" },
    u?.admin ? { href: "/gestion", texte: "Gestion" } : { href: "/compte", texte: "Mon compte" },
  ];
  return (
    <header className="sans-impression sticky top-0 z-40 border-b border-filet bg-fond/90 backdrop-blur-md">
      <div className="relative mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link href="/" aria-label="Studio 360, accueil" className="shrink-0">
          <Logo />
        </Link>
        <nav aria-label="Navigation principale" className="hidden items-center gap-7 md:flex">
          {liens.map((l) => (
            <LienNav key={l.href} href={l.href}>
              {l.texte}
            </LienNav>
          ))}
          <Link href="/reserver" className="btn btn-or">
            Réserver
          </Link>
        </nav>
        <MenuMobile liens={liens} />
      </div>
    </header>
  );
}
