# 07 — Requisitos verificables (Fase 3 de /ingeniería)

> Producto de la Fase 3 de `/ingeniería` ejecutada el 2026-04-11.
> Esta fase responde a la pregunta: **¿Qué especificación verificable debe producir Socrates para que el agente auditor de YUNQUE pueda validar el código contra los requisitos?**
> Inputs: `docs/05_ESTRATEGIA.md` (Fase 1), `docs/06_PROCESOS.md` (Fase 2).
> Output: las 12 historias INVEST del walking skeleton del MVP-1 con criterios Given-When-Then ejecutables, modelo de datos formal con RLS, NFRs medibles, Definition of Ready / Done, mapeo a checks YUNQUE.

---

## 1. Marco general

### 1.1 Por qué Fase 3 es no negociable antes del código

**Regla IV&V del estándar de desarrollo del investigador:** el agente auditor debe recibir los requisitos, no solo el código. Sin requisitos formales, el auditor solo puede detectar defectos en lo implementado, no defectos en lo OMITIDO. La sesión 2026-04-09 (BITÁCORA construida sin protocolos) demostró el costo de saltarse Fase 3.

**Cada historia INVEST en este documento debe satisfacer:**

- **I**ndependent: no depende de otras historias para tener valor (excepto dependencias técnicas explícitas)
- **N**egotiable: el cómo se puede discutir
- **V**aluable: el aprendiz reconoce el valor sin que se le explique
- **E**stimable: el equipo puede dimensionarla
- **S**mall: cabe en un sprint corto
- **T**estable: tiene criterios Given-When-Then ejecutables, **mapeables a checks YUNQUE**

### 1.2 Alcance de este documento

Las **12 historias del walking skeleton del MVP-1** (definidas en `docs/06 § 6.3`). Las historias adicionales del MVP-1.5 y MVP-2 se especificarán al cierre del MVP-1, cuando haya código real para informar la formalización.

### 1.3 Convención de IDs

`HU-{walking skeleton number}.{caso}` — ej: `HU-3.1` es el caso 1 de la historia 3 (A12 conduce entrevista de POA).

`AC-{HU id}.{caso}` — criterio de aceptación.

`CHK-{YUNQUE check id}` — check verificable de YUNQUE asociado.

---

## 2. Las 12 historias INVEST del walking skeleton

### HU-1 — Sign-up por invitación + login

**Como** aprendiz invitado por el administrador de Socrates,
**quiero** crear mi cuenta usando el email de la invitación y poder iniciar sesión,
**para** acceder al sistema y crear mi primer curso doctoral.

**Justificación de valor:** sin auth no hay aprendiz. Sin whitelist no hay control de quién entra (D6).

**Definition of Ready:**
- Tabla `invited_users` con email + invited_at + invited_by existe
- Supabase Auth configurado en el proyecto
- Rate limiting de intentos de login configurado

**Criterios de aceptación (Given-When-Then):**

**AC-1.1** Sign-up exitoso de email invitado:
- **Given** existe una fila en `invited_users` con email `alejandro@example.com`
- **And** no existe una fila en `auth.users` con ese email
- **When** un usuario hace POST a `/api/auth/signup` con `{ email: "alejandro@example.com", password: "..." }`
- **Then** se crea una fila en `auth.users` con ese email
- **And** se devuelve un JWT de sesión válido
- **And** la respuesta tiene status 201

**AC-1.2** Sign-up rechazado de email NO invitado:
- **Given** NO existe una fila en `invited_users` con email `random@example.com`
- **When** un usuario hace POST a `/api/auth/signup` con `{ email: "random@example.com", password: "..." }`
- **Then** la respuesta tiene status 403 con `{ error: "email not in whitelist" }`
- **And** NO se crea ninguna fila en `auth.users`

**AC-1.3** Login exitoso:
- **Given** existe `auth.users` con email `alejandro@example.com` y password hasheado correctamente
- **When** un usuario hace POST a `/api/auth/login` con credenciales correctas
- **Then** la respuesta tiene status 200 con JWT válido

**AC-1.4** Login rechazado por credencial errónea:
- **Given** existe `auth.users` con email `alejandro@example.com`
- **When** un usuario hace POST a `/api/auth/login` con password incorrecta
- **Then** la respuesta tiene status 401 con mensaje genérico (NO revela si el email existe)

**Checks YUNQUE asociados:**
- `CHK-AUTH-001`: la tabla `invited_users` existe y tiene RLS habilitada
- `CHK-AUTH-002`: el endpoint `/api/auth/signup` valida whitelist antes de crear el usuario
- `CHK-AUTH-003`: el rate limiter del login está configurado (max 5 intentos / 15 min / IP)
- `CHK-SEC-001`: passwords almacenados con bcrypt o equivalente (Supabase nativo)

---

### HU-2 — Crear curso (nombre + deadline)

**Como** aprendiz autenticado,
**quiero** crear un curso nuevo con un nombre descriptivo y una fecha límite,
**para** tener un objeto raíz al cual asociar mi POA, mis PDFs y mis sesiones de aprendizaje.

**Definition of Ready:**
- Tabla `course` definida con esquema completo (ver § 4)
- RLS policy: `course.user_id = auth.uid()`
- Endpoint POST `/api/courses` definido

**Criterios de aceptación:**

**AC-2.1** Crear curso exitoso:
- **Given** un aprendiz autenticado con `user_id = U1`
- **When** hace POST a `/api/courses` con `{ name: "Capital social", deadline: "2026-06-15" }`
- **Then** se crea una fila en `course` con `user_id=U1`, `state=draft`, `name`, `deadline` proporcionados
- **And** la respuesta tiene status 201 con `{ id, state: "draft" }`

**AC-2.2** Validación de deadline futuro:
- **Given** un aprendiz autenticado
- **When** hace POST con `deadline` anterior a hoy
- **Then** la respuesta tiene status 400 con `{ error: "deadline must be in the future" }`

**AC-2.3** RLS impide ver cursos de otros usuarios:
- **Given** existen courses de `U1` y `U2`
- **When** `U2` hace GET a `/api/courses`
- **Then** la respuesta solo contiene cursos de `U2`, ninguno de `U1`
- **And** intento directo a la API REST de Supabase con JWT de `U2` también filtra por RLS

**Checks YUNQUE asociados:**
- `CHK-DATA-001`: tabla `course` tiene primary key, created_at, updated_at, user_id FK con ON DELETE CASCADE
- `CHK-RLS-001`: RLS habilitada en `course` con policy `user_id = auth.uid()`
- `CHK-DEFENSE-001`: el endpoint backend filtra por user_id en código además de confiar en RLS (defense-in-depth)

---

### HU-3 — A12 conduce entrevista de POA

