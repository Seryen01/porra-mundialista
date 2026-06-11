// app/api/debug/force-sync/route.ts
// Endpoint para forzar sincronización manual (DEBUG)

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { calculatePoints } from "@/lib/scoring";
import { getWC2026Matches, normalizeTeamName, findMatchInList, isMatchReversed } from "@/lib/wc2026";
import { cacheDelete } from "@/lib/cache";

export async function POST(req: Request) {
  console.log("[force-sync] Iniciando sincronización forzada...");
  
  try {
    const apiMatches = await getWC2026Matches();
    cacheDelete("live_endpoint_response");

    const dbMatches = await prisma.match.findMany({
      where: { status: { not: "FINISHED" } },
    });

    const logs: string[] = [];
    let synced = 0;

    for (const apiMatch of apiMatches) {
      if (!apiMatch.home_team || !apiMatch.away_team) continue;

      const homeTeamEs = normalizeTeamName(apiMatch.home_team);
      const awayTeamEs = normalizeTeamName(apiMatch.away_team);
      const kickoff = new Date(apiMatch.kickoff_utc);

      const dbMatch = findMatchInList(
        dbMatches,
        homeTeamEs,
        awayTeamEs,
        apiMatch.home_team,
        apiMatch.away_team,
        kickoff
      );
      if (!dbMatch) continue;

      // UPCOMING → LIVE
      if (apiMatch.status === "live" && dbMatch.status === "UPCOMING") {
        await prisma.match.update({
          where: { id: dbMatch.id },
          data: { status: "LIVE" },
        });
        logs.push(`→ LIVE: ${dbMatch.teamA} vs ${dbMatch.teamB}`);
        synced++;
      }
      // LIVE/PENDING → FINISHED con scores
      else if (
        apiMatch.status === "finished" &&
        apiMatch.home_score !== null &&
        apiMatch.away_score !== null
      ) {
        const reversed = isMatchReversed(dbMatch, awayTeamEs, apiMatch.away_team);
        const scoreA = reversed ? apiMatch.away_score : apiMatch.home_score;
        const scoreB = reversed ? apiMatch.home_score : apiMatch.away_score;

        const result = await prisma.match.updateMany({
          where: { id: dbMatch.id, status: { not: "FINISHED" } },
          data: { scoreA, scoreB, status: "FINISHED" },
        });

        if (result.count > 0) {
          await calculatePoints(dbMatch.id, scoreA, scoreB);
          logs.push(
            `→ FINISHED: ${dbMatch.teamA} ${scoreA}-${scoreB} ${dbMatch.teamB} (✓ puntos calculados)`
          );
          synced++;
        }
      }
      // API reporta finished sin scores
      else if (apiMatch.status === "finished" && (apiMatch.home_score === null || apiMatch.away_score === null)) {
        logs.push(
          `⚠️ SKIPPED: ${dbMatch.teamA} vs ${dbMatch.teamB} - API reporta finished pero scores = null`
        );
      }
    }

    console.log("[force-sync] Completado. Sincronizados:", synced, "| Logs:", logs);

    return NextResponse.json({
      success: true,
      synced,
      logs,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("[force-sync] Error:", msg);
    return NextResponse.json(
      { error: msg },
      { status: 500 }
    );
  }
}
