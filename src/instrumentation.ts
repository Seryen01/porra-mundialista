// Ejecutado por Next.js al iniciar el servidor (una sola vez por instancia).
// https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation

export async function register() {
  if (process.env.NODE_ENV === "production") {
    try {
      const { validateEnv } = await import("@/lib/env");
      validateEnv();
    } catch (error) {
      console.error("[instrumentation] Startup validation error", error);
      // Do not re-throw — crashing here kills the entire server process.
      // Missing vars will surface as 500s at request time instead.
    }
  }
}
