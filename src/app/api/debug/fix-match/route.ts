// app/api/debug/fix-match/route.ts
// Endpoint de corrección manual para un partido específico.
// Protegido por CRON_SECRET. Útil cuando la API se queda bloqueada en "live"
// y el score o estado en BD es incorrecto.

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { calculatePoints } from "@/lib/scoring";

export async function POST(req: Request) {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    return NextResponse.json({ error: "Server misconfiguration" }, { status: 500 });
  }
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${cronSecret}`) {
    console.warn("[fix-match] Intento de acceso no autorizado");
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { teamA, teamB, scoreA, scoreB } = body as {
    teamA: string;
    teamB: string;
    scoreA: number;
    scoreB: number;
  };

  if (!teamA || !teamB || scoreA === undefined || scoreB === undefined) {
    return NextResponse.json({ error: "Faltan campos: teamA, teamB, scoreA, scoreB" }, { status: 400 });
  }

  console.log("[fix-match] Buscando partido", { teamA, teamB, scoreA, scoreB });

  const match = await prisma.match.findFirst({
    where: {
      OR: [
        { teamA, teamB },
        { teamA: teamB, teamB: teamA },
      ],
    },
  });

  if (!match) {
    console.warn("[fix-match] Partido no encontrado", { teamA, teamB });
    return NextResponse.json({ error: "Partido no encontrado" }, { status: 404 });
  }

  console.log("[fix-match] Partido encontrado", {
    id: match.id,
    teams: `${match.teamA} vs ${match.teamB}`,
    currentStatus: match.status,
    currentScore: `${match.scoreA}-${match.scoreB}`,
  });

  const finalScoreA = match.teamA === teamA ? scoreA : scoreB;
  const finalScoreB = match.teamA === teamA ? scoreB : scoreA;

  await prisma.match.update({
    where: { id: match.id },
    data: { status: "FINISHED", scoreA: finalScoreA, scoreB: finalScoreB },
  });

  await calculatePoints(match.id, finalScoreA, finalScoreB);

  console.log("[fix-match] Partido actualizado y puntos recalculados", {
    id: match.id,
    teams: `${match.teamA} vs ${match.teamB}`,
    score: `${finalScoreA}-${finalScoreB}`,
  });

  return NextResponse.json({
    success: true,
    match: `${match.teamA} ${finalScoreA}-${finalScoreB} ${match.teamB}`,
    previousStatus: match.status,
    previousScore: `${match.scoreA ?? "?"}–${match.scoreB ?? "?"}`,
    timestamp: new Date().toISOString(),
  });
}
