# 06 — Procesos (Fase 2 de /ingeniería)

> Producto de la Fase 2 de `/ingeniería` ejecutada el 2026-04-11.
> Esta fase responde a la pregunta: **¿Cómo flujos, estados y responsabilidades hacen posible la estrategia de la Fase 1?**
> Inputs: `docs/05_ESTRATEGIA.md` (Fase 1 cerrada con D14-D19) + `docs/03_ARQUITECTURA_MULTI_AGENTE.md` (12 agentes definidos).
> Outputs verificables para Fase 3 (Requisitos): los Service Blueprints, las máquinas de estado, el SIPOC y el User Story Map de esta fase son los inputs sobre los que se redactarán los user stories INVEST con criterios Given-When-Then.

---

## 1. Marco general de la Fase 2

La Fase 1 dejó cerrada la estrategia y las decisiones técnicas bloqueantes. La Fase 2 modela los **4 procesos centrales** de Socrates con cuatro instrumentos:

| # | Instrumento | Responde a la pregunta |
|---|---|---|
| 1 | **Service Blueprint** | ¿Qué hace el aprendiz, qué hace el sistema visible, qué hace el sistema invisible, y qué evidencia queda? |
| 2 | **Modelo tripartito de Barros** | ¿Quién produce, quién gestiona, quién dirige cada proceso? |
| 3 | **State machines** | ¿Por qué estados pasa cada entidad y qué transiciones son válidas? |
| 4 | **SIPOC** | ¿Quién proporciona qué a cada proceso y quién recibe qué del proceso? |

Adicionalmente, esta fase produce un **User Story Map** con corte explícito MVP-1 / MVP-1.5 / MVP-2 que sirve de puente directo a la Fase 3.

### Los 4 procesos centrales (revisión 2026-04-11)

| # | Proceso | Frecuencia | Agentes activos |
|---|---|---|---|
| **P1** | **Onboarding del curso** (NUEVO en MVP-1) | 1 vez por curso | A12 (siempre), A11 (si modo libro o multi-PDF heterogéneo) |
| **P2** | **Ingestión de material** | 1 vez por curso (después de P1) | A1, A2, A10, A3, A7 (con POA en contexto del A3) |
| **P3** | **Sesión de aprendizaje** | N veces por día/semana hasta deadline | A4 (con POA en contexto), A5, A8/A9 (MVP-2) |
| **P4** | **Acreditación de hito o sprint** | 1 vez por unidad y 1 vez por sprint | A4, A5 |

P1 es nuevo respecto al diseño previo al 2026-04-11. P3 y P4 están imbricados: durante una sesión P3 puede ocurrir una acreditación P4 (al finalizar una unidad o un sprint). Los modelamos como procesos distintos porque tienen actores y outputs diferentes.

---

## 2. Service Blueprint de los 4 procesos

> Notación: **CA** = Customer Action (aprendiz). **OA** = Onstage Action (lo que el aprendiz ve del sistema). **BA** = Backstage Action (procesos del sistema invisibles). **SP** = Support Process (infraestructura, BD, APIs externas). **PE** = Physical Evidence (artefactos persistidos).

### 2.1 Service Blueprint — P1 Onboarding del curso

```
TIEMPO    │  CA (Aprendiz)            │  OA (Sistema visible)        │  BA (Sistema invisible)         │  SP (Infraestructura)        │  PE (Evidencia)
──────────┼──────────────────────────┼─────────────────────────────┼────────────────────────────────┼──────────────────────────────┼────────────────────────────
T0        │  Login                    │  Dashboard "Mis cursos"      │  Verifica whitelist (D6)        │  Supabase Auth                │  session JWT
          │                           │  → "Crear curso nuevo"       │                                 │                              │
T0+1m     │  Click "Crear curso"      │  Form: nombre + deadline     │  Crea fila course (state=draft)│  Postgres course               │  course.id
          │  Ingresa nombre, deadline │  → "Continuar"                │                                 │                              │
T0+2m     │  Empieza entrevista A12   │  Chat de A12: pregunta 1     │  A12 emite primera pregunta   │  Claude API (Sonnet)         │  message_log fila 1
          │  ("Soy doctorando en...") │  ("Cuéntame sobre tu rol")   │  Lee POA template, no historia │                              │
T0+3m     │  Responde libremente      │  A12 procesa, sigue          │  A12 detecta señal vaga,      │  Claude API (Sonnet)         │  message_log fila 2-3
          │                           │  preguntando o follow-up     │  hace follow-up                 │                              │
...       │  ...iteraciones...        │  ...iteraciones...            │  ...iteraciones...              │                              │
T0+6m     │  Termina respuestas       │  A12 muestra POA capturado:  │  A12 sintetiza JSON con los    │  Claude API (Sonnet)         │  learner_objective_profile
          │                           │  3 componentes en pantalla   │  13 campos del POA              │                              │  (state=captured)
T0+7m     │  Revisa, edita, confirma  │  "POA confirmado ✓"           │  POA → state=confirmed_by_     │  Postgres                     │  poa.confirmed_at
          │                           │  → "Subir material"           │  learner. Locked.               │                              │
T0+8m     │  Drag-and-drop PDFs       │  Upload bar + miniaturas      │  Recibe ficheros, valida       │  Supabase Storage (bucket    │  pdf rows + binary
          │                           │                               │  tipo, calcula hash             │  privado, signed URL)        │
T0+9m     │  Ve PDFs subidos          │  Lista de PDFs con campo     │  A1 fase 1: extrae solo TOC   │  GPT-4o vision               │  pdf.toc, pdf.length_pp
          │  Asigna rol a cada uno    │  "rol" (default=principal)   │  + longitud por PDF             │                              │
T0+10m    │  Decide rol               │  Dropdown 5 roles (D14)      │  Persiste pdf.role + razón     │  Postgres pdf_role           │  pdf.role
          │                           │                               │  en pdf_role_history            │                              │  pdf_role_history fila
T0+11m    │  ¿Algún PDF >80pp?        │  Si sí: "Necesitamos hablar  │  A11 detecta condición         │                              │
          │                           │  de cómo procesar este libro"│  (length>80 OR n_pdfs hetero)  │                              │
T0+12m    │  Inicia chat con A11      │  Chat A11: presenta libro    │  A11 lee POA + TOC, formula    │  Claude API (Opus)           │  message_log de A11
          │  (si aplica modo libro)   │  con su TOC                  │  preguntas sobre objetivo       │                              │
T0+13m    │  Responde sobre cuáles    │  A11 conversa: "¿1, 3, 4 son │  A11 propone curaduría:        │  Claude API (Opus)           │  chapter_curation propuesta
          │  capítulos necesita       │  los esenciales? ¿Saltamos 6?│  núcleo, lectura rápida,        │                              │
          │                           │                               │  referencial                    │                              │
T0+14m    │  Revisa propuesta         │  Tabla de capítulos con      │  Espera confirmación del       │                              │
          │                           │  nivel asignado por A11      │  aprendiz                       │                              │
T0+15m    │  Acepta/ajusta            │  "Curaduría confirmada ✓"    │  chapter_curation → state=     │  Postgres                     │  chapter_curation
          │                           │  → "Procesar material"        │  confirmed                      │                              │  (state=confirmed)
T0+15m    │  Click "Procesar"         │  → Pasa al proceso P2        │  course.state=ingestion_ready  │                              │  course.state
          │                           │   (Ingestión)                │                                 │                              │
```

