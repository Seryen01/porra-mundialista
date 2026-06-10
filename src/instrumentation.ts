// Ejecutado por Next.js al iniciar el servidor (una sola vez por instancia).
// https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation

export async function register() {
  if (process.env.NODE_ENV === "production") {
    const { validateEnv } = await import("@/lib/env");
    validateEnv();
  }
}