**Como** aprendiz que acaba de crear un curso nuevo,
**quiero** conversar con el agente A12 (Entrevistador de objetivos) en una sesión de chat de 5-8 minutos,
**para** que Socrates capture quién soy, qué objetivo tengo, qué ya sé, y pueda calibrar todo el resto del sistema a mi contexto real (Ausubel estricto, las 3 condiciones del aprendizaje significativo).

**Definition of Ready:**
- Tabla `learner_objective_profile` existe con los 13 campos de los 3 componentes
- Endpoint streaming `/api/courses/:id/poa/interview` existe
- Prompt del A12 versionado en `prompts/a12_v1.txt`
- Modelo Claude Sonnet configurado con API key en env

**Criterios de aceptación:**

**AC-3.1** Inicio de la entrevista:
- **Given** un curso con `state=draft` y `poa.state=empty`
- **When** el aprendiz inicia la entrevista (POST `/api/courses/:id/poa/interview/start`)
- **Then** se crea una fila `learner_objective_profile` con `state=in_interview`
- **And** A12 emite la primera pregunta del Componente 1 (rol del aprendiz)
- **And** la pregunta se persiste en `message_log` con `agent=a12`

**AC-3.2** A12 hace follow-up cuando detecta respuesta vaga:
- **Given** una entrevista en curso con turno previo: pregunta sobre objetivo
- **When** el aprendiz responde "quiero entender mejor"
- **Then** A12 detecta vaguedad
- **And** A12 emite un follow-up: "¿Entender mejor para qué? ¿Hay un examen, un seminario, una discusión específica?"
- **And** el follow-up queda persistido en `message_log`

**AC-3.3** A12 sintetiza POA al cerrar la entrevista:
- **Given** una entrevista con respuestas suficientes para los 3 componentes
- **When** A12 detecta que tiene cobertura de los 13 campos
- **Then** A12 sintetiza un JSON con los 13 campos del POA
- **And** persiste el POA en `learner_objective_profile` con `state=captured`
- **And** muestra el POA al aprendiz en formato legible para confirmación

**AC-3.4** Aprendiz confirma POA:
- **Given** un POA con `state=captured`
- **When** el aprendiz hace POST `/api/courses/:id/poa/confirm`
- **Then** el POA pasa a `state=confirmed_by_learner` (locked)
- **And** el curso pasa a `state=poa_captured`
- **And** se setea `poa.confirmed_at = now()`

**AC-3.5** Aprendiz puede editar antes de confirmar:
- **Given** un POA con `state=captured`
- **When** el aprendiz edita uno de los 13 campos vía PATCH
- **Then** el POA se actualiza pero **mantiene** `state=captured` (no `confirmed`)
- **And** debe confirmarlo explícitamente para avanzar

**AC-3.6** El A3 NO puede leer un POA no confirmado:
- **Given** un POA con `state=captured` o `in_interview`
- **When** el A3 intenta cargar el POA del curso
- **Then** falla con error `POA_NOT_CONFIRMED` y la operación se aborta

**Checks YUNQUE asociados:**
- `CHK-DATA-002`: tabla `learner_objective_profile` con FK a `course`, los 13 campos, state machine constraint
- `CHK-RLS-002`: RLS en POA filtra por `course.user_id = auth.uid()`
- `CHK-AGENT-001`: el endpoint del A12 valida que el POA está en `state ∈ {empty, in_interview, captured}` antes de procesar
- `CHK-AGENT-002`: el A3 verifica `poa.state === 'confirmed_by_learner'` antes de leerlo (test adversarial: si state es otro, falla)
- `CHK-EVIDENCE-001`: cada turno de la entrevista del A12 queda persistido en `message_log` con timestamp + agent + content

---

### HU-4 — POA confirmado bloquea avance hasta tener PDFs

**Como** aprendiz con POA confirmado,
**quiero** que el sistema no me deje avanzar a la sesión hasta haber subido al menos 1 PDF,
**para** que el flujo respete el orden lógico (POA → corpus → ingestión → sesión) y nunca llegue al A3 sin material.

**Definition of Ready:**
- HU-3 implementada y pasando
- Tabla `pdf` existe con FK a `course`

**Criterios de aceptación:**

**AC-4.1** Bloqueo de transición sin PDFs:
- **Given** un curso con `state=poa_captured` y 0 PDFs subidos
- **When** el aprendiz intenta hacer POST `/api/courses/:id/process` para iniciar la ingestión
- **Then** la respuesta tiene status 409 con `{ error: "no PDFs uploaded" }`
- **And** el curso permanece en `state=poa_captured`

**AC-4.2** Transición habilitada con ≥1 PDF:
- **Given** un curso con `state=poa_captured` y 1 PDF en estado `role_assigned`
- **When** el aprendiz hace POST `/api/courses/:id/process`
- **Then** el curso transiciona a `state=ingesting`
- **And** se encola el job de ingestión

**Checks YUNQUE:**
- `CHK-FLOW-001`: state machine de `course` no permite `poa_captured → ingesting` directamente
- `CHK-FLOW-002`: tests adversariales que intentan bypassear cada transición inválida y verifican que falla

---

### HU-5 — Subir 1 PDF, validar y asignar rol default

**Como** aprendiz con POA confirmado,
**quiero** subir 1 PDF al curso, que el sistema valide tipo y tamaño, y que se le asigne un rol por defecto,
**para** tener material listo para procesamiento por el pipeline.

**Definition of Ready:**
- Supabase Storage configurado con bucket privado `pdfs`
- Tabla `pdf` con campos id, course_id, filename, size_bytes, mime_type, role, state, storage_path
- Endpoint POST `/api/courses/:id/pdfs` con multipart/form-data

**Criterios de aceptación:**

**AC-5.1** Upload exitoso de PDF válido:
- **Given** un curso con `state=poa_captured`
- **When** el aprendiz sube un archivo `.pdf` de 5 MB
- **Then** el archivo se persiste en `storage://pdfs/{user_id}/{course_id}/{pdf_id}.pdf`
- **And** se crea una fila en `pdf` con `state=uploaded`, `role=principal` (default), `mime_type=application/pdf`
- **And** la respuesta tiene status 201

**AC-5.2** Rechazo de archivo no-PDF:
- **Given** un curso válido
- **When** el aprendiz sube un `.docx`
- **Then** la respuesta tiene status 400 con `{ error: "only PDF files allowed" }`

**AC-5.3** Rechazo de archivo demasiado grande:
- **Given** un curso válido
- **When** el aprendiz sube un PDF de 60 MB (límite = 50 MB)
- **Then** la respuesta tiene status 413 con `{ error: "file too large, max 50 MB" }`

**AC-5.4** Bucket privado sin acceso público:
- **Given** un PDF subido en `storage://pdfs/U1/C1/P1.pdf`
- **When** un usuario no autenticado intenta GET `storage.url(P1.pdf)`
- **Then** la respuesta tiene status 403
- **And** solo signed URLs temporales del propio aprendiz dan acceso

