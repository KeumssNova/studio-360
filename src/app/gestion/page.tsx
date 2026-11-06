import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { DownloadSimple, EnvelopeSimple, Phone } from "@phosphor-icons/react/dist/ssr";
import { bloquer, debloquer, majOption, majStatut, majTarif } from "@/app/actions";
import { BadgeStatut } from "@/components/BadgeStatut";
import { BoutonDeuxTemps } from "@/components/BoutonDeuxTemps";
import { ESPACES, OPTIONS } from "@/data/catalogue";
import { utilisateurCourant } from "@/lib/auth";
import { LIBELLE_TYPE, dateCourte, dateLongue, euros, horaire, majuscule } from "@/lib/format";
import { FERMETURE, OUVERTURE, PRIX_HEURE_SUP_DEFAUT, finDelaiRetractation, maintenantParis, range } from "@/lib/regles";
import { blocagesAVenir, lireTarifs, messagesRecus, nomEspace, toutesReservations, type Reservation } from "@/lib/reservations";

export const metadata: Metadata = { title: "Gestion", robots: { index: false, follow: false } };

const ONGLETS = [
  { id: "reservations", texte: "Réservations" },
  { id: "blocages", texte: "Indisponibilités" },
  { id: "tarifs", texte: "Tarifs" },
  { id: "options", texte: "Options" },
  { id: "messages", texte: "Messages" },
] as const;
type Onglet = (typeof ONGLETS)[number]["id"];

const horodatage = new Intl.DateTimeFormat("fr-FR", { dateStyle: "short", timeStyle: "short", timeZone: "Europe/Paris" });

