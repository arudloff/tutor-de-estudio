# Socrates — Context Resume

> **Para Claude (al retomar):** Lee este archivo primero. Da el snapshot mínimo necesario para reanudar el trabajo sin re-leer todo.
> **Última actualización:** 2026-04-10

## En una línea
Socrates es un tutor doctoral basado en IA que aplica los 6 principios pedagógicos del A9 del cluster doctoral, en fase de diseño pre-código.

## Estado al cierre de la última sesión (2026-04-10)
- Visión: ✓ definida y documentada (docs/01_VISION.md)
- Fundamentación teórica: ✓ artículo A9 del cluster doctoral, escrito y auditado (BORRADOR PASS)
- Principios pedagógicos: ✓ los 6, documentados con evidencia (docs/02_PRINCIPIOS_PEDAGOGICOS.md)
- Arquitectura conceptual: ✓ 8 agentes + n8n, esbozada (docs/03_ARQUITECTURA_MULTI_AGENTE.md)
- Decisiones abiertas: documentadas en docs/04_DECISIONES_ABIERTAS.md
- Código: ✗ todavía no
- Repo GitHub: ✓ creado en arudloff/tutor-de-estudio
- Registrado en BITÁCORA: ✓ con ID `tutor-de-estudio`

## Qué tocar primero al volver
1. Lee este archivo (CONTEXT_RESUME.md)
2. Lee `PROJECT_STATE.md` para el estado completo
3. Lee `docs/04_DECISIONES_ABIERTAS.md` para entender qué decisiones siguen pendientes
4. Decide: ¿pasamos a `/ingeniería` para formalizar requisitos, o sigues explorando algún eje del diseño?

## Tareas inmediatas (orden sugerido)

### Tarea 1 — Decisiones técnicas pendientes
Antes de invocar `/ingeniería`, necesitamos cerrar (o explicitar como pendientes):
- Dónde vive la inteligencia (pre-generación vs runtime vs híbrido) — propuesta abierta: híbrido
- Self-host n8n vs n8n cloud vs simplificar (Trigger.dev, Inngest, código directo)
- Modelo de negocio: solo personal, abierto al equipo del investigador, o producto

### Tarea 2 — /ingeniería fase 1 (estrategia)
Formalizar el problema, los stakeholders, las restricciones críticas (sin código, sin requisitos todavía).

### Tarea 3 — /ingeniería fase 2 (proceso)
Definir el flujo de usuario completo y el flujo de datos.

### Tarea 4 — /ingeniería fase 3 (requisitos verificables)
Cada requisito con criterio de aceptación ejecutable. Estos son los requisitos que el agente auditor de /dev recibirá durante la implementación.

### Tarea 5 — MVP (cuando todo lo anterior esté cerrado)
Implementación del flujo más pequeño que entrega valor: subir 1 PDF, generar micro-lecciones, distribuirlas.

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
