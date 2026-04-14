# Socrates — Context Resume

> **Para Claude (al retomar):** Lee este archivo primero. Da el snapshot mínimo necesario para reanudar el trabajo sin re-leer todo.
> **Última actualización:** 2026-04-14 (sprints M1-M5 completados, auditoría PASS, deploy en Vercel)

## En una línea
Socrates es un tutor doctoral basado en IA con MVP-1 **funcional y probado por el usuario**. Walking skeleton completo: signup → POA → upload PDF → pipeline 6 agentes → sesión socrática con voz natural. El investigador completó su primera unidad de "Principios de Economía" y reportó: "es muy entretenido estudiar así".

## Estado al 2026-04-14

- Visión: ✓ docs/01
- Principios pedagógicos: ✓ docs/02
- Arquitectura: ✓ 12 agentes, docs/03
- Fase 1 /ingeniería: ✓ docs/05 (D1-D19 cerradas, Ausubel estricto)
- Fase 2 /ingeniería: ✓ docs/06 (Service Blueprint, state machines, SIPOC)
- Fase 3 /ingeniería: ✓ docs/07 (12 historias INVEST, DDL, NFRs)
- **Sprint S0-S6: ✓ TODOS COMPLETOS**
- **MVP-1 funcional y validado por el usuario**
- Código: ✓ ~70 archivos, 6 agentes LLM, 5 migraciones SQL
- Tests: ✓ 35/35 PASS, pre-commit hook activo
- Repo: ✓ arudloff/tutor-de-estudio, 14 commits en main
- Directorio de trabajo: `C:\dev\socrates` (npm install funcional)
- Directorio Google Drive: `G:\Mi unidad\DOCTORADO\Tutor de estudio` (docs, sin node_modules)
- Supabase: ✓ proyecto "socrates" activo con DB + Storage + Auth
- Curso real: ✓ "TOPICOS DE ECONOMIA (A)" con 25 unidades, 13 disponibles, 1 dominada

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

1. **Sprint M6 — Multi-PDF** (siguiente): subir N PDFs con roles, A2_corpus cruce inter-textual, sprints temáticos
2. Agregar Ausubel al A9 del cluster doctoral
3. Tests de integración para flujo sesión→diálogo→acreditación (defecto M4)
4. Endpoint DELETE /api/auth/account (derecho a eliminación)
5. Extraer hooks de voz de session-view.tsx a archivos propios (>644 líneas)

## Cómo retomar

1. Decir "retomo socrates"
2. URL producción: https://tutor-de-estudio.vercel.app
3. URL local: `cd C:\dev\socrates && npm run dev` → http://localhost:3000
4. Login: alejandro@chenriquez.cl
5. Deploy hook: `curl -X POST "https://api.vercel.com/v1/integrations/deploy/prj_Mgp5ZLqOE9EUf9lEstUEbT25RoKd/4sW3asfMrb"`
