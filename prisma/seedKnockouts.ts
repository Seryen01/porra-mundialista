import "dotenv/config";
import { prisma } from "../src/lib/prisma";

// All remaining knockout rounds — FIFA World Cup 2026
// Times in UTC (CEST = UTC+2)
// Team names use bracket placeholders; admin updates them as results come in

const matches = [
  // ================================================================
  // OCTAVOS DE FINAL (8 partidos) — 7-10 julio
  // ================================================================
  { tA: "Gana D32/1",  tB: "Gana D32/2",  d: "2026-07-07T19:00:00Z", phase: "Octavos" }, // 21:00 CEST
  { tA: "Gana D32/3",  tB: "Gana D32/4",  d: "2026-07-07T23:00:00Z", phase: "Octavos" }, // 01:00 CEST 8 jul
  { tA: "Gana D32/5",  tB: "Gana D32/6",  d: "2026-07-08T19:00:00Z", phase: "Octavos" },
  { tA: "Gana D32/7",  tB: "Gana D32/8",  d: "2026-07-08T23:00:00Z", phase: "Octavos" },
  { tA: "Gana D32/9",  tB: "Gana D32/10", d: "2026-07-09T19:00:00Z", phase: "Octavos" },
  { tA: "Gana D32/11", tB: "Gana D32/12", d: "2026-07-09T23:00:00Z", phase: "Octavos" },
  { tA: "Gana D32/13", tB: "Gana D32/14", d: "2026-07-10T19:00:00Z", phase: "Octavos" },
  { tA: "Gana D32/15", tB: "Gana D32/16", d: "2026-07-10T23:00:00Z", phase: "Octavos" },

  // ================================================================
  // CUARTOS DE FINAL (4 partidos) — 14-15 julio
  // ================================================================
  { tA: "Gana Oc/1",   tB: "Gana Oc/2",   d: "2026-07-14T19:00:00Z", phase: "Cuartos" },
  { tA: "Gana Oc/3",   tB: "Gana Oc/4",   d: "2026-07-14T23:00:00Z", phase: "Cuartos" },
  { tA: "Gana Oc/5",   tB: "Gana Oc/6",   d: "2026-07-15T19:00:00Z", phase: "Cuartos" },
  { tA: "Gana Oc/7",   tB: "Gana Oc/8",   d: "2026-07-15T23:00:00Z", phase: "Cuartos" },

  // ================================================================
  // SEMIFINALES (2 partidos) — 19 y 22 julio
  // ================================================================
  { tA: "Gana CF/1",   tB: "Gana CF/2",   d: "2026-07-19T22:00:00Z", phase: "Semis" }, // 00:00 CEST 20 jul
  { tA: "Gana CF/3",   tB: "Gana CF/4",   d: "2026-07-22T22:00:00Z", phase: "Semis" }, // 00:00 CEST 23 jul

  // ================================================================
  // FINAL (1 partido) — 26 julio, MetLife Stadium
  // ================================================================
  { tA: "Gana SF/1",   tB: "Gana SF/2",   d: "2026-07-26T22:00:00Z", phase: "Final" }, // 00:00 CEST 27 jul
];

async function main() {
  for (const m of matches) {
    await prisma.match.create({
      data: { teamA: m.tA, teamB: m.tB, date: new Date(m.d), phase: m.phase },
    });
    console.log(`✅ [${m.phase}] ${m.tA} vs ${m.tB} — ${m.d}`);
  }
  console.log(`\n${matches.length} partidos de fase final creados.`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
