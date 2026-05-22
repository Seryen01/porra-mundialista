// lib/wc2026.ts
// Cliente para la WC2026 API (https://api.wc2026api.com)
// Auth: Bearer token via WC2026_API_KEY env var

import { cacheGet, cacheSet } from "./cache";

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

interface ApiResponse {
  matches: WC2026Match[];
}

// Inglés → Español: mapeo completo de nombres de equipos WC2026
// Debe coincidir con los nombres que usa el admin en la BD (basados en src/lib/flags.ts)
export const TEAM_NAME_MAP: Record<string, string> = {
  // América del Norte / Central / Caribe
  Mexico: "México",
  Canada: "Canadá",
  "United States": "Estados Unidos",
  USA: "Estados Unidos",
  "United States of America": "Estados Unidos",
  Panama: "Panamá",
  Honduras: "Honduras",
  "Costa Rica": "Costa Rica",
  Haiti: "Haití",
  Jamaica: "Jamaica",
  "Trinidad and Tobago": "Trinidad y Tobago",
  "Trinidad & Tobago": "Trinidad y Tobago",
  "Curaçao": "Curasao",
  Curacao: "Curasao",
  Guatemala: "Guatemala",
  "El Salvador": "El Salvador",
  Nicaragua: "Nicaragua",
  Cuba: "Cuba",
  "Dominican Republic": "República Dominicana",

  // América del Sur
  Brazil: "Brasil",
  Argentina: "Argentina",
  Uruguay: "Uruguay",
  Colombia: "Colombia",
  Ecuador: "Ecuador",
  Paraguay: "Paraguay",
  Peru: "Perú",
  Chile: "Chile",
  Bolivia: "Bolivia",
  Venezuela: "Venezuela",

  // Europa
  Spain: "España",
  Germany: "Alemania",
  France: "Francia",
  Portugal: "Portugal",
  Netherlands: "Países Bajos",
  Holland: "Países Bajos",
  Italy: "Italia",
  Belgium: "Bélgica",
  Croatia: "Croacia",
  England: "Inglaterra",
  Scotland: "Escocia",
  Wales: "Gales",
  Switzerland: "Suiza",
  Austria: "Austria",
  Norway: "Noruega",
  Sweden: "Suecia",
  "Czech Republic": "Chequia",
  Czechia: "Chequia",
  Turkey: "Turquía",
  "Türkiye": "Turquía",
  "Bosnia and Herzegovina": "Bosnia y Herzegovina",
  "Bosnia & Herzegovina": "Bosnia y Herzegovina",
  Denmark: "Dinamarca",
  Serbia: "Serbia",
  Ukraine: "Ucrania",
  Hungary: "Hungría",
  Romania: "Rumanía",
  Slovakia: "Eslovaquia",
  Slovenia: "Eslovenia",
  Albania: "Albania",
  Greece: "Grecia",
  Poland: "Polonia",
  Russia: "Rusia",
  "Republic of Ireland": "República de Irlanda",
  Ireland: "República de Irlanda",
  "Northern Ireland": "Irlanda del Norte",
  Finland: "Finlandia",
  Iceland: "Islandia",

  // África
  Morocco: "Marruecos",
  "South Africa": "Sudáfrica",
  Egypt: "Egipto",
  Senegal: "Senegal",
  Ghana: "Ghana",
  Tunisia: "Túnez",
  "Ivory Coast": "Costa de Marfil",
  "Côte d'Ivoire": "Costa de Marfil",
  "Cote d'Ivoire": "Costa de Marfil",
  Algeria: "Argelia",
  "DR Congo": "RD Congo",
  "Congo DR": "RD Congo",
  "DRC Congo": "RD Congo",
  "Cape Verde": "Cabo Verde",
  Mali: "Malí",
  Cameroon: "Camerún",
  Nigeria: "Nigeria",
  Zambia: "Zambia",
  Uganda: "Uganda",
  Kenya: "Kenia",

  // Asia
  Japan: "Japón",
  "South Korea": "República de Corea",
  "Korea Republic": "República de Corea",
  "Korea, Republic of": "República de Corea",
  "Saudi Arabia": "Arabia Saudí",
  Iran: "Irán",
  Iraq: "Irak",
  Jordan: "Jordania",
  Qatar: "Catar",
  Uzbekistan: "Uzbekistán",
  China: "China",
  Indonesia: "Indonesia",
  "United Arab Emirates": "Emiratos Árabes Unidos",
  UAE: "Emiratos Árabes Unidos",
  Bahrain: "Baréin",
  Kuwait: "Kuwait",
  Oman: "Omán",
  Syria: "Siria",

  // Oceanía
  Australia: "Australia",
  "New Zealand": "Nueva Zelanda",
};

// Mapa inverso: Español → Inglés (para buscar en la API)
export const REVERSE_TEAM_MAP: Record<string, string> = {};
for (const [en, es] of Object.entries(TEAM_NAME_MAP)) {
  if (!REVERSE_TEAM_MAP[es]) {
    REVERSE_TEAM_MAP[es] = en;
  }
}

/** Convierte nombre de equipo de la API (inglés) a nombre español (como en nuestra BD) */
export function normalizeTeamName(apiName: string): string {
  return TEAM_NAME_MAP[apiName] ?? apiName;
}

/**
 * Busca en una lista de partidos de BD el que corresponde a los equipos y fecha del partido de la API.
 * Prueba: nombres en español, nombres en inglés y coincidencia case-insensitive.
 */
export function findMatchInList<T extends { teamA: string; teamB: string; date: Date }>(
  dbMatches: T[],
  homeTeamSpanish: string,
  awayTeamSpanish: string,
  homeTeamEn: string,
  awayTeamEn: string,
  kickoff: Date
): T | undefined {
  // Ventana de 5h: cubre partidos con prórroga + tiempo entre kickoff real y el horario de BD
  const TIME_WINDOW_MS = 5 * 60 * 60 * 1000;

  return dbMatches.find((m) => {
    const dateOk = Math.abs(m.date.getTime() - kickoff.getTime()) < TIME_WINDOW_MS;
    if (!dateOk) return false;

    const teamALower = m.teamA.toLowerCase();
    const teamBLower = m.teamB.toLowerCase();
    const homeSpLower = homeTeamSpanish.toLowerCase();
    const awaySpLower = awayTeamSpanish.toLowerCase();
    const homeEnLower = homeTeamEn.toLowerCase();
    const awayEnLower = awayTeamEn.toLowerCase();

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
  awayTeamSpanish: string,
  awayTeamEn: string
): boolean {
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

  const data: ApiResponse = await res.json();
  if (!data.matches || !Array.isArray(data.matches)) {
    throw new Error("[wc2026] Respuesta inesperada de la API");
  }
  return data.matches;
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
