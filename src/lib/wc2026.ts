// lib/wc2026.ts
// Cliente para la WC2026 API (https://api.wc2026api.com)
// Auth: Bearer token via WC2026_API_KEY env var

import { cacheGet, cacheSet } from "./cache";
import { prisma } from "./prisma";

const BASE_URL = "https://api.wc2026api.com";
const CACHE_TTL = 60; // 60 segundos — máximo 1 llamada/minuto a la API externa

export interface WC2026Match {
  id: number;
  match_number: number;
  round: string; // "group" | "round_of_32" | "round_of_16" | "quarter_final" | "semi_final" | "final"
  group_name: string | null;
  home_team: string;
  away_team: string;
  home_score: number | null;
  away_score: number | null;
  status: "scheduled" | "live" | "finished";
  kickoff_utc: string; // ISO datetime
  stadium: string;
}

// La API devuelve un array directo, no un objeto envoltorio.
// Tipo de respuesta: WC2026Match[] directamente.

// Inglés → Español: mapeo completo de nombres de equipos WC2026
// Basado en los nombres EXACTOS que devuelve la API (verificados contra respuesta real).
export const TEAM_NAME_MAP: Record<string, string> = {
  // ── Nombres exactos que usa la API ──────────────────────────────────────────
  // (comprobados con GET /matches el 2026-05-22)
  Algeria: "Argelia",
  Argentina: "Argentina",
  Australia: "Australia",
  Austria: "Austria",
  Belgium: "Bélgica",
  "Bosnia-Herzegovina": "Bosnia y Herzegovina",  // API usa guion, no "and"
  Brazil: "Brasil",
  "Cabo Verde": "Cabo Verde",                    // API usa "Cabo Verde" (igual en español)
  Canada: "Canadá",
  Colombia: "Colombia",
  "Congo DR": "RD Congo",                        // API usa "Congo DR"
  Croatia: "Croacia",
  "Curaçao": "Curasao",
  Czechia: "Chequia",
  "Côte d'Ivoire": "Costa de Marfil",            // API usa acento
  Ecuador: "Ecuador",
  Egypt: "Egipto",
  England: "Inglaterra",
  France: "Francia",
  Germany: "Alemania",
  Ghana: "Ghana",
  Haiti: "Haití",
  "IR Iran": "Irán",                             // API usa "IR Iran"
  Iraq: "Irak",
  Japan: "Japón",
  Jordan: "Jordania",
  "Korea Republic": "República de Corea",
  Mexico: "México",
  Morocco: "Marruecos",
  Netherlands: "Países Bajos",
  "New Zealand": "Nueva Zelanda",
  Norway: "Noruega",
  Panama: "Panamá",
  Paraguay: "Paraguay",
  Portugal: "Portugal",
  Qatar: "Catar",
  "Saudi Arabia": "Arabia Saudí",
  Scotland: "Escocia",
  Senegal: "Senegal",
  "South Africa": "Sudáfrica",
  Spain: "España",
  Sweden: "Suecia",
  Switzerland: "Suiza",
  Tunisia: "Túnez",
  Turkey: "Turquía",
  USA: "Estados Unidos",
  Uruguay: "Uruguay",
  Uzbekistan: "Uzbekistán",

  // ── Aliases / variantes por si la API cambia en fases finales ───────────────
  "United States": "Estados Unidos",
  "United States of America": "Estados Unidos",
  "Bosnia and Herzegovina": "Bosnia y Herzegovina",
  "Bosnia & Herzegovina": "Bosnia y Herzegovina",
  "Cape Verde": "Cabo Verde",
  "Cote d'Ivoire": "Costa de Marfil",
  "Ivory Coast": "Costa de Marfil",
  "DR Congo": "RD Congo",
  "DRC Congo": "RD Congo",
  Iran: "Irán",
  "South Korea": "República de Corea",
  "Korea, Republic of": "República de Corea",
  "Türkiye": "Turquía",
  Holland: "Países Bajos",
  "Czech Republic": "Chequia",
  Curacao: "Curasao",
  Honduras: "Honduras",
  "Costa Rica": "Costa Rica",
  Jamaica: "Jamaica",
  Italy: "Italia",
  "Trinidad and Tobago": "Trinidad y Tobago",
  Denmark: "Dinamarca",
  Serbia: "Serbia",
  Ukraine: "Ucrania",
  Poland: "Polonia",
  Wales: "Gales",
  Mali: "Malí",
  Cameroon: "Camerún",
  Nigeria: "Nigeria",
  China: "China",
  Indonesia: "Indonesia",
};

// Mapa inverso: Español → Inglés (para buscar en la API)
export const REVERSE_TEAM_MAP: Record<string, string> = {};
for (const [en, es] of Object.entries(TEAM_NAME_MAP)) {
  if (!REVERSE_TEAM_MAP[es]) {
    REVERSE_TEAM_MAP[es] = en;
  }
}

/** Convierte nombre de equipo de la API (inglés) a nombre español (como en nuestra BD).
 *  Devuelve null si el nombre es nulo/vacío (partido TBD). */
export function normalizeTeamName(apiName: string | null | undefined): string | null {
  if (!apiName) return null;
  const mapped = TEAM_NAME_MAP[apiName];
  if (!mapped) {
    console.warn("[wc2026] Equipo no mapeado en TEAM_NAME_MAP — añadir alias si aparece en partidos reales", { apiName });
  }
  return mapped ?? apiName;
}

/**
 * Busca en una lista de partidos de BD el que corresponde a los equipos y fecha del partido de la API.
 * Devuelve undefined si algún nombre de equipo es nulo (partido TBD).
 */
