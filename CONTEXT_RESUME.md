# Socrates — Context Resume

> **Para Claude (al retomar):** Lee este archivo primero. Da el snapshot mínimo necesario para reanudar el trabajo sin re-leer todo.
> **Última actualización:** 2026-04-11

## En una línea
Socrates es un tutor doctoral basado en IA que aplica los 6 principios pedagógicos del A9 del cluster doctoral + Ausubel estricto como anclaje del POA. Fase 1 de /ingeniería COMPLETA al 2026-04-11. Listo para Fase 2.

## Estado al 2026-04-11 (cierre de Fase A: D14-D19)

- Visión: ✓ cerrada (docs/01_VISION.md)
- Principios pedagógicos: ✓ cerrados con evidencia (docs/02_PRINCIPIOS_PEDAGOGICOS.md)
- Fundamentación teórica: ✓ A9 del cluster + ✓ Ausubel estricto como anclaje del POA
- Arquitectura conceptual: ✓ **12 agentes** (A1-A12) en docs/03, con A11 (Curador de corpus) y A12 (Entrevistador de objetivos) ya integrados, no solo propuestos
- Fase 1 de /ingeniería (Estrategia): ✓ COMPLETA en docs/05_ESTRATEGIA.md, secciones 1-12
- **Decisiones cerradas (14):** D1, D2, D4 revisada, D5, D6, D11 (revisada 2026-04-11), D12, D13, **D14, D15, D16, D17, D18, D19** — ver docs/04
- Decisiones diferidas (4): D3, D7, D8, D9, D10 — ver docs/04
- Código: ✗ todavía no — pendiente Fase 2 y Fase 3 antes de implementación
- Repo GitHub: ✓ arudloff/tutor-de-estudio, pendiente push de cambios del 2026-04-11
- BITÁCORA: ✓ sesión 2026-04-11 journaleada

## Qué tocar primero al retomar (próxima sesión)

1. **Leer `docs/05_ESTRATEGIA.md` § 11** — POA, curaduría conversada y sprints (resumen del cierre del 2026-04-11).
2. **Leer `docs/03_ARQUITECTURA_MULTI_AGENTE.md` § A11, § A12 y § Roles de PDFs** — los nuevos componentes integrados.
3. **Avanzar a Fase 2 de /ingeniería (`docs/06_PROCESOS.md`):**
   - Service Blueprint de los 4 procesos centrales
   - Modelo tripartito de Barros para los 4 procesos
   - State machines: curso, POA, PDF, unidad, sesión, hito, sprint, corpus, chapter_curation
   - SIPOC del sistema completo
   - User Story Map con corte MVP-1 / MVP-1.5 / MVP-2
4. **Después: Fase 3 de /ingeniería (`docs/07_REQUISITOS.md`):**
   - User stories INVEST con criterios Given-When-Then
   - 3+ ejemplos por story
   - Modelo de datos formal con RLS
   - NFRs medibles
5. **Recién entonces: Implementación del MVP-1 con auditoría YUNQUE por feature** (sprints S0-S6).

## El cierre de D14-D19 (2026-04-11)

Las 6 decisiones que estaban en estado PROPUESTA al cierre del 2026-04-10 fueron CERRADAS el 2026-04-11 con la confirmación del investigador ("acojo tus sugerencias"). La pregunta conceptual sobre Ausubel quedó resuelta: **Ausubel estricto** (las 3 condiciones del aprendizaje significativo). Se debe agregar Ausubel 1963/1968 como referencia teórica al A9 en el próximo ciclo de corrección del cluster doctoral (NO bloquea Socrates).

**Las 6 decisiones cerradas:**
- D14: 5 roles explícitos de PDFs + flujo híbrido de asignación
- D15: Modo libro con A11 nuevo y 3 niveles (núcleo/rápida/referencial)
- D16: Sprints first-class desde el modelo de datos
- D17: POA con anclaje en Ausubel estricto (3 componentes, 13 campos)
- D18: A12 Entrevistador de objetivos como agente nuevo separado del A11
- D19: POA propagado a A3 (diseño) y A4 (runtime)

