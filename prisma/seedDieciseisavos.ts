import "dotenv/config";
import { prisma } from "../src/lib/prisma";

// Round of 32 — FIFA World Cup 2026
// 16 matches, July 1-4 2026
// Times in UTC (calendar shows CEST = UTC+2)
// Team names use bracket placeholders; admin updates them after group stage

const matches = [
  // === 1 de julio ===
  { tA: "1º Grupo A", tB: "2º Grupo B", d: "2026-07-01T16:00:00Z" }, // 18:00 CEST
  { tA: "1º Grupo C", tB: "2º Grupo D", d: "2026-07-01T19:00:00Z" }, // 21:00 CEST
  { tA: "1º Grupo E", tB: "2º Grupo F", d: "2026-07-01T22:00:00Z" }, // 00:00 CEST 2 jul
  { tA: "1º Grupo G", tB: "2º Grupo H", d: "2026-07-02T01:00:00Z" }, // 03:00 CEST 2 jul

  // === 2 de julio ===
  { tA: "1º Grupo B", tB: "2º Grupo A", d: "2026-07-02T16:00:00Z" }, // 18:00 CEST
  { tA: "1º Grupo D", tB: "2º Grupo C", d: "2026-07-02T19:00:00Z" }, // 21:00 CEST
  { tA: "1º Grupo F", tB: "2º Grupo E", d: "2026-07-02T22:00:00Z" }, // 00:00 CEST 3 jul
  { tA: "1º Grupo H", tB: "2º Grupo G", d: "2026-07-03T01:00:00Z" }, // 03:00 CEST 3 jul

  // === 3 de julio ===
  { tA: "1º Grupo I", tB: "2º Grupo J", d: "2026-07-03T16:00:00Z" },
  { tA: "1º Grupo K", tB: "2º Grupo L", d: "2026-07-03T19:00:00Z" },
  { tA: "1º Grupo J", tB: "2º Grupo I", d: "2026-07-03T22:00:00Z" },
  { tA: "1º Grupo L", tB: "2º Grupo K", d: "2026-07-04T01:00:00Z" },

  // === 4 de julio — 3os clasificados ===
  { tA: "3º Mejor 1", tB: "3º Mejor 2", d: "2026-07-04T16:00:00Z" },
  { tA: "3º Mejor 3", tB: "3º Mejor 4", d: "2026-07-04T19:00:00Z" },
  { tA: "3º Mejor 5", tB: "3º Mejor 6", d: "2026-07-04T22:00:00Z" },
  { tA: "3º Mejor 7", tB: "3º Mejor 8", d: "2026-07-05T01:00:00Z" },
];

async function main() {
  console.log("Insertando 16 partidos de Dieciseisavos de Final...");
  for (const m of matches) {
    await prisma.match.create({
      data: {
        teamA: m.tA,
        teamB: m.tB,
        date: new Date(m.d),
        phase: "Dieciseisavos",
      },
    });
    console.log(`✅ ${m.tA} vs ${m.tB} — ${m.d}`);
  }
  console.log("\n16 partidos de Dieciseisavos creados.");
}

main().catch(console.error).finally(() => prisma.$disconnect());
