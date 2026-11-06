"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function LienNav({ href, children }: { href: string; children: React.ReactNode }) {
  const actif = usePathname().startsWith(href);
  return (
    <Link
      href={href}
      aria-current={actif ? "page" : undefined}
      className={`font-titre text-[0.8rem] tracking-[0.06em] uppercase transition-colors hover:text-or ${actif ? "text-or" : "text-texte"}`}
    >
      {children}
    </Link>
  );
}