**Checks YUNQUE:**
- `CHK-STORAGE-001`: bucket `pdfs` configurado como privado (no público)
- `CHK-STORAGE-002`: el endpoint valida MIME type y extensión antes de aceptar el upload
- `CHK-STORAGE-003`: límite de tamaño aplicado en backend, no solo en frontend
- `CHK-RLS-003`: RLS en `pdf` filtra por `course.user_id = auth.uid()` (vía join)

---

### HU-6 — A1 extrae texto, A2 produce unidades, A10 verifica cobertura 100%

**Como** sistema (job automatizado),
**quiero** que el pipeline A1 → A2 → A10 procese cada PDF del curso, extraiga el texto, descomponga en unidades de sentido y verifique cobertura del 100% del texto sustantivo,
**para** garantizar que el aprendiz nunca vea unidades de sentido construidas sobre un texto del que el A2 omitió pasajes.

**Definition of Ready:**
- API de OpenAI configurada (GPT-4o vision para A1)
- API de Anthropic configurada (Claude Opus para A2 y A10)
- Tablas `sense_unit`, `prerequisite_edge`, `glossary_term`, `coverage_report` definidas
- Prompts de A1, A2, A10 versionados

**Criterios de aceptación:**

**AC-6.1** A1 extrae texto del PDF:
- **Given** un PDF con `state=ready_to_ingest`
- **When** el job de A1 procesa el PDF
- **Then** se crea/actualiza el campo `pdf.full_text` con el texto extraído
- **And** `pdf.state` transiciona a `text_extracted`
- **And** el texto contiene >95% del texto del PDF (verificable por longitud comparada)

**AC-6.2** A2 produce ≥3 unidades de sentido para un PDF de >5 páginas:
- **Given** un PDF con `state=text_extracted` y >5 páginas
- **When** el job de A2 procesa el PDF
- **Then** se crean filas en `sense_unit` con `count >= 3`
- **And** cada unidad tiene `name`, `description`, `pdf_id`, `course_id`, `source_spans` con al menos 1 span
- **And** `pdf.state` transiciona a `analyzed`

**AC-6.3** A10 verifica cobertura 100% sustantiva (PASS):
- **Given** un PDF con `state=analyzed` y unidades del A2 que cubren todos los párrafos sustantivos
- **When** el job de A10 corre
- **Then** se crea fila `coverage_report` con `coverage_pct=100`, `orphan_paragraphs=[]`
- **And** `pdf.state` transiciona a `coverage_ok`

**AC-6.4** A10 detecta huérfanos y dispara loop A2↔A10:
- **Given** un PDF con `state=analyzed` y unidades que dejan huérfanos
- **When** el job de A10 corre
- **Then** `coverage_report.coverage_pct < 100`, `orphan_paragraphs` no vacío
- **And** se dispara una nueva ejecución del A2 con feedback (los párrafos huérfanos)
- **And** el contador `ingestion_iter` se incrementa

**AC-6.5** A10 rinde FAIL_REVIEW tras 3 iteraciones:
- **Given** un PDF que tras 3 iteraciones del loop A2↔A10 sigue teniendo huérfanos
- **When** el job de A10 corre la 4ta vez
- **Then** `pdf.state` transiciona a `fail_review`
- **And** se notifica al aprendiz con el reporte de huérfanos
- **And** el job no avanza al A3

**AC-6.6** No-coberturables son justificados:
- **Given** un PDF cuyo texto incluye encabezados, bibliografía, agradecimientos
- **When** el A10 procesa el reporte
- **Then** estos párrafos están en `coverage_report.non_coverable[]` con razón explícita
- **And** NO cuentan como huérfanos

**Checks YUNQUE:**
- `CHK-AGENT-003`: el A10 ejecuta en una llamada LLM independiente del A2 (sin compartir contexto)
- `CHK-AGENT-004`: límite de 3 iteraciones del loop A2↔A10 se aplica con contador en BD
- `CHK-EVIDENCE-002`: cada `coverage_report` tiene timestamp, iter_number, orphan_count, coverage_pct, lista de huérfanos con su contenido textual
- `CHK-DATA-003`: `sense_unit.source_spans` no puede estar vacío (constraint NOT NULL + length>0)

---

### HU-7 — A3 diseña con POA en contexto, A7 audita fidelidad

**Como** sistema (job automatizado),
**quiero** que el agente A3 diseñe la secuencia pedagógica completa de cada unidad de sentido **con el POA del curso como contexto**, y que el A7 audite que las citas son fieles al PDF y el catálogo de misconcepciones cubre los puntos contraintuitivos,
**para** que el aprendiz reciba lecciones calibradas a su objetivo real (Ausubel) y sin alucinaciones del LLM.

**Definition of Ready:**
- HU-3 (POA) y HU-6 (unidades + cobertura) implementadas
- Tablas `productive_failure_problem`, `canonical_instruction`, `rubric`, `misconception_catalog`, `generative_task`, `audit_report` definidas
- Prompts del A3 y A7 versionados

**Criterios de aceptación:**

**AC-7.1** A3 recibe POA en contexto:
- **Given** un PDF con `state=coverage_ok` y un POA del curso con `state=confirmed_by_learner`
- **When** el job del A3 corre para una unidad
- **Then** la llamada al LLM incluye el POA en el prompt (verificable por inspección de logs)
- **And** A3 produce los 5 artefactos: `productive_failure_problem`, `canonical_instruction`, `rubric`, `misconception_catalog`, `generative_task`

**AC-7.2** A3 falla si POA no está confirmado (test adversarial):
- **Given** un POA con `state=in_interview`
- **When** el job del A3 intenta correr
- **Then** falla con `POA_NOT_CONFIRMED` y NO crea ninguno de los 5 artefactos

**AC-7.3** Rúbrica calibrada al POA:
- **Given** un POA cuyo `target_challenge = "construir marco teórico para tesis"`
- **When** A3 produce la rúbrica de la unidad
- **Then** la rúbrica contiene **al menos 1 item específico** que conecta con "marco teórico" o "tesis" (verificable por LLM auditor o regex sobre rubric.items[])
- **And** la rúbrica también contiene los items universales del concepto

**AC-7.4** A7 verifica fidelidad de citas verbatim ≥99%:
- **Given** unidades con `canonical_instruction` y `misconception_catalog` producidos por A3
- **When** el A7 audita
- **Then** para cada cita verbatim del A3, A7 verifica que coincide con el `pdf.full_text` con similitud ≥99% (después de normalización de whitespace)
- **And** se crea `audit_report` con resultado PASS/FAIL por cita
- **And** si FAIL, A3 reprocesa esa unidad (max 3 iter)

