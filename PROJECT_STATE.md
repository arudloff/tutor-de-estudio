# Socrates — Estado actual
> Última actualización: 2026-04-11 (Sprint S0 Bootstrap completo)

## Estado general
Proyecto con **Fases A, B, C de /ingeniería completas** (decisiones + procesos + requisitos) y **Sprint S0 (Bootstrap) completado**. El scaffold ejecutable del MVP-1 está en el repo con Next.js 14 + TypeScript strict + Supabase clients + primera migración SQL con RLS + tests adversariales (env + migraciones) + hooks git pre-commit + CI en GitHub Actions + scripts de auditoría. Listo para avanzar al Sprint S1 (HU-1 + HU-2: auth por whitelist + crear curso).

## Lo que funciona hoy
- **Visión** — completa, documentada en docs/01_VISION.md
- **Fundamentación pedagógica** — completa, los 6 principios derivados del A9, documentados en docs/02_PRINCIPIOS_PEDAGOGICOS.md
- **Anclaje teórico de aprendizaje significativo** — Ausubel estricto (1963/1968) como fundamento del POA. Pendiente agregar al A9 en próximo ciclo de corrección
- **Arquitectura conceptual multi-agente** — esbozada con **12 agentes** (A1-A12) con responsabilidades, modelos sugeridos y flujos, documentado en docs/03_ARQUITECTURA_MULTI_AGENTE.md
- **Vinculación con cluster doctoral** — el A9 sirve como artículo fundacional empírico-teórico
- **Estrategia formal (Fase 1 de /ingeniería)** — COMPLETA, documentada en docs/05_ESTRATEGIA.md secciones 1-12. Incluye JTBD canónico, Value Proposition Canvas, Impact Map, Kano, MoSCoW del MVP-1, **14 decisiones técnicas cerradas** (D1, D2, D4 revisada, D5, D6, D11, D12, D13, **D14, D15, D16, D17, D18, D19**), regla de integración con SILA, y sección 11 completa sobre POA, curaduría conversada y sprints
- **Arquitectura multi-agente con know-how de SILA internalizado** — A2 y A3 documentados con sus prompts operacionales en docs/03
- **Agente A10 separado como Verificador de cobertura del 100% del PDF** (regla IV&V, separación de roles obligatoria)
- **Agente A11 Curador de corpus** — modo libro y conversación de curaduría (D15). Activo desde MVP-2
- **Agente A12 Entrevistador de objetivos** — captura del POA (D17, D18). **Activo desde MVP-1**
- **Multi-PDF como capacidad arquitectónica first-class** desde el modelo de datos (D13), con los 4 tipos de unidades (mono-fuente, multi-fuente convergente, multi-fuente en tensión, de integración)
- **POA propagado al A3 y al A4** (D19) — A3 calibra rúbrica, fallo productivo y tarea generativa al objetivo del aprendiz; A4 calibra tono, énfasis y criterio de acreditación
- **5 roles explícitos de PDFs en el corpus** (D14) — principal/equivalente/complementario/referencial/contrapunto, con flujo híbrido de asignación
- **Sprints de aprendizaje como concepto de primera clase** (D16) — modelo de datos en MVP-1, UI en MVP-1.5/MVP-2

## Lo que NO existe todavía (después de S0)
- Proyecto Supabase real aprovisionado (el código está listo para conectarse cuando haya credenciales reales)
- Lógica de negocio (empieza en S1)
- UI más allá del scaffold (página index placeholder)
- Flujos de jobs largos (Trigger.dev / Inngest) — decisión y código en S3
- Endpoints de API (empiezan en S1 con /api/auth/signup)
- Agentes LLM implementados (A1 en S3, A2+A10 en S3, A3+A7 en S4, A4 en S5, A12 en S2)
- CI corriendo en GitHub (se activa al primer push con el workflow)