**Punto crítico de fallo:** entre T0+2m y T0+7m (entrevista del A12). Si el aprendiz abandona la entrevista sin confirmar el POA, el curso queda en `state=draft` con `poa.state=in_interview`. Al volver, A12 retoma la conversación desde donde la dejó. **Sin POA confirmado no se puede subir PDFs.**

**Punto crítico de privacidad:** los textos del PDF aún no han sido enviados a APIs externas. Solo el TOC y la longitud (que A1 extrae con visión) van a GPT-4o. La conversación del A12 con Claude no incluye el texto del PDF. La conversación del A11 con Claude incluye el TOC + longitudes pero NO el contenido completo de los capítulos.

### 2.2 Service Blueprint — P2 Ingestión de material

```
TIEMPO    │  CA (Aprendiz)            │  OA (Sistema visible)        │  BA (Sistema invisible)         │  SP (Infraestructura)        │  PE (Evidencia)
──────────┼──────────────────────────┼─────────────────────────────┼────────────────────────────────┼──────────────────────────────┼────────────────────────────
T0        │  Click "Procesar"         │  Pantalla de progreso:        │  Trigger.dev/Inngest job       │  Job queue                    │  ingestion_job fila
          │                           │  "Procesando tu material..."  │  encolado                       │                              │  (state=queued)
T0+10s    │  Espera (puede cerrar)    │  Barra: "Extrayendo texto    │  A1 procesa cada PDF: extrae   │  GPT-4o vision               │  pdf.full_text
          │                           │  (1/N)"                       │  texto completo + estructura    │                              │
          │                           │                               │  de los capítulos (modo libro:  │                              │
          │                           │                               │  solo núcleo + lectura rápida)  │                              │
T0+2m     │                           │  "Analizando contenido..."    │  A2 procesa cada PDF: descompone│  Claude API (Opus)          │  sense_unit, glosario,
          │                           │                               │  en unidades de sentido + grafo │                              │  prerequisite_edge,
          │                           │                               │  + glosario + posicionamiento   │                              │  literature_position
T0+5m     │                           │  "Verificando cobertura..."   │  A10 verifica que cada párrafo  │  Claude API (Opus)          │  coverage_report
          │                           │                               │  sustantivo esté cubierto       │                              │
          │                           │                               │  (loop A2↔A10 hasta 100% o      │                              │
          │                           │                               │  3 iter → FAIL_REVIEW)          │                              │
T0+7m     │                           │  "Diseñando lecciones..."     │  A3 procesa cada unidad CON    │  Claude API (Sonnet)         │  productive_failure_problem,
          │                           │                               │  POA: fallo productivo, rúbrica,│                              │  rubric, misconception_catalog,
          │                           │                               │  catálogo, tarea generativa     │                              │  generative_task
T0+10m    │                           │  "Auditando calidad..."       │  A7 verifica fidelidad verbatim │  Claude API (Opus)          │  audit_report
          │                           │                               │  de citas + cobertura de        │                              │
          │                           │                               │  misconcepciones                │                              │
T0+11m    │                           │  ¿PASS o FAIL?                │  Si FAIL: A3 reprocesa la       │                              │
          │                           │                               │  unidad rechazada (max 3 iter)  │                              │
T0+12m    │  Recibe notificación      │  "Curso listo para empezar 🎓"│  course.state=active            │  Postgres                     │  course.state=active
          │  (push o email opcional)  │  → "Ir al plan"               │                                 │                              │
```

**Tiempo total proyectado para 1 PDF de ~30 páginas:** 8-15 minutos. Para libro modo núcleo de ~120 páginas: 20-30 minutos. Para multi-PDF (5 artículos): 25-40 minutos.

**Punto crítico de fallo:** loop A2↔A10. Si después de 3 iteraciones sigue habiendo párrafos huérfanos sin justificar, el job se marca FAIL_REVIEW y el aprendiz debe inspeccionar manualmente. Esto es preferible a aprobar silenciosamente una ingestión incompleta.

