import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, FilePdf, SignOut } from "@phosphor-icons/react/dist/ssr";
import { seDeconnecter } from "@/app/actions";
import { BadgeStatut } from "@/components/BadgeStatut";
import { BoutonAnnuler } from "@/components/BoutonAnnuler";
import { utilisateurCourant } from "@/lib/auth";
import { dateLongue, euros, horaire, majuscule } from "@/lib/format";
import { maintenantParis } from "@/lib/regles";
import { nomEspace, reservationsDe, type Reservation } from "@/lib/reservations";

export const metadata: Metadata = { title: "Mon compte", robots: { index: false, follow: false } };

export default async function Compte() {
  const u = await utilisateurCourant();
  if (!u) redirect("/connexion?retour=/compte");
  const toutes = await reservationsDe(u.email);
  const aujourdhui = maintenantParis().date;
  // À venir : de la plus proche à la plus lointaine. Passées : de la plus récente à la plus ancienne.
  const aVenir = toutes.filter((r) => r.date >= aujourdhui).reverse();
  const passees = toutes.filter((r) => r.date < aujourdhui);

  return (
    <div className="mx-auto max-w-4xl px-4 pt-12 sm:px-6">
      <div className="flex flex-wrap items-end justify-between gap-6">
        <div>
          <p className="surtitre">Mon compte</p>
          <h1 className="mt-3 text-3xl leading-tight sm:text-4xl">Mes réservations</h1>
          <p className="mt-3 text-sm break-all text-gris">{u.email}</p>
        </div>
        <div className="flex flex-wrap gap-3">
          {u.admin && (
            <Link href="/gestion" className="btn btn-contour">
              Gestion du studio
            </Link>
          )}
          <form action={seDeconnecter}>
            <button type="submit" className="btn btn-discret">
              <SignOut size={18} aria-hidden="true" /> Se déconnecter
            </button>
          </form>
        </div>
      </div>

      {toutes.length === 0 ? (
        <div className="mt-12 rounded-sm border border-filet-neutre p-8 text-center">
          <p className="font-titre text-lg uppercase">Aucune réservation</p>
          <p className="mx-auto mt-2 max-w-[45ch] text-sm text-gris">
            Les demandes faites avec cette adresse apparaîtront ici, avec leur statut et leur récapitulatif.
          </p>
          <Link href="/reserver" className="btn btn-or mt-6">
            Réserver un espace
          </Link>
        </div>
      ) : (
        <>
          <Liste titre="À venir" vide="Aucune réservation à venir." lignes={aVenir} annulable />
          {passees.length > 0 && <Liste titre="Passées" lignes={passees} />}
        </>
      )}
    </div>
  );
}

function Liste({ titre, lignes, vide, annulable }: { titre: string; lignes: Reservation[]; vide?: string; annulable?: boolean }) {
  return (
    <section aria-label={titre} className="mt-12">
      <h2 className="text-base">{titre}</h2>
      {lignes.length === 0 ? (
        <p className="mt-4 text-sm text-gris">{vide}</p>
      ) : (
        <ul className="mt-4 divide-y divide-filet-neutre border-y border-filet-neutre">
          {lignes.map((r) => (
            <li key={r.id} className="py-5">
              <div className="flex flex-wrap items-start justify-between gap-x-6 gap-y-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-3">
                    <BadgeStatut statut={r.statut} />
                    <span className="chiffres text-xs text-gris">{r.ref}</span>
                  </div>
                  <p className="mt-2 font-semibold">{nomEspace(r.espace)}</p>
                  <p className="chiffres mt-1 text-sm text-gris">
                    {majuscule(dateLongue(r.date))}, {horaire(r.debut, r.fin)}
                  </p>
                </div>
                <p className="chiffres font-titre text-lg">{euros(r.totalTtc)} TTC</p>
              </div>
              <div className="mt-4 flex flex-wrap items-start gap-2">
                <Link href={`/reservation/${r.id}`} className="btn btn-discret">
                  Détail <ArrowRight size={16} aria-hidden="true" />
                </Link>
                <a href={`/reservation/${r.id}/pdf`} className="btn btn-discret" target="_blank" rel="noopener">
                  <FilePdf size={18} aria-hidden="true" /> PDF
                </a>
                {annulable && (r.statut === "a_confirmer" || r.statut === "confirmee") && (
                  <BoutonAnnuler
                    id={r.id}
                    particulier={r.typeClient === "particulier"}
                    details={{ ref: r.ref, nom: r.nom, email: r.email, creneau: `${dateLongue(r.date)}, ${horaire(r.debut, r.fin)}` }}
                  />
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
