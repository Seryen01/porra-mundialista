// app/api/matches/live/route.ts
// Endpoint consumido por el frontend cada 60s cuando hay partidos activos.
// Actúa como proxy cacheado de la WC2026 API Y sincroniza automáticamente
// los resultados a la BD cuando la API marca un partido como terminado.
//
// IMPORTANTE: En el plan Hobby de Vercel, los cron jobs solo se ejecutan una
// vez al día.  Este endpoint es el MECANISMO PRINCIPAL de auto-finish; cada
// visita de un usuario dispara la sincronización.

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
  const relevantApi = apiMatches.filter(
    (m) =>
      (m.status === "live" ||
        m.status === "finished" ||
        m.status === "completed") &&
      m.home_team &&
      m.away_team
  );
  if (relevantApi.length === 0) {
    console.log("[live-sync] Sin partidos relevantes en la API (0 live/finished/completed)");
    return 0;
  }

  // Una sola query para obtener todos los partidos no terminados
  const dbMatches = await prisma.match.findMany({
    where: { status: { not: "FINISHED" } },
  });
  if (dbMatches.length === 0) {
    console.log("[live-sync] Sin partidos no-FINISHED en BD");
    return 0;
  }

  console.log("[live-sync] Sincronizando", {
    apiRelevant: relevantApi.length,
    dbNotFinished: dbMatches.length,
    apiStatuses: relevantApi.map((m) => `${m.home_team} vs ${m.away_team}: ${m.status} (${m.home_score}-${m.away_score})`),
    dbStatuses: dbMatches.map((m) => `${m.teamA} vs ${m.teamB}: ${m.status} (age=${Math.round((Date.now() - m.date.getTime()) / 60000)}min)`),
  });

  let synced = 0;

  for (const apiMatch of relevantApi) {
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
    if (!dbMatch) {
      console.log("[live-sync] No encontrado en BD", {
        apiTeams: `${apiMatch.home_team} vs ${apiMatch.away_team}`,
        homeTeamEs,
        awayTeamEs,
      });
      continue;
    }

    // ── Safety net: partido de grupo bloqueado en LIVE/PENDING por >120 min ──
    const isStuckGroupMatch =
      dbMatch.phase.toLowerCase().includes("grupo") &&
      Date.now() - dbMatch.date.getTime() > 120 * 60 * 1000;

    // ── Transición UPCOMING → LIVE ──
    if (apiMatch.status === "live" && dbMatch.status === "UPCOMING" && !isStuckGroupMatch) {
      await prisma.match.update({
        where: { id: dbMatch.id },
        data: { status: "LIVE" },
      });
      console.log(`[live-sync] LIVE: ${dbMatch.teamA} vs ${dbMatch.teamB}`);
      synced++;
      continue;
    }

    // ── Transición → FINISHED (API dice completed/finished, O safety net) ──
    const apiSaysFinished =
      apiMatch.status === "finished" || apiMatch.status === "completed";
    const shouldFinish =
      apiSaysFinished || (apiMatch.status === "live" && isStuckGroupMatch);

    if (
      shouldFinish &&
      apiMatch.home_score !== null &&
      apiMatch.away_score !== null &&
      dbMatch.status !== "FINISHED"
    ) {
      const reversed = isMatchReversed(
        dbMatch,
        awayTeamEs,
        apiMatch.away_team
      );
      const scoreA = reversed ? apiMatch.away_score : apiMatch.home_score;
      const scoreB = reversed ? apiMatch.home_score : apiMatch.away_score;

      // updateMany con where extra garantiza idempotencia ante llamadas simultáneas
      const result = await prisma.match.updateMany({
        where: { id: dbMatch.id, status: { not: "FINISHED" } },
        data: { scoreA, scoreB, status: "FINISHED" },
      });

      if (result.count > 0) {
        await calculatePoints(dbMatch.id, scoreA, scoreB);
        const reason = isStuckGroupMatch && apiMatch.status === "live"
          ? "safety net >120min"
          : `API ${apiMatch.status}`;
        console.log(
          `[live-sync] FINISHED: ${dbMatch.teamA} ${scoreA}-${scoreB} ${dbMatch.teamB} (${reason}, puntos calculados)`
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
    console.log("[live] Feature flag LIVE_SCORES_ENABLED desactivado");
    return NextResponse.json(
      { enabled: false, matches: [], syncedCount: 0 },
      { headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600" } }
    );
  }

  // ── Antes de devolver caché, comprobar si hay partidos bloqueados ──
  // Si hay partidos LIVE/PENDING en BD con >120 min de antigüedad,
  // invalidamos el caché para forzar un nuevo sync.
  let stuckCount = 0;
  try {
    stuckCount = await prisma.match.count({
      where: {
        status: { in: ["LIVE", "PENDING"] },
        date: { lt: new Date(Date.now() - 120 * 60 * 1000) },
      },
    });
  } catch (err) {
    console.warn("[live] No se pudo comprobar partidos bloqueados", err);
  }

  if (stuckCount > 0) {
    console.log("[live] Partidos bloqueados detectados, forzando sync", { stuckCount });
  }

  // Cache HIT (solo si NO hay partidos bloqueados)
  if (stuckCount === 0) {
    const cached = cacheGet<LiveResponse>(RESPONSE_CACHE_KEY);
    if (cached) {
      return NextResponse.json(cached, {
        headers: { "Cache-Control": "public, s-maxage=55, stale-while-revalidate=60" },
      });
    }
  }

  // Cache MISS o partidos bloqueados → fetch + sync + respuesta
  try {
    const apiMatches = await getWC2026Matches();

    // Sincronizar automáticamente (idempotente)
    const syncedCount = await syncMatchesToDB(apiMatches);

    if (syncedCount > 0) {
      console.log("[live] Sincronizados", { syncedCount });
    }

    // Construir respuesta con partidos activos y recientes
    const now = Date.now();
    const THREE_HOURS = 3 * 60 * 60 * 1000;

    const matches: LiveResponseMatch[] = apiMatches
      .filter((m) => {
        // Descartar TBD
        if (!m.home_team || !m.away_team) return false;
        if (m.status === "live") return true;
        const kickoffMs = new Date(m.kickoff_utc).getTime();
        if (m.status === "finished" || m.status === "completed")
          return now - kickoffMs < THREE_HOURS;
        return kickoffMs > now && kickoffMs - now < 2 * 60 * 60 * 1000;
      })
      .map((m) => ({
        homeTeam: normalizeTeamName(m.home_team) as string,
        awayTeam: normalizeTeamName(m.away_team) as string,
        homeScore: m.home_score,
        awayScore: m.away_score,
        status: (m.status === "completed"
          ? "finished"
          : m.status) as LiveResponseMatch["status"],
        kickoffUtc: m.kickoff_utc,
      }));

    const response: LiveResponse = {
      enabled: true,
      updatedAt: new Date().toISOString(),
      matches,
      syncedCount,
    };

    cacheSet(RESPONSE_CACHE_KEY, response, RESPONSE_CACHE_TTL);
    return NextResponse.json(response, {
      headers: { "Cache-Control": "public, s-maxage=55, stale-while-revalidate=60" },
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("[live] Error:", msg);
    // Responder sin matches — la app usa datos manuales de BD
    return NextResponse.json(
      {
        enabled: true,
        matches: [],
        syncedCount: 0,
        updatedAt: new Date().toISOString(),
        error: "API temporalmente no disponible",
      },
      { headers: { "Cache-Control": "public, s-maxage=30, stale-while-revalidate=60" } }
    );
  }
}
