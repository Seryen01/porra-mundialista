// hooks/useLiveScores.ts
// Polling de live scores — solo cuando la pestaña está visible y hay partidos activos.
// Pollea /api/matches/live (que a su vez sincroniza la BD automáticamente).

import { useState, useEffect, useCallback, useRef } from "react";

export interface LiveMatch {
  homeTeam: string;
  awayTeam: string;
  homeScore: number | null;
  awayScore: number | null;
  status: "scheduled" | "live" | "finished";
  kickoffUtc: string;
}

interface LiveScoresResponse {
  enabled: boolean;
  updatedAt: string;
  matches: LiveMatch[];
  syncedCount: number;
  error?: string;
}

const POLL_INTERVAL_LIVE = 60_000; // 60s cuando hay partido en curso
const POLL_INTERVAL_IDLE = 120_000; // 2min cuando no hay partidos activos

export function useLiveScores(onSync?: () => void) {
  const [liveMatches, setLiveMatches] = useState<LiveMatch[]>([]);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [enabled, setEnabled] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const hasLive = liveMatches.some((m) => m.status === "live");
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const onSyncRef = useRef(onSync);
  onSyncRef.current = onSync;

  const fetchScores = useCallback(async () => {
    if (typeof document !== "undefined" && document.hidden) return;

    try {
      const res = await fetch("/api/matches/live");
      if (!res.ok) return;
      const data: LiveScoresResponse = await res.json();

      setEnabled(data.enabled);
      setLiveMatches(data.matches ?? []);
      setLastUpdated(new Date());
      setApiError(data.error ?? null);

      // Si hubo sync (partido nuevo terminado), notificar al padre para refrescar la BD
      if (data.syncedCount > 0 && onSyncRef.current) {
        onSyncRef.current();
      }
    } catch {
      // Silencioso — la app continúa con datos manuales de la BD
    }
  }, []);

  // Reinicia el interval cuando cambia si hay partidos live o no
  useEffect(() => {
    if (timerRef.current) clearInterval(timerRef.current);

    fetchScores();

    const interval = hasLive ? POLL_INTERVAL_LIVE : POLL_INTERVAL_IDLE;
    timerRef.current = setInterval(fetchScores, interval);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [fetchScores, hasLive]);

  // Reanudar polling al volver a la pestaña
  useEffect(() => {
    const handleVisibility = () => {
      if (!document.hidden) fetchScores();
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, [fetchScores]);

  /** Busca datos live para un partido dado sus equipos. */
  function getLiveDataForMatch(teamA: string, teamB: string): LiveMatch | null {
    const aL = teamA.toLowerCase();
    const bL = teamB.toLowerCase();
    return (
      liveMatches.find(
        (m) =>
          (m.homeTeam.toLowerCase() === aL && m.awayTeam.toLowerCase() === bL) ||
          (m.homeTeam.toLowerCase() === bL && m.awayTeam.toLowerCase() === aL)
      ) ?? null
    );
  }

  return {
    liveMatches,
    hasLive,
    lastUpdated,
    enabled,
    apiError,
    getLiveDataForMatch,
  };
}
