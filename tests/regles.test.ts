import { test } from "node:test";
import assert from "node:assert/strict";
import { prixLocation, devis, heuresPrises, chevauche, heuresPassees, maintenantParis, dateValide } from "../src/lib/regles.ts";

const plateau = { prixHeure: 120, prixJournee: 450, prixHeureSup: 40 };
const cabine = { prixHeure: 30, prixJournee: 110, prixHeureSup: 40 };

test("prix : 1re heure au tarif, +40 par heure, plafond journée", () => {
  assert.equal(prixLocation(plateau, { debut: 8, fin: 9 }), 120);
  assert.equal(prixLocation(plateau, { debut: 9, fin: 12 }), 200);
  assert.equal(prixLocation(plateau, { debut: 8, fin: 17 }), 450);
  assert.equal(prixLocation(plateau, { debut: 8, fin: 16 }), 400);
  assert.equal(prixLocation(cabine, { debut: 10, fin: 13 }), 110);
  assert.equal(prixLocation(cabine, { debut: 10, fin: 15 }), 110);
});

test("prix : plages refusées", () => {
  assert.throws(() => prixLocation(plateau, { debut: 9, fin: 9 }));
  assert.throws(() => prixLocation(plateau, { debut: 7, fin: 9 }));
  assert.throws(() => prixLocation(plateau, { debut: 16, fin: 18 }));
});

test("devis en centimes avec TVA 20 %", () => {
  const d = devis(plateau, { debut: 8, fin: 17 }, [
    { id: "cameras-3", nom: "", prix: 250, quantite: 1 },
    { id: "maquillage", nom: "", prix: 100, quantite: 2 },
  ]);
  assert.deepEqual(d, { locationHt: 45000, optionsHt: 45000, totalHt: 90000, tva: 18000, totalTtc: 108000 });
});

test("créneaux pris et chevauchements", () => {
  assert.deepEqual(heuresPrises([{ debut: 9, fin: 11 }, { debut: 14, fin: 15 }]), [9, 10, 14]);
  assert.equal(chevauche({ debut: 9, fin: 11 }, { debut: 11, fin: 12 }), false);
  assert.equal(chevauche({ debut: 9, fin: 11 }, { debut: 10, fin: 12 }), true);
});

test("heures passées et fuseau de Paris", () => {
  const m = { date: "2026-11-06", heure: 10 };
  assert.deepEqual(heuresPassees("2026-11-06", m), [8, 9, 10]);
  assert.deepEqual(heuresPassees("2026-11-07", m), []);
  assert.equal(heuresPassees("2026-11-05", m).length, 9);
  // 2026-07-01 22:30 UTC = 2026-07-02 00h30 à Paris (heure d'été, UTC+2)
  assert.deepEqual(maintenantParis(new Date("2026-07-01T22:30:00Z")), { date: "2026-07-02", heure: 0 });
  assert.equal(dateValide("2026-02-30"), false);
  assert.equal(dateValide("2026-02-28"), true);
});

test("prix TTC affiché à côté du HT", async () => {
  const { prixTtc } = await import("../src/lib/format.ts");
  const net = (s: string) => s.replace(/\s/g, " ");
  assert.equal(net(prixTtc(120)), "144 €");
  assert.equal(net(prixTtc(45)), "54 €");
  // Même arrondi que devis() : 12,50 € HT donne 15 € TTC.
  assert.equal(net(prixTtc(12.5)), "15 €");
});

test("délai de rétractation : 14 jours après la conclusion, reporté après un week-end ou un jour férié", async () => {
  const { paques, jourFerie, finDelaiRetractation } = await import("../src/lib/regles.ts");
  // Pâques : dates connues (calendrier grégorien).
  assert.equal(paques(2026), "2026-04-05");
  assert.equal(paques(2027), "2027-03-28");
  assert.equal(paques(2024), "2024-03-31");
  assert.equal(jourFerie("2026-11-11"), true);
  assert.equal(jourFerie("2026-04-06"), true); // lundi de Pâques
  assert.equal(jourFerie("2026-05-14"), true); // Ascension
  assert.equal(jourFerie("2026-05-25"), true); // lundi de Pentecôte
  assert.equal(jourFerie("2026-11-12"), false);
  // Conclu le vendredi 6 novembre 2026 : J+14 = vendredi 20, jour ouvrable.
  assert.equal(finDelaiRetractation("2026-11-06"), "2026-11-20");
  // Conclu le samedi 7 : J+14 = samedi 21, reporté au lundi 23.
  assert.equal(finDelaiRetractation("2026-11-07"), "2026-11-23");
  // Conclu le 28 octobre 2026 : J+14 = mercredi 11 novembre, férié, reporté au jeudi 12.
  assert.equal(finDelaiRetractation("2026-10-28"), "2026-11-12");
  // Conclu le 11 décembre 2026 : J+14 = vendredi 25 décembre, férié, puis week-end : lundi 28.
  assert.equal(finDelaiRetractation("2026-12-11"), "2026-12-28");
});
