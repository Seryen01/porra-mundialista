// app/api/debug/live-matches/route.ts
// Endpoint de diagnóstico: muestra todos los partidos LIVE/PENDING con sus campos relevantes

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const now = new Date();

  const liveOrPending = await prisma.match.findMany({
    where: { status: { in: ["LIVE", "PENDING"] } },
    select: {
      id: true,
      teamA: true,
      teamB: true,
      status: true,
      phase: true,
      date: true,
      scoreA: true,
      scoreB: true,
    },
    orderBy: { date: "asc" },
  });

  const diagnostics = liveOrPending.map((m) => {
    const ageMs = now.getTime() - m.date.getTime();
    return {
      teams: `${m.teamA} vs ${m.teamB}`,
      status: m.status,
      phase: m.phase,
      dateUTC: m.date.toISOString(),
      ageMinutes: Math.round(ageMs / 60000),
      scoreA: m.scoreA,
      scoreB: m.scoreB,
      phaseHasGrupo: m.phase.toLowerCase().includes("grupo"),
      over120min: ageMs > 120 * 60 * 1000,
      wouldBeClosedBySafetyNet: m.phase.toLowerCase().includes("grupo") && ageMs > 120 * 60 * 1000,
    };
  });

  console.log("[debug-live-matches] Partidos LIVE/PENDING en BD", diagnostics);

  return NextResponse.json({
    now: now.toISOString(),
    count: liveOrPending.length,
    matches: diagnostics,
  });
}
