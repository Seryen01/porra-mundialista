// tests/setup.ts
// Variables de entorno para los tests — nunca toca la BD real ni la API real
process.env.WC2026_API_KEY = 'test_key_fake'
process.env.LIVE_SCORES_ENABLED = 'true'
process.env.CRON_SECRET = 'test_cron_secret'
process.env.NEXTAUTH_SECRET = 'test_nextauth_secret'
process.env.DATABASE_URL = 'postgresql://fake:fake@localhost:5432/fake_test'
// NODE_ENV se deja como 'test' por defecto — los tests de auth que necesiten
// simular producción lo sobreescriben individualmente
