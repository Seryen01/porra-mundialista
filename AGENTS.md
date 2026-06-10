<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

<!-- BEGIN:console-logging-rules -->
# Console logging is mandatory in all new code

Every piece of code you write or modify **must include console logging** wherever it is relevant or necessary. Apply this rule before considering a task complete.

## What always requires a log

- Entry and exit of API routes, Server Actions, and cron jobs — log the key inputs and the outcome.
- All `catch` / error paths — use `console.error('[module] description', error)`.
- External I/O: database queries (Supabase), fetches to third-party APIs — log the operation and its result/status.
- Significant conditional branches (auth checks, permission gates, feature flags) — log which path was taken.
- State mutations that affect multiple components or the data layer.

## Format rule (non-negotiable)

```ts
console.log('[module-name] Human-readable description', { relevantData })
console.error('[module-name] What failed', error)
console.warn('[module-name] Non-fatal issue', { context })
```

- `[module-name]` must match the file or hook name (kebab-case, lowercase).
- Pass objects directly — never `JSON.stringify`.
- Never log secrets, tokens, or passwords; log only their presence (`hasToken: !!token`).

## What does NOT need a log

- Pure React render functions with no side effects.
- Simple getters, trivial helpers, and purely synchronous transformations with no branching.

> For detailed conventions and the `/console-logging` skill (add / audit / strip), see `.claude/commands/console-logging.md`.
<!-- END:console-logging-rules -->
