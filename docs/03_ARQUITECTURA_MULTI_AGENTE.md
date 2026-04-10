# 03 — Arquitectura multi-agente de Socrates

> Esbozo conceptual. No es la arquitectura técnica final. Esa se cierra en `/ingeniería`.
> Fecha: 2026-04-10
> Estado: borrador

## Principio rector

No usamos un único agente conversacional. Cada tarea tiene un perfil cognitivo distinto y requiere un modelo distinto. La separación de roles también permite auditar: si el diseñador de lecciones y el evaluador de calidad son agentes diferentes, uno puede verificar al otro. Esta es la misma lógica de separación de roles que el estándar de desarrollo del investigador exige para el código y los textos doctorales.

## Los nueve agentes

| ID | Agente | Tarea | Modelo sugerido | Por qué ese modelo |
|---|---|---|---|---|
| A1 | Lector | Extraer texto y estructura de PDFs, capítulos, presentaciones | GPT-4o | Mejor visión multimodal, rápido, costo bajo |
| A2 | Analista semántico | Descomponer el texto en unidades de sentido, construir el grafo de prerequisitos, identificar relaciones | Claude Opus | Razonamiento profundo sobre textos densos |
| A3 | Diseñador instruccional | Para cada unidad, generar la secuencia pedagógica (problema de fallo productivo, instrucción canónica, rúbrica de expectativas, catálogo de misconcepciones, tarea generativa) | Claude Sonnet | Buen balance creatividad/costo |
| A4 | Evaluador socrático | Conducir el diálogo de verificación, detectar evidencia de dominio o ausencia de dominio, decidir cierre del diálogo | Claude Opus | Necesita razonamiento fino para distinguir comprensión de memorización |
| A5 | Adaptador (planificador) | Recalcular el plan de aprendizaje según fecha límite, tiempo disponible, velocidad observada, resultados de cada hito | Algorítmico (FSRS) + Claude Sonnet para reformulación | Mayormente lógica, LLM solo para reformular enfoque pedagógico |
| A6 | Productor visual | Generar mapas mentales, diagramas, infografías, líneas de tiempo, mapas conceptuales | Mermaid + D3 + DALL-E 3 | Herramientas especializadas, no LLM genérico |
| A7 | Auditor de calidad | Verificar que las unidades de sentido son fieles al texto fuente, que las rúbricas son completas, que la progresión es coherente | Claude Opus (agente independiente del diseñador) | Rol de verificación independiente: nunca el mismo agente que produjo lo verifica |
| A8 | Coach metacognitivo | Generar el debrief semanal del aprendiz: dónde está, qué dominó, qué le falta, cómo se compara con su propio progreso anterior | Claude Sonnet | Necesita empatía + datos, no razonamiento pesado |
| A9 | Detector afectivo | Clasificar el estado emocional del aprendiz a partir de señales conductuales (latencia, longitud de respuesta, patrones de error, comportamiento de re-lectura) | Algorítmico + posible LLM ligero | Mayormente clasificación de patrones, no requiere modelo de razonamiento |

## Orquestación con n8n

n8n es el orquestador propuesto porque es visual, soporta múltiples APIs nativamente, tiene cron incorporado para los disparadores temporales, y permite que el investigador modifique los flujos sin necesidad de programar cada cambio. La alternativa es código directo en el backend (Next.js API routes), que daría más control pero menos visibilidad y mayor costo de evolución. Decisión pendiente.

## Los tres flujos principales

### Flujo 1 — Ingestión (una vez por curso, al cargar nuevo material)

```
Upload de PDFs/PPTs (PWA)
       ↓
Webhook n8n
       ↓
A1 — Extrae texto y estructura
       ↓
A2 — Construye unidades de sentido + grafo de prerequisitos
       ↓
A3 — Para cada unidad, genera la secuencia pedagógica completa
       ↓
A6 — Genera visuales asociados (mapa del grafo, diagramas)
       ↓
A7 — Audita fidelidad al texto fuente
       ↓
¿PASS?  →  Sí → Guarda en Supabase, marca curso como listo
        →  No → Regresa al A3 con feedback del auditor
```