**Punto crítico de costo:** A3 + A7 son las llamadas más costosas porque corren una vez por unidad de sentido. Para un curso típico de 30-50 unidades, son 60-100 llamadas a Sonnet/Opus. Optimización: A3 procesa lotes de unidades en una sola llamada cuando es viable.

### 2.3 Service Blueprint — P3 Sesión de aprendizaje

```
TIEMPO    │  CA (Aprendiz)            │  OA (Sistema visible)        │  BA (Sistema invisible)         │  SP (Infraestructura)        │  PE (Evidencia)
──────────┼──────────────────────────┼─────────────────────────────┼────────────────────────────────┼──────────────────────────────┼────────────────────────────
T0        │  Abre Socrates            │  Dashboard del curso         │  A5 calcula la frontera de     │  Postgres                     │  learning_session row
          │                           │  → "Próxima unidad: X"       │  aprendibilidad: ¿qué unidad   │                              │  (state=scheduled)
          │                           │                               │  toca ahora?                    │                              │
T0+30s    │  Click "Empezar sesión"   │  Card: la unidad N           │  Carga unit + prereqs cumplidos│  Postgres                     │  session.state=started
T0+1m     │  Lee el problema de       │  Pantalla: "Antes de leer    │  Muestra problema_fallo_       │                              │
          │  fallo productivo         │  cualquier explicación,      │  productivo. NO instrucción.   │                              │
          │  (Principio 1 del A9)     │  intenta esto..."             │                                 │                              │
T0+3m     │  Intenta resolver         │  Caja de texto + botón       │  Espera respuesta del aprendiz │                              │  attempt row
          │  (puede fallar)           │  "Mi intento"                 │                                 │                              │
T0+5m     │  Submit del intento       │  Spinner                     │  A4 evalúa el intento contra  │  Claude API (Opus, con POA   │  attempt.evaluation
          │                           │                               │  rúbrica + misconcepciones      │  en contexto)                │
T0+5m+5s  │  Recibe instrucción       │  "Buen intento. Aquí está    │  A4 muestra instrucción        │                              │  message_log
          │  canónica                 │  cómo lo trata el autor..."   │  canónica del A3                │                              │
T0+6m     │  Lee instrucción          │  Texto de instrucción        │                                 │                              │
T0+8m     │  Diálogo socrático        │  A4 hace pregunta 1          │  A4 emite pregunta calibrada   │  Claude API (Opus, con POA)  │  message_log fila
          │  (Principio 3)            │                               │  por rúbrica + POA              │                              │
T0+10m    │  Responde                 │  Loading                     │  A4 evalúa, decide siguiente   │  Claude API                   │  attempt.eval
          │                           │                               │  pregunta o cierre              │                              │
T0+12m    │  ...iteraciones del       │  ...iteraciones...            │  ...A4 detecta evidencia o     │                              │  ...
          │  diálogo (3-7 turnos)     │                               │  ausencia de evidencia...       │                              │
T0+18m    │  Cierre del diálogo       │  A4: "Estás listo para la    │  A4 decide acreditación        │  → pasa a P4                  │
          │                           │  tarea generativa"            │  inicial PASS                   │                              │
T0+19m    │  Lee tarea generativa     │  Caja de texto: tarea Tier 1 │  Muestra generative_task del A3│                              │
          │  (Principio 6, Tier 1     │  ("Sintetiza en 100 palabras │                                 │                              │
          │  en MVP-1)                │  cómo X explica Y")           │                                 │                              │
T0+22m    │  Escribe síntesis         │  Submit                       │  Persiste artifact              │  Postgres                     │  artifact row
T0+22m+5s │                           │  Confirmación de cierre      │  unit.state=mastered           │  Postgres                     │  unit.state=mastered
          │                           │                               │  A5 recalcula plan              │                              │  plan_recalc fila
T0+22m    │  Pantalla de cierre       │  "Unidad acreditada ✓        │                                 │                              │
          │                           │  Próxima: Y"                  │                                 │                              │
```

**Duración de una sesión típica en MVP-1:** 15-30 minutos por unidad. El target es 1-2 unidades por día.

**Punto crítico de fallo:** evaluación del A4 incorrecta. Si A4 acredita falsamente o rechaza falsamente, el sistema falla en su misión central. Mitigación: en MVP-2 puede agregarse muestreo aleatorio de evaluaciones del A4 que un agente auditor independiente revisa.

### 2.4 Service Blueprint — P4 Acreditación de hito o sprint

> En MVP-1, la "acreditación de hito" es la decisión PASS/FAIL al cierre del diálogo socrático de una unidad (subproceso de P3). En MVP-2, la "acreditación de sprint" es un proceso explícito separado donde el A4 conduce un diálogo integrador sobre las N unidades del sprint y produce una acreditación integradora.

