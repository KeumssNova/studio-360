import Link from "next/link";
import { CONTACT } from "@/data/catalogue";
import { FERMETURE, OUVERTURE } from "@/lib/regles";
import { Logo } from "./Logo";

export function PiedDePage() {
  return (
    <footer className="sans-impression mt-24 border-t border-filet">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-[1.4fr_1fr_1fr]">
        <div>
          <Logo taille={44} />
          <p className="mt-4 max-w-xs text-sm text-gris">{CONTACT.devise}</p>
          <p className="mt-2 text-sm text-gris">
            Location à l&apos;heure ou à la journée, de {OUVERTURE}h à {FERMETURE}h.
          </p>
        </div>
        <div>
          <p className="surtitre">Le studio</p>
          <ul className="mt-4 space-y-2.5 text-sm">
            <li><Link className="hover:text-or" href="/espaces">Espaces</Link></li>
            <li><Link className="hover:text-or" href="/tarifs">Tarifs</Link></li>
            <li><Link className="hover:text-or" href="/reserver">Réserver</Link></li>
            <li><Link className="hover:text-or" href="/contact">Contact</Link></li>
            <li><Link className="hover:text-or" href="/compte">Mon compte</Link></li>
          </ul>
        </div>
        <div>
          <p className="surtitre">Informations</p>
          <ul className="mt-4 space-y-2.5 text-sm">
            <li><Link className="hover:text-or" href="/cgv">Conditions générales</Link></li>
            <li><Link className="hover:text-or" href="/mentions-legales">Mentions légales</Link></li>
            <li><Link className="hover:text-or" href="/confidentialite">Confidentialité</Link></li>
            <li><a className="hover:text-or" href={`mailto:${CONTACT.email}`}>{CONTACT.email}</a></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-filet-neutre">
        <p className="mx-auto max-w-6xl px-4 py-5 text-xs text-gris sm:px-6">© {new Date().getFullYear()} Studio 360</p>
      </div>
    </footer>
  );
}
