"use client";

import { CaretLeft, CaretRight } from "@phosphor-icons/react";
import { useState } from "react";

// Calendrier du mois, semaine commençant le lundi (norme ISO 8601, usage français).
// Les dates sont des chaînes AAAA-MM-JJ calculées en UTC à midi, comme dans lib/regles.ts :
// aucun décalage de fuseau ne peut faire glisser un jour.

const MOIS = new Intl.DateTimeFormat("fr-FR", { month: "long", year: "numeric", timeZone: "UTC" });
const JOUR_LONG = new Intl.DateTimeFormat("fr-FR", { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" });
const JOUR_COURT = new Intl.DateTimeFormat("fr-FR", { weekday: "short", timeZone: "UTC" });
// Le 1er janvier 2024 était un lundi : point de départ des en-têtes de colonnes.
const SEMAINE = Array.from({ length: 7 }, (_, i) => JOUR_COURT.format(new Date(Date.UTC(2024, 0, 1 + i))));

export function Calendrier({
  valeur,
  min,
  max,
  onChange,
}: {
  valeur: string;
  min: string;
  max: string;
  onChange: (date: string) => void;
}) {
  const [mois, setMois] = useState(valeur.slice(0, 7));
  const [a, m] = mois.split("-").map(Number);
  const premier = new Date(Date.UTC(a, m - 1, 1));
  const decalage = (premier.getUTCDay() + 6) % 7; // lundi = 0
  const nbJours = new Date(Date.UTC(a, m, 0)).getUTCDate();
  const jours = Array.from({ length: nbJours }, (_, i) => `${mois}-${String(i + 1).padStart(2, "0")}`);
  const decaler = (n: number) => setMois(new Date(Date.UTC(a, m - 1 + n, 1)).toISOString().slice(0, 7));

  return (
    <div className="w-full max-w-md rounded-sm border border-filet bg-carte p-3 sm:p-4">
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => decaler(-1)}
          disabled={mois <= min.slice(0, 7)}
          aria-label="Mois précédent"
          className="grid size-11 place-items-center rounded-sm transition-colors hover:bg-sourdine disabled:pointer-events-none disabled:opacity-30"
        >
          <CaretLeft size={18} weight="bold" />
        </button>
        <p aria-live="polite" className="font-titre text-sm tracking-wide uppercase">
          {MOIS.format(premier)}
        </p>
        <button
          type="button"
          onClick={() => decaler(1)}
          disabled={mois >= max.slice(0, 7)}
          aria-label="Mois suivant"
          className="grid size-11 place-items-center rounded-sm transition-colors hover:bg-sourdine disabled:pointer-events-none disabled:opacity-30"
        >
          <CaretRight size={18} weight="bold" />
        </button>
      </div>

      <div aria-hidden="true" className="mt-2 grid grid-cols-7 text-center text-[0.7rem] font-semibold text-gris uppercase">
        {SEMAINE.map((j) => (
          <span key={j} className="py-1">
            {j.replace(".", "")}
          </span>
        ))}
      </div>

      <ol className="grid grid-cols-7 gap-0.5">
        {Array.from({ length: decalage }, (_, i) => (
          <li key={`v${i}`} aria-hidden="true" />
        ))}
        {jours.map((j) => {
          const hors = j < min || j > max;
          const choisi = j === valeur;
          return (
            <li key={j}>
              <button
                type="button"
                onClick={() => onChange(j)}
                disabled={hors}
                aria-pressed={choisi}
                aria-label={JOUR_LONG.format(new Date(`${j}T12:00:00Z`))}
                className={`chiffres grid aspect-square w-full place-items-center rounded-sm text-sm transition-colors ${
                  choisi
                    ? "bg-or font-semibold text-sur-or"
                    : hors
                      ? "text-gris/35"
                      : "hover:bg-sourdine hover:text-or"
                }`}
              >
                {Number(j.slice(8))}
              </button>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