```
TIEMPO    │  CA (Aprendiz)            │  OA (Sistema visible)        │  BA (Sistema invisible)         │  SP (Infraestructura)        │  PE (Evidencia)
──────────┼──────────────────────────┼─────────────────────────────┼────────────────────────────────┼──────────────────────────────┼────────────────────────────
          │                           │                               │  [Subproceso de P3 en MVP-1]   │                              │
T0        │  Termina diálogo de      │  A4 evalúa la totalidad       │  A4 produce decisión final:    │  Claude API                   │  hito_accreditation row
          │  unidad                   │  del diálogo                  │  PASS/FAIL + razón              │                              │
T0+5s     │  Si PASS: continúa       │  "Unidad acreditada ✓"        │  unit.state=mastered           │  Postgres                     │  unit.state
          │  Si FAIL: reformulación  │  "Vamos a revisarlo desde     │  unit.state=needs_review       │                              │
          │                           │  otro ángulo"                 │  + nueva pregunta del A4        │                              │
T0+10s    │                           │                               │  A5 recalcula plan              │  Postgres                     │  plan_recalc fila
          │                           │                               │                                 │                              │
          │                           │                               │  [En MVP-2 con sprint:]        │                              │
T0+0      │  Termina N unidades del  │  "Has completado las N       │  A4 detecta que todas las      │                              │
          │  sprint                   │  unidades. Vamos a integrar"  │  unidades del sprint fueron     │                              │
          │                           │                               │  acreditadas individualmente    │                              │
T0+1m     │  Inicia diálogo          │  A4 conduce diálogo           │  A4 hace pregunta integradora  │  Claude API (Opus + POA)     │  sprint_dialog row
          │  integrador              │  integrador                   │                                 │                              │
T0+10m    │  ...iteraciones...       │                               │                                 │                              │
T0+15m    │  Tarea generativa Tier 2 │  Caja de texto Tier 2        │  Muestra integration_task      │                              │
          │  o Tier 3                 │                               │                                 │                              │
T0+30m    │  Submit                   │  "Sprint acreditado ✓"        │  sprint.state=completed         │  Postgres                     │  sprint.state
          │                           │  Resumen de avance           │  A8 (MVP-2) registra progreso  │                              │  sprint_completion
          │                           │                               │  contra el POA                  │                              │
```

---

## 3. Modelo tripartito de Barros

> El modelo tripartito de Barros distingue tres niveles dentro de cada proceso de negocio: **producción** (lo que se hace), **gestión** (cómo se administra el flujo), **dirección** (decisiones estratégicas que enmarcan el flujo). Aplicado a cada proceso central de Socrates:

### 3.1 P1 Onboarding del curso

| Nivel | Qué ocurre | Quién es responsable | Inputs | Outputs |
|---|---|---|---|---|
| **Producción** | A12 conduce entrevista, captura POA, lo persiste. A11 conduce curaduría si aplica modo libro. A1 extrae TOC | A12, A11, A1 | nombre, deadline, PDFs subidos | POA confirmado, chapter_curation, pdf.role |
| **Gestión** | El sistema verifica que el POA esté completo antes de permitir subir PDFs. Verifica que los PDFs subidos pasen validación de tipo y tamaño. Encola la curaduría del A11 cuando aplica | Backend (Next.js API routes) + state machine de curso | course.state, poa.state | transición de estado controlada |
| **Dirección** | El aprendiz decide si los datos capturados por el A12 reflejan su intención real. Acepta o rechaza la curaduría propuesta por el A11. Decide los roles de cada PDF | El aprendiz (autoridad final) | propuestas del A12 y A11 | confirmaciones, ajustes, rechazos |

**Regla de oro de P1:** ninguna decisión metodológica (POA, roles, curaduría) se finaliza sin confirmación explícita del aprendiz. El sistema sugiere; el aprendiz decide.

### 3.2 P2 Ingestión de material

| Nivel | Qué ocurre | Quién es responsable | Inputs | Outputs |
|---|---|---|---|---|
| **Producción** | A1 extrae texto, A2 descompone en unidades, A10 verifica cobertura, A3 diseña pedagogía con POA, A7 audita fidelidad | A1, A2, A10, A3, A7 | PDFs procesados, POA, chapter_curation | unidades, grafo, problemas, rúbricas, catálogos, tareas |
| **Gestión** | Job orquestador (Trigger.dev/Inngest) coordina las etapas, maneja reintentos, notifica progreso al aprendiz, resuelve loops A2↔A10 con límite de 3 iter | Backend orquestador | ingestion_job state | progreso visible, FAIL_REVIEW si aplica |
| **Dirección** | El sistema decide unilateralmente cuándo aprobar la ingestión (loop A2↔A10 cierra cuando cobertura=100%). El aprendiz solo decide reprocesar manual si hay FAIL_REVIEW | Sistema automático + aprendiz si FAIL_REVIEW | umbrales de aprobación | decisión PASS/FAIL_REVIEW |

**Regla de oro de P2:** el aprendiz nunca ve unidades de sentido sin que A10 haya verificado cobertura 100% sustantiva y A7 haya verificado fidelidad de citas.

### 3.3 P3 Sesión de aprendizaje

| Nivel | Qué ocurre | Quién es responsable | Inputs | Outputs |
|---|---|---|---|---|
| **Producción** | A4 conduce el diálogo socrático con POA en contexto, evalúa cada respuesta, decide cierre. El aprendiz produce los artefactos generativos. A5 actualiza el plan al final | A4, A5, aprendiz | unidad, rúbrica, catálogo, POA, historia del diálogo | message_log, attempt rows, artifacts, decisión de acreditación |
| **Gestión** | Frontend Next.js mantiene la sesión activa, persiste cada turno en BD, maneja reconexión si el aprendiz cierra la pestaña. Cron de notificaciones (mobile) recuerda sesiones programadas | Frontend + service worker + cron de Trigger.dev | session.state | session persistida sin pérdida |
| **Dirección** | El aprendiz decide cuándo empezar y cuándo cerrar una sesión. Puede abandonarla y retomarla. El A4 decide el cierre del diálogo dentro de una unidad. A5 decide la siguiente unidad según el grafo | Aprendiz + A4 + A5 | preferencias del aprendiz, estado del plan | siguiente sesión, siguiente unidad |

**Regla de oro de P3:** cada turno del diálogo queda persistido. La pérdida de un turno por crash de cliente es un defecto bloqueante.

### 3.4 P4 Acreditación de hito o sprint

