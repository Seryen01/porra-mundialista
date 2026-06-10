// Valida que todas las variables de entorno críticas estén presentes al arrancar.
// Llamado desde src/instrumentation.ts (ejecutado por Next.js al iniciar el servidor).

const REQUIRED_ENV = [
  "DATABASE_URL",
  "NEXTAUTH_SECRET",
  "WC2026_API_KEY",
  "CRON_SECRET",
  "LIVE_SCORES_ENABLED",
] as const;

export function validateEnv(): void {
  const missing = REQUIRED_ENV.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    const msg = `[env] Variables de entorno faltantes en producción: ${missing.join(", ")}`;
    console.error(msg);
    throw new Error(msg);
  }

  console.log("[env] Todas las variables de entorno requeridas están configuradas", {
    hasApiKey: !!process.env.WC2026_API_KEY,
    hasDb: !!process.env.DATABASE_URL,
    liveScoresEnabled: process.env.LIVE_SCORES_ENABLED,
  });
}
