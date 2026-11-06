"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { Minus, Plus, WarningCircle } from "@phosphor-icons/react";
import { envoyerDemande } from "@/app/actions";
import { OPTIONS_EXCLUSIVES, type OptionId } from "@/data/catalogue";
import { euros, horaire, prix } from "@/lib/format";
import { FERMETURE, OUVERTURE, TAUX_TVA, devis, estJournee, range, type Plage, type Tarif } from "@/lib/regles";
import { Calendrier } from "./Calendrier";
import { PrixTtc } from "./PrixTtc";

// Formulaire de /reserver/[slug]. Champs, libellés et récapitulatif repris de la maquette du client
// (relevés le 2026-11-06). Le prix affiché est calculé avec la même fonction que le serveur (devis),
// mais c'est le serveur qui recalcule et enregistre le montant : rien de ce qui vient d'ici n'est cru.

type Option = { id: OptionId; nom: string; detail?: string; prix: number };
type TypeClient = "particulier" | "societe" | "association";
type NomChamp = "nom" | "email" | "telephone" | "adresse" | "structure" | "fonction" | "siret" | "tva" | "message";
type Champ = {
  nom: NomChamp;
  libelle: string;
  requis?: boolean;
  type?: "text" | "email" | "tel";
  autoComplete?: string;
  inputMode?: "numeric" | "text";
  aide?: string;
  multiligne?: boolean;
  large?: boolean;
};

const TYPES: { v: TypeClient; texte: string }[] = [
  { v: "particulier", texte: "Particulier" },
  { v: "societe", texte: "Professionnel / Société" },
  { v: "association", texte: "Association" },
];

const MESSAGE: Champ = { nom: "message", libelle: "Informations complémentaires", multiligne: true, large: true };
const CHAMPS: Record<TypeClient, Champ[]> = {
  particulier: [
    { nom: "nom", libelle: "Nom et prénom", requis: true, autoComplete: "name" },
    { nom: "email", libelle: "E-mail", requis: true, type: "email", autoComplete: "email" },
    { nom: "telephone", libelle: "Téléphone", requis: true, type: "tel", autoComplete: "tel" },
    { nom: "adresse", libelle: "Adresse postale", autoComplete: "street-address" },
    MESSAGE,
  ],
  societe: [
    { nom: "nom", libelle: "Nom du représentant", requis: true, autoComplete: "name" },
    { nom: "email", libelle: "E-mail professionnel", requis: true, type: "email", autoComplete: "email" },
    { nom: "telephone", libelle: "Téléphone", requis: true, type: "tel", autoComplete: "tel" },
    { nom: "structure", libelle: "Nom de la société", requis: true, autoComplete: "organization" },
    { nom: "fonction", libelle: "Fonction du représentant", autoComplete: "organization-title" },
    { nom: "siret", libelle: "N° SIRET", inputMode: "numeric", aide: "14 chiffres" },
    { nom: "tva", libelle: "N° TVA intracommunautaire", aide: "Ex. FR12345678901" },
    { nom: "adresse", libelle: "Adresse du siège social", autoComplete: "street-address" },
    MESSAGE,
  ],
  association: [
    { nom: "nom", libelle: "Nom du représentant", requis: true, autoComplete: "name" },
    { nom: "email", libelle: "E-mail professionnel", requis: true, type: "email", autoComplete: "email" },
    { nom: "telephone", libelle: "Téléphone", requis: true, type: "tel", autoComplete: "tel" },
    { nom: "structure", libelle: "Nom de l'association", requis: true, autoComplete: "organization" },
    { nom: "fonction", libelle: "Fonction du représentant", autoComplete: "organization-title" },
    { nom: "siret", libelle: "N° SIRET", inputMode: "numeric", aide: "14 chiffres" },
    { nom: "adresse", libelle: "Adresse du siège social", autoComplete: "street-address", large: true },
    MESSAGE,
  ],
};