| Nivel | Qué ocurre | Quién es responsable | Inputs | Outputs |
|---|---|---|---|---|
| **Producción** | A4 emite decisión PASS/FAIL contra la rúbrica con evidencia trazable del diálogo. En MVP-2, A4 conduce diálogo integrador de sprint y emite decisión integradora | A4 | rúbrica, catálogo, diálogo completo, POA | hito_accreditation row, sprint_completion |
| **Gestión** | Sistema persiste la decisión en `unit.state` o `sprint.state`. A5 recalcula plan. Si FAIL, A5 reprograma la unidad para más tarde con feedback al aprendiz | Backend | decisión del A4 | unit.state, sprint.state, plan |
| **Dirección** | El aprendiz puede apelar una decisión FAIL solicitando otra ronda del A4. En MVP-2 esto es opcional | Aprendiz (post-decisión) | decisión del A4, contexto del aprendiz | acreditación o nueva ronda |

**Regla de oro de P4:** ninguna acreditación se persiste sin evidencia recuperable del diálogo que la fundamentó. La decisión PASS/FAIL siempre tiene un `message_log_id` y un `evaluation_artifact_id` asociados.

---

## 4. State machines de las entidades clave

> Notación: cada entidad se modela como un autómata finito con estados y transiciones válidas. Las transiciones llevan etiqueta del agente o evento que las dispara.

### 4.1 `course` (Curso)

```
                                            ┌──────────────┐
              [usuario crea curso]          │              │
        ────────────────────────────────────▶    draft     │
                                            │              │
                                            └──────┬───────┘
                                                   │ [A12 termina entrevista, aprendiz confirma POA]
                                                   ▼
                                            ┌──────────────┐
                                            │ poa_captured │
                                            └──────┬───────┘
                                                   │ [aprendiz sube ≥1 PDF y asigna roles]
                                                   ▼
                                            ┌──────────────┐
                                            │ corpus_loaded│
                                            └──────┬───────┘
                                                   │ [si modo libro: A11 termina curaduría]
                                                   │ [si no: skip directo]
                                                   ▼
                                            ┌──────────────┐
                                            │ ingestion_   │
                                            │ ready        │
                                            └──────┬───────┘
                                                   │ [aprendiz dispara "Procesar"]
                                                   ▼
                                            ┌──────────────┐
                                            │ ingesting    │
                                            └──────┬───────┘
                                                   │ [pipeline P2 termina con PASS]
                                                   │
                                          ┌────────┴────────┐
                                          │                 │
                                          ▼                 ▼
                                    ┌──────────┐     ┌─────────────┐
                                    │  active  │     │ fail_review │ ← ingestión incompleta tras 3 iter
                                    └────┬─────┘     └──────┬──────┘
                                         │                  │ [aprendiz revisa y reanuda]
                                         │                  └─────┐
                                         │                        │
                                         │                        ▼
                                         │                  ┌──────────┐
                                         │                  │ ingesting│ ← reanuda loop
                                         │                  └──────────┘
                                         │
                       ┌─────────────────┼─────────────────┐
                       │                 │                 │
                       ▼                 ▼                 ▼
                ┌──────────┐      ┌──────────┐     ┌──────────┐
                │  paused  │      │ completed│     │ archived │
                └────┬─────┘      └──────────┘     └──────────┘
                     │ [reactiva]
                     ▼
                ┌──────────┐
                │  active  │
                └──────────┘
```

**Transiciones inválidas (deben rechazarse con error 409):**
- `draft → corpus_loaded` sin pasar por `poa_captured` (no se puede subir PDF sin POA confirmado)
- `corpus_loaded → ingesting` saltándose `ingestion_ready` cuando hay libro en el corpus
- `active → ingesting` (no se puede re-ingestar; hay que crear curso nuevo)
- `completed → active` (un curso completado no se reactiva; se archiva o se clona)

### 4.2 `learner_objective_profile` (POA)

```
        ┌────────┐  [A12 inicia conversación]   ┌──────────────┐
        │ empty  │ ──────────────────────────▶  │ in_interview │
        └────────┘                              └──────┬───────┘
                                                       │ [A12 termina, sintetiza]
                                                       ▼
                                                ┌──────────────┐
                                                │  captured    │ ← borrador A12
                                                └──────┬───────┘
                                                       │ [aprendiz revisa y confirma]
                                                       ▼
                                                ┌──────────────────────┐
                                                │ confirmed_by_learner │ ← LOCKED
                                                └──────────────────────┘
                                                          │
                                                          │ [aprendiz solicita actualización
                                                          │  desde dashboard del curso, MVP-1.5]
                                                          ▼
                                                ┌──────────────────────┐
                                                │ updating             │
                                                └──────────┬───────────┘
                                                           │ [aprendiz reconfirma]
                                                           ▼
                                                ┌──────────────────────┐
                                                │ confirmed_by_learner │
                                                └──────────────────────┘
```

**Regla:** una vez `confirmed_by_learner`, el POA no se modifica sin transición explícita a `updating`. El A3 y el A4 NUNCA leen un POA en estado distinto de `confirmed_by_learner`.

### 4.3 `pdf` (PDF subido)

