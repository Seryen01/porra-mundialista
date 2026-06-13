// app/api/matches/live/route.ts
// Endpoint consumido por el frontend cada 60s cuando hay partidos activos.
// Actúa como proxy cacheado de la WC2026 API Y sincroniza automáticamente
// los resultados a la BD cuando la API marca un partido como terminado.

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { calculatePoints } from "@/lib/scoring";
import {
  getWC2026Matches,
  normalizeTeamName,
  findMatchInList,
  isMatchReversed,
  type WC2026Match,
} from "@/lib/wc2026";
import { cacheGet, cacheSet } from "@/lib/cache";

export const dynamic = "force-dynamic";

const RESPONSE_CACHE_KEY = "live_endpoint_response";
const RESPONSE_CACHE_TTL = 58; // segundos — ligeramente menor que el TTL de la API

interface LiveResponseMatch {
  homeTeam: string;
  awayTeam: string;
  homeScore: number | null;
  awayScore: number | null;
  status: "scheduled" | "live" | "finished";
  kickoffUtc: string;
}

interface LiveResponse {
  enabled: boolean;
  updatedAt: string;
  matches: LiveResponseMatch[];
  syncedCount: number;
  error?: string;
}

/** Sincroniza los partidos de la API con la BD. Idempotente y seguro para llamadas concurrentes. */
async function syncMatchesToDB(apiMatches: WC2026Match[]): Promise<number> {
  // Filtrar TBD (fases eliminatorias sin equipos aún definidos) y partidos relevantes
  const liveAndFinished = apiMatches.filter(
    (m) => (m.status === "live" || m.status === "finished" || m.status === "completed") && m.home_team && m.away_team
  );
  if (liveAndFinished.length === 0) return 0;

  // Una sola query para obtener todos los partidos no terminados
  const dbMatches = await prisma.match.findMany({
    where: { status: { not: "FINISHED" } },
  });
  if (dbMatches.length === 0) return 0;

  let synced = 0;

  for (const apiMatch of liveAndFinished) {
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

    const isStuckGroupMatch = 
      dbMatch.phase.toLowerCase().includes("grupo") &&
      Date.now() - dbMatch.date.getTime() > 3 * 60 * 60 * 1000;

    if (apiMatch.status === "live" && dbMatch.status === "UPCOMING" && !isStuckGroupMatch) {
      // UPCOMING → LIVE
      await prisma.match.update({
        where: { id: dbMatch.id },
        data: { status: "LIVE" },
      });
      console.log(`[live-sync] LIVE: ${dbMatch.teamA} vs ${dbMatch.teamB}`);
      synced++;
    } else if (
      (apiMatch.status === "finished" || apiMatch.status === "completed" || (apiMatch.status === "live" && isStuckGroupMatch)) &&
      apiMatch.home_score !== null &&
      apiMatch.away_score !== null
    ) {
      // LIVE/UPCOMING/PENDING → FINISHED
      const reversed = isMatchReversed(dbMatch, awayTeamEs, apiMatch.away_team);
      const scoreA = reversed ? apiMatch.away_score : apiMatch.home_score;
      const scoreB = reversed ? apiMatch.home_score : apiMatch.away_score;

      // updateMany con where extra garantiza idempotencia ante llamadas simultáneas
      const result = await prisma.match.updateMany({
        where: { id: dbMatch.id, status: { not: "FINISHED" } },
        data: { scoreA, scoreB, status: "FINISHED" },
      });

      if (result.count > 0) {
        await calculatePoints(dbMatch.id, scoreA, scoreB);
        console.log(
          `[live-sync] FINISHED: ${dbMatch.teamA} ${scoreA}-${scoreB} ${dbMatch.teamB} (puntos calculados${isStuckGroupMatch && apiMatch.status === "live" ? ", safety net" : ""})`
        );
        synced++;
      }
    }
  }

  return synced;
}

export async function GET() {
  // Feature flag
  if (process.env.LIVE_SCORES_ENABLED !== "true") {
    return NextResponse.json({ enabled: false, matches: [], syncedCount: 0 });
  }

  // Cache HIT → respuesta inmediata sin llamada a API ni BD
  const cached = cacheGet<LiveResponse>(RESPONSE_CACHE_KEY);
  if (cached) {
    return NextResponse.json(cached);
  }

  // Cache MISS → fetch + sync + respuesta
  try {
    const apiMatches = await getWC2026Matches();

    // Sincronizar automáticamente (idempotente)
    const syncedCount = await syncMatchesToDB(apiMatches);

    // Construir respuesta con partidos activos y recientes
    const now = Date.now();
    const THREE_HOURS = 3 * 60 * 60 * 1000;

    const matches: LiveResponseMatch[] = apiMatches
      .filter((m) => {
        // Descartar TBD
        if (!m.home_team || !m.away_team) return false;
        if (m.status === "live") return true;
        const kickoffMs = new Date(m.kickoff_utc).getTime();
        if (m.status === "finished" || m.status === "completed") return now - kickoffMs < THREE_HOURS;
        return kickoffMs > now && kickoffMs - now < 2 * 60 * 60 * 1000;
      })
      .map((m) => ({
        homeTeam: normalizeTeamName(m.home_team) as string,
        awayTeam: normalizeTeamName(m.away_team) as string,
        homeScore: m.home_score,
        awayScore: m.away_score,
        status: (m.status === "completed" ? "finished" : m.status) as LiveResponseMatch["status"],
        kickoffUtc: m.kickoff_utc,
      }));

    const response: LiveResponse = {
      enabled: true,
      updatedAt: new Date().toISOString(),
      matches,
      syncedCount,
    };

    cacheSet(RESPONSE_CACHE_KEY, response, RESPONSE_CACHE_TTL);
    return NextResponse.json(response);
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("[live] Error:", msg);
    // Responder sin matches — la app usa datos manuales de BD
    return NextResponse.json({
      enabled: true,
      matches: [],
      syncedCount: 0,
      updatedAt: new Date().toISOString(),
      error: "API temporalmente no disponible",
    });
  }
}
