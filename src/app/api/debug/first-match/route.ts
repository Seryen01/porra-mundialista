// app/api/debug/first-match/route.ts
// Endpoint de diagnóstico para verificar el estado del primer partido

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getWC2026Matches, normalizeTeamName } from "@/lib/wc2026";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    console.log("[debug] Verificando estado del primer partido...");

    // 1. Obtener el primer partido de BD
    const dbFirstMatch = await prisma.match.findFirst({
      where: { matchNumber: 1 },
      include: { predictions: { select: { id: true } } },
    });

    console.log("[debug] Primer partido en BD:", {
      id: dbFirstMatch?.id,
      teams: `${dbFirstMatch?.teamA} vs ${dbFirstMatch?.teamB}`,
      date: dbFirstMatch?.date,
      status: dbFirstMatch?.status,
      score: dbFirstMatch?.scoreA && dbFirstMatch?.scoreB ? `${dbFirstMatch.scoreA}-${dbFirstMatch.scoreB}` : "sin resultado",
      predictions: dbFirstMatch?.predictions?.length || 0,
    });

    // 2. Obtener datos de la API
    let apiMatch = null;
    let apiError = null;

    try {
      const allApiMatches = await getWC2026Matches();
      // Buscar el partido #1 (México vs Sudáfrica)
      apiMatch = allApiMatches.find((m) => m.match_number === 1);

      console.log("[debug] Primer partido en API:", {
        match_number: apiMatch?.match_number,
        teams: `${normalizeTeamName(apiMatch?.home_team)} vs ${normalizeTeamName(apiMatch?.away_team)}`,
        status: apiMatch?.status,
        scores: apiMatch?.home_score !== null && apiMatch?.away_score !== null 
          ? `${apiMatch?.home_score}-${apiMatch?.away_score}` 
          : `home=${apiMatch?.home_score}, away=${apiMatch?.away_score}`,
        kickoff: apiMatch?.kickoff_utc,
      });
    } catch (error) {
      apiError = error instanceof Error ? error.message : String(error);
      console.error("[debug] Error obteniendo datos de API:", apiError);
    }

    // 3. Análisis del problema
    const analysis: Record<string, string> = {};

    if (!dbFirstMatch) {
      analysis.error = "Primer partido no encontrado en BD";
    } else if (dbFirstMatch.status === "FINISHED") {
      analysis.status = "✅ Partido terminado correctamente";
      if (dbFirstMatch.scoreA === null || dbFirstMatch.scoreB === null) {
        analysis.warning = "⚠️ Partido FINISHED pero sin scores";
      }
    } else if (dbFirstMatch.status === "LIVE") {
      analysis.status = "🔴 PROBLEMA: Partido sigue en LIVE";
      
      if (!apiMatch) {
        analysis.cause = "API no encontró el partido";
      } else if (apiMatch.status === "live") {
        analysis.cause = "API aún reporta status='live' (no ha finalizado)";
      } else if (apiMatch.status === "finished" || apiMatch.status === "completed") {
        if (apiMatch.home_score === null || apiMatch.away_score === null) {
          analysis.cause = `API reporta '${apiMatch.status}' pero scores son null`;
          analysis.action = "❌ La BD no puede transicionar a FINISHED sin scores válidos";
        } else {
          analysis.cause = `API reporta '${apiMatch.status}' con scores, pero BD no se sincronizó`;
          analysis.action = "⚠️ Probablemente falta ejecutar el cron sync";
        }
      } else {
        analysis.cause = `API reporta status='${apiMatch.status}' (desconocido)`;
      }
    } else if (dbFirstMatch.status === "PENDING") {
      analysis.status = "⚠️ Partido en PENDING (esperando validación manual)";
      analysis.info = "El partido fue marcado como PENDING por la lógica de fallback (sin API disponible)";
    }

    const response = {
      timestamp: new Date().toISOString(),
      db: {
        match: dbFirstMatch ? {
          id: dbFirstMatch.id,
          teams: `${dbFirstMatch.teamA} vs ${dbFirstMatch.teamB}`,
          date: dbFirstMatch.date,
          status: dbFirstMatch.status,
          scoreA: dbFirstMatch.scoreA,
          scoreB: dbFirstMatch.scoreB,
          predictions: dbFirstMatch.predictions?.length || 0,
        } : null,
      },
      api: {
        match: apiMatch ? {
          match_number: apiMatch.match_number,
          teams: `${normalizeTeamName(apiMatch.home_team)} vs ${normalizeTeamName(apiMatch.away_team)}`,
          status: apiMatch.status,
          home_score: apiMatch.home_score,
          away_score: apiMatch.away_score,
          kickoff_utc: apiMatch.kickoff_utc,
        } : null,
        error: apiError,
      },
      analysis,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("[debug] Error en endpoint:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