```
   ┌──────────┐  [aprendiz drag-drop]   ┌──────────────┐
   │  empty   │ ──────────────────────▶ │  uploaded    │
   └──────────┘                         └──────┬───────┘
                                               │ [A1 fase 1: extrae TOC + longitud]
                                               ▼
                                        ┌──────────────────┐
                                        │ structure_known  │
                                        └──────┬───────────┘
                                               │ [aprendiz asigna rol (D14)]
                                               ▼
                                        ┌──────────────────┐
                                        │  role_assigned   │
                                        └──────┬───────────┘
                                               │ [si length>80: A11 cura → chapter_curation]
                                               │ [si no: skip]
                                               ▼
                                        ┌──────────────────┐
                                        │ ready_to_ingest  │
                                        └──────┬───────────┘
                                               │ [job de ingestión arranca: A1 fase 2 extrae texto completo]
                                               ▼
                                        ┌──────────────────┐
                                        │ text_extracted   │
                                        └──────┬───────────┘
                                               │ [A2 procesa]
                                               ▼
                                        ┌──────────────────┐
                                        │  analyzed        │
                                        └──────┬───────────┘
                                               │ [A10 verifica cobertura]
                                               ▼
                                  ┌────────────┴────────────┐
                                  │                         │
                                  ▼                         ▼
                          ┌────────────┐           ┌──────────────┐
                          │ coverage_ok│           │ coverage_fail│
                          └─────┬──────┘           └──────┬───────┘
                                │                         │ [A2 reprocesa, max 3 iter]
                                │                         └─────┐
                                │                               │
                                │                               ▼
                                │                         ┌──────────────┐
                                │                         │ fail_review  │
                                │                         └──────────────┘
                                │ [A3 diseña, A7 audita]
                                ▼
                          ┌────────────┐
                          │   ready    │ ← unidades disponibles para sesión
                          └────────────┘
```

### 4.4 `sense_unit` (Unidad de sentido)

```
    ┌──────────┐  [A2 crea]   ┌──────────────┐  [A3 diseña con POA]   ┌──────────────┐
    │  draft   │ ───────────▶ │ analyzed     │ ─────────────────────▶ │  designed    │
    └──────────┘              └──────────────┘                        └──────┬───────┘
                                                                             │ [A7 audita]
                                                                             ▼
                                                                      ┌──────────────┐
                                                                      │  audited_ok  │
                                                                      └──────┬───────┘
                                                                             │ [A5 incluye en plan, prereqs cumplidos]
                                                                             ▼
                                                                      ┌──────────────┐
                                                                      │  available   │
                                                                      └──────┬───────┘
                                                                             │ [aprendiz inicia sesión]
                                                                             ▼
                                                                      ┌──────────────┐
                                                                      │ in_session   │
                                                                      └──────┬───────┘
                                                                             │ [A4 acredita PASS]
                                                                             ▼
                                                                      ┌──────────────┐
                                                                      │  mastered    │
                                                                      └──────────────┘
                                                                             ▲
                                                                             │ [A4 acredita FAIL → revisar]
                                                                      ┌──────┴───────┐
                                                                      │ needs_review │
                                                                      └──────────────┘
```

### 4.5 `learning_session` (Sesión de aprendizaje)

```
    [A5 calcula próxima unidad, aprendiz acepta empezar]
                       │
                       ▼
              ┌────────────────┐
              │  scheduled     │
              └───────┬────────┘
                      │ [aprendiz click "Empezar"]
                      ▼
              ┌────────────────┐
              │  started       │
              └───────┬────────┘
                      │ [aprendiz envía primer intento]
                      ▼
              ┌────────────────┐
              │  in_progress   │ ← turnos del diálogo aquí
              └───────┬────────┘
                      │ [A4 cierra diálogo, decisión PASS/FAIL]
                      ▼
              ┌────────────────┐
              │  evaluated     │
              └───────┬────────┘
                      │ [aprendiz envía artifact generativo]
                      ▼
              ┌────────────────┐
              │  closed        │
              └────────────────┘
```

**Estados de error:** `abandoned` (aprendiz cierra antes de evaluar) y `crashed` (cliente perdió conexión sin recuperarse en N minutos). Ambos preservan los turnos persistidos hasta el momento del fallo.

### 4.6 `sprint` (Sprint de aprendizaje, MVP-1 latente / MVP-2 activo)

```
    ┌──────────────┐  [aprendiz/A11 crea]   ┌──────────────┐
    │  not_started │ ───────────────────▶  │ in_progress  │
    └──────────────┘                       └──────┬───────┘
                                                  │ [todas las unidades del sprint mastered]
                                                  ▼
                                           ┌──────────────────────┐
                                           │ ready_for_integration│
                                           └──────────┬───────────┘
                                                      │ [A4 conduce diálogo integrador]
                                                      ▼
                                           ┌──────────────────────┐
                                           │ integrating          │
                                           └──────────┬───────────┘
                                                      │ [aprendiz envía tarea Tier 2/3]
                                                      ▼
                                           ┌──────────────────────┐
                                           │  completed           │
                                           └──────────────────────┘
```

### 4.7 `chapter_curation` (Curaduría de capítulos, MVP-2)

```
    ┌──────────┐  [A11 propone]    ┌──────────┐  [aprendiz acepta]  ┌──────────┐
    │  empty   │ ────────────────▶ │ proposed │ ──────────────────▶ │ confirmed│
    └──────────┘                   └────┬─────┘                     └──────────┘
                                        │ [aprendiz ajusta]
                                        ▼
                                   ┌──────────┐
                                   │ adjusting│
                                   └────┬─────┘
                                        │ [aprendiz reconfirma]
                                        ▼
                                   ┌──────────┐
                                   │ confirmed│
                                   └──────────┘
```

### 4.8 `pdf_role` (Rol de PDF en el corpus, D14)

```
    ┌──────────┐  [aprendiz asigna]  ┌──────────────────┐
    │   none   │ ──────────────────▶ │ assigned_by_     │
    └──────────┘                     │ learner          │
                                     └────────┬─────────┘
                                              │ [A2_corpus sugiere ajuste basado en POA y contenido]
                                              ▼
                                     ┌──────────────────┐
                                     │ adjustment_      │
                                     │ suggested        │
                                     └────────┬─────────┘
                                              │ [aprendiz acepta o mantiene]
                                              ▼
                                     ┌──────────────────┐
                                     │  confirmed       │
                                     └──────────────────┘
```

---

## 5. SIPOC del sistema completo