**AC-7.5** A7 verifica catálogo de misconcepciones ≥3 items por unidad:
- **Given** una unidad con `misconception_catalog`
- **When** A7 audita
- **Then** verifica que `misconception_catalog.length >= 3`
- **And** cada misconcepción tiene `description`, `why_typical`, `detection_signal`, `reformulation`

**AC-7.6** Tarea generativa Tier 1:
- **Given** una unidad procesada por A3 en MVP-1
- **When** se inspecciona `generative_task`
- **Then** `task.tier === 1`, `task.max_words ∈ [80, 120]`, `task.format` es uno de {síntesis, tabla comparativa, ejemplos contextuales}

**Checks YUNQUE:**
- `CHK-AGENT-005`: el prompt del A3 incluye literalmente el POA serializado (test: inspección de prompt construido)
- `CHK-AGENT-006`: el A7 verifica fidelidad verbatim con umbral 99% (test: cita modificada en 1 palabra → FAIL)
- `CHK-EVIDENCE-003`: cada `audit_report` tiene `unit_id`, `cite_results[]`, `pass`, `iter`
- `CHK-DATA-004`: `rubric.items` tiene min length=5 (constraint en BD o validación de aplicación)

---

### HU-8 — Plan inicial: lista de unidades disponibles

**Como** aprendiz con un curso ingestado,
**quiero** ver el plan de aprendizaje del curso con la lista de unidades disponibles, su estado, y la próxima sugerida por el A5,
**para** entender qué tengo que aprender y por dónde empezar.

**Definition of Ready:**
- Tabla `learning_plan` con FK a course, contenido del plan
- Endpoint GET `/api/courses/:id/plan`

**Criterios de aceptación:**

**AC-8.1** Plan disponible cuando course.state=active:
- **Given** un curso con `state=active`
- **When** el aprendiz hace GET `/api/courses/:id/plan`
- **Then** la respuesta tiene status 200 con `{ units: [...], next_unit_id, deadline, progress_pct }`
- **And** las unidades incluyen al menos los campos `id`, `name`, `state`, `prereqs_satisfied`

**AC-8.2** Plan no disponible mientras course.state=ingesting:
- **Given** un curso con `state=ingesting`
- **When** el aprendiz hace GET `/api/courses/:id/plan`
- **Then** la respuesta tiene status 202 con `{ status: "ingesting", progress_pct }`

**AC-8.3** A5 calcula próxima unidad respetando prerequisitos:
- **Given** unidades U1, U2, U3 donde U2 depende de U1 y U3 depende de U2
- **When** se solicita `next_unit`
- **Then** mientras U1 no esté `mastered`, `next_unit_id == U1.id`
- **And** después de U1 mastered, `next_unit_id == U2.id`

**Checks YUNQUE:**
- `CHK-DATA-005`: tabla `prerequisite_edge` con `(from_unit, to_unit)` y constraint contra ciclos
- `CHK-LOGIC-001`: A5 nunca propone una unidad cuyas prereqs no estén `mastered`

---

### HU-9 — Sesión completa: fallo productivo → diálogo socrático A4 con POA → acreditación

**Como** aprendiz,
**quiero** vivir una sesión de aprendizaje completa de una unidad: empezar con un problema de fallo productivo (intento sin haber visto la instrucción), recibir luego la instrucción canónica, dialogar socráticamente con el A4 (que tiene el POA en contexto), y recibir una decisión PASS/FAIL trazable,
**para** que mi comprensión se construya por lucha cognitiva y no por consumo pasivo (Principio 1 + 3 del A9).

**Definition of Ready:**
- HU-7 implementada (A3 produjo todos los artefactos)
- Tabla `learning_session` con state machine
- Tabla `message_log`, `attempt`, `evaluation`
- Endpoint streaming `/api/sessions/:id/turn`

**Criterios de aceptación:**

**AC-9.1** Inicio de sesión:
- **Given** una unidad en `state=available`
- **When** el aprendiz hace POST `/api/sessions` con `{ unit_id }`
- **Then** se crea una fila `learning_session` con `state=started`
- **And** la respuesta incluye el `productive_failure_problem` de la unidad
- **And** NO incluye la `canonical_instruction` (todavía)

**AC-9.2** Aprendiz envía intento:
- **Given** una sesión con `state=started`
- **When** el aprendiz envía su intento de respuesta
- **Then** se persiste en `attempt` con `attempt_type=productive_failure`
- **And** sesión transiciona a `state=in_progress`
- **And** se devuelve la `canonical_instruction` en la respuesta

**AC-9.3** A4 conduce diálogo con POA en contexto:
- **Given** sesión `in_progress` con instrucción ya mostrada
- **When** el aprendiz envía un mensaje del diálogo
- **Then** A4 evalúa el mensaje contra `rubric` + `misconception_catalog` + POA
- **And** la llamada LLM del A4 incluye el POA en el prompt (verificable en logs)
- **And** A4 emite la siguiente pregunta o decide cierre del diálogo

**AC-9.4** Acreditación PASS con evidencia trazable:
- **Given** un diálogo donde A4 considera que hay evidencia suficiente de dominio
- **When** A4 cierra el diálogo
- **Then** se crea `hito_accreditation` con `result=PASS`, `unit_id`, `session_id`, `evidence: { message_log_ids, rubric_items_satisfied, misconceptions_avoided }`
- **And** `unit.state` transiciona a `mastered`
- **And** A5 recalcula el plan

**AC-9.5** Acreditación FAIL con razón:
- **Given** un diálogo donde A4 detecta misconcepciones persistentes
- **When** A4 cierra el diálogo con FAIL
- **Then** `hito_accreditation.result=FAIL`, `evidence.failed_rubric_items`, `evidence.detected_misconceptions`
- **And** `unit.state` transiciona a `needs_review`
- **And** A4 produce una reformulación/explicación adicional

**AC-9.6** Cada turno persistido sin pérdida:
- **Given** una sesión activa
- **When** el cliente del aprendiz se desconecta entre turnos
- **And** vuelve a conectarse a la misma sesión
- **Then** la sesión carga la historia completa de mensajes hasta el último turno persistido
- **And** ningún turno emitido por el A4 se pierde

**Checks YUNQUE:**
- `CHK-EVIDENCE-004`: toda fila `hito_accreditation` tiene `evidence` no vacío con al menos `message_log_ids` y `rubric_items_satisfied`
- `CHK-AGENT-007`: prompt del A4 incluye POA serializado
- `CHK-AGENT-008`: A4 NO puede emitir PASS sin que `rubric_items_satisfied.length >= rubric.items.length * 0.7` (70% de la rúbrica)
- `CHK-PERSISTENCE-001`: cada mensaje del diálogo se persiste antes de devolverse al cliente (write-then-respond)

---

### HU-10 — Tarea generativa Tier 1 al cierre, persistir artifact

