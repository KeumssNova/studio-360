import type { Metadata } from "next";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { notFound } from "next/navigation";
import { EN_PROD } from "@/lib/config";
import { DOSSIER_OUTBOX } from "@/lib/mail";

// Boîte de réception de test : sans RESEND_API_KEY, chaque e-mail est écrit dans .outbox/ (voir lib/mail.ts).
// Cette page les affiche pour tester la connexion par lien et les avis de réservation sans vrai envoi.
// Elle n'existe pas en production.
export const metadata: Metadata = { title: "Boîte de test", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

type Recu = { fichier: string; a: string; sujet: string; html: string; texte: string; repondreA?: string; le: string };

const HEURE = new Intl.DateTimeFormat("fr-FR", { dateStyle: "short", timeStyle: "medium", timeZone: "Europe/Paris" });

async function lire(): Promise<Recu[]> {
  let fichiers: string[];
  try {
    fichiers = (await readdir(DOSSIER_OUTBOX)).filter((f) => f.endsWith(".json"));
  } catch {
    return [];
  }
  // Nom de fichier : `${Date.now()}-${destinataire}.json`, donc l'ordre inverse donne le plus récent en tête.
  fichiers.sort().reverse();
  const recus = await Promise.all(
    fichiers.slice(0, 50).map(async (f) => {
      try {
        return { fichier: f, ...(JSON.parse(await readFile(path.join(DOSSIER_OUTBOX, f), "utf8")) as Omit<Recu, "fichier">) };
      } catch {
        return null;
      }
    }),
  );
  return recus.filter((r): r is Recu => r !== null);
}

export default async function BoiteDeTest() {
  if (EN_PROD) notFound();
  const recus = await lire();

  return (
    <div className="mx-auto max-w-4xl px-4 pt-12 sm:px-6">
      <p className="surtitre">Développement</p>
      <h1 className="mt-3 text-3xl sm:text-4xl">Boîte de test</h1>
      <p className="mt-4 max-w-[60ch] text-gris">
        Les e-mails que le site aurait envoyés, du plus récent au plus ancien (50 au plus). Rechargez la page après une action.
      </p>

      {recus.length === 0 ? (
        <p className="mt-10 rounded-sm border border-filet-neutre p-6 text-gris">Aucun e-mail pour l&apos;instant.</p>
      ) : (
        <ul className="mt-10 space-y-4">
          {recus.map((m, i) => {
            const liens = [...new Set(m.texte.match(/https?:\/\/\S+/g) ?? [])];
            return (
              <li key={m.fichier}>
                <details open={i === 0} className="rounded-sm border border-filet-neutre">
                  <summary className="flex cursor-pointer flex-wrap items-baseline justify-between gap-x-4 gap-y-1 p-4">
                    <span className="font-semibold">{m.sujet}</span>
                    <span className="chiffres text-sm text-gris">
                      {m.a}, {HEURE.format(new Date(m.le))}
                    </span>
                  </summary>
                  <div className="border-t border-filet-neutre p-4">
                    {m.repondreA && <p className="text-sm text-gris">Réponse à : {m.repondreA}</p>}
                    {liens.length > 0 && (
                      <ul className="mt-2 space-y-1 text-sm">
                        {liens.map((l) => (
                          <li key={l}>
                            <a className="lien break-all" href={l}>
                              {l}
                            </a>
                          </li>
                        ))}
                      </ul>
                    )}
                    {/* sandbox sans aucun droit : le HTML de l'e-mail s'affiche sans pouvoir exécuter de script. */}
                    <iframe
                      title={`Aperçu : ${m.sujet}`}
                      sandbox=""
                      srcDoc={m.html}
                      className="mt-4 h-[28rem] w-full rounded-sm border border-filet-neutre bg-white"
                    />
                  </div>
                </details>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