> **SIPOC** = Suppliers, Inputs, Process, Outputs, Customers. Vista macro de Socrates como sistema.

### 5.1 SIPOC de Socrates (todo el sistema)

| Suppliers | Inputs | Process | Outputs | Customers |
|---|---|---|---|---|
| Aprendiz doctoral | Datos personales mínimos (email) | Auth + creación de cuenta (D6 whitelist) | Cuenta activa | Aprendiz |
| Aprendiz | Nombre del curso, deadline | P1: Onboarding del curso | POA confirmado, course en `state=ingestion_ready` | Aprendiz, A11, A2, A3, A4 |
| Aprendiz | PDFs (artículos, capítulos, libros) | P1 (upload + curaduría) → P2 (ingestión) | Unidades de sentido, grafo, micro-lecciones diseñadas, audit reports | Aprendiz, A4, A5 |
| A2, A3 | Texto del PDF, POA | P2 (subprocesos analítico-pedagógicos) | sense_unit, productive_failure_problem, rubric, misconception_catalog, generative_task | A4, A5, A7 |
| A10 | sense_units, PDF chunks | P2 (verificación cobertura) | coverage_report, lista de párrafos huérfanos | A2 (loop), aprendiz (audit trail) |
| A7 | sense_units, citas, misconcepciones | P2 (auditoría fidelidad) | audit_report PASS/FAIL | A3 (loop), aprendiz (audit trail) |
| Aprendiz | Tiempo + intentos + respuestas en sesión | P3: Sesión de aprendizaje | message_log, attempts, artifacts, evaluations | A4, A5, BD, propio aprendiz |
| A4 | Unidad, rúbrica, catálogo, POA, historia del diálogo | P3 → P4 (decisión de acreditación) | hito_accreditation PASS/FAIL con evidencia | aprendiz, A5, BD |
| A5 | Decisiones de acreditación, fecha límite, velocidad observada | P3, P4 (recálculo de plan) | plan recalculado | aprendiz, próxima sesión |
| Claude API (Anthropic) | prompts + historia | A2, A3, A4, A7, A10, A11, A12 (todos) | respuestas LLM | agentes Socrates |
| GPT-4o (OpenAI) | PDF (visión) | A1 | texto extraído + estructura | A2, A11 |
| Supabase | esquema, RLS policies | persistencia | cada estado + cada artefacto | todos los procesos |
| Trigger.dev/Inngest | jobs encolados | orquestación de jobs largos | progreso, notificaciones | aprendiz, P2 |

### 5.2 Fronteras del sistema (qué Socrates NO hace)

- **No genera el contenido del PDF.** El PDF es input externo del aprendiz.
- **No entrega resúmenes al aprendiz.** El aprendiz aprende dialogando, no leyendo resúmenes.
- **No aprueba conocimiento sin diálogo.** Toda acreditación requiere diálogo socrático del A4.
- **No procesa textos sin POA confirmado.** El A3 y el A4 fallan si POA.state ≠ confirmed_by_learner.
- **No comparte datos del aprendiz con terceros.** Privacidad por RLS + buckets privados.

---

## 6. User Story Map con corte MVP-1 / MVP-1.5 / MVP-2

> **User Story Map (Patton):** organiza las historias en una columna vertical por cada gran actividad (backbone), con filas de detalle abajo cortadas por release. Esta es la visión a vuelo de pájaro que se traducirá a stories INVEST en Fase 3.

### 6.1 Backbone: las grandes actividades del aprendiz

```
┌───────────────────┐ ┌───────────────────┐ ┌───────────────────┐ ┌───────────────────┐ ┌───────────────────┐
│  Crear cuenta y   │ │  Empezar curso    │ │  Subir y curar    │ │  Aprender unidad  │ │  Cerrar curso     │
│  entrar           │ │  nuevo            │ │  material         │ │  por unidad       │ │                   │
└───────────────────┘ └───────────────────┘ └───────────────────┘ └───────────────────┘ └───────────────────┘
```

### 6.2 Mapa completo con cortes

| Backbone | MVP-1 | MVP-1.5 | MVP-2 |
|---|---|---|---|
| **Crear cuenta y entrar** | Sign-up por whitelist (admin invita), email+password, login/logout | Recovery password básico, perfil del aprendiz editable | OAuth (Google), 2FA opcional |
| **Empezar curso nuevo** | Crear curso (nombre + deadline), **A12 entrevista POA**, confirmar POA. Modo único = examen | Edición posterior del POA, modo del curso seleccionable (examen/seminario/presentación) | Múltiples cursos en paralelo, plantillas de POA reutilizables |
| **Subir y curar material** | Subir 1 PDF, asignar rol (default=principal), validar tipo y tamaño | **Subir N PDFs**, **asignar roles 5 categorías**, A2_corpus sugiere ajustes con razón, sprints temáticos manuales | **Modo libro con A11**, conversación de curaduría, niveles núcleo/rápida/referencial |
| **Procesar material (ingestión)** | Pipeline A1→A2→A10→A3→A7 sobre 1 PDF. Pantalla de progreso. FAIL_REVIEW si cobertura no alcanza | Multi-PDF: A2_corpus, A3_corpus, A10_corpus. Tipos de unidades multi-fuente | Modo libro completo, A11 sugiere sprints, optimización de costos por lotes |
| **Aprender unidad por unidad** | Sesión: fallo productivo → intento → instrucción → diálogo socrático A4 (con POA) → tarea generativa Tier 1 → acreditación. Plan A5 simple | Tier 2 generativo, skip directo a hito si aprendiz lo solicita, vista del grafo como mapa | A8 debrief semanal con progreso vs POA, A9 detección afectiva, A6 visuales generados, repetición espaciada FSRS |
| **Cerrar curso** | Dashboard con % cubierto, vista de unidades dominadas, exportar evidencia básica | Exportar portafolio de artifacts | Comparación intra-sujeto, métrica de Bastani, validación cuasi-experimental |