// Seul le maquillage se compte par personne (maquette : « 1 h, par personne ») ; même borne que schemaDemande.
const PAR_PERSONNE: OptionId[] = ["maquillage"];
const MAX_PERSONNES = 20;

// Format de date du récapitulatif de la maquette : « mer. 11 nov. 2026 ».
const DATE_RECAP = new Intl.DateTimeFormat("fr-FR", { weekday: "short", day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });

type Dispo = { date: string; prises: number[]; passees: number[] };

export function FormulaireReservation({
  espace,
  options,
  premierJour,
  dernierJour,
  freres,
}: {
  espace: { slug: string; nom: string; studio?: string; photo: string; tarif: Tarif };
  options: Option[];
  premierJour: string;
  dernierJour: string;
  freres: { slug: string; nom: string }[];
}) {
  const router = useRouter();
  const [date, setDate] = useState(premierJour);
  const [plage, setPlage] = useState<Plage | null>(null);
  const [ancre, setAncre] = useState<number | null>(null);
  const [choisies, setChoisies] = useState<Partial<Record<OptionId, number>>>({});
  const [type, setType] = useState<TypeClient>("particulier");
  const [valeurs, setValeurs] = useState<Record<NomChamp, string>>({
    nom: "",
    email: "",
    telephone: "",
    adresse: "",
    structure: "",
    fonction: "",
    siret: "",
    tva: "",
    message: "",
  });
  const [cgv, setCgv] = useState(false);
  const [avantDelai, setAvantDelai] = useState(false);
  const [erreurs, setErreurs] = useState<Record<string, string>>({});
  const [erreurGenerale, setErreurGenerale] = useState<string | null>(null);
  const [enCours, demarrer] = useTransition();

  /* ---------- Disponibilités du jour choisi ---------- */
  const [dispo, setDispo] = useState<Dispo | null>(null);
  const [echecDispo, setEchecDispo] = useState<string | null>(null); // date dont la lecture a échoué
  const [relecture, setRelecture] = useState(0);

  useEffect(() => {
    const ctrl = new AbortController();
    fetch(`/api/disponibilites?espace=${encodeURIComponent(espace.slug)}&date=${date}`, { signal: ctrl.signal, cache: "no-store" })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`))))
      .then((d: { prises: number[]; passees: number[] }) => setDispo({ date, prises: d.prises, passees: d.passees }))
      .catch((e: unknown) => {
        if (!(e instanceof DOMException && e.name === "AbortError")) setEchecDispo(date);
      });
    return () => ctrl.abort();
  }, [date, espace.slug, relecture]);

  const dispoDuJour = dispo?.date === date ? dispo : null;
  const echec = echecDispo === date && !dispoDuJour;
  const indisponibles = new Set([...(dispoDuJour?.prises ?? []), ...(dispoDuJour?.passees ?? [])]);
  const libre = (h: number) => dispoDuJour !== null && !indisponibles.has(h);
  const toutLibre = (a: number, b: number) => range(a, b).every(libre);
  // Une sélection que les dernières disponibilités rendent impossible (créneau pris entre-temps) tombe d'elle-même.
  const selection = plage && toutLibre(plage.debut, plage.fin) ? plage : null;
  const heures = range(OUVERTURE, FERMETURE);

  function choisirDate(d: string) {
    setDate(d);
    setPlage(null);
    setAncre(null);
  }

  // Premier clic : l'heure de début. Second clic : l'heure de fin, si tout l'intervalle est libre.
  function cliquerHeure(h: number) {
    if (!libre(h)) return;
    if (ancre !== null && selection) {
      if (h === ancre) return setAncre(null);
      const a = Math.min(ancre, h);
      const b = Math.max(ancre, h) + 1;
      if (toutLibre(a, b)) {
        setPlage({ debut: a, fin: b });
        setAncre(null);
        return;
      }
    }
    setPlage({ debut: h, fin: h + 1 });
    setAncre(h);
  }

  function journeeComplete() {
    setPlage({ debut: OUVERTURE, fin: FERMETURE });
    setAncre(null);
  }

  /* ---------- Options ---------- */
  function basculer(id: OptionId) {
    setChoisies((c) => {
      const n = { ...c };
      if (n[id]) {
        delete n[id];
        return n;
      }
      for (const g of OPTIONS_EXCLUSIVES) if (g.includes(id)) for (const x of g) delete n[x];
      n[id] = 1;
      return n;
    });
  }
  const quantite = (id: OptionId, delta: number) =>
    setChoisies((c) => ({ ...c, [id]: Math.min(MAX_PERSONNES, Math.max(1, (c[id] ?? 1) + delta)) }));

  const lignes = options
    .filter((o) => choisies[o.id])
    .map((o) => ({ id: o.id, nom: o.nom, prix: o.prix, quantite: choisies[o.id] ?? 1 }));
  const montants = selection ? devis(espace.tarif, selection, lignes) : null;

  /* ---------- Envoi ---------- */
  const champs = CHAMPS[type];

  // Avertir avant de quitter une demande à moitié remplie (Vercel Web Interface Guidelines, section Forms :
  // « Warn before navigation with unsaved changes »). Événement beforeunload (HTML Living Standard) : couvre la
  // fermeture de l'onglet, le rechargement et la sortie du site, pas une navigation interne du routeur Next.
  const saisie = Object.values(valeurs).some((v) => v.trim() !== "");
  useEffect(() => {
    if (!saisie) return;
    const retenir = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", retenir);
    return () => window.removeEventListener("beforeunload", retenir);
  }, [saisie]);
  const aFocaliser = useRef<string | null>(null);
  useEffect(() => {
    if (!aFocaliser.current) return;
    document.getElementById(aFocaliser.current)?.focus();
    aFocaliser.current = null;
  }, [erreurs, erreurGenerale]);

  function envoyer(ev: React.FormEvent<HTMLFormElement>) {
    ev.preventDefault();
    if (enCours) return;
    if (!selection) {
      setErreurs({ creneau: "Choisissez un créneau." });
      setErreurGenerale(null);
      aFocaliser.current = "creneau";
      return;
    }
    const donnees = {
      espace: espace.slug,
      date,
      debut: selection.debut,
      fin: selection.fin,
      options: lignes.map((l) => ({ id: l.id, quantite: l.quantite })),
      typeClient: type,
      ...Object.fromEntries(champs.map((c) => [c.nom, valeurs[c.nom]])),
      cgv,
      executionAvantDelai: type === "particulier" && avantDelai,
    };
    demarrer(async () => {
      try {
        const r = await envoyerDemande(donnees);
        if (r.ok) {
          router.push(`/reservation/${r.id}`);
          return;
        }
        const ch = r.champs ?? {};
        setErreurs(ch);
        setErreurGenerale(r.erreur);
        const premier = champs.find((c) => ch[c.nom]);
        aFocaliser.current = premier
          ? `champ-${premier.nom}`
          : ch.executionAvantDelai
            ? "champ-avant-delai"
            : ch.cgv
              ? "champ-cgv"
              : "erreur-envoi";
        if (!r.champs) setRelecture((n) => n + 1); // créneau pris ou espace fermé entre-temps : on relit l'état
      } catch {
        setErreurs({});
        setErreurGenerale("Envoi impossible pour le moment. Réessayez, ou écrivez directement au studio.");
        aFocaliser.current = "erreur-envoi";
      }
    });
  }

  const n = { date: 1, heures: 2, options: 3, coordonnees: options.length ? 4 : 3 };

  return (
    <form onSubmit={envoyer} noValidate className="mt-8 grid gap-12 lg:grid-cols-[minmax(0,1fr)_380px] lg:items-start lg:gap-14">
      <div className="min-w-0 space-y-14">
        {freres.length > 1 && (
          <nav aria-label="Choisir la cabine" className="-mt-2 flex flex-wrap gap-2">
            {freres.map((f) => (
              <Link
                key={f.slug}
                href={`/reserver/${f.slug}`}
                aria-current={f.slug === espace.slug ? "page" : undefined}
                className={`btn ${f.slug === espace.slug ? "btn-or" : "btn-discret"}`}
              >
                {f.nom.replace("Cabine de montage", "Cabine")}
              </Link>
            ))}
          </nav>
        )}

        <section aria-labelledby="t-date">
          <Etape n={n.date} id="t-date">
            Date
          </Etape>
          <div className="mt-5">
            <Calendrier valeur={date} min={premierJour} max={dernierJour} onChange={choisirDate} />
          </div>
        </section>

        <section id="creneau" tabIndex={-1} aria-labelledby="t-heures" className="outline-none">
          <Etape n={n.heures} id="t-heures">
            Horaires
          </Etape>
          <p className="mt-2 text-sm text-gris">
            Touchez l&apos;heure de début, puis l&apos;heure de fin. 1 h minimum.
          </p>

          {echec ? (
            <div role="alert" className="mt-5 flex flex-wrap items-center gap-4 rounded-sm border border-alerte p-4 text-sm">
              <span className="flex items-center gap-2 text-alerte-texte">
                <WarningCircle size={18} aria-hidden="true" /> Impossible de lire les disponibilités.
              </span>
              <button
                type="button"
                className="btn btn-discret"
                onClick={() => {
                  setEchecDispo(null);
                  setRelecture((x) => x + 1);
                }}
              >
                Réessayer
              </button>
            </div>
          ) : (
            <ul className="mt-5 grid grid-cols-3 gap-2 sm:grid-cols-9" aria-busy={!dispoDuJour}>
              {heures.map((h) => {
                if (!dispoDuJour)
                  return <li key={h} aria-hidden="true" className="h-14 animate-pulse rounded-sm bg-sourdine" />;
                const prise = dispoDuJour.prises.includes(h);
                const passee = dispoDuJour.passees.includes(h);
                const dedans = selection !== null && h >= selection.debut && h < selection.fin;
                const etat = passee ? "passé" : prise ? "pris" : "libre";
                return (
                  <li key={h}>
                    <button
                      type="button"
                      onClick={() => cliquerHeure(h)}
                      disabled={prise || passee}
                      aria-pressed={dedans}
                      aria-label={`${horaire(h, h + 1)}, ${etat}`}
                      className={`chiffres flex h-14 w-full flex-col items-center justify-center rounded-sm border text-sm font-semibold transition-colors ${
                        dedans
                          ? "border-or bg-or text-sur-or"
                          : prise
                            ? "cursor-not-allowed border-transparent bg-occupe text-gris line-through"
                            : passee
                              ? "cursor-not-allowed border-transparent text-gris/40"
                              : "border-filet-neutre hover:border-or hover:text-or"
                      } ${ancre === h ? "ring-2 ring-texte ring-offset-2 ring-offset-fond" : ""}`}
                    >
                      {h}h
                      <span className={`text-[0.65rem] font-normal ${dedans ? "text-sur-or/70" : "text-gris"}`}>
                        {prise ? "pris" : passee ? "passé" : `à ${h + 1}h`}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}

          <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-3">
            <button
              type="button"
              onClick={journeeComplete}
              disabled={!toutLibre(OUVERTURE, FERMETURE)}
              aria-pressed={selection !== null && estJournee(selection)}
              className={`btn ${selection && estJournee(selection) ? "btn-or" : "btn-discret"}`}
            >
              Journée complète {OUVERTURE}h à {FERMETURE}h
            </button>
            <p aria-live="polite" className="chiffres text-sm">
              {selection ? (
                <>
                  <span className="font-semibold">{horaire(selection.debut, selection.fin)}</span>
                  <span className="text-gris">
                    {" "}
                    · {selection.fin - selection.debut} h{estJournee(selection) ? ", tarif journée" : ""}
                  </span>
                </>
              ) : dispoDuJour && heures.every((h) => !libre(h)) ? (
                <span className="text-gris">Plus aucun créneau libre ce jour-là. Choisissez une autre date.</span>
              ) : null}
            </p>
          </div>
          {erreurs.creneau && <MessageErreur id="creneau-err">{erreurs.creneau}</MessageErreur>}
        </section>

        {options.length > 0 && (
          <section aria-labelledby="t-options">
            <Etape n={n.options} id="t-options">
              Options
            </Etape>
            <p className="mt-2 text-sm text-gris">Facultatif. Un seul pack caméras à la fois.</p>
            <ul className="mt-5 divide-y divide-filet-neutre border-y border-filet-neutre">
              {options.map((o) => {
                const coche = Boolean(choisies[o.id]);
                const parPersonne = PAR_PERSONNE.includes(o.id);
                const q = choisies[o.id] ?? 1;
                return (
                  <li key={o.id} className="flex flex-wrap items-center gap-x-4 gap-y-2 py-3">
                    <label className="flex min-h-11 flex-1 cursor-pointer items-center gap-3">
                      <input
                        type="checkbox"
                        checked={coche}
                        onChange={() => basculer(o.id)}
                        className="size-5 shrink-0 accent-or"
                      />
                      <span>
                        {o.nom}
                        {o.detail && <span className="block text-xs text-gris">{o.detail}</span>}
                      </span>
                    </label>
                    {coche && parPersonne && (
                      <div className="flex items-center gap-1" role="group" aria-label={`Nombre de personnes, ${o.nom}`}>
                        <button
                          type="button"
                          onClick={() => quantite(o.id, -1)}
                          disabled={q <= 1}
                          aria-label="Une personne de moins"
                          className="grid size-11 place-items-center rounded-sm border border-filet-neutre hover:border-or disabled:opacity-30"
                        >
                          <Minus size={14} weight="bold" />
                        </button>
                        <span aria-live="polite" className="chiffres w-20 text-center text-sm">
                          {q} pers.
                        </span>
                        <button
                          type="button"
                          onClick={() => quantite(o.id, 1)}
                          disabled={q >= MAX_PERSONNES}
                          aria-label="Une personne de plus"
                          className="grid size-11 place-items-center rounded-sm border border-filet-neutre hover:border-or disabled:opacity-30"
                        >
                          <Plus size={14} weight="bold" />
                        </button>
                      </div>
                    )}
                    <span className="chiffres w-24 shrink-0 text-right font-semibold">
                      {prix(o.prix)} HT
                      <PrixTtc ht={o.prix} />
                    </span>
                  </li>
                );
              })}
            </ul>
          </section>
        )}

        <section aria-labelledby="t-coord">
          <Etape n={n.coordonnees} id="t-coord">
            Vos coordonnées
          </Etape>
          <fieldset className="mt-5">
            <legend className="etiquette">Vous réservez en tant que</legend>
            <div className="grid grid-cols-3 gap-1 rounded-sm border border-filet p-1">
              {TYPES.map((t) => (
                <label
                  key={t.v}
                  className={`flex min-h-11 cursor-pointer items-center justify-center rounded-sm px-2 py-2 text-center font-titre text-[0.68rem] leading-tight tracking-wide uppercase transition-colors has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-or sm:text-xs ${
                    type === t.v ? "bg-or text-sur-or" : "text-gris hover:text-texte"
                  }`}
                >
                  <input
                    type="radio"
                    name="typeClient"
                    value={t.v}
                    checked={type === t.v}
                    onChange={() => setType(t.v)}
                    className="sr-only"
                  />
                  {t.texte}
                </label>
              ))}
            </div>
          </fieldset>

          <p className="mt-5 text-xs text-gris">Les champs marqués d&apos;un * sont obligatoires.</p>
          <div className="mt-3 grid gap-x-5 gap-y-5 sm:grid-cols-2">
            {champs.map((c) => (
              <ChampTexte
                key={c.nom}
                c={c}
                valeur={valeurs[c.nom]}
                erreur={erreurs[c.nom]}
                onChange={(v) => setValeurs((x) => ({ ...x, [c.nom]: v }))}
              />
            ))}
          </div>
        </section>
      </div>

      <aside aria-labelledby="t-recap" className="lg:sticky lg:top-24">
        <div className="overflow-hidden rounded-sm border border-filet bg-carte">
          <div className="relative aspect-[16/7] bg-sourdine">
            <Image src={espace.photo} alt="" fill sizes="(min-width: 1024px) 380px, 100vw" className="object-cover" />
          </div>
          <div className="p-5">
            <h2 id="t-recap" className="surtitre">
              Récapitulatif
            </h2>
            <p className="mt-2 font-titre text-lg leading-tight uppercase">{espace.nom}</p>
            {espace.studio && <p className="text-sm text-gris">{espace.studio}</p>}

            <dl className="mt-5 space-y-2 text-sm">
              <Ligne t="Date">{DATE_RECAP.format(new Date(`${date}T12:00:00Z`))}</Ligne>
              <Ligne t="Horaires">{selection ? horaire(selection.debut, selection.fin) : "à choisir"}</Ligne>
            </dl>

            <dl className="chiffres mt-4 space-y-2 border-t border-filet-neutre pt-4 text-sm">
              <Ligne t="Location HT">{montants ? euros(montants.locationHt) : "—"}</Ligne>
              {lignes.map((l) => (
                <Ligne key={l.id} t={l.quantite > 1 ? `${l.nom} × ${l.quantite}` : l.nom}>
                  {euros(l.prix * 100 * l.quantite)}
                </Ligne>
              ))}
              {montants && lignes.length > 0 && <Ligne t="Total HT">{euros(montants.totalHt)}</Ligne>}
              <Ligne t={`TVA (${TAUX_TVA * 100} %)`}>{montants ? euros(montants.tva) : "—"}</Ligne>
            </dl>
            <div className="mt-4 flex items-baseline justify-between gap-4 border-t border-filet pt-4">
              <span className="font-titre text-sm uppercase">Total TTC</span>
              <span className="chiffres font-titre text-2xl text-or">{montants ? euros(montants.totalTtc) : "—"}</span>
            </div>
            <p className="chiffres mt-3 text-xs leading-relaxed text-gris">
              1 h minimum • + {prix(espace.tarif.prixHeureSup)} HT / heure supplémentaire • plafonné au tarif journée (
              {prix(espace.tarif.prixJournee)} HT). Une caution peut être demandée.
            </p>

            <label className="mt-5 flex cursor-pointer items-start gap-3 text-sm">
              <input
                id="champ-cgv"
                type="checkbox"
                checked={cgv}
                onChange={(e) => setCgv(e.target.checked)}
                aria-invalid={erreurs.cgv ? true : undefined}
                aria-describedby={erreurs.cgv ? "champ-cgv-err" : undefined}
                className="mt-0.5 size-5 shrink-0 accent-or"
              />
              <span>
                J&apos;accepte les{" "}
                <Link href="/cgv" target="_blank" className="lien">
                  conditions de location
                </Link>
                .
              </span>
            </label>
            {erreurs.cgv && <MessageErreur id="champ-cgv-err">{erreurs.cgv}</MessageErreur>}

            {/* Demande expresse d'exécution avant la fin du délai de rétractation (Code de la consommation,
                art. L221-25), et information sur la perte du droit une fois la location réalisée (art. L221-28, 1°). */}
            {type === "particulier" && (
              <>
                <label className="mt-4 flex cursor-pointer items-start gap-3 text-sm">
                  <input
                    id="champ-avant-delai"
                    type="checkbox"
                    checked={avantDelai}
                    onChange={(e) => setAvantDelai(e.target.checked)}
                    aria-invalid={erreurs.executionAvantDelai ? true : undefined}
                    aria-describedby={erreurs.executionAvantDelai ? "champ-avant-delai-err" : undefined}
                    className="mt-0.5 size-5 shrink-0 accent-or"
                  />
                  <span>
                    Je demande que la location ait lieu à la date choisie, même avant la fin de mon délai de rétractation de
                    14 jours. Une fois la location réalisée, je ne peux plus me rétracter.
                  </span>
                </label>
                {erreurs.executionAvantDelai && (
                  <MessageErreur id="champ-avant-delai-err">{erreurs.executionAvantDelai}</MessageErreur>
                )}
              </>
            )}

            {erreurGenerale && (
              <div
                id="erreur-envoi"
                role="alert"
                tabIndex={-1}
                className="mt-5 flex gap-2 rounded-sm border border-alerte p-3 text-sm text-alerte-texte outline-none"
              >
                <WarningCircle size={18} className="mt-0.5 shrink-0" aria-hidden="true" />
                {erreurGenerale}
              </div>
            )}

            {/* La maquette disait « Confirmer la réservation » ; la demande reste à confirmer par le studio,
                le bouton dit donc ce qui se passe vraiment. */}
            <button type="submit" disabled={enCours} className="btn btn-or mt-5 w-full">
              {enCours ? "Envoi en cours…" : "Envoyer la demande"}
            </button>
            <p className="mt-3 text-center text-xs text-gris">Le studio confirme par e-mail. Aucun paiement en ligne.</p>
          </div>
        </div>
      </aside>
    </form>
  );
}

function Etape({ n, id, children }: { n: number; id: string; children: React.ReactNode }) {
  return (
    <h2 id={id} className="flex items-baseline gap-3 text-xl sm:text-2xl">
      <span aria-hidden="true" className="chiffres text-base text-or">
        {String(n).padStart(2, "0")}
      </span>
      {children}
    </h2>
  );
}

function Ligne({ t, children }: { t: string; children: React.ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <dt className="text-gris">{t}</dt>
      <dd className="text-right font-semibold">{children}</dd>
    </div>
  );
}

function MessageErreur({ id, children }: { id: string; children: React.ReactNode }) {
  return (
    <p id={id} className="mt-2 flex items-center gap-1.5 text-sm text-alerte-texte">
      <WarningCircle size={16} className="shrink-0" aria-hidden="true" />
      {children}
    </p>
  );
}

function ChampTexte({
  c,
  valeur,
  erreur,
  onChange,
}: {
  c: Champ;
  valeur: string;
  erreur?: string;
  onChange: (v: string) => void;
}) {
  const id = `champ-${c.nom}`;
  const decrit = [c.aide && `${id}-aide`, erreur && `${id}-err`].filter(Boolean).join(" ") || undefined;
  const commun = {
    id,
    name: c.nom,
    value: valeur,
    required: c.requis,
    autoComplete: c.autoComplete,
    "aria-invalid": erreur ? true : undefined,
    "aria-describedby": decrit,
    className: "champ",
  } as const;
  return (
    <div className={c.multiligne || c.large ? "sm:col-span-2" : undefined}>
      <label htmlFor={id} className="etiquette">
        {c.libelle}
        {c.requis && (
          <span aria-hidden="true" className="text-or">
            {" "}
            *
          </span>
        )}
      </label>
      {c.multiligne ? (
        <textarea rows={4} maxLength={2000} {...commun} onChange={(e) => onChange(e.target.value)} />
      ) : (
        <input
          type={c.type ?? "text"}
          inputMode={c.inputMode}
          spellCheck={c.type === "email" || c.nom === "siret" || c.nom === "tva" ? false : undefined}
          {...commun}
          onChange={(e) => onChange(e.target.value)}
        />
      )}
      {c.aide && (
        <p id={`${id}-aide`} className="mt-1.5 text-xs text-gris">
          {c.aide}
        </p>
      )}
      {erreur && <MessageErreur id={`${id}-err`}>{erreur}</MessageErreur>}
    </div>
  );
}