export function findMatchInList<T extends { teamA: string; teamB: string; date: Date }>(
  dbMatches: T[],
  homeTeamSpanish: string | null,
  awayTeamSpanish: string | null,
  homeTeamEn: string | null,
  awayTeamEn: string | null,
  kickoff: Date
): T | undefined {
  // Si alguno de los nombres es nulo, el partido es TBD → no se puede hacer match
  if (!homeTeamSpanish || !awayTeamSpanish || !homeTeamEn || !awayTeamEn) return undefined;

  // Ventana de 5h: cubre partidos con prórroga + tiempo entre kickoff real y el horario de BD
  const TIME_WINDOW_MS = 5 * 60 * 60 * 1000;

  const homeSpLower = homeTeamSpanish.toLowerCase();
  const awaySpLower = awayTeamSpanish.toLowerCase();
  const homeEnLower = homeTeamEn.toLowerCase();
  const awayEnLower = awayTeamEn.toLowerCase();

  return dbMatches.find((m) => {
    if (!m.teamA || !m.teamB) return false;
    const dateOk = Math.abs(m.date.getTime() - kickoff.getTime()) < TIME_WINDOW_MS;
    if (!dateOk) return false;

    const teamALower = m.teamA.toLowerCase();
    const teamBLower = m.teamB.toLowerCase();

    return (
      (teamALower === homeSpLower && teamBLower === awaySpLower) ||
      (teamALower === awaySpLower && teamBLower === homeSpLower) ||
      (teamALower === homeEnLower && teamBLower === awayEnLower) ||
      (teamALower === awayEnLower && teamBLower === homeEnLower)
    );
  });
}

/** Determina si los equipos de la BD están en orden inverso respecto a la API (home/away) */
export function isMatchReversed<T extends { teamA: string }>(
  dbMatch: T,
  awayTeamSpanish: string | null,
  awayTeamEn: string | null
): boolean {
  if (!dbMatch.teamA || !awayTeamSpanish || !awayTeamEn) return false;
  const a = dbMatch.teamA.toLowerCase();
  return a === awayTeamSpanish.toLowerCase() || a === awayTeamEn.toLowerCase();
}

// ─── API calls ───────────────────────────────────────────────────────────────

async function fetchAllMatchesFromAPI(): Promise<WC2026Match[]> {
  const apiKey = process.env.WC2026_API_KEY;
  if (!apiKey) throw new Error("[wc2026] WC2026_API_KEY no configurada");

  const res = await fetch(`${BASE_URL}/matches`, {
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(`[wc2026] API error ${res.status}: ${res.statusText}`);
  }

  const data: unknown = await res.json();

  // La API devuelve un array directo (verificado 2026-05-22)
  if (!Array.isArray(data)) {
    throw new Error(`[wc2026] Respuesta inesperada: se esperaba array, recibido ${typeof data}`);
  }

  // Contabilizar la llamada real a la API (no la del caché)
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  prisma.dailyApiUsage
    .upsert({
      where: { date: today },
      create: { date: today, callCount: 1 },
      update: { callCount: { increment: 1 } },
    })
    .then((row) => console.log("[wc2026] API call contabilizada", { date: row.date, callCount: row.callCount }))
    .catch((err) => console.warn("[wc2026] Error registrando uso de API", err));

  return data as WC2026Match[];
}

/** Devuelve todos los partidos del torneo (caché 60s). */
export async function getWC2026Matches(): Promise<WC2026Match[]> {
  const CACHE_KEY = "wc2026_all_matches";
  const cached = cacheGet<WC2026Match[]>(CACHE_KEY);
  if (cached) return cached;

  const matches = await fetchAllMatchesFromAPI();
  cacheSet(CACHE_KEY, matches, CACHE_TTL);
  return matches;
}

/**
 * Devuelve los partidos de fase eliminatoria que la API ya tiene con equipos reales definidos.
 * Útil para actualizar teamA/teamB en la BD cuando los cruces se conocen (a partir del 26 junio).
 * Caché de 5 minutos — los cruces no cambian con frecuencia.
 */
export async function getKnockoutMatchesWithTeams(): Promise<WC2026Match[]> {
  const CACHE_KEY = "knockout_with_teams";
  const cached = cacheGet<WC2026Match[]>(CACHE_KEY);
  if (cached) return cached;

  const all = await getWC2026Matches();

  // Rondas eliminatorias — incluir todos los valores que la API puede usar
  const knockoutRounds = new Set([
    "round_of_32",
    "round_of_16",
    "quarter_final",
    "semi_final",
    "third_place",
    "3rd_place",
    "final",
  ]);

  const result = all.filter((m) => {
    if (!knockoutRounds.has(m.round)) return false;
    // Solo los que ya tienen equipos reales (no TBD ni vacíos)
    const hasHome = m.home_team && m.home_team !== "TBD" && m.home_team !== "";
    const hasAway = m.away_team && m.away_team !== "TBD" && m.away_team !== "";
    return hasHome && hasAway;
  });

  cacheSet(CACHE_KEY, result, 300); // 5 min — los cruces no cambian rápido
  return result;
}

/** Devuelve solo los partidos en curso o recién terminados (últimas 3h). */
export async function getLiveAndRecentMatches(): Promise<WC2026Match[]> {
  const all = await getWC2026Matches();
  const now = Date.now();
  const THREE_HOURS = 3 * 60 * 60 * 1000;

  return all.filter((m) => {
    if (m.status === "live") return true;
    const kickoffMs = new Date(m.kickoff_utc).getTime();
    return m.status === "finished" && now - kickoffMs < THREE_HOURS;
  });
}
