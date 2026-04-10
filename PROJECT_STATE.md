# Socrates — Estado actual
> Última actualización: 2026-04-10

## Estado general
Proyecto en fase de diseño pre-código. Visión definida, fundamentación teórica completa (artículo A9 del cluster doctoral), arquitectura multi-agente esbozada. Pendiente: formalización de requisitos vía /ingeniería, decisiones técnicas finales, y construcción del MVP.

## Lo que funciona hoy
- **Visión** — completa, documentada en docs/01_VISION.md
- **Fundamentación pedagógica** — completa, los 6 principios derivados del A9, documentados en docs/02_PRINCIPIOS_PEDAGOGICOS.md
- **Arquitectura conceptual multi-agente** — esbozada, 8 agentes identificados con responsabilidades, modelos sugeridos y flujos, documentado en docs/03_ARQUITECTURA_MULTI_AGENTE.md
- **Vinculación con cluster doctoral** — el A9 sirve como artículo fundacional empírico-teórico

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
1. **Invocar /ingeniería** para formalizar las tres fases (estrategia, proceso, requisitos verificables) antes de cualquier código
2. **Definir el MVP mínimo** — la versión más pequeña que entrega valor real (mi sugerencia inicial: subir 1 PDF, descomponerlo en unidades, generar micro-lecciones nivel 1 con preguntas de opción múltiple, distribuirlas hasta una fecha)
3. **Decisión técnica: dónde vive la inteligencia** — pre-generación + LLM para adaptación (opción 3 del análisis), o full-runtime LLM, o híbrido
4. **Decisión técnica: deployment** — self-host n8n vs n8n cloud vs alternativa más simple
5. **Diseñar el primer flujo n8n** — el de ingestión (PDF → Unidades de sentido → Micro-lecciones nivel 1)
6. **Mockups de la PWA** — pantallas mobile de: subir material, lección diaria, dashboard de progreso

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