**Como** aprendiz que acaba de acreditar el diálogo socrático de una unidad,
**quiero** producir una tarea generativa breve (síntesis 100 palabras, tabla comparativa, o 3 ejemplos contextualizados) y que se persista como artifact recuperable,
**para** dejar evidencia material de mi comprensión y empezar a acumular un portafolio de producciones (Principio 6 del A9).

**Definition of Ready:**
- HU-9 implementada
- Tabla `artifact` con campos: id, unit_id, session_id, format, content, word_count, created_at

**Criterios de aceptación:**

**AC-10.1** Tarea generativa visible al PASS del diálogo:
- **Given** una sesión donde A4 acreditó PASS del diálogo
- **When** la sesión transiciona a `evaluated`
- **Then** la respuesta del backend incluye el `generative_task` de la unidad
- **And** UI muestra caja de texto con el prompt de la tarea

**AC-10.2** Aprendiz envía artifact:
- **Given** una sesión `evaluated` con tarea generativa visible
- **When** el aprendiz envía contenido (texto)
- **Then** se crea fila `artifact` con `format = task.format`, `content`, `word_count`
- **And** la sesión transiciona a `closed`
- **And** la respuesta confirma persistencia

**AC-10.3** Validación de word count Tier 1:
- **Given** tarea Tier 1 con `max_words=100`
- **When** el aprendiz envía 250 palabras
- **Then** la respuesta tiene status 400 con `{ error: "exceeds Tier 1 max words", limit: 100 }`

**Checks YUNQUE:**
- `CHK-DATA-006`: tabla `artifact` con FK a unit y session, content NOT NULL
- `CHK-VALIDATION-001`: word count validado en backend antes de persistir

---

### HU-11 — A5 recalcula plan, marca unidad mastered

**Como** sistema (job síncrono al cierre de sesión),
**quiero** que el A5 recalcule el plan después de cada acreditación, actualizando la frontera de aprendibilidad y proyectando si se cumple el deadline,
**para** que el aprendiz vea siempre el siguiente paso sin tener que decidirlo manualmente.

**Definition of Ready:**
- HU-9 (acreditación) implementada
- A5 implementado como módulo de lógica (no LLM en MVP-1)

**Criterios de aceptación:**

**AC-11.1** Recálculo después de PASS:
- **Given** una unidad U1 que acaba de pasar a `mastered`
- **When** el A5 recalcula el plan
- **Then** la próxima unidad sugerida es la primera unidad en `available` cuyas prereqs estén satisfechas
- **And** el `progress_pct` del curso se actualiza
- **And** la `projected_finish_date` se recalcula contra el deadline

**AC-11.2** Recálculo después de FAIL:
- **Given** una unidad U1 que acaba de pasar a `needs_review`
- **When** el A5 recalcula
- **Then** U1 se reprograma para dentro de N días (calculable, no aleatorio)
- **And** la próxima unidad sugerida puede ser otra (avanzar otras paralelas)

**AC-11.3** Proyección de deadline alerta:
- **Given** un curso con velocidad observada que NO alcanza el deadline
- **When** A5 recalcula
- **Then** el plan incluye `at_risk: true` con `gap_days` calculado
- **And** la UI muestra alerta visible

**Checks YUNQUE:**
- `CHK-LOGIC-002`: A5 es determinístico (mismo input → mismo output, testeable)
- `CHK-LOGIC-003`: A5 nunca propone una unidad con prereqs no satisfechas

---

### HU-12 — Dashboard: % cubierto, próxima unidad, deadline

**Como** aprendiz,
**quiero** ver un dashboard del curso con porcentaje de unidades dominadas, próxima unidad sugerida, días al deadline, y alerta si voy lento,
**para** tener retroalimentación visual mínima sobre mi progreso.

**Definition of Ready:**
- HU-8 y HU-11 implementadas

**Criterios de aceptación:**

**AC-12.1** Dashboard básico:
- **Given** un curso `active`
- **When** el aprendiz hace GET `/api/courses/:id/dashboard`
- **Then** la respuesta incluye `{ progress_pct, mastered_count, total_units, next_unit, deadline, days_remaining, at_risk: boolean }`

**AC-12.2** Mostrar evidencia recuperable:
- **Given** una unidad mastered
- **When** el aprendiz hace GET `/api/units/:id/evidence`
- **Then** la respuesta incluye el `message_log` completo del diálogo + el `artifact` producido + la decisión de acreditación con razón

**Checks YUNQUE:**
- `CHK-UX-001`: dashboard accesible WCAG 2.1 AA (contraste 4.5:1, navegable por teclado)
- `CHK-EVIDENCE-005`: el endpoint de evidencia retorna el log completo, no resumido

---

## 3. Definition of Ready (transversal)

Para que cualquier historia entre a sprint:

1. La historia tiene **criterios Given-When-Then ejecutables** (no descripciones vagas)
2. Tiene **al menos 3 escenarios de aceptación** cubriendo happy path + 2 edge cases
3. **Mapea a checks YUNQUE específicos** (cada AC tiene al menos 1 CHK)
4. Tiene **dependencias explícitas** (qué historias previas deben estar `done`)
5. Tiene **estimación gruesa** (S/M/L/XL — XL debe partirse)
6. **Modelo de datos afectado** está documentado en § 4

## 4. Modelo de datos formal (DDL Postgres)

> Esquema MVP-1 que soporta D14-D19 (POA + roles + sprints + chapter_curation latentes). RLS habilitada en todas las tablas con datos de usuario.