**Cambios en MVP-1:**
- 6 agentes activos en lugar de 5: A1, A2, A3, A4, A7, A10 + **A12** (entrevista POA al crear curso)
- Primer paso del onboarding cambia: A12 antes de subir PDFs
- Modelo de datos del MVP-1 incluye `learner_objective_profile`, `pdf_role`, `sprint`, `chapter_curation` (los 3 últimos latentes)
- Costo proyectado del MVP-1: < $10.50/curso

## Tareas que quedan después de cerrar D14-D19

### Tarea 1 — Fase 2 de /ingeniería (docs/06_PROCESOS.md)
- Tripartita Barros para los 3 procesos centrales (ingestión, sesión, acreditación)
- Service Blueprint del proceso central (sesión de aprendizaje desktop + complemento mobile)
- State machines para curso, unidad, sesión, hito, sprint, corpus
- SIPOC del sistema completo
- User Story Map con corte MVP-1 / MVP-1.5 / MVP-2

### Tarea 2 — Fase 3 de /ingeniería (docs/07_REQUISITOS.md)
- User stories INVEST con criterios Given-When-Then
- 3+ ejemplos concretos por story
- Modelo de datos formal con RLS (incluyendo course_id, spans multi-PDF, POA, roles, sprints)
- C4 Level 1 y 2
- NFRs medibles
- Definition of Ready

### Tarea 3 — Diseño técnico del pipeline de ingestión
- Formato exacto de los artefactos internos (JSON schemas)
- Prompts operacionales finales de cada agente
- Esquema de base de datos con RLS policies

### Tarea 4 — Implementación del MVP-1
- Solo cuando todas las decisiones estén cerradas y la Fase 3 esté completa
- Acotado a 1 PDF/curso, agentes A1, A2, A3, A4, A7, A10 mínimo
- Con POA activo desde el primer curso

## Lo que NO hay que hacer al retomar
- No saltar directo a Fase 2 sin cerrar D14-D19. La Fase 2 necesita saber qué componentes existen antes de modelarlos.
- No empezar a codear sin Fase 3 completa. La auditoría del A9 demostró el riesgo.
- No confundir "snapshot intermedio" con "cierre de fase". Esto NO ejecutó `yunque close` ni sincronizó los 6 repos del registro — solo respaldó el repo `tutor-de-estudio`.

## Cómo retomar la conversación con Claude
- Decir "retomo socrates" o "retomo tutor-de-estudio" — BITÁCORA cargará el contexto de la sesión 2026-04-10.
- O decir directamente: "vamos a revisar docs/99_DECISIONES_PENDIENTES.md" y empezar a confirmar.

## Lo que NO hay que hacer
- Saltarse `/ingeniería` y empezar a codear directo. La auditoría del A9 demostró el riesgo: sin requisitos verificables el auditor no puede detectar omisiones.
- Implementar los 8 agentes de una vez. El MVP debe usar 3-4 agentes mínimos.
- Conectar a producción de Supabase sin RLS configurado.
- Asumir que un wrapper de ChatGPT funcionará. La paradoja de Bastani lo refuta empíricamente.

## Convenciones del proyecto (heredadas del estándar global)
- Toda función de lógica de negocio tiene tests
- Toda evaluación de aprendizaje produce evidencia estructurada (no `executed: true`)
- Antes de declarar un hito completo, ejecutar agente auditor separado
- Quality gates por tipo de cambio (ver `~/.claude/CLAUDE.md`)
- Commits convencionales: feat / fix / docs / refactor / chore / test
- Sin secrets en código, sin innerHTML con datos de usuario, sin `any` en TypeScript

## Anclas externas
- A9 del cluster: `G:\Mi unidad\DOCTORADO\Organizaciones Hibridadas\Cluster de Investigación_publicación\A9_Tutor_Sin_Deuda.docx`
- Cluster doctoral completo: `G:\Mi unidad\DOCTORADO\Organizaciones Hibridadas\Cluster de Investigación_publicación\`
- Estándar de desarrollo: `~/.claude/CLAUDE.md`
- Body of Knowledge: `G:\Mi unidad\DOCTORADO\Auditorias\ENFORCEMENT_BODY_OF_KNOWLEDGE.md`
