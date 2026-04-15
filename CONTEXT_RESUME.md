# Socrates — Context Resume

> **Para Claude (al retomar):** Lee este archivo primero. Da el snapshot mínimo necesario para reanudar el trabajo sin re-leer todo.
> **Última actualización:** 2026-04-15 (sprints D1+D2+D6, landing page, deploy Vercel)

## En una línea
Socrates es un tutor doctoral basado en IA. MVP-1 funcional + dashboard de metacognición (SOLO/Toulmin/IBC/convergencia) + notas personales + landing page. Deploy en Vercel. 98 tests, pre-commit 4/4 PASS.

## Estado al 2026-04-15

- Sprints S0-S6 + M1-M5: ✓ MVP-1 completo
- **D20+D21 cerradas** — docs/09_SPRINTS_D20_D21.md
- **D1 completado** — A4 clasifica SOLO+Toulmin por turno, migración 0006, analytics endpoints
- **D2 completado** — Dashboard bloques 1-2-5 (progreso, IBC, convergencia+ZDP)
- **D6 completado** — Notas personales: CRUD + tags + búsqueda + export markdown + QuickNote en sesión
- **Landing page** — pública, estática, 6 ideas fuerza
- Código: ✓ ~90 archivos, 7 migraciones SQL
- Tests: ✓ 98/98 PASS, pre-commit 4/4 PASS
- Repo: ✓ arudloff/tutor-de-estudio, 20 commits en main
- Deploy: ✓ https://tutor-de-estudio.vercel.app
- Curso real: ✓ "TOPICOS DE ECONOMIA (A)" con 25 unidades, 3 mastered

## Stack activo del MVP-1

- Next.js 14 + TypeScript strict + Tailwind CSS
- Supabase (Postgres + RLS + Auth + Storage bucket privado)
- Anthropic Claude Sonnet/Opus (A2, A3, A4, A7, A10, A12)
- Claude Haiku (A1 TOC)
- pdf2json (extracción local de texto PDF, sin API)
- OpenAI Whisper (transcripción de voz)
- OpenAI TTS "nova" (texto a voz natural en español)
- Husky pre-commit hook (4 checks)
- GitHub Actions CI

## Decisiones técnicas tomadas durante la implementación

| Decisión | Razón |
|---|---|
| A1 usa pdf2json local en vez de LLM | LLMs resumen en vez de transcribir |
| A1 usa Haiku para TOC | Rate limit de Sonnet demasiado bajo |
| A4 responde JSON en vez de SSE streaming | SSE se colgaba |
| Voz usa OpenAI TTS "nova" | Web Speech API sonaba mecánica |
| Dictado usa MediaRecorder + Whisper | SpeechRecognition bloqueada en Chrome |
| Delays de 70-90s entre pasos del pipeline | Plan free Anthropic: 30K tokens/min |

## Bugs conocidos / deuda técnica

1. No hay auto-avance entre unidades — requiere F5 manual
2. Sesiones abandonadas dejan unidades en "in_session"
3. 12 unidades en audited_fail por fidelidad insuficiente
4. CSP con unsafe-inline en dev
5. Service role key expuesta en el chat — REGENERAR
6. all_migrations.sql no debería commitearse

## Qué tocar al retomar

1. **Sprint D3** — Dashboard bloques 3-4 (SOLO + Toulmin visual con gráficos). Requiere D1 (ya completado).
2. **Sprint D4** — Lectura Socrática (D20). Prompt A4 expandido, exposición en capas, confrontación textual.
3. **Sprint M6** — Multi-PDF: upload con roles, A2_corpus, A10_corpus, unidades multi-fuente.
4. Tests de integración para API routes (IBC, velocity, ZDP — deuda técnica identificada por auditor)
5. Extraer hooks de voz de session-view.tsx a archivos propios (>950 líneas)

## Cómo retomar

1. Decir "retomo socrates"
2. URL producción: https://tutor-de-estudio.vercel.app
3. URL local: `cd C:\dev\socrates && npm run dev` → http://localhost:3000
4. Login: alejandro@chenriquez.cl
5. Deploy hook: `curl -X POST "https://api.vercel.com/v1/integrations/deploy/prj_Mgp5ZLqOE9EUf9lEstUEbT25RoKd/4sW3asfMrb"`
