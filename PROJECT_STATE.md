# Socrates — Estado actual
> Última actualización: 2026-04-10

## Estado general
Proyecto en fase de diseño pre-código. Visión definida, fundamentación teórica completa (artículo A9 del cluster doctoral), arquitectura multi-agente esbozada. Pendiente: formalización de requisitos vía /ingeniería, decisiones técnicas finales, y construcción del MVP.

## Lo que funciona hoy
- **Visión** — completa, documentada en docs/01_VISION.md
- **Fundamentación pedagógica** — completa, los 6 principios derivados del A9, documentados en docs/02_PRINCIPIOS_PEDAGOGICOS.md
- **Arquitectura conceptual multi-agente** — esbozada, 9 agentes identificados con responsabilidades, modelos sugeridos y flujos, documentado en docs/03_ARQUITECTURA_MULTI_AGENTE.md
- **Vinculación con cluster doctoral** — el A9 sirve como artículo fundacional empírico-teórico
- **Estrategia formal (Fase 1 de /ingeniería)** — completa, documentada en docs/05_ESTRATEGIA.md. Incluye JTBD canónico, Value Proposition Canvas, Impact Map, Kano, MoSCoW del MVP-1, y 6 decisiones técnicas cerradas (D1, D2, D4 revisada, D5, D6, D11)

## Lo que NO existe todavía
- Código de cualquier tipo
- Especificaciones técnicas formales (requisitos verificables, criterios de aceptación)
- Mockups de UI
- Flujos n8n implementados
- Esquema de base de datos
- Tests
- Decisiones cerradas sobre stack final

## Último hito completado
**2026-04-10 — Auditoría y publicación del A9 en cluster doctoral**
- Qué se hizo: producción del artículo A9 ("El tutor que no genera deuda") como pieza fundamental del cluster *Coexistir con lo que nos excede*. Auditoría /dr completa con cuatro agentes independientes (humanizer, critic, devil's advocate, verificador). Aplicación de 8 correcciones post-auditoría. Quality gate: BORRADOR PASS sólido.
- Decisiones clave:
  - Codename del proyecto: Socrates (en honor al método socrático estructurado de Graesser y Khanmigo)
  - Repo: [arudloff/tutor-de-estudio](https://github.com/arudloff/tutor-de-estudio)
  - Stack tentativo: Next.js (frontend mobile-first PWA) + Supabase (auth/db/storage) + n8n (orquestación multi-agente) + Claude API + GPT-4o + modelos especializados
  - Arquitectura: 8 agentes con responsabilidades específicas, no un único agente conversacional
  - Fase 1 = MVP con 1 PDF, 1 modo (examen), nivel 1-2 de Bloom, evaluación opción múltiple + diálogo socrático básico
- Archivos generados en esta fase:
  - `G:\Mi unidad\DOCTORADO\Organizaciones Hibridadas\Cluster de Investigación_publicación\A9_Tutor_Sin_Deuda.docx`
  - `gen_A9.js`, `A9_tabla_verificacion_citas.md`, `A9_Tutor_Sin_Deuda.yunque-dr.json`

## Próximos pasos sugeridos
1. **Fase 2 de /ingeniería (Procesos)** — Service Blueprint del proceso central (sesión de aprendizaje), modelo tripartito de Barros para los 3 procesos, state machines, SIPOC, User Story Map con corte MVP-1
2. **Fase 3 de /ingeniería (Requisitos verificables)** — User stories en formato INVEST con criterios Given-When-Then ejecutables, 3+ ejemplos por story, modelo de datos formal, NFRs medibles, Definition of Ready
3. **Diseño técnico del pipeline de ingestión** — A1 → A2 → A3 → A7, formato de artefactos persistidos
4. **Esquema de base de datos** — tablas, relaciones, RLS policies, índices
5. **Implementación del MVP-1** — solo cuando los pasos 1-4 estén cerrados

## Deuda técnica conocida
- Ninguna todavía (no hay código)

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