### Flujo 2 — Sesión de aprendizaje (varias veces al día, según notificaciones)

```
Cron n8n (según configuración del aprendiz) o entrada manual a la PWA
       ↓
A5 — Selecciona la siguiente unidad de la frontera de aprendibilidad
       ↓
PWA muestra la lección siguiendo la secuencia pedagógica:
  - Problema (fallo productivo)
  - Aprendiz intenta
  - Instrucción canónica
  - Diálogo socrático
  - Tarea generativa
       ↓
A4 + A9 en paralelo:
  - A4 evalúa la respuesta contra la rúbrica
  - A9 detecta el estado afectivo
       ↓
A4 decide:
  - Acreditar la unidad → marcar como dominada → A5 selecciona la siguiente
  - No acreditar → reformular el enfoque → siguiente turno del diálogo
  - Pivote afectivo (de A9) → cambiar tono → continuar
       ↓
A5 actualiza el plan
       ↓
Guarda evidencia en Supabase (diálogo completo, decisión, estado afectivo)
```

### Flujo 3 — Debrief metacognitivo (semanal)

```
Cron n8n (semanal)
       ↓
A8 — Lee toda la actividad de la semana en Supabase
       ↓
A8 — Genera el reporte:
  - Conceptos dominados esta semana
  - Áreas débiles detectadas
  - Comparación con la semana anterior
  - Proyección al hito (¿se está cumpliendo el plan?)
  - Recomendaciones específicas (priorizar X, descansar Y)
       ↓
PWA muestra el reporte como notificación o vista dedicada
```

## Decisiones técnicas pendientes (críticas)

| Decisión | Opciones | Impacto si se elige mal |
|---|---|---|
| Dónde vive la inteligencia | Pre-generación al ingestar / Runtime en cada interacción / Híbrido | Costo de API y latencia de respuesta |
| Self-host n8n vs n8n cloud | Self-host (costo fijo, privacidad) / Cloud (cero ops) | Privacidad de los textos doctorales |
| Modelo de evaluación de respuestas abiertas | Solo Claude Opus / Cascada (Sonnet primero, Opus solo si dudoso) | Costo por sesión |
| Storage de PDFs | Supabase Storage / Cloudflare R2 / Self-host | Costo, soberanía de datos |
| Auth | Supabase Auth / Clerk / Custom | Velocidad de implementación |
| Stack frontend | Next.js 14 PWA / Remix / Astro / SvelteKit | Familiaridad del investigador, velocidad de mobile |

## Lo que NO está en esta arquitectura todavía

- Mecanismo de pago (no aplica al MVP, no es un producto comercial)
- Integración con sistemas de gestión doctoral (Zotero, Mendeley, OBS) — fase 2
- Generación de podcasts de repaso — fase 3 si la evidencia justifica
- Soporte multi-idioma — fase 2
- Modo colaborativo (varios aprendices del mismo curso) — fase 3
- API pública para terceros — fase 4 o nunca

## Compatibilidad con el cluster doctoral

La arquitectura propuesta es coherente con los siete principios invariantes del artículo A7 del cluster:
- **P1 (proteger integridad cognitiva del aprendiz)**: la separación entre A4 (evaluador) y A3 (diseñador) impide que el diseñador autoevalúe su propio output, igual que el estándar de desarrollo del investigador exige separación de roles.
- **P2 (gobernar la coexistencia)**: cada agente tiene responsabilidad delimitada y trazable.
- **P3, P6 (distinguir donde la deuda es aceptable y donde no)**: en aprendizaje doctoral, la deuda no es aceptable, por eso A7 (auditor) es obligatorio antes de entregar contenido al aprendiz.
- **P5 (liberar capacidades de orden superior)**: A8 (coach metacognitivo) y la inversión de rol del principio 4 alimentan al procesador inconsciente del aprendiz.
- **P7 (ciclo de problematización-generación-asimilación-aplicación)**: este es exactamente el flujo de cada micro-lección.
