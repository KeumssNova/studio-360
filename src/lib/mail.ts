import "server-only";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { EN_PROD, STUDIO_EMAIL } from "./config";

export type Mail = { a: string; sujet: string; html: string; texte: string; repondreA?: string };

export const DOSSIER_OUTBOX = path.join(process.cwd(), ".outbox");

// Sans RESEND_API_KEY, les e-mails ne partent pas : ils sont écrits dans .outbox/ et se lisent sur
// /dev/boite. Avec la clé, envoi par l'API Resend (resend.com/docs/api-reference/emails/send-email).
export async function envoyer(m: Mail) {
  const cle = process.env.RESEND_API_KEY;
  if (!cle) {
    // En production, un e-mail écrit dans .outbox/ ne serait lu par personne (/dev/boite y est fermée) :
    // on échoue franchement plutôt que de perdre les messages sans le savoir.
    if (EN_PROD) throw new Error("RESEND_API_KEY manquante : aucun e-mail ne peut partir en production.");
    await mkdir(DOSSIER_OUTBOX, { recursive: true });
    const nom = `${Date.now()}-${m.a.replace(/[^a-z0-9]+/gi, "_")}.json`;
    await writeFile(path.join(DOSSIER_OUTBOX, nom), JSON.stringify({ ...m, le: new Date().toISOString() }, null, 2));
    return;
  }
  const r = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${cle}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: process.env.MAIL_FROM || `Studio 360 <${STUDIO_EMAIL}>`,
      to: [m.a],
      subject: m.sujet,
      html: m.html,
      text: m.texte,
      reply_to: m.repondreA,
    }),
  });
  if (!r.ok) throw new Error(`Envoi d'e-mail refusé par Resend (${r.status}) : ${await r.text()}`);
}

const echapper = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

/** Gabarit commun : noir et or, comme le site. Les styles sont en ligne, seuls lus par les messageries. */
export function gabarit(titre: string, paragraphes: string[], bouton?: { texte: string; lien: string }) {
  const corps = paragraphes.map((p) => `<p style="margin:0 0 14px;line-height:1.55">${echapper(p)}</p>`).join("");
  const btn = bouton
    ? `<p style="margin:24px 0"><a href="${echapper(bouton.lien)}" style="background:#f2c84b;color:#0f0f0f;padding:12px 20px;border-radius:4px;text-decoration:none;font-weight:700;display:inline-block">${echapper(bouton.texte)}</a></p>`
    : "";
  const html = `<!doctype html><html lang="fr"><body style="margin:0;background:#0f0f0f;color:#f5f5f5;font-family:Montserrat,Arial,sans-serif">
<div style="max-width:560px;margin:0 auto;padding:32px 24px">
<p style="color:#f2c84b;font-weight:800;letter-spacing:.08em;margin:0 0 24px">STUDIO 360</p>
<h1 style="font-size:22px;margin:0 0 18px;text-transform:uppercase">${echapper(titre)}</h1>${corps}${btn}
<p style="margin:32px 0 0;color:#a3a3a3;font-size:12px">Studio 360. Votre projet. Votre espace. Votre production.</p>
</div></body></html>`;
  const texte = [titre, "", ...paragraphes, ...(bouton ? ["", `${bouton.texte} : ${bouton.lien}`] : [])].join("\n");
  return { html, texte };
}
