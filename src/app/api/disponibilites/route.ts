import { NextResponse, type NextRequest } from "next/server";
import { espaceParSlug } from "@/data/catalogue";
import { heuresOccupees } from "@/lib/reservations";
import { dateValide } from "@/lib/regles";

// GET /api/disponibilites?espace=grand-plateau-tv&date=2026-11-20
// Rend les heures prises (réservations et blocages) et celles déjà passées, jamais qui a réservé.
export async function GET(req: NextRequest) {
  const espace = req.nextUrl.searchParams.get("espace") ?? "";
  const date = req.nextUrl.searchParams.get("date") ?? "";
  if (!espaceParSlug(espace) || !dateValide(date)) return NextResponse.json({ erreur: "Paramètres invalides" }, { status: 400 });
  const d = await heuresOccupees(espace, date);
  return NextResponse.json(d, { headers: { "Cache-Control": "no-store" } });
}
