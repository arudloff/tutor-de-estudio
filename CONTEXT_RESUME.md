# Socrates — Context Resume

> **Para Claude (al retomar):** Lee este archivo primero. Da el snapshot mínimo necesario para reanudar el trabajo sin re-leer todo.
> **Última actualización:** 2026-04-10

## En una línea
Socrates es un tutor doctoral basado en IA que aplica los 6 principios pedagógicos del A9 del cluster doctoral, en fase de diseño pre-código.

## Estado al cierre del snapshot intermedio (2026-04-10, tarde)

- Visión: ✓ cerrada (docs/01_VISION.md)
- Principios pedagógicos: ✓ cerrados con evidencia (docs/02_PRINCIPIOS_PEDAGOGICOS.md)
- Fundamentación teórica: ✓ artículo A9 del cluster doctoral, escrito y auditado (BORRADOR PASS)
- Arquitectura conceptual: ✓ 10 agentes (A1-A10) + conversación de curaduría propuesta (A11, A12) en docs/03
- Fase 1 de /ingeniería (Estrategia): ✓ cerrada en docs/05_ESTRATEGIA.md
- Decisiones cerradas (8): D1, D2, D4 revisada, D5, D6, D11, D12, D13 — ver docs/04
- Decisiones diferidas (4): D3, D7, D8, D9, D10 — ver docs/04
- **Decisiones propuestas PENDIENTES de confirmación (6): D14, D15, D16, D17, D18, D19 — ver docs/99_DECISIONES_PENDIENTES.md**
- Código: ✗ todavía no
- Repo GitHub: ✓ arudloff/tutor-de-estudio, 3 commits, main actualizado
- BITÁCORA: ✓ registrado como `tutor-de-estudio`, sesión 2026-04-10 journaleada

## Qué tocar primero al retomar (CRÍTICO)

1. **Leer `docs/99_DECISIONES_PENDIENTES.md`** — tiene las 6 propuestas que quedaron sin confirmar.
2. **Responder las confirmaciones** — cada decisión tiene una pregunta específica. Idealmente responder las seis en bloque.
3. **Primer punto no resuelto:** la pregunta conceptual sobre si "experiencia de aprendizaje significativo" se usa en el sentido de Ausubel (con las tres condiciones) o en sentido amplio. Esta respuesta determina si agregamos Ausubel como referencia al A9 en el próximo ciclo de corrección del artículo doctoral.
4. **Después de cerrar D14-D19:** actualizar docs/03 (arquitectura ampliada con A11 y A12), docs/04 (D14-D19 pasadas a CERRADAS), docs/05 (sección nueva sobre POA y modo libro), PROJECT_STATE, commit + push.
5. **Recién después:** avanzar a Fase 2 de /ingeniería (docs/06_PROCESOS.md).

## El origen de las 6 decisiones pendientes

Durante la sesión del 2026-04-10 surgieron tres ideas del investigador que requieren formalización:

**Idea A (D14-D16):** al incorporar varios PDFs, indicar el rol de cada uno (principal, equivalente, complementario, referencial, contrapunto); soportar libros con conversación de curaduría; sprints de aprendizaje por capas o bloques.

**Idea B (D17-D19):** Socrates debe conocer el objetivo del aprendiz (qué desafío espera resolver, para qué quiere estar habilitado) y es diseñador de experiencias de **aprendizaje significativo** — no solo entregador de contenido. Esto implica un Perfil de Objetivo del Aprendiz (POA) como input obligatorio, un agente nuevo A12 que lo captura, y propagación del POA al A3 (diseño) y al A4 (runtime).

Ambas ideas son de diseño, no de implementación. Son el momento correcto para incorporarlas porque la Fase 2 de /ingeniería (Service Blueprint, state machines, User Story Map) necesita saber si existen POA, A11, A12, modo libro y sprints antes de poder modelarlas.

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
