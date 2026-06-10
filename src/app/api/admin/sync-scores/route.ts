// app/api/admin/sync-scores/route.ts
// Endpoint de administración para sincronizar:
//   1. Resultados de partidos terminados (via WC2026 API o lógica temporal)
//   2. Equipos de partidos eliminatorios cuando la API los revele (a partir del 26 junio)
//
// Llamado manualmente desde el panel de Admin o por el cron auto-finish.
// Protegido: requiere x-cron-secret en producción.

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
const KNOCKOUT_PHASES = ["Dieciseisavos", "Octavos", "Cuartos", "Semis", "Final", "Tercer y cuarto puesto"];

// ─── Función 1: Sync de resultados (partidos terminados) ──────────────────────

async function syncMatchResults(): Promise<{ updated: number; errors: number; logs: string[] }> {
  let updated = 0;
  let errors = 0;
  const logs: string[] = [];

  try {
    const apiMatches = await getWC2026Matches();
    cacheDelete("live_endpoint_response");

    const dbMatches = await prisma.match.findMany({
      where: { status: { not: "FINISHED" } },
    });

    for (const apiMatch of apiMatches) {
      if (!apiMatch.home_team || !apiMatch.away_team) continue; // TBD

      const homeTeamEs = normalizeTeamName(apiMatch.home_team);
      const awayTeamEs = normalizeTeamName(apiMatch.away_team);
      const kickoff = new Date(apiMatch.kickoff_utc);

      // Primary: match by matchNumber (stable identifier, independent of date/name)
      // Fallback: match by team names + date window (for records without matchNumber)
      let dbMatch = dbMatches.find((m) => m.matchNumber != null && m.matchNumber === apiMatch.match_number);
      if (!dbMatch) {
        dbMatch = findMatchInList(
          dbMatches,
          homeTeamEs,
          awayTeamEs,
          apiMatch.home_team,
          apiMatch.away_team,
          kickoff
        );
      }
      if (!dbMatch) continue;

      if (apiMatch.status === "live" && dbMatch.status === "UPCOMING") {
        await prisma.match.update({
          where: { id: dbMatch.id },
          data: { status: "LIVE" },
        });
        updated++;
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
          updated++;
          logs.push(`→ FINISHED: ${dbMatch.teamA} ${scoreA}-${scoreB} ${dbMatch.teamB}`);
        }
      }
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[sync-scores] Error en syncMatchResults:", msg);
    errors++;
    logs.push(`Error results: ${msg}`);
  }

  return { updated, errors, logs };
}

// ─── Función 2: Sync de equipos eliminatorios ─────────────────────────────────

async function syncKnockoutTeams(): Promise<{ updated: number; errors: number; logs: string[] }> {
  let updated = 0;
  let errors = 0;
  const logs: string[] = [];

  try {
    // Partidos eliminatorios que la API ya tiene con equipos reales
    const apiKnockouts = await getKnockoutMatchesWithTeams();

    if (apiKnockouts.length === 0) {
      // Normal hasta el 26 de junio — los cruces no se conocen aún
      return { updated: 0, errors: 0, logs: [] };
    }

    // Partidos eliminatorios en BD con matchNumber asignado
    const dbKnockouts = await prisma.match.findMany({
      where: {
        phase: { in: KNOCKOUT_PHASES },
        matchNumber: { not: null },
      },
    });

    if (dbKnockouts.length === 0) return { updated: 0, errors: 0, logs: [] };

    console.log(
      `[sync-knockout-teams] API: ${apiKnockouts.length} con equipos | BD: ${dbKnockouts.length} eliminatorios`
    );

    for (const apiMatch of apiKnockouts) {
      // Emparejar por matchNumber — la clave estable que no depende del nombre del equipo
      const dbMatch = dbKnockouts.find((m) => m.matchNumber === apiMatch.match_number);
      if (!dbMatch) continue;

      const homeTeamEs = normalizeTeamName(apiMatch.home_team);
      const awayTeamEs = normalizeTeamName(apiMatch.away_team);
      if (!homeTeamEs || !awayTeamEs) continue;

      // Si ya tiene los equipos correctos → no hace falta actualizar (idempotente)
      if (dbMatch.teamA === homeTeamEs && dbMatch.teamB === awayTeamEs) continue;

      // Si tiene los equipos en orden inverso también está bien → no actualizar
      if (dbMatch.teamA === awayTeamEs && dbMatch.teamB === homeTeamEs) continue;

      try {
        await prisma.match.update({
          where: { id: dbMatch.id },
          data: {
            teamA: homeTeamEs,
            teamB: awayTeamEs,
            // status y scores no se tocan — el partido aún no ha empezado
          },
        });

        console.log(
          `[sync-knockout-teams] ✓ Partido #${apiMatch.match_number}: ${homeTeamEs} vs ${awayTeamEs}`
        );
        logs.push(`→ Equipo knockout #${apiMatch.match_number}: ${homeTeamEs} vs ${awayTeamEs}`);
        updated++;
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        console.error(`[sync-knockout-teams] ✗ Error en partido #${apiMatch.match_number}:`, msg);
        logs.push(`Error knockout #${apiMatch.match_number}: ${msg}`);
        errors++;
      }
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[sync-knockout-teams] Error general:", msg);
    logs.push(`Error knockout general: ${msg}`);
    errors++;
  }

  return { updated, errors, logs };
}

// ─── Handler POST ─────────────────────────────────────────────────────────────

export async function POST(req: Request) {
  // En producción CRON_SECRET es obligatorio — si no está configurado, fallo explícito
  if (process.env.NODE_ENV === "production") {
    const cronSecret = process.env.CRON_SECRET;
    if (!cronSecret) {
      console.error("[sync-scores] CRON_SECRET no configurado en producción");
      return NextResponse.json({ error: "Server misconfiguration" }, { status: 500 });
    }
    const secret = req.headers.get("x-cron-secret") ?? req.headers.get("authorization")?.replace("Bearer ", "");
    if (secret !== cronSecret) {
      console.warn("[sync-scores] Intento de acceso no autorizado", { hasSecret: !!secret });
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const apiEnabled =
    process.env.LIVE_SCORES_ENABLED === "true" && !!process.env.WC2026_API_KEY;

  if (!apiEnabled) {
    return NextResponse.json({
      success: false,
      error: "LIVE_SCORES_ENABLED o WC2026_API_KEY no configuradas",
    });
  }

  // Ejecutar ambos syncs en paralelo
  const [resultsSync, knockoutSync] = await Promise.all([
    syncMatchResults(),
    syncKnockoutTeams(),
  ]);

  return NextResponse.json({
    success: true,
    timestamp: new Date().toISOString(),
    // Sync de resultados
    updated: resultsSync.updated,
    errors: resultsSync.errors,
    logs: resultsSync.logs,
    // Sync de equipos eliminatorios
    knockoutTeamsUpdated: knockoutSync.updated,
    knockoutTeamsErrors: knockoutSync.errors,
    knockoutLogs: knockoutSync.logs,
  });
}

// GET también disponible para facilitar pruebas desde navegador/curl
export async function GET(req: Request) {
  return POST(req);
}
