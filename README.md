# Atalaya

Plataforma personal de análisis de mercados: gráficos, indicadores, listas de seguimiento y, más adelante, screener, carteras y alertas.

## Estado

Fase 3a (núcleo del MVP):

- Gráfico de velas, barras, línea y área con ocho temporalidades e histórico que se amplía al retroceder.
- Indicadores: SMA 50 y 200, EMA 20, Bollinger, volumen, RSI 14 y MACD.
- Criptomonedas en tiempo real (Binance, sin clave).
- Acciones, ETF e índices con Twelve Data (requiere clave gratuita; datos diferidos o de cierre).
- Buscador y lista de seguimiento con cotizaciones (guardada en el navegador hasta que haya cuentas de usuario).

## Puesta en marcha

Requiere Node 22 y pnpm.

```bash
pnpm install
cp .env.example .env   # y escribe tu clave de Twelve Data
pnpm dev               # web en http://localhost:5173, servidor en el puerto 4000
```

Modo producción, con un solo proceso que sirve API y web:

```bash
pnpm build
pnpm start             # http://localhost:4000
```

Comprobaciones: `pnpm test` (indicadores) y `pnpm typecheck`.

## Estructura

| Ruta | Contenido |
|---|---|
| `packages/core` | Tipos de dominio y motor de indicadores. Lo comparten servidor y web. |
| `apps/server` | API REST, canal de tiempo real y adaptadores de proveedores de datos. |
| `apps/web` | Aplicación React con el gráfico (Lightweight Charts). |
| `design/prototipo.html` | Maqueta de diseño aprobada, con datos ficticios. |

Para añadir un proveedor de datos, implementa `MarketDataProvider` (`apps/server/src/providers/types.ts`) y regístralo en `apps/server/src/registry.ts`.
Para añadir un indicador, escribe la función en `packages/core/src/indicators` con su prueba y descríbelo en `apps/web/src/indicators.ts`.

## Licencias de terceros

El gráfico usa Lightweight Charts (Apache 2.0), cuya licencia exige mostrar la atribución a TradingView; por eso aparece su logotipo en el gráfico.