### 6.3 Walking skeleton del MVP-1 (las 12 historias mínimas)

> El walking skeleton es la lista mínima de historias que cuando funcionan extremo a extremo prueban que el sistema completo está vivo. El criterio: poder completar **un curso real con un PDF real** desde cero hasta dominio acreditado.

| # | Historia | Bloque | Razón de ser parte del walking skeleton |
|---|---|---|---|
| 1 | Sign-up por invitación + login | Auth | Sin auth no hay aprendiz |
| 2 | Crear curso (nombre + deadline) | Onboarding | Objeto raíz del sistema |
| 3 | **A12 conduce entrevista de POA** | Onboarding | Sin POA el A3 y A4 fallan |
| 4 | **Aprendiz confirma POA → estado locked** | Onboarding | Gate antes de subir PDFs |
| 5 | Subir 1 PDF, validar, asignar rol default | Onboarding | Input del pipeline |
| 6 | A1 extrae texto, A2 produce unidades, A10 verifica cobertura | Ingestión | Sin esto no hay material para enseñar |
| 7 | A3 diseña con POA en contexto, A7 audita | Ingestión | Sin diseño no hay sesión |
| 8 | Plan inicial: lista de unidades disponibles | Sesión | Visibilidad del estado |
| 9 | Sesión: fallo productivo → intento → instrucción → diálogo A4 con POA → acreditación | Sesión | Corazón del producto |
| 10 | Tarea generativa Tier 1 al cierre, persistir artifact | Sesión | Principio 6 mínimo |
| 11 | A5 recalcula plan, marca unidad como mastered | Sesión | Adaptatividad mínima |
| 12 | Dashboard: % cubierto, próxima unidad, deadline | Cierre | Retroalimentación al aprendiz |

**Si las 12 funcionan, el MVP-1 está vivo.** Cualquier feature adicional es Should/Could del MVP-1.

### 6.4 Cortes de release explícitos

```
                    │
           MVP-1    │  Walking skeleton: 12 historias arriba
                    │  + RLS desde día uno
                    │  + auditoría YUNQUE por feature
                    │
           ─────────┤
                    │
           MVP-1.5  │  Multi-PDF (D13 activo)
                    │  Sprints temáticos manuales (D16 con UI)
                    │  Roles de PDF activos (D14 con UI)
                    │  Tier 2 generativo
                    │
           ─────────┤
                    │
           MVP-2    │  Modo libro con A11 (D15 activo)
                    │  Acreditación de sprint con diálogo integrador (D16 completo)
                    │  A8 debrief con POA (D19 completo)
                    │  A9 detección afectiva
                    │  A6 visuales generados
                    │  FSRS
```

---

## 7. Riesgos identificados en Fase 2

| Riesgo | Severidad | Mitigación |
|---|---|---|
| El A12 captura un POA superficial que no permite calibrar al A3 | Alta | A12 hace follow-ups si detecta vaguedad. El POA capturado se muestra al aprendiz para confirmación explícita antes de lockear |
| El loop A2↔A10 entra en oscilación sin converger | Alta | Límite duro de 3 iteraciones. Después → FAIL_REVIEW manual con reporte estructurado al aprendiz |
| A4 acredita falsamente una unidad (PASS cuando debió FAIL) | Alta | En MVP-1 no hay mitigación automática (depende del juicio del A4). En MVP-2: muestreo aleatorio auditado por agente independiente. En todos los casos: evidencia recuperable del diálogo permite auditoría posterior del aprendiz |
| El POA se vuelve obsoleto a mitad de curso (cambia el objetivo del aprendiz) | Media | MVP-1.5 permite editar POA → re-locked. Las unidades ya diseñadas mantienen su diseño previo (no hay re-diseño retroactivo en MVP-1.5; sí en MVP-2) |
| Costo de tokens del POA (~5%) se acumula con el tiempo | Baja | Aceptado en Fase 1. Optimización: cachear POA en memoria del worker durante una sesión |
| Latencia del A4 degrada UX | Media | D3 diferida: empezar con Sonnet, escalar a Opus si calidad lo requiere. Target p95 < 5s |
| La curaduría del A11 se equivoca y descarta capítulos esenciales | Alta (en MVP-2) | A11 propone, aprendiz decide. Decisión final del aprendiz es vinculante. Razón trazada en BD |

---

## 8. Output: lo que esta Fase 2 entrega como input a la Fase 3

Para entrar a la Fase 3 de `/ingeniería` (Requisitos verificables), tenemos:

- ✅ Service Blueprint de los 4 procesos centrales con punto de fallo y punto de privacidad explícitos
- ✅ Modelo tripartito de Barros para los 4 procesos (producción / gestión / dirección + regla de oro de cada uno)
- ✅ State machines de las entidades clave con transiciones inválidas explícitas
- ✅ SIPOC del sistema completo + fronteras explícitas (qué Socrates NO hace)
- ✅ User Story Map con backbone + corte MVP-1/MVP-1.5/MVP-2
- ✅ **Walking skeleton del MVP-1 = 12 historias mínimas**
- ✅ Riesgos identificados con mitigación

**Lo que la Fase 3 producirá:**
- **Las 12 historias del walking skeleton en formato INVEST con criterios Given-When-Then ejecutables**
- 3+ ejemplos por historia (escenarios concretos de aceptación)
- Modelo de datos formal (DDL Postgres con RLS policies)
- NFRs medibles (latencia, costo, accesibilidad, seguridad)
- Definition of Ready y Definition of Done
- Mapeo de cada criterio a un check ejecutable de YUNQUE