```sql
-- ===== AUTH (Supabase nativo) =====
-- auth.users gestionado por Supabase

CREATE TABLE invited_users (
  email         TEXT PRIMARY KEY,
  invited_by    UUID REFERENCES auth.users(id),
  invited_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  signed_up_at  TIMESTAMPTZ
);
-- RLS: solo admin (rol específico) puede leer/escribir

-- ===== CURSO =====
CREATE TABLE course (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name        TEXT NOT NULL CHECK (length(name) BETWEEN 3 AND 200),
  deadline    DATE NOT NULL CHECK (deadline > current_date),
  state       TEXT NOT NULL CHECK (state IN (
                'draft','poa_captured','corpus_loaded','ingestion_ready',
                'ingesting','active','fail_review','paused','completed','archived'
              )) DEFAULT 'draft',
  mode        TEXT NOT NULL DEFAULT 'examen' CHECK (mode IN ('examen')),  -- MVP-1: solo examen
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_course_user_id ON course(user_id);
CREATE INDEX idx_course_state ON course(state);

ALTER TABLE course ENABLE ROW LEVEL SECURITY;
CREATE POLICY course_owner ON course FOR ALL USING (user_id = auth.uid());

-- ===== POA (D17, D18) =====
CREATE TABLE learner_objective_profile (
  id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id                UUID NOT NULL UNIQUE REFERENCES course(id) ON DELETE CASCADE,
  state                    TEXT NOT NULL CHECK (state IN (
                             'empty','in_interview','captured',
                             'confirmed_by_learner','updating'
                           )) DEFAULT 'empty',
  -- Componente 1: contexto del aprendiz
  learner_role             TEXT,
  discipline               TEXT,
  program                  TEXT,
  phase                    TEXT CHECK (phase IN ('starting','middle','closing','postdoctoral')),
  research_field           TEXT,
  -- Componente 2: objetivo del curso
  target_challenge         TEXT,
  target_capability        TEXT,
  success_signal           TEXT,
  target_deadline          DATE,
  -- Componente 3: conocimientos previos relevantes
  known_authors            TEXT[],
  prior_readings           TEXT[],
  prior_ideas              TEXT,
  theoretical_traditions   TEXT[],
  -- meta
  confirmed_at             TIMESTAMPTZ,
  created_at               TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at               TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_poa_course_id ON learner_objective_profile(course_id);

ALTER TABLE learner_objective_profile ENABLE ROW LEVEL SECURITY;
CREATE POLICY poa_owner ON learner_objective_profile FOR ALL USING (
  course_id IN (SELECT id FROM course WHERE user_id = auth.uid())
);

-- ===== PDF (D14: rol de PDF) =====
CREATE TABLE pdf (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id     UUID NOT NULL REFERENCES course(id) ON DELETE CASCADE,
  filename      TEXT NOT NULL,
  size_bytes    BIGINT NOT NULL CHECK (size_bytes > 0 AND size_bytes <= 52428800), -- 50 MB
  mime_type     TEXT NOT NULL CHECK (mime_type = 'application/pdf'),
  storage_path  TEXT NOT NULL UNIQUE,
  role          TEXT NOT NULL CHECK (role IN (
                  'principal','equivalente','complementario','referencial','contrapunto'
                )) DEFAULT 'principal',
  state         TEXT NOT NULL CHECK (state IN (
                  'uploaded','structure_known','role_assigned','ready_to_ingest',
                  'text_extracted','analyzed','coverage_ok','coverage_fail',
                  'ready','fail_review'
                )) DEFAULT 'uploaded',
  full_text     TEXT,
  toc           JSONB,
  length_pp     INT,
  ingestion_iter INT NOT NULL DEFAULT 0 CHECK (ingestion_iter <= 3),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_pdf_course_id ON pdf(course_id);
CREATE INDEX idx_pdf_state ON pdf(state);

ALTER TABLE pdf ENABLE ROW LEVEL SECURITY;
CREATE POLICY pdf_owner ON pdf FOR ALL USING (
  course_id IN (SELECT id FROM course WHERE user_id = auth.uid())
);

-- Auditoría de cambios de rol (D14, flujo híbrido)
CREATE TABLE pdf_role_history (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pdf_id          UUID NOT NULL REFERENCES pdf(id) ON DELETE CASCADE,
  proposed_by     TEXT NOT NULL CHECK (proposed_by IN ('learner','a2_corpus')),
  proposed_role   TEXT NOT NULL,
  decided_by      TEXT NOT NULL CHECK (decided_by IN ('learner')),
  final_role      TEXT NOT NULL,
  reason          TEXT,
  decided_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ===== CHAPTER CURATION (D15, MVP-2 funcional, MVP-1 latente) =====
CREATE TABLE chapter_curation (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pdf_id          UUID NOT NULL REFERENCES pdf(id) ON DELETE CASCADE,
  chapter_index   INT NOT NULL,
  chapter_title   TEXT NOT NULL,
  chapter_pp      INT NOT NULL,
  level           TEXT NOT NULL CHECK (level IN ('nucleo','rapida','referencial')),
  proposed_by     TEXT NOT NULL CHECK (proposed_by IN ('a11','learner')),
  reason          TEXT,
  state           TEXT NOT NULL CHECK (state IN ('proposed','adjusting','confirmed')) DEFAULT 'proposed',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (pdf_id, chapter_index)
);

-- ===== SPRINT (D16, MVP-1 latente con 1 sprint default) =====
CREATE TABLE sprint (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id       UUID NOT NULL REFERENCES course(id) ON DELETE CASCADE,
  name            TEXT NOT NULL DEFAULT 'default',
  strategy        TEXT NOT NULL CHECK (strategy IN ('layers','blocks','default')) DEFAULT 'default',
  order_in_course INT NOT NULL DEFAULT 1,
  state           TEXT NOT NULL CHECK (state IN (
                    'not_started','in_progress','ready_for_integration',
                    'integrating','completed'
                  )) DEFAULT 'not_started',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_sprint_course_id ON sprint(course_id);

ALTER TABLE sprint ENABLE ROW LEVEL SECURITY;
CREATE POLICY sprint_owner ON sprint FOR ALL USING (
  course_id IN (SELECT id FROM course WHERE user_id = auth.uid())
);

-- ===== UNIDAD DE SENTIDO (multi-PDF first-class por D13) =====
CREATE TABLE sense_unit (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id       UUID NOT NULL REFERENCES course(id) ON DELETE CASCADE,
  name            TEXT NOT NULL,
  description     TEXT NOT NULL,
  unit_type       TEXT NOT NULL CHECK (unit_type IN (
                    'mono_source','multi_source_convergent',
                    'multi_source_tension','integration'
                  )) DEFAULT 'mono_source',
  source_spans    JSONB NOT NULL CHECK (jsonb_array_length(source_spans) > 0),
  -- ej: [{ "pdf_id":"...", "start_offset":123, "end_offset":456, "paragraph_hash":"..." }]
  state           TEXT NOT NULL CHECK (state IN (
                    'draft','analyzed','designed','audited_ok','audited_fail',
                    'available','in_session','mastered','needs_review'
                  )) DEFAULT 'draft',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_sense_unit_course_id ON sense_unit(course_id);
CREATE INDEX idx_sense_unit_state ON sense_unit(state);

ALTER TABLE sense_unit ENABLE ROW LEVEL SECURITY;
CREATE POLICY unit_owner ON sense_unit FOR ALL USING (
  course_id IN (SELECT id FROM course WHERE user_id = auth.uid())
);

-- Asignación de unidades a sprints (M:N en MVP-2; default 1 sprint en MVP-1)
CREATE TABLE sense_unit_in_sprint (
  unit_id         UUID NOT NULL REFERENCES sense_unit(id) ON DELETE CASCADE,
  sprint_id       UUID NOT NULL REFERENCES sprint(id) ON DELETE CASCADE,
  order_in_sprint INT NOT NULL,
  PRIMARY KEY (unit_id, sprint_id)
);

-- Grafo de prerequisitos
CREATE TABLE prerequisite_edge (
  from_unit       UUID NOT NULL REFERENCES sense_unit(id) ON DELETE CASCADE,
  to_unit         UUID NOT NULL REFERENCES sense_unit(id) ON DELETE CASCADE,
  PRIMARY KEY (from_unit, to_unit),
  CHECK (from_unit <> to_unit)
);
-- Constraint contra ciclos: aplicado a nivel aplicación (test adversarial obligatorio)

-- ===== ARTEFACTOS PEDAGÓGICOS DEL A3 =====
CREATE TABLE productive_failure_problem (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_id     UUID NOT NULL UNIQUE REFERENCES sense_unit(id) ON DELETE CASCADE,
  content     TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE canonical_instruction (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_id     UUID NOT NULL UNIQUE REFERENCES sense_unit(id) ON DELETE CASCADE,
  content     TEXT NOT NULL,
  cited_spans JSONB NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE rubric (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_id     UUID NOT NULL UNIQUE REFERENCES sense_unit(id) ON DELETE CASCADE,
  items       JSONB NOT NULL CHECK (jsonb_array_length(items) >= 5),
  -- ej: [{ "id":"...", "description":"...", "scope":"universal|objective_specific" }]
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE misconception_catalog (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_id     UUID NOT NULL UNIQUE REFERENCES sense_unit(id) ON DELETE CASCADE,
  items       JSONB NOT NULL CHECK (jsonb_array_length(items) >= 3),
  -- ej: [{ "description","why_typical","detection_signal","reformulation" }]
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE generative_task (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_id     UUID NOT NULL UNIQUE REFERENCES sense_unit(id) ON DELETE CASCADE,
  tier        INT NOT NULL CHECK (tier IN (1,2,3)),
  format      TEXT NOT NULL,
  prompt      TEXT NOT NULL,
  max_words   INT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ===== AUDITORÍAS (A7 fidelidad, A10 cobertura) =====
CREATE TABLE audit_report (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_id     UUID NOT NULL REFERENCES sense_unit(id) ON DELETE CASCADE,
  agent       TEXT NOT NULL CHECK (agent IN ('a7')),
  iter        INT NOT NULL DEFAULT 1,
  cite_results JSONB NOT NULL,
  pass        BOOLEAN NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE coverage_report (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pdf_id          UUID NOT NULL REFERENCES pdf(id) ON DELETE CASCADE,
  iter            INT NOT NULL DEFAULT 1,
  coverage_pct    NUMERIC(5,2) NOT NULL,
  orphan_count    INT NOT NULL,
  orphan_paragraphs JSONB NOT NULL,
  non_coverable   JSONB NOT NULL,
  pass            BOOLEAN NOT NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ===== SESIÓN DE APRENDIZAJE =====
CREATE TABLE learning_session (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id   UUID NOT NULL REFERENCES course(id) ON DELETE CASCADE,
  unit_id     UUID NOT NULL REFERENCES sense_unit(id) ON DELETE CASCADE,
  state       TEXT NOT NULL CHECK (state IN (
                'scheduled','started','in_progress','evaluated','closed',
                'abandoned','crashed'
              )) DEFAULT 'scheduled',
  started_at  TIMESTAMPTZ,
  closed_at   TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_session_course_id ON learning_session(course_id);

ALTER TABLE learning_session ENABLE ROW LEVEL SECURITY;
CREATE POLICY session_owner ON learning_session FOR ALL USING (
  course_id IN (SELECT id FROM course WHERE user_id = auth.uid())
);

CREATE TABLE message_log (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id  UUID NOT NULL REFERENCES learning_session(id) ON DELETE CASCADE,
  agent       TEXT NOT NULL CHECK (agent IN ('a4','a12','a11','learner')),
  role        TEXT NOT NULL CHECK (role IN ('user','assistant','system')),
  content     TEXT NOT NULL,
  tokens      INT,
  latency_ms  INT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_message_log_session ON message_log(session_id, created_at);

CREATE TABLE attempt (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id    UUID NOT NULL REFERENCES learning_session(id) ON DELETE CASCADE,
  attempt_type  TEXT NOT NULL CHECK (attempt_type IN ('productive_failure','dialog_turn')),
  content       TEXT NOT NULL,
  evaluation    JSONB,  -- output del A4
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ===== ACREDITACIÓN =====
CREATE TABLE hito_accreditation (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_id     UUID NOT NULL REFERENCES sense_unit(id) ON DELETE CASCADE,
  session_id  UUID NOT NULL REFERENCES learning_session(id) ON DELETE CASCADE,
  result      TEXT NOT NULL CHECK (result IN ('PASS','FAIL')),
  evidence    JSONB NOT NULL CHECK (
                evidence ? 'message_log_ids'
                AND evidence ? 'rubric_items_satisfied'
              ),
  reason      TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_accreditation_unit ON hito_accreditation(unit_id);

-- ===== ARTIFACTS GENERATIVOS =====
CREATE TABLE artifact (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_id     UUID NOT NULL REFERENCES sense_unit(id) ON DELETE CASCADE,
  session_id  UUID NOT NULL REFERENCES learning_session(id) ON DELETE CASCADE,
  task_id     UUID NOT NULL REFERENCES generative_task(id),
  format      TEXT NOT NULL,
  content     TEXT NOT NULL,
  word_count  INT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ===== PLAN ADAPTATIVO (A5) =====
CREATE TABLE learning_plan (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id       UUID NOT NULL UNIQUE REFERENCES course(id) ON DELETE CASCADE,
  next_unit_id    UUID REFERENCES sense_unit(id),
  progress_pct    NUMERIC(5,2) NOT NULL DEFAULT 0,
  projected_finish DATE,
  at_risk         BOOLEAN NOT NULL DEFAULT false,
  gap_days        INT,
  recalculated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ===== INGESTION JOB (Trigger.dev/Inngest) =====
CREATE TABLE ingestion_job (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id   UUID NOT NULL REFERENCES course(id) ON DELETE CASCADE,
  state       TEXT NOT NULL CHECK (state IN (
                'queued','running','completed','failed','fail_review'
              )) DEFAULT 'queued',
  current_step TEXT,  -- 'a1','a2','a10','a3','a7'
  progress_pct NUMERIC(5,2) NOT NULL DEFAULT 0,
  error_msg   TEXT,
  started_at  TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ===== TELEMETRÍA (D8 esquema básico) =====
CREATE TABLE event_log (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID REFERENCES auth.users(id),
  course_id   UUID REFERENCES course(id),
  event_type  TEXT NOT NULL,
  payload     JSONB,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_event_log_user ON event_log(user_id, created_at);
CREATE INDEX idx_event_log_type ON event_log(event_type);
```