## Último hito completado
**2026-04-11 (tarde) — Sprint S0 Bootstrap completo**
- Qué se hizo: scaffold ejecutable del MVP-1 creado en el mismo directorio del repo tutor-de-estudio. Next.js 14 con App Router + TypeScript strict con `noUncheckedIndexedAccess` + Tailwind CSS + CSP headers. `lib/env.ts` con validación Zod de fail-fast al startup. `lib/supabase/` con 3 clients separados (browser, server, admin). Primera migración SQL `0001_init.sql` con `invited_users` (RLS bloqueante) + `course` (RLS con 4 policies + state machine CHECK + trigger updated_at). Tests adversariales con Vitest: 6 tests para `lib/env.ts` (incluyendo bypass tentativos) + 10 tests estáticos para la migración (verificando RLS, ON DELETE CASCADE, no-USING-true, etc.). Scripts `audit-secrets.mjs` y `audit-rls.mjs` que el pre-commit hook y CI ejecutan. Hook husky pre-commit bloqueante con los 4 checks (secrets + RLS + typecheck + tests). CI en `.github/workflows/ci.yml` con 3 jobs (audit estático, typecheck+tests, npm audit high/critical). README completamente reescrito con stack, setup, scripts y roadmap de sprints.
- Decisiones clave tomadas durante S0:
  - Modelo de Claude fijado en env: `claude-opus-4-6` y `claude-sonnet-4-6` (versionados, no "latest")
  - TypeScript con flags estrictos adicionales: `noUncheckedIndexedAccess`, `noImplicitOverride`
  - CSP restrictiva por default (solo self + supabase + anthropic + openai)
  - Bucket privado de PDFs desde día uno (sin acceso público)
  - 3 clients de Supabase separados con enforcement estructural: `admin.ts` lanza error si se importa en el navegador
- Archivos creados (24 archivos nuevos):
  - `package.json`, `tsconfig.json`, `next.config.mjs`, `tailwind.config.ts`, `postcss.config.mjs`, `vitest.config.ts`, `.env.example`, `next-env.d.ts`
  - `app/layout.tsx`, `app/page.tsx`, `app/globals.css`
  - `lib/env.ts`, `lib/supabase/client.ts`, `lib/supabase/server.ts`, `lib/supabase/admin.ts`, `lib/db/types.ts`, `lib/db/migrations/0001_init.sql`
  - `scripts/audit-secrets.mjs`, `scripts/audit-rls.mjs`, `scripts/db-migrate.mjs`
  - `tests/setup.ts`, `tests/env.test.ts`, `tests/migrations.test.ts`
  - `.husky/pre-commit`, `.github/workflows/ci.yml`
  - `README.md` (reescrito)
- Checks estáticos ejecutados: `audit-secrets.mjs` PASS (0 secretos en 18 archivos), `audit-rls.mjs` PASS (1/1 tabla con datos de usuario tiene RLS)
- **Estado:** listo para Sprint S1 (HU-1 sign-up por whitelist + HU-2 crear curso)

**2026-04-11 — Cierre de D14-D19 y completitud de Fase 1 de /ingeniería**
- Qué se hizo: el investigador confirmó las 6 decisiones propuestas D14-D19 que quedaron pendientes al cierre del 2026-04-10 ("acojo tus sugerencias"). Resolución de la pregunta conceptual abierta sobre Ausubel: **Ausubel estricto** (las 3 condiciones del aprendizaje significativo). Propagación completa a docs/03 (arquitectura ampliada con A11 y A12 + secciones nuevas sobre roles de PDFs, modo libro, propagación del POA y sprints), docs/04 (registro de cierre), docs/05 (sección 11 nueva con POA, curaduría conversada y sprints), docs/99 (marcado como CERRADO).
- Decisiones cerradas en este hito:
  - **D14** — Roles explícitos de PDFs (5 roles + flujo híbrido)
  - **D15** — Modo libro y curaduría conversada (3 modos por tamaño + A11 nuevo + 3 niveles núcleo/rápida/referencial)
  - **D16** — Sprints de aprendizaje first-class (modelo de datos en MVP-1, 2 estrategias capas/bloques, UI en MVP-1.5/MVP-2)
  - **D17** — POA con anclaje en Ausubel estricto (3 componentes + 13 campos)
  - **D18** — A12 Entrevistador de objetivos como agente nuevo (separado del A11, activo desde MVP-1)
  - **D19** — Propagación del POA al A3 (diseño) y al A4 (runtime)
- Cambios en MVP-1 derivados:
  - 6 agentes activos en lugar de 5 (A1, A2, A3, A4, A7, A10) **+ A12 Entrevistador**
  - Primer paso del onboarding cambia: A12 captura POA antes de subir PDFs
  - Modelo de datos del MVP-1 incluye `learner_objective_profile`, `pdf_role`, `sprint`, `chapter_curation` (estos 3 últimos latentes)
  - Costo proyectado del MVP-1: < $10.50/curso (POA agrega ~5%)
- Tarea pendiente para el cluster doctoral (NO bloquea Socrates): agregar Ausubel 1963/1968 como referencia teórica al A9 en próximo ciclo de corrección
- **Estado:** Fase 1 de /ingeniería COMPLETA. Listo para Fase 2 (Procesos) en docs/06_PROCESOS.md

