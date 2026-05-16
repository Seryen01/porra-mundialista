import "dotenv/config";
import { prisma } from "../src/lib/prisma";

// Official FIFA World Cup 2026 knockout stage schedule
// Source: Wikipedia / FIFA official (fetched May 2026)
// All times in UTC. Local times shown for reference.

const dieciseisavosSlots = [
  "2026-06-28T19:00:00Z", // M73 — Jun 28 12:00 PT  — SoFi Stadium (Los Ángeles)
  "2026-06-29T17:00:00Z", // M76 — Jun 29 12:00 CT  — NRG Stadium (Houston)
  "2026-06-29T20:30:00Z", // M74 — Jun 29 16:30 ET  — Gillette Stadium (Boston)
  "2026-06-30T01:00:00Z", // M75 — Jun 29 19:00 MT  — Estadio BBVA (Monterrey)
  "2026-06-30T17:00:00Z", // M78 — Jun 30 12:00 CT  — AT&T Stadium (Dallas)
  "2026-06-30T21:00:00Z", // M77 — Jun 30 17:00 ET  — MetLife Stadium (Nueva York)
  "2026-07-01T01:00:00Z", // M79 — Jun 30 19:00 MT  — Estadio Azteca (México DF)
  "2026-07-01T16:00:00Z", // M80 — Jul  1 12:00 ET  — Mercedes-Benz Stadium (Atlanta)
  "2026-07-01T20:00:00Z", // M82 — Jul  1 13:00 PT  — Lumen Field (Seattle)
  "2026-07-02T00:00:00Z", // M81 — Jul  1 17:00 PT  — Levi's Stadium (San Francisco)
  "2026-07-02T19:00:00Z", // M84 — Jul  2 12:00 PT  — SoFi Stadium (Los Ángeles)
  "2026-07-02T23:00:00Z", // M83 — Jul  2 19:00 ET  — BMO Field (Toronto)
  "2026-07-03T03:00:00Z", // M85 — Jul  2 20:00 PT  — BC Place (Vancouver)
  "2026-07-03T18:00:00Z", // M88 — Jul  3 13:00 CT  — AT&T Stadium (Dallas)
  "2026-07-03T22:00:00Z", // M86 — Jul  3 18:00 ET  — Hard Rock Stadium (Miami)
  "2026-07-04T01:30:00Z", // M87 — Jul  3 20:30 CT  — Arrowhead Stadium (Kansas City)
];

const octavosSlots = [
  "2026-07-04T17:00:00Z", // M90 — Jul 4 12:00 CT — NRG Stadium (Houston)
  "2026-07-04T21:00:00Z", // M89 — Jul 4 17:00 ET — Lincoln Financial Field (Filadelfia)
  "2026-07-05T20:00:00Z", // M91 — Jul 5 16:00 ET — MetLife Stadium (Nueva York)
  "2026-07-06T00:00:00Z", // M92 — Jul 5 18:00 MT — Estadio Azteca (México DF)
  "2026-07-06T19:00:00Z", // M93 — Jul 6 14:00 CT — AT&T Stadium (Dallas)
  "2026-07-07T00:00:00Z", // M94 — Jul 6 17:00 PT — Lumen Field (Seattle)
  "2026-07-07T16:00:00Z", // M95 — Jul 7 12:00 ET — Mercedes-Benz Stadium (Atlanta)
  "2026-07-07T20:00:00Z", // M96 — Jul 7 13:00 PT — BC Place (Vancouver)
];

const cuartosSlots = [
  "2026-07-09T20:00:00Z", // M97  — Jul  9 16:00 ET — Gillette Stadium (Boston)
  "2026-07-10T19:00:00Z", // M98  — Jul 10 12:00 PT — SoFi Stadium (Los Ángeles)
  "2026-07-11T21:00:00Z", // M99  — Jul 11 17:00 ET — Hard Rock Stadium (Miami)
  "2026-07-12T01:00:00Z", // M100 — Jul 11 20:00 CT — Arrowhead Stadium (Kansas City)
];

const semisSlots = [
  "2026-07-14T19:00:00Z", // M101 — Jul 14 14:00 CT — AT&T Stadium (Dallas)
  "2026-07-15T19:00:00Z", // M102 — Jul 15 15:00 ET — Mercedes-Benz Stadium (Atlanta)
];

const finalSlot = "2026-07-19T19:00:00Z"; // M104 — Jul 19 15:00 ET — MetLife Stadium (Nueva York)

async function updatePhase(phase: string, slots: string[]) {
  const matches = await prisma.match.findMany({
    where: { phase },
    orderBy: { date: "asc" },
  });

  if (matches.length !== slots.length) {
    console.warn(`⚠️  ${phase}: ${matches.length} partidos en DB pero ${slots.length} slots oficiales`);
  }

  let updated = 0;
  for (let i = 0; i < Math.min(matches.length, slots.length); i++) {
    const newDate = new Date(slots[i]);
    await prisma.match.update({ where: { id: matches[i].id }, data: { date: newDate } });
    console.log(`✅ [${phase}] ${matches[i].teamA} vs ${matches[i].teamB} → ${slots[i]}`);
    updated++;
  }
  return updated;
}

async function main() {
  console.log("Actualizando fechas oficiales FIFA 2026 — fase eliminatoria\n");

  let total = 0;
  total += await updatePhase("Dieciseisavos", dieciseisavosSlots);
  console.log();
  total += await updatePhase("Octavos", octavosSlots);
  console.log();
  total += await updatePhase("Cuartos", cuartosSlots);
  console.log();
  total += await updatePhase("Semis", semisSlots);
  console.log();

  const finals = await prisma.match.findMany({ where: { phase: "Final" } });
  if (finals.length === 1) {
    await prisma.match.update({ where: { id: finals[0].id }, data: { date: new Date(finalSlot) } });
    console.log(`✅ [Final] ${finals[0].teamA} vs ${finals[0].teamB} → ${finalSlot}`);
    total++;
  } else {
    console.warn(`⚠️  Final: ${finals.length} partidos encontrados (esperado 1)`);
  }

  console.log(`\n${total} partidos actualizados con fechas oficiales FIFA 2026.`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