export default async function Gestion({ searchParams }: { searchParams: Promise<{ onglet?: string; erreur?: string }> }) {
  const u = await utilisateurCourant();
  // 404 plutôt que 403 : la page n'existe pas pour qui n'est pas du studio.
  if (!u?.admin) notFound();
  const { onglet: brut, erreur } = await searchParams;
  const onglet: Onglet = ONGLETS.some((o) => o.id === brut) ? (brut as Onglet) : "reservations";
  const [resas, msgs] = await Promise.all([toutesReservations(), messagesRecus()]);
  const aujourdhui = maintenantParis().date;
  const aTraiter = resas.filter((r) => r.statut === "a_confirmer" && r.date >= aujourdhui).length;

  return (
    <div className="mx-auto max-w-6xl px-4 pt-10 sm:px-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="surtitre">Studio 360</p>
          <h1 className="mt-2 text-3xl sm:text-4xl">Gestion</h1>
        </div>
        <a href="/gestion/export" className="btn btn-discret">
          <DownloadSimple size={18} aria-hidden="true" /> Exporter les réservations (CSV)
        </a>
      </div>

      <nav aria-label="Rubriques de gestion" className="-mx-4 mt-8 overflow-x-auto px-4 sm:mx-0 sm:px-0">
        <ul className="flex min-w-max gap-1 border-b border-filet-neutre">
          {ONGLETS.map((o) => {
            const compte = o.id === "reservations" ? aTraiter : o.id === "messages" ? msgs.length : 0;
            return (
              <li key={o.id}>
                <Link
                  href={`/gestion?onglet=${o.id}`}
                  aria-current={onglet === o.id ? "page" : undefined}
                  className="-mb-px inline-flex min-h-11 items-center gap-2 border-b-2 border-transparent px-3 text-sm font-semibold text-gris hover:text-texte aria-[current=page]:border-or aria-[current=page]:text-texte"
                >
                  {o.texte}
                  {compte > 0 && (
                    <span className="chiffres rounded-sm bg-or px-1.5 text-xs text-sur-or">
                      {compte}
                      <span className="sr-only">{o.id === "reservations" ? " à confirmer" : " messages"}</span>
                    </span>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {erreur && (
        <p role="alert" className="mt-6 rounded-sm border border-alerte p-4 text-sm text-alerte-texte">
          {erreur}
        </p>
      )}

      <div className="mt-8">
        {onglet === "reservations" && <Reservations resas={resas} aujourdhui={aujourdhui} />}
        {onglet === "blocages" && <Blocages aujourdhui={aujourdhui} />}
        {onglet === "tarifs" && <Tarifs />}
        {onglet === "options" && <Options />}
        {onglet === "messages" && <Messages msgs={msgs} />}
      </div>
    </div>
  );
}

/* ---------- Réservations ---------- */

function Reservations({ resas, aujourdhui }: { resas: Reservation[]; aujourdhui: string }) {
  const aConfirmer = resas.filter((r) => r.statut === "a_confirmer" && r.date >= aujourdhui);
  const confirmees = resas.filter((r) => r.statut === "confirmee" && r.date >= aujourdhui);
  // Historique : du plus récent au plus ancien, limité pour garder la page légère (tout est dans l'export CSV).
  const historique = resas
    .filter((r) => r.date < aujourdhui || r.statut === "refusee" || r.statut === "annulee")
    .reverse()
    .slice(0, 50);

  return (
    <div className="space-y-12">
      <Groupe titre="À confirmer" vide="Aucune demande en attente." lignes={aConfirmer} />
      <Groupe titre="Confirmées à venir" vide="Aucune réservation confirmée à venir." lignes={confirmees} />
      <Groupe titre="Historique" vide="Rien pour l'instant." lignes={historique} replie />
    </div>
  );
}

function Groupe({ titre, lignes, vide, replie }: { titre: string; lignes: Reservation[]; vide: string; replie?: boolean }) {
  return (
    <section aria-label={titre}>
      <h2 className="text-base">
        {titre} <span className="chiffres font-sans text-sm text-gris">({lignes.length})</span>
      </h2>
      {lignes.length === 0 ? (
        <p className="mt-3 text-sm text-gris">{vide}</p>
      ) : (
        <ul className="mt-4 space-y-3">
          {lignes.map((r) => (
            <li key={r.id}>
              <FicheReservation r={r} replie={replie} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function FicheReservation({ r, replie }: { r: Reservation; replie?: boolean }) {
  return (
    <details open={!replie} className="rounded-sm border border-filet-neutre bg-carte">
      <summary className="flex min-h-11 cursor-pointer list-none flex-wrap items-center gap-x-4 gap-y-2 p-4 [&::-webkit-details-marker]:hidden">
        <BadgeStatut statut={r.statut} />
        <span className="chiffres font-semibold">{majuscule(dateCourte(r.date))}</span>
        <span className="chiffres text-sm">{horaire(r.debut, r.fin)}</span>
        <span className="text-sm">{nomEspace(r.espace)}</span>
        <span className="text-sm text-gris">{r.structure || r.nom}</span>
        <span className="chiffres ml-auto font-semibold">{euros(r.totalTtc)} TTC</span>
      </summary>
      <div className="grid gap-6 border-t border-filet-neutre p-4 md:grid-cols-[1fr_1fr_1.2fr]">
        <div className="space-y-1 text-sm">
          <p className="chiffres text-xs text-gris">
            {r.ref}, reçue le {horodatage.format(r.creeLe)}
          </p>
          <p>{majuscule(dateLongue(r.date))}</p>
          <p className="text-gris">
            {r.lignesOptions.length
              ? r.lignesOptions.map((o) => (o.quantite > 1 ? `${o.nom} × ${o.quantite}` : o.nom)).join(", ")
              : "Sans option"}
          </p>
          <p className="chiffres text-gris">
            {euros(r.totalHt)} HT, TVA {euros(r.montantTva)}
          </p>
          <p className="pt-2">
            <a href={`/reservation/${r.id}/pdf`} className="lien text-xs" target="_blank" rel="noopener">
              Récapitulatif PDF
            </a>
          </p>
        </div>
        <div className="space-y-1 text-sm">
          <p className="font-semibold">{r.nom}</p>
          <p className="text-gris">
            {LIBELLE_TYPE[r.typeClient]}
            {r.structure ? `, ${r.structure}` : ""}
            {r.fonction ? ` (${r.fonction})` : ""}
          </p>
          {r.typeClient === "particulier" && (
            <p className="text-gris">
              {r.executionAvantDelai ? "Location avant la fin du délai de rétractation : demandée" : "Pas de demande de location avant la fin du délai de rétractation"}
            </p>
          )}
          {r.typeClient === "particulier" && r.confirmeeLe && !r.retractation && (
            <p className="text-gris">
              Rétractation possible jusqu&apos;au {dateLongue(finDelaiRetractation(maintenantParis(r.confirmeeLe).date))} inclus
            </p>
          )}
          {r.retractation && (
            <p className="font-semibold text-alerte-texte">Rétractation : sommes versées à rembourser sous 14 jours (art. L221-24)</p>
          )}
          {r.versionCgv && <p className="text-gris">CGV du {r.versionCgv}</p>}
          {r.siret && <p className="chiffres text-gris">SIRET {r.siret}</p>}
          {r.tva && <p className="chiffres text-gris">TVA {r.tva}</p>}
          {r.adresse && <p className="text-gris">{r.adresse}</p>}
          <p>
            <a
              href={`mailto:${r.email}?subject=${encodeURIComponent(`Réservation ${r.ref}`)}`}
              className="lien inline-flex items-center gap-1.5 break-all"
            >
              <EnvelopeSimple size={14} aria-hidden="true" /> {r.email}
            </a>
          </p>
          <p>
            <a href={`tel:${r.telephone.replace(/[^+\d]/g, "")}`} className="lien inline-flex items-center gap-1.5">
              <Phone size={14} aria-hidden="true" /> {r.telephone}
            </a>
          </p>
          {r.message && <p className="mt-2 border-l-2 border-filet pl-3 whitespace-pre-line text-gris">{r.message}</p>}
        </div>
        <form action={majStatut} className="space-y-3">
          <input type="hidden" name="id" value={r.id} />
          <div>
            <label htmlFor={`note-${r.id}`} className="etiquette">
              Message au client (facultatif)
            </label>
            <textarea
              id={`note-${r.id}`}
              name="note"
              rows={2}
              maxLength={1000}
              defaultValue={r.noteStudio ?? ""}
              className="champ mt-2 resize-y"
              aria-describedby={`note-aide-${r.id}`}
            />
            <p id={`note-aide-${r.id}`} className="mt-1 text-xs text-gris">
              Joint à l&apos;e-mail envoyé quand le statut change, et visible sur sa page de réservation.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {r.statut === "a_confirmer" && (
              <>
                <button type="submit" name="statut" value="confirmee" className="btn btn-or">
                  Confirmer
                </button>
                <BoutonDeuxTemps name="statut" value="refusee" confirmation="Refuser et prévenir">
                  Refuser
                </BoutonDeuxTemps>
              </>
            )}
            {r.statut === "confirmee" && (
              <BoutonDeuxTemps name="statut" value="annulee" confirmation="Annuler et prévenir">
                Annuler
              </BoutonDeuxTemps>
            )}
            {(r.statut === "refusee" || r.statut === "annulee") && (
              <button type="submit" name="statut" value="a_confirmer" className="btn btn-discret">
                Remettre à confirmer
              </button>
            )}
            <button type="submit" name="statut" value={r.statut} className="btn btn-discret">
              Enregistrer le message seul
            </button>
          </div>
        </form>
      </div>
    </details>
  );
}

/* ---------- Indisponibilités ---------- */

async function Blocages({ aujourdhui }: { aujourdhui: string }) {
  const blocs = await blocagesAVenir(aujourdhui);
  return (
    <div className="grid gap-10 lg:grid-cols-[1fr_1.2fr]">
      <section aria-labelledby="t-bloquer">
        <h2 id="t-bloquer" className="text-base">
          Bloquer un créneau
        </h2>
        <p className="mt-2 text-sm text-gris">
          Fermeture, entretien, réservation prise par téléphone : le créneau disparaît de la réservation en ligne.
        </p>
        <form action={bloquer} className="mt-5 space-y-4 rounded-sm border border-filet-neutre bg-carte p-4 sm:p-5">
          <div>
            <label htmlFor="b-espace" className="etiquette">
              Espace
            </label>
            <select id="b-espace" name="espace" className="champ mt-2" defaultValue="*">
              <option value="*">Tous les espaces</option>
              {ESPACES.map((e) => (
                <option key={e.slug} value={e.slug}>
                  {nomEspace(e.slug)}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="b-date" className="etiquette">
              Date
            </label>
            <input id="b-date" name="date" type="date" required min={aujourdhui} className="champ mt-2" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="b-debut" className="etiquette">
                De
              </label>
              <select id="b-debut" name="debut" className="champ mt-2" defaultValue={OUVERTURE}>
                {range(OUVERTURE, FERMETURE).map((h) => (
                  <option key={h} value={h}>
                    {h}h
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="b-fin" className="etiquette">
                À
              </label>
              <select id="b-fin" name="fin" className="champ mt-2" defaultValue={FERMETURE}>
                {range(OUVERTURE + 1, FERMETURE + 1).map((h) => (
                  <option key={h} value={h}>
                    {h}h
                  </option>
                ))}
              </select>
            </div>
          </div>
          <label className="flex min-h-11 items-center gap-3 text-sm">
            <input type="checkbox" name="journee" className="size-5 accent-[var(--color-or)]" />
            Toute la journée ({OUVERTURE}h à {FERMETURE}h)
          </label>
          <div>
            <label htmlFor="b-motif" className="etiquette">
              Motif (visible du studio seulement)
            </label>
            <input id="b-motif" name="motif" maxLength={200} className="champ mt-2" />
          </div>
          <button type="submit" className="btn btn-or w-full sm:w-auto">
            Bloquer
          </button>
        </form>
      </section>
      <section aria-labelledby="t-blocs">
        <h2 id="t-blocs" className="text-base">
          Indisponibilités à venir
        </h2>
        {blocs.length === 0 ? (
          <p className="mt-3 text-sm text-gris">Aucune.</p>
        ) : (
          <ul className="mt-4 divide-y divide-filet-neutre border-y border-filet-neutre">
            {blocs.map((b) => (
              <li key={b.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                <div className="text-sm">
                  <p className="chiffres font-semibold">
                    {majuscule(dateCourte(b.date))}, {b.debut === OUVERTURE && b.fin === FERMETURE ? "journée" : horaire(b.debut, b.fin)}
                  </p>
                  <p className="text-gris">
                    {b.espace === "*" ? "Tous les espaces" : nomEspace(b.espace)}
                    {b.motif ? `, ${b.motif}` : ""}
                  </p>
                </div>
                <form action={debloquer}>
                  <input type="hidden" name="id" value={b.id} />
                  <BoutonDeuxTemps confirmation="Rouvrir le créneau">Supprimer</BoutonDeuxTemps>
                </form>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

/* ---------- Tarifs et options ---------- */

async function Tarifs() {
  const { espaces } = await lireTarifs();
  return (
    <section aria-labelledby="t-tarifs">
      <h2 id="t-tarifs" className="text-base">
        Tarifs des espaces (€ HT)
      </h2>
      <p className="mt-2 max-w-[70ch] text-sm text-gris">
        Les prix s&apos;appliquent tout de suite au site, à la fiche tarifaire et aux nouvelles demandes. Les demandes déjà reçues
        gardent le prix du jour où elles ont été faites. Décocher « Réservable » retire l&apos;espace de la réservation en ligne
        (il reste visible, « sur demande »).
      </p>
      <ul className="mt-6 space-y-3">
        {ESPACES.map((e) => {
          const t = espaces[e.slug];
          return (
            <li key={e.slug}>
              <form
                action={majTarif}
                className="grid items-end gap-3 rounded-sm border border-filet-neutre bg-carte p-4 sm:grid-cols-3 lg:grid-cols-[1.6fr_repeat(3,7rem)_auto_auto]"
              >
                <input type="hidden" name="slug" value={e.slug} />
                <p className="font-semibold sm:col-span-3 lg:col-span-1 lg:self-center">{nomEspace(e.slug)}</p>
                <Montant id={`h-${e.slug}`} nom="prixHeure" label="Heure" valeur={t?.prixHeure ?? e.prixHeure} />
                <Montant id={`j-${e.slug}`} nom="prixJournee" label="Journée" valeur={t?.prixJournee ?? e.prixJournee} />
                <Montant id={`s-${e.slug}`} nom="prixHeureSup" label="Heure sup." valeur={t?.prixHeureSup ?? PRIX_HEURE_SUP_DEFAUT} />
                <label className="flex min-h-11 items-center gap-2 text-sm">
                  <input type="checkbox" name="reservable" defaultChecked={t?.reservable ?? true} className="size-5 accent-[var(--color-or)]" />
                  Réservable
                </label>
                <button type="submit" className="btn btn-discret sm:col-span-2 lg:col-span-1">
                  Enregistrer
                </button>
              </form>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

async function Options() {
  const { options } = await lireTarifs();
  return (
    <section aria-labelledby="t-options">
      <h2 id="t-options" className="text-base">
        Options (€ HT)
      </h2>
      <p className="mt-2 text-sm text-gris">Une option désactivée disparaît du formulaire de réservation et de la fiche tarifaire.</p>
      <ul className="mt-6 space-y-3">
        {OPTIONS.map((o) => {
          const t = options[o.id];
          return (
            <li key={o.id}>
              <form
                action={majOption}
                className="grid items-end gap-3 rounded-sm border border-filet-neutre bg-carte p-4 sm:grid-cols-[1fr_7rem_auto_auto]"
              >
                <input type="hidden" name="id" value={o.id} />
                <p className="sm:self-center">
                  <span className="font-semibold">{o.nom}</span>
                  {o.detail && <span className="block text-xs text-gris">{o.detail}</span>}
                </p>
                <Montant id={`o-${o.id}`} nom="prix" label="Prix" valeur={t?.prix ?? o.prix} />
                <label className="flex min-h-11 items-center gap-2 text-sm">
                  <input type="checkbox" name="active" defaultChecked={t?.active ?? true} className="size-5 accent-[var(--color-or)]" />
                  Proposée
                </label>
                <button type="submit" className="btn btn-discret">
                  Enregistrer
                </button>
              </form>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function Montant({ id, nom, label, valeur }: { id: string; nom: string; label: string; valeur: number }) {
  return (
    <div>
      <label htmlFor={id} className="etiquette">
        {label}
      </label>
      {/* Bornes identiques à la vérification serveur (entier de 0 à 100 000, actions.ts). */}
      <input
        id={id}
        name={nom}
        type="number"
        inputMode="numeric"
        min={0}
        max={100000}
        step={1}
        required
        defaultValue={valeur}
        className="champ chiffres mt-2"
      />
    </div>
  );
}

/* ---------- Messages ---------- */

function Messages({ msgs }: { msgs: Awaited<ReturnType<typeof messagesRecus>> }) {
  if (msgs.length === 0) return <p className="text-sm text-gris">Aucun message reçu par le formulaire de contact.</p>;
  return (
    <ul className="space-y-3">
      {msgs.map((m) => (
        <li key={m.id} className="rounded-sm border border-filet-neutre bg-carte p-4">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <p className="font-semibold">
              {m.nom}
              {m.sujet && <span className="font-normal text-gris">, {m.sujet}</span>}
            </p>
            <p className="chiffres text-xs text-gris">{horodatage.format(m.creeLe)}</p>
          </div>
          <p className="mt-3 text-sm whitespace-pre-line">{m.texte}</p>
          <a
            href={`mailto:${m.email}?subject=${encodeURIComponent(`Re: ${m.sujet || "votre message"}`)}`}
            className="lien mt-3 inline-flex items-center gap-1.5 text-sm break-all"
          >
            <EnvelopeSimple size={14} aria-hidden="true" /> Répondre à {m.email}
          </a>
        </li>
      ))}
    </ul>
  );
}