**2026-04-10 — Auditoría y publicación del A9 en cluster doctoral**
- Qué se hizo: producción del artículo A9 ("El tutor que no genera deuda") como pieza fundamental del cluster *Coexistir con lo que nos excede*. Auditoría /dr completa con cuatro agentes independientes (humanizer, critic, devil's advocate, verificador). Aplicación de 8 correcciones post-auditoría. Quality gate: BORRADOR PASS sólido.
- Archivos generados en esta fase:
  - `G:\Mi unidad\DOCTORADO\Organizaciones Hibridadas\Cluster de Investigación_publicación\A9_Tutor_Sin_Deuda.docx`
  - `gen_A9.js`, `A9_tabla_verificacion_citas.md`, `A9_Tutor_Sin_Deuda.yunque-dr.json`

## Próximos pasos sugeridos (en orden estricto)
1. ✅ Fase 2 de /ingeniería — COMPLETA en `docs/06_PROCESOS.md`
2. ✅ Fase 3 de /ingeniería — COMPLETA en `docs/07_REQUISITOS.md`
3. ✅ Sprint S0 (Bootstrap) — COMPLETO
4. **Sprint S1 (Auth + crear curso)** — Siguiente. Implementa HU-1 (sign-up por whitelist con AC-1.1 a 1.4) y HU-2 (crear curso con AC-2.1 a 2.3). Requiere proyecto Supabase real + primer aprovisionamiento (migración aplicada + primer email en whitelist). Termina con auditoría YUNQUE Nivel 2 por agente separado + QA Report.
5. **Sprint S2 (A12 + POA + state machine)** — HU-3 (A12 conduce entrevista), HU-4 (POA bloquea sin PDFs)
6. **Sprint S3 (Upload + A1 + A2 + A10)** — HU-5, HU-6. Primer agente LLM real (A1 con GPT-4o) + A2 + loop A2↔A10
7. **Sprint S4 (A3 con POA + A7)** — HU-7. Primer A3 calibrado contra POA real
8. **Sprint S5 (Sesión socrática completa)** — HU-8 a HU-11. El corazón del producto: fallo productivo + diálogo A4 con POA + acreditación trazable
9. **Sprint S6 (Dashboard + hardening)** — HU-12. Cierre del MVP-1, auditoría YUNQUE completa final, lighthouse, a11y
10. **Tarea de cluster doctoral (paralela, NO bloquea Socrates):** agregar Ausubel 1963/1968 como referencia teórica al A9 en el próximo ciclo de corrección del artículo

## Deuda técnica conocida
- **CSP con `'unsafe-inline'` en script-src y style-src** — severidad baja. Razón: Next 14 requiere inline scripts para hydration inicial y Tailwind inyecta estilos inline. Plan: reemplazar por nonces dinámicos en S6 (hardening). Ubicación: `next.config.mjs` sección headers.
- **Tests dinámicos de RLS contra Postgres real ausentes** — severidad media. En S0 solo tenemos checks estáticos sobre SQL (`audit-rls.mjs` + `tests/migrations.test.ts`). Los tests dinámicos adversariales (intentar leer datos de otro usuario con JWT forjado) se agregan en S1 cuando haya Postgres efímero en CI.
- **`scripts/db-migrate.mjs` es stub** — severidad baja. En S0 solo lista migraciones sin ejecutarlas. Implementación completa en S1 con conexión real a Supabase.
- **CI no se ha activado todavía** — severidad baja. El workflow `.github/workflows/ci.yml` existe pero no se ha ejecutado porque el primer push tras S0 aún no ocurrió.
- **ADR-001 (`.audit-queue/` + hook pre-push)** — diferido del BoK. No bloquea S0 pero conviene agregarlo en S1 o S2.

## Riesgos identificados
- **Calidad del chunking semántico** — si las "unidades de sentido" son malas, todo el pipeline falla. Severidad: alta. Mitigación: el agente A2 (Analista) debe usar Claude Opus y debe haber un agente A7 (Auditor) que verifique la calidad de las unidades antes de pasarlas al diseñador.
- **Costo de API por sesión** — cada evaluación de respuesta abierta = llamada a LLM. Severidad: media. Mitigación: arquitectura híbrida con pre-generación de contenido + LLM solo en evaluación adaptativa.
- **La trampa del "sí entendí"** — el estudiante puede engañarse o engañar al sistema. Severidad: alta. Mitigación: diálogo socrático estructurado por expectativa-misconception (Graesser/AutoTutor), nunca confiar solo en autoreporte.
- **PPTs como fuente** — poco texto, mucho visual, frases sueltas sin contexto. Severidad: media. Mitigación: usar GPT-4o para extracción multimodal.
- **Generalización doctoral no demostrada** — el A9 reconoce que la transferencia de los 6 principios al contexto doctoral es plausible pero no demostrada empíricamente. Severidad: alta para validación, baja para construcción del MVP. Mitigación: el propio uso del MVP por el investigador será evidencia inicial.

## Cómo retomar
1. Leer este archivo (PROJECT_STATE.md)
2. Leer CONTEXT_RESUME.md para el snapshot de los próximos pasos inmediatos
3. Revisar docs/04_DECISIONES_ABIERTAS.md para entender qué decisiones quedaron pendientes
4. Si vuelves después de semanas: leer también el A9 del cluster, que es el ancla teórica
5. Para retomar la conversación con Claude: decir "retomo socrates" o "retomo tutor-de-estudio" — BITÁCORA cargará el contexto

## Arquitectura (C4 Level 1 — propuesta)

```
              ┌─────────────────────────────────┐
              │   Aprendiz doctoral             │
              │   (estudiante o investigador)   │
              └──────────────┬──────────────────┘
                             │
                             ▼
              ┌─────────────────────────────────┐
              │   Socrates PWA (Next.js)        │
              │   Mobile-first, offline-capable │
              └──────────────┬──────────────────┘
                             │ HTTPS
                             ▼
              ┌─────────────────────────────────┐
              │   Backend (Supabase)            │
              │   Auth + DB + Storage           │
              └──────────────┬──────────────────┘
                             │ Webhooks
                             ▼
              ┌─────────────────────────────────┐
              │   Orquestador (n8n)             │
              │   Coordina los 8 agentes        │
              └──────────────┬──────────────────┘
                             │ APIs
              ┌──────────────┼──────────────┐
              ▼              ▼              ▼
        ┌─────────┐    ┌─────────┐   ┌─────────┐
        │ Claude  │    │ GPT-4o  │   │ Otros   │
        │ Opus    │    │         │   │ (img,   │
        │ Sonnet  │    │         │   │  voz)   │
        └─────────┘    └─────────┘   └─────────┘
```

## Decisiones arquitectónicas registradas

| Fecha | Decisión | Contexto | Alternativas descartadas |
|---|---|---|---|
| 2026-04-10 | Codename Socrates | Necesidad de un nombre interno corto | Goteo (descartado por sonar comercial), Aprendiz (genérico) |
| 2026-04-10 | Multi-agente con n8n | Diferentes tareas requieren diferentes modelos; n8n permite orquestación visual | Agente único monolítico (descartado: GPT-4o no es óptimo para todo); LangChain/LangGraph (descartado: menos visual, mayor curva para no-developer) |
| 2026-04-10 | Stack: Next.js PWA + Supabase | Mobile-first, ya conocido por el investigador, rápido de montar | Native iOS/Android (descartado: aplazado a fase 2); CLI (descartado: no llega al estudiante en su día) |
| 2026-04-10 | MVP con un solo modo (examen) | Reducir variables para validar el pipeline antes de generalizar | MVP con los 3 modos (descartado: complejidad innecesaria) |
| 2026-04-10 | Diálogo socrático estructurado por expectativa-misconception | Evidencia AutoTutor: d=0.81, mejor que socrático abierto | Socrático abierto (descartado: difícil de cerrar, ineficiente); quizz tradicional (descartado: ilusión de saber) |
| 2026-04-10 | D1 — Inteligencia híbrida | Pre-gen reduce costo recurrente; runtime LLM se reserva para lo único impredecible (respuesta del aprendiz) | Pre-gen total (descartado: cero adaptabilidad); Runtime total (descartado: costo proporcional al uso) |
| 2026-04-10 | D2 — Sin n8n; Next.js routes + Trigger.dev/Inngest | Elimina infra a mantener, mejor privacidad, menor superficie operacional | Self-host n8n (descartado: el investigador no es DevOps); n8n cloud (descartado: textos académicos pasarían por terceros) |
| 2026-04-10 | D4 — Desktop-first norma metodológica + mobile complemento | Trabajo doctoral profundo (subir, leer, dialogar, producir Tier 2-3) requiere desktop. Mobile es para micro-dosis | Mobile-first puro (descartado: sacrificaría profundidad por ubicuidad — lo opuesto a lo que Socrates protege) |
| 2026-04-10 | D5 — Supabase todo en uno + RLS día uno | Velocidad de implementación + RLS robusto para multi-tenancy | Backend custom (descartado: más código sin valor proporcional); Auth separado tipo Clerk (descartado: complejidad sin justificación en MVP-1) |
| 2026-04-10 | D6 — Multi-usuario controlado desde día uno | Agregar multi-usuario después de single-user es más caro que diseñarlo bien desde el inicio | Solo personal (descartado: bloquea validación con estudiantes); Producto comercial (descartado: distrae del cluster doctoral) |
| 2026-04-10 | D11 — MVP-1 con 5 agentes (A1, A2, A3, A4, A7), P1-P3 cubiertos, Bloom L1-L3, modo único | Recorte mínimo viable que cubre los principios fundacionales y permite validar el pipeline completo | MVP grande con todos los principios (descartado: demasiadas variables que validar a la vez) |
| 2026-04-10 | D12 — SILA es ancestro metodológico de Socrates, no componente runtime | Una sola pasada del PDF, sin doble costo, sin acoplamiento operacional, preserva la naturaleza socrática | Importar artefactos SILA en runtime (descartado: doble procesamiento, acoplamiento, riesgo de divergencia entre dos pipelines); Reemplazar SILA con Socrates (descartado: SILA sigue siendo válido para lectura individual fuera de cursos) |
| 2026-04-10 | A10 nuevo agente — Verificador de cobertura del 100% del PDF | Separación de roles obligatoria (IV&V): el A2 no puede auditar su propio output. El A10 verifica que ningún pasaje sustantivo del PDF quede sin asignar a una unidad | Auto-auditoría del A2 (descartada: anti-patrón del estándar de desarrollo); Mezclar con A7 (descartado: dilución de foco adversarial) |
| 2026-04-10 | D13 — Multi-PDF como capacidad arquitectónica | Un curso doctoral real tiene 5-15 PDFs, no uno; las relaciones inter-texto son el aporte central del cluster doctoral. Multi-PDF debe ser first-class desde el inicio del modelo de datos | MVP-1 con un solo PDF y reescribir esquema después (descartado: refactor caro y la auditoría del A9 demostró el riesgo de acumular deuda de diseño) |
| 2026-04-11 | D14 — 5 roles explícitos de PDFs (principal/equivalente/complementario/referencial/contrapunto) | Sin roles, el A2_corpus trata todo como equivalente y pierde la curaduría del investigador. Los roles permiten al A10 saber dónde exigir cobertura 100% y dónde no | Asignación automática (descartada: sustituye criterio del aprendiz por modelo); sin roles (descartada: pérdida de información metodológica) |
| 2026-04-11 | D15 — Modo libro con A11 nuevo | Procesar libros completos con A2 + A10 cobertura 100% es ineficiente y pedagógicamente inadecuado. La curaduría conversada respeta la heterogeneidad real de un libro académico | Procesar libro completo (descartado: costo y desperdicio); fragmentar automáticamente sin conversación (descartado: pierde voz del aprendiz) |
| 2026-04-11 | D16 — Sprints first-class desde el modelo de datos | Refactorizar después es caro y la auditoría del A9 demostró el riesgo de acumular deuda de diseño temprana | Agregar sprints como agrupación posterior (descartado: refactor caro) |
| 2026-04-11 | D17 — POA con anclaje en Ausubel estricto | Sin información sobre el aprendiz y su objetivo, el A3 diseña en el vacío y Socrates degrada a wrapper de ChatGPT con técnicas pedagógicas encima | Sentido amplio de "aprendizaje significativo" (descartado: sin anclaje teórico defendible); sin POA (descartado: incompatible con principio de Ausubel) |
| 2026-04-11 | D18 — A12 separado del A11 | Dos conversaciones cognitivamente distintas (A12 sobre el aprendiz, A11 sobre los textos). Mezclar diluye ambos | Colapsar A11 y A12 en un Curador único (descartado: confunde conversaciones distintas) |
| 2026-04-11 | D19 — POA propagado a A3 y A4 en runtime | Calibrar al objetivo declarado es la diferencia entre Socrates como tutor real y wrapper genérico. Costo proporcionalmente pequeño (~5%) | POA solo para A3 (descartado: A4 también necesita calibrar tono y criterio); POA solo para A8 (descartado: A8 es MVP-2, A3 y A4 son MVP-1) |