**Reglas comunes a todas las tablas:**
- Toda tabla con datos de usuario tiene RLS habilitada y policy `course_id IN (SELECT id FROM course WHERE user_id = auth.uid())` o equivalente
- Toda FK con `ON DELETE CASCADE` cuando el child no tiene sentido sin el parent (delete account = delete all data, cumple D9)
- `created_at` y `updated_at` con default `now()`
- Trigger BEFORE UPDATE actualiza `updated_at` automáticamente (función PL/pgSQL común)

---

## 5. NFRs medibles (Non-Functional Requirements)

| NFR | Métrica | Target MVP-1 | Cómo se mide |
|---|---|---|---|
| **Latencia del A4 (sesión)** | p95 de tiempo entre submit del aprendiz y respuesta del A4 | < 5 segundos | Telemetría: `event_log.event_type='a4_response'` con `latency_ms` |
| **Latencia del dashboard** | p95 GET `/api/courses/:id/dashboard` | < 500 ms | APM (Vercel Analytics o equivalente) |
| **Latencia de ingestión** | p95 tiempo total del job para 1 PDF de 30 pp | < 15 minutos | Telemetría: `ingestion_job.completed_at - started_at` |
| **Costo por curso** | Suma de tokens × precios de API por `course_id` | < $10.50 USD | Telemetría: `event_log` con `tokens` por cada llamada LLM |
| **Disponibilidad** | uptime del backend en horario de uso del aprendiz | > 99% | Vercel/Supabase status monitor |
| **Cobertura de tests** | unit tests para lógica de negocio | > 70% | YUNQUE check |
| **Cobertura adversarial** | tests que verifican que checks de enforcement fallan correctamente | 100% de los checks tienen al menos 1 test adversarial | YUNQUE check |
| **Accesibilidad** | Lighthouse Accessibility | > 90 | Lighthouse CI |
| **Seguridad** | npm audit | 0 vulnerabilidades críticas/altas | YUNQUE check |
| **Sin secrets en código** | grep adversarial sobre el repo | 0 hallazgos | YUNQUE check + git pre-commit hook |
| **RLS habilitada** | toda tabla con datos de usuario tiene `enable_row_security = true` | 100% | YUNQUE check (query a `pg_class`) |
| **Bundle del frontend** | tamaño del bundle inicial gzip | < 250 KB | Next.js build report |

