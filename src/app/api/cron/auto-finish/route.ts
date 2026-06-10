// app/api/cron/auto-finish/route.ts
// Llamado por Vercel Cron (o manualmente desde el botón "Scheduler" del Admin).
// Sincroniza el estado de los partidos con la WC2026 API.
// Si la API no está disponible, aplica lógica temporal de respaldo.

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { calculatePoints } from "@/lib/scoring";
import {
  getWC2026Matches,
  getKnockoutMatchesWithTeams,
  normalizeTeamName,
  findMatchInList,
  isMatchReversed,
} from "@/lib/wc2026";
import { cacheDelete } from "@/lib/cache";

// Fases eliminatorias tal como están en la BD
const KNOCKOUT_PHASES = ["Dieciseisavos", "Octavos", "Cuartos", "Semis", "Final"];

/** Sincroniza los equipos de los partidos eliminatorios cuando la API los revela */
async function syncKnockoutTeams(): Promise<number> {
  try {
    const apiKnockouts = await getKnockoutMatchesWithTeams();
    if (apiKnockouts.length === 0) return 0; // Aún sin cruces definidos

    const dbKnockouts = await prisma.match.findMany({
      where: { phase: { in: KNOCKOUT_PHASES }, matchNumber: { not: null } },
    });
    if (dbKnockouts.length === 0) return 0;

    let updated = 0;
    for (const apiMatch of apiKnockouts) {
      const dbMatch = dbKnockouts.find((m) => m.matchNumber === apiMatch.match_number);
      if (!dbMatch) continue;

      const homeTeamEs = normalizeTeamName(apiMatch.home_team);
      const awayTeamEs = normalizeTeamName(apiMatch.away_team);
      if (!homeTeamEs || !awayTeamEs) continue;

      // Idempotente: saltar si ya tiene los equipos correctos (en cualquier orden)
      if (
        (dbMatch.teamA === homeTeamEs && dbMatch.teamB === awayTeamEs) ||
        (dbMatch.teamA === awayTeamEs && dbMatch.teamB === homeTeamEs)
      )
        continue;

      await prisma.match.update({
        where: { id: dbMatch.id },
        data: { teamA: homeTeamEs, teamB: awayTeamEs },
      });
      console.log(`[cron-knockout] ✓ #${apiMatch.match_number}: ${homeTeamEs} vs ${awayTeamEs}`);
      updated++;
    }
    return updated;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[cron-knockout] Error:", msg);
    return 0;
  }
}

export async function GET(req: Request) {
  // En producción CRON_SECRET es obligatorio — si no está configurado, fallo explícito
  if (process.env.NODE_ENV === "production") {
    const cronSecret = process.env.CRON_SECRET;
    if (!cronSecret) {
      console.error("[cron-auto-finish] CRON_SECRET no configurado en producción");
      return NextResponse.json({ error: "Server misconfiguration" }, { status: 500 });
    }
    const authHeader = req.headers.get("authorization");
    if (authHeader !== `Bearer ${cronSecret}`) {
      console.warn("[cron-auto-finish] Intento de acceso no autorizado", { authHeader: !!authHeader });
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const now = new Date();
  let changedCount = 0;
  let syncedFromApi = false;
  let knockoutTeamsUpdated = 0;
  const logs: string[] = [];

  // ═══════════════════════════════════════════════════════
  // ESTRATEGIA 1: WC2026 API (fuente de verdad)
  // ═══════════════════════════════════════════════════════
  const apiEnabled =
    process.env.LIVE_SCORES_ENABLED === "true" && !!process.env.WC2026_API_KEY;

  if (apiEnabled) {
    try {
      const apiMatches = await getWC2026Matches();

      // Forzar refresco del caché del endpoint /matches/live para que los usuarios
      // vean los cambios en el siguiente poll sin esperar los 60s de caché
      cacheDelete("live_endpoint_response");

      const dbMatches = await prisma.match.findMany({
        where: { status: { not: "FINISHED" } },
      });

      for (const apiMatch of apiMatches) {
        // Saltar partidos TBD (equipos aún no determinados en fases eliminatorias)
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

        if (apiMatch.status === "live" && dbMatch.status === "UPCOMING") {
          await prisma.match.update({
            where: { id: dbMatch.id },
            data: { status: "LIVE" },
          });
          changedCount++;
          logs.push(`→ LIVE: ${dbMatch.teamA} vs ${dbMatch.teamB}`);
        } else if (
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
            changedCount++;
            logs.push(
              `→ FINISHED: ${dbMatch.teamA} ${scoreA}-${scoreB} ${dbMatch.teamB} (puntos calculados)`
            );
          }
        }
      }

      // Sincronizar equipos de fases eliminatorias cuando la API los revele
      knockoutTeamsUpdated = await syncKnockoutTeams();
      if (knockoutTeamsUpdated > 0) {
        logs.push(`[knockout] ${knockoutTeamsUpdated} partido(s) con equipos actualizados`);
        changedCount += knockoutTeamsUpdated;
      }

      syncedFromApi = true;
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      console.error("[cron] WC2026 API no disponible, usando lógica temporal:", msg);
      logs.push(`API no disponible: ${msg}`);
    }
  }

  // ═══════════════════════════════════════════════════════
  // ESTRATEGIA 2: Lógica temporal de respaldo
  // Se usa si la API no está configurada o si falló
  // ═══════════════════════════════════════════════════════
  if (!syncedFromApi) {
    const activeMatches = await prisma.match.findMany({
      where: { status: { in: ["UPCOMING", "LIVE"] } },
    });

    for (const match of activeMatches) {
      const isGroupStage = match.phase.toLowerCase().includes("grupo");
      const durationMinutes = isGroupStage ? 100 : 150;
      const finishTime = new Date(match.date.getTime() + durationMinutes * 60000);

      if (match.status === "UPCOMING" && now >= match.date) {
        await prisma.match.update({
          where: { id: match.id },
          data: { status: "LIVE" },
        });
        changedCount++;
        logs.push(`[fallback] → LIVE: ${match.teamA} vs ${match.teamB}`);
      } else if (match.status === "LIVE" && now >= finishTime) {
        // Sin API: pasa a PENDING para validación manual del Admin
        await prisma.match.update({
          where: { id: match.id },
          data: { status: "PENDING" },
        });
        changedCount++;
        logs.push(`[fallback] → PENDING: ${match.teamA} vs ${match.teamB}`);
      }
    }
  }

  return NextResponse.json({
    success: true,
    changedCount,
    syncedFromApi,
    knockoutTeamsUpdated,
    logs,
    timestamp: now.toISOString(),
  });
}
