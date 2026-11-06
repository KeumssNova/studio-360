import { reservationParId } from "@/lib/reservations";
import { pdfReservation } from "@/lib/pdf";

// L'identifiant (128 bits aléatoires) sert de clé : seul qui a reçu le lien peut ouvrir le PDF.
export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const r = await reservationParId((await params).id);
  if (!r) return new Response("Réservation introuvable", { status: 404 });
  const octets = await pdfReservation(r);
  return new Response(Buffer.from(octets), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="studio-360-${r.ref}.pdf"`,
      "Cache-Control": "private, no-store",
    },
  });
}
