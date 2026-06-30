// lib/scoring.ts
// Sistema de puntuación de la Porra Mundial 2026
//
// Dos resultados posibles:
//   1. Resultado exacto  → puntos_exacto
//   2. Resultado (V/E/D) → puntos_resultado
//
// Puntos base por fase:
//   Grupos (Grupo A–L)  : exacto=5, resultado=3
//   Dieciseisavos       : exacto=6, resultado=4
//   Octavos             : exacto=7, resultado=5
//   Cuartos             : exacto=8, resultado=6
//   Semis               : exacto=10, resultado=7
//   Final               : exacto=15, resultado=8
//
// Partido Estrella: los puntos se multiplican ×2

import { prisma } from "@/lib/prisma";

interface PhasePoints {
  exact: number;
  outcome: number;
}

function getPhasePoints(phase: string): PhasePoints {
  const p = phase.toLowerCase().trim();

  if (p === "final")          return { exact: 15, outcome: 8 };
  if (p === "semis")          return { exact: 10, outcome: 7 };
  if (p === "cuartos")        return { exact: 8,  outcome: 6 };
  if (p === "octavos")        return { exact: 7,  outcome: 5 };
  if (p === "dieciseisavos")  return { exact: 6,  outcome: 4 };

  // Grupos (Grupo A, Grupo B, … Grupo L) y cualquier otra fase
  return { exact: 5, outcome: 3 };
}

export async function calculatePoints(
  matchId: string,
  scoreA: number,
  scoreB: number
) {
  console.log('[scoring] calculatePoints start', { matchId, scoreA, scoreB });
  try {
    const match = await prisma.match.findUnique({ where: { id: matchId } });
    if (!match) {
      console.warn('[scoring] Match not found', { matchId });
      return;
    }

    const { exact: baseExact, outcome: baseOutcome } = getPhasePoints(match.phase);
    const multiplier = match.isStarMatch ? 2 : 1;
    const pointsExact   = baseExact   * multiplier;
    const pointsOutcome = baseOutcome * multiplier;
    const realOutcome = scoreA > scoreB ? "1" : scoreA < scoreB ? "2" : "X";

    const predictions = await prisma.prediction.findMany({ where: { matchId } });
    console.log(`[scoring] ${predictions.length} predicciones para partido ${matchId}`);

    const updates = predictions.map((prediction) => {
      const predA = prediction.predictedScoreA;
      const predB = prediction.predictedScoreB;
      const predOutcome = predA > predB ? "1" : predA < predB ? "2" : "X";

      let points = 0;
      if (predA === scoreA && predB === scoreB) {
        points = pointsExact;
      } else if (predOutcome === realOutcome) {
        points = pointsOutcome;
      }

      return prisma.prediction.update({ where: { id: prediction.id }, data: { points } });
    });

    await prisma.$transaction(updates);
    console.log(`[scoring] Puntos calculados OK — ${updates.length} predicciones actualizadas`);
  } catch (error) {
    console.error('[scoring] calculatePoints failed', error);
    throw error; // re-throw so the caller (admin PATCH) can return 500
  }
}