---

## 6. Definition of Done (transversal)

Para que cualquier historia se considere `done`:

1. ✅ Todos los criterios Given-When-Then ejecutados como tests automáticos y pasando
2. ✅ Tests adversariales (al menos 1 por check de enforcement) ejecutados y pasando
3. ✅ **Agente auditor de YUNQUE Nivel 2** corrió `yunque audit` y produjo PASS para los checks aplicables (la lista de checks aplicables se mapea desde los AC)
4. ✅ **QA Report** incluido en la PR/commit, con sección `Roles`, `Checks`, `Evidence`, `Gaps`
5. ✅ Lighthouse CI (Performance > 85, Accessibility > 90) en la página afectada si aplica
6. ✅ Tests de RLS adversariales: intento de leer datos de otro usuario falla
7. ✅ Documentación actualizada (`PROJECT_STATE.md`, JSDoc en exportes públicos)
8. ✅ Código revisado por agente revisor separado (Nivel 2: implementador → verificador)
9. ✅ Sin TODOs sin fecha ni responsable
10. ✅ npm audit limpio o vulnerabilidades documentadas con justificación

---

## 7. Mapeo Stories → Sprints de implementación (Fase D)

> Estos son los sprints de IMPLEMENTACIÓN del MVP-1, distintos de los sprints de aprendizaje del producto. Cada sprint cierra cuando todas sus historias pasan DoD + auditoría YUNQUE.

| Sprint | Historias | Bloque | Auditoría YUNQUE al cierre |
|---|---|---|---|
| **S0 — Bootstrap** | (no hay HU) | Repo + Next.js + Supabase + Trigger.dev + env + CI + git pre-commit hook + YUNQUE installation | Setup CHK: 3 capas instaladas |
| **S1 — Auth + esquema base** | HU-1, HU-2 | Sign-up por whitelist + login + tabla `course` + RLS | CHK-AUTH-* + CHK-RLS-* + CHK-DEFENSE-* |
| **S2 — A12 + POA + state machine** | HU-3, HU-4 | Tabla `learner_objective_profile` + endpoint A12 streaming + flujo de confirmación + state machine de course | CHK-AGENT-001 a 002 + CHK-EVIDENCE-001 + CHK-FLOW-* |
| **S3 — Upload + A1 + A2 + A10** | HU-5, HU-6 | Upload PDF + bucket privado + A1 + A2 + A10 + loop + FAIL_REVIEW | CHK-STORAGE-* + CHK-AGENT-003 a 004 + CHK-EVIDENCE-002 |
| **S4 — A3 con POA + A7** | HU-7 | A3 con POA en contexto + A7 fidelidad + audit_report + reproceso | CHK-AGENT-005 a 006 + CHK-EVIDENCE-003 |
| **S5 — Sesión completa con A4** | HU-8, HU-9, HU-10, HU-11 | Plan + sesión + diálogo A4 con POA + acreditación + artifact + recálculo A5 | CHK-AGENT-007 a 008 + CHK-EVIDENCE-004 a 005 + CHK-PERSISTENCE-001 + CHK-LOGIC-* |
| **S6 — Dashboard + hardening** | HU-12 | Dashboard + endpoint de evidencia + lighthouse + a11y + security review final | CHK-UX-001 + CHK-VALIDATION-001 + auditoría YUNQUE completa final |

**Auditoría al cierre de cada sprint:**
1. Implementador (agente productor) entrega el código
2. Tests adversariales corren y pasan
3. **Agente auditor (Nivel 2, separado)** ejecuta `yunque audit` con los checks del sprint + verifica los AC contra el código
4. QA Report producido y agregado al commit
5. Si el auditor encuentra defectos: implementador corrige, auditor revalida (max 3 iter)
6. Si el sprint contiene código de enforcement (auth, RLS, validación): **adversario adicional** intenta bypasses

---

## 8. Output: lo que esta Fase 3 entrega como input a la Fase D (Implementación)

- ✅ 12 historias INVEST con criterios Given-When-Then ejecutables (3-6 AC por historia)
- ✅ Modelo de datos formal (DDL Postgres con RLS) cubriendo POA + roles + sprints + chapter_curation
- ✅ NFRs medibles con target y método de medición
- ✅ Definition of Ready y Definition of Done transversales
- ✅ Mapeo de cada AC a checks YUNQUE (CHK-*)
- ✅ Plan de sprints S0-S6 para Fase D, con auditoría por sprint

**Lo que la Fase D producirá:**
- Código de los 7 sprints, cada uno con auditoría YUNQUE PASS al cierre
- QA Report obligatorio en cada entregable
- BoK feedback loop activo: cualquier vulnerabilidad nueva descubierta se registra en `ENFORCEMENT_BODY_OF_KNOWLEDGE.md`
- MVP-1 funcional con el walking skeleton completo
