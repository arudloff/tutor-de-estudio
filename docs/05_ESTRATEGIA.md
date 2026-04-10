# 05 — Estrategia (Fase 1 de /ingeniería)

> Producto de la Fase 1 de `/ingeniería` ejecutada el 2026-04-10.
> Esta fase responde a la pregunta: **¿Por qué construir Socrates y no otra cosa?**
> Las decisiones aquí formalizadas son inputs verificables para la Fase 2 (Procesos) y Fase 3 (Requisitos).

---

## 1. Job To Be Done (formato canónico)

### Job funcional principal

> **Cuando** un aprendiz doctoral debe comprender profundamente un cuerpo de literatura académica antes de una fecha límite (seminario, examen, presentación, defensa, discusión con el asesor),
> **quiere** convertir el tiempo disponible (heterogéneo, fragmentado, presionado) en comprensión real verificable,
> **para** llegar al hito habiendo entendido y pudiendo defender lo entendido — no habiendo acumulado páginas leídas con sensación falsa de progreso.

### Job emocional

El aprendiz quiere **dejar de sentir** la ansiedad de la deuda de lectura, la frustración de re-leer sin retener, la sensación de impostor cuando descubre en discusión real que no comprendía lo que creía comprender, y el aislamiento intelectual de procesar literatura densa sin un interlocutor permanente. Quiere **empezar a sentir** progreso medible, capacidad demostrable, claridad sobre lo que sabe y lo que no, y la satisfacción epistémica de haber luchado con un concepto y ganado.

### Job social

El aprendiz quiere **ser percibido** como alguien que comprende el material, que puede dialogar críticamente con la literatura y con sus pares, y que llega preparado a las instancias académicas. Quiere evitar ser percibido como alguien que recita sin entender, que cita autores que no leyó, o que usa IA para producir output sin haber procesado el contenido.

### Lo que el job NO incluye

- No es resolver problemas de procrastinación general — el aprendiz que no quiere estudiar no es el cliente.
- No es producir resúmenes para citar — eso es exactamente la trampa de Bastani.
- No es la dimensión social del doctorado (relación con el asesor, política institucional, financiamiento).
- No es la escritura de la tesis — eso es trabajo del cluster doctoral con `/dr`, no de Socrates.

---

## 2. Value Proposition Canvas

### Perfil del aprendiz doctoral

**Jobs (en orden de prioridad):**
1. Comprender la literatura asignada con suficiente profundidad para discutirla
2. Conservar esa comprensión hasta el momento del hito (examen, seminario)
3. Integrar la literatura nueva con la ya leída (acumulación coherente del campo)
4. Defender la comprensión bajo cuestionamiento crítico
5. Producir artefactos académicos derivados (notas, resúmenes críticos, mapas conceptuales) que sirvan para la tesis

**Pains (lo que duele hoy):**
1. **Sobrecarga de lectura:** demasiados textos, demasiado densos, en demasiado poco tiempo.
2. **Re-lectura ineficaz:** subrayar y re-leer crea sensación de progreso sin producir comprensión.
3. **Ilusión de saber (fluency illusion):** el aprendiz no distingue entre "reconozco esto" y "comprendo esto" hasta que es expuesto en discusión real.
4. **Frustración del descubrimiento tardío:** descubrir en el seminario que no entendía cuando ya es tarde para corregir.
5. **Imposibilidad de retomar:** después de una pausa, no sabe por dónde seguir y debe re-empezar.
6. **Ansiedad de deadline:** la presión temporal degrada la calidad del estudio y aumenta cramming superficial.
7. **Aislamiento intelectual:** procesa solo, sin nadie con quien probar su comprensión antes de que cuente.
8. **Costo psicológico del fallo público:** preferir no hablar a hablar mal en discusión.
9. **Trampa de la IA mal usada:** usar ChatGPT para resumir produce desempeño aparente y atrofia real (Bastani et al., 2025).

**Gains (lo que el aprendiz desea):**
1. Comprensión que persiste cuando la herramienta no está disponible.
2. Capacidad de defender el concepto bajo preguntas adversariales.
3. Sentido de progreso medible y trazable.
4. Llegada preparada a cada hito sin último minuto.
5. Producciones académicas acumuladas que avanzan la tesis.
6. Visión clara del campo como mapa, no como pila de PDFs.
7. Detección temprana de los conceptos que aún no domina (antes del seminario, no durante).
8. Uso de IA que respeta su tiempo y su capacidad cognitiva.

### Propuesta de valor de Socrates

**Productos / servicios:**
- Tutor doctoral basado en IA que aplica los seis principios pedagógicos del A9.
- PWA con acceso desde escritorio (norma metodológica) y mobile (micro-dosis).
- Pipeline de ingestión: PDFs → unidades de sentido → grafo de prerequisitos → micro-lecciones.
- Diálogo socrático estructurado por expectativa-misconception.
- Acreditación trazable de hitos.
- Adaptación del plan al tiempo disponible y la velocidad observada.

**Pain relievers (uno por uno):**

| Pain | Cómo Socrates lo alivia |
|---|---|
| Sobrecarga de lectura | Descompone en unidades de sentido y prioriza por frontera de aprendibilidad |
| Re-lectura ineficaz | El principio de fallo productivo reemplaza la re-lectura por intentos cognitivos antes de la instrucción |
| Ilusión de saber | El diálogo socrático expone vacíos que la opción múltiple oculta |
| Descubrimiento tardío del no-saber | La acreditación por hito ocurre antes del seminario, no durante |
| Imposibilidad de retomar | El plan se recalcula con cada interacción; el dashboard muestra exactamente dónde retomar |
| Ansiedad de deadline | El plan se ajusta al tiempo disponible y proyecta en tiempo real si alcanza |
| Aislamiento intelectual | El sistema es interlocutor permanente, disponible cuando el asesor no |
| Costo del fallo público | El fallo productivo es privado y deliberado, no público y accidental |
| Trampa de la IA mal usada | Los seis principios garantizan que el sistema enseña en lugar de sustituir |

**Gain creators (uno por uno):**

| Gain | Cómo Socrates lo crea |
|---|---|
| Comprensión persistente sin la herramienta | Métrica de Bastani como criterio de éxito desde el diseño (la regla no negociable del producto) |
| Capacidad de defender bajo cuestionamiento | El diálogo socrático adversarial estructurado prepara exactamente para esa situación |
| Progreso medible y trazable | Dashboard con conceptos dominados, frontera actual, proyección a fecha |
| Llegada preparada a cada hito | Acreditación verificable por hito antes de la fecha real |
| Producciones acumuladas | Salida generativa estructurada (Principio 6) deja artefactos en cada sesión |
| Visión del campo como mapa | Grafo de prerequisitos visualizable como mapa del campo |
| Detección temprana del no-saber | El evaluador socrático lo detecta en el diálogo, no en el seminario |
| Uso respetuoso de la IA | Diseño explícito contra la paradoja de Bastani |

---

## 3. Impact Map

### WHY — Objetivo medible

> El aprendiz doctoral comprende profundamente la literatura asignada antes de su fecha límite, **conservando la comprensión sin la herramienta posterior al uso**. Métrica primaria: capacidad de discutir críticamente un concepto sin acceso a Socrates, evaluada por el propio investigador en uso real (semestre 1) y por evaluación cuasi-experimental con estudiantes (semestre 2-3).

### WHO — Actores que afectan el objetivo

| Actor | Cómo afecta el objetivo |
|---|---|
| **Aprendiz primario** (Alejandro inicialmente) | Es el usuario y la primera fuente de evidencia de eficacia |
| **Estudiantes del investigador** (fase 2) | Son la expansión del N para validación cuasi-experimental |
| **Asesor de tesis** | Stakeholder indirecto: si los aprendices llegan más preparados, el asesor lo nota |
| **Comité doctoral** | Stakeholder de validación: el A9 + Socrates es contribución doctoral |
| **Cluster doctoral previo (A1-A8)** | Marco teórico que Socrates operacionaliza |

### HOW — Cambios de comportamiento que buscamos

1. **Reemplazo de re-lectura por sesiones cortas de diálogo.** El aprendiz deja de subrayar y empieza a luchar con problemas antes de la instrucción.
2. **Producción en cada sesión.** El aprendiz deja de "leer y pasar al siguiente" y empieza a producir un artefacto por unidad estudiada.
3. **Interrupción de la ilusión de saber.** El aprendiz acepta cuando el sistema lo expone, en lugar de defender una comprensión superficial.
4. **Retorno diario.** El aprendiz vuelve cada día porque las sesiones son cortas y dejan progreso visible.
5. **Apertura a la verificación sin herramienta.** El aprendiz consiente medirse a sí mismo sin Socrates para validar la comprensión real.

### WHAT — Features que producen esos cambios

Mapeo cada cambio de comportamiento a las features que lo habilitan:

| Cambio buscado | Features que lo habilitan |
|---|---|
| Re-lectura → diálogo | Pipeline de ingestión, diseño de micro-lecciones con fallo productivo, evaluador socrático |
| Recibir → producir | Tarea generativa al cierre de cada sesión, portafolio acumulado |
| Defender ilusión → aceptar exposición | Diálogo socrático estructurado por expectativa-misconception (no opción múltiple) |
| Retorno diario | Plan adaptativo, dashboard de progreso, sesiones de 3-5 min en mobile, sesiones profundas en desktop |
| Verificación sin herramienta | Modo de acreditación de hito sin scaffolding, evidencia trazable del diálogo |

---

## 4. Clasificación Kano de las features

### BÁSICAS (must-have, sin esto no es Socrates)

- **Pipeline de ingestión funcional:** PDF → texto extraído → unidades de sentido → grafo de prerequisitos → micro-lecciones nivel L1-L3 con rúbricas y catálogos de misconcepciones.
- **Diálogo socrático estructurado:** evaluador con rúbrica + catálogo de misconcepciones, decisión de acreditación con evidencia trazable.
- **Acreditación de unidad:** decisión PASS/FAIL con log completo del diálogo.
- **Plan adaptativo:** recalculo según unidades acreditadas y tiempo restante.
- **Dashboard de progreso:** % cubierto, unidades dominadas, proyección a fecha límite.
- **Auth multi-usuario controlada:** para que el investigador y eventualmente sus estudiantes accedan.
- **RLS configurada:** privacidad de datos académicos desde día uno.

### PERFORMANCE (más es mejor — competitivas)

- **Calidad del chunking semántico:** entre mejor descomponga el texto en unidades, mejor todo lo demás.
- **Calidad de la evaluación de respuestas abiertas:** entre más fina la distinción comprensión/recitación, mayor el valor.
- **Velocidad de respuesta del evaluador:** latencia importa porque las sesiones son cortas.
- **Adaptabilidad del plan:** entre más rápido detecte cambios de velocidad, mejor.

### EXCITEMENT (diferenciadores — sorprenden cuando aparecen)

- **Skip directo a evaluación de hito:** el aprendiz dice "ya domino esto" y el sistema lo verifica con un diálogo de alto nivel, ahorrando lecciones intermedias.
- **Modo protégé inverso:** el aprendiz le enseña al sistema, el sistema hace preguntas naif estratégicas. (MVP-2)
- **Detección afectiva:** el sistema reconoce frustración o flujo y adapta el tono. (MVP-2)
- **Visuales generados a demanda:** mapas conceptuales, líneas de tiempo, diagramas de argumentación. (MVP-2)
- **Vista del grafo como mapa del campo:** el aprendiz ve su disciplina como territorio explorable.

### INDIFERENTE (no invertir aquí)

- Gamificación tipo Duolingo (XP, leaderboards, streaks). El target es académico maduro, no necesita azúcar conductual.
- Avatar del tutor con personalidad. Distrae del contenido.
- Sonidos y animaciones de feedback. Ruido cognitivo.
- Modo competitivo entre aprendices. Anti-patrón académico.

---

## 5. Priorización MoSCoW del MVP-1

### MUST HAVE (60% del esfuerzo del MVP-1)

| Feature | Justificación |
|---|---|
| Auth multi-usuario con control manual de invitaciones | D6 cerrada. Sin auth no hay aprendiz; sin control de invitaciones no hay límite de quién entra |
| Crear curso (nombre, fecha límite, modo único = examen) | Sin curso no hay objeto de aprendizaje |
| Subir 1+ PDFs como material del curso | Input mínimo del sistema |
| Pipeline de ingestión completo (A1+A2+A3+A7) | Sin esto no hay micro-lecciones |
| Vista del plan: lista de unidades pendientes y dominadas | Mínima visibilidad del estado |
| Sesión de aprendizaje con secuencia completa: fallo productivo → instrucción → diálogo socrático → tarea generativa | Es el corazón del producto |
| Diálogo socrático estructurado por expectativa-misconception | Principio 3, no negociable |
| Acreditación de unidad con evidencia trazable | Sin evidencia, no hay diferencia con un wrapper de ChatGPT |
| Recalculo del plan según unidades acreditadas y tiempo restante | Lo que hace adaptativo al sistema |
| Dashboard básico de progreso | Mínima retroalimentación al aprendiz |
| Persistencia de evidencia (event sourcing) | Trazabilidad obligatoria del estándar |
| RLS configurada en todas las tablas con datos de usuario | D5 cerrada. Privacidad desde día uno |

### SHOULD HAVE (20% del esfuerzo)

| Feature | Justificación |
|---|---|
| Skip a evaluación de hito si el aprendiz lo solicita | Respeto al conocimiento previo del aprendiz, ahorra tiempo |
| Vista del grafo de prerequisitos como mapa del campo | Visibilidad del territorio, motivación visual |
| Múltiples PDFs por curso | Realista para un curso doctoral típico |
| Selección del modo del curso (examen / presentación / seminario) | Calibra el nivel de profundidad esperado |
| Historial completo de diálogos del aprendiz | Útil para el propio aprendiz y para la auditoría posterior |
| Modo desktop completo + modo mobile reducido | D4 cerrada. Diferenciación de canales |

### COULD HAVE (20% del esfuerzo, si hay tiempo)

- Subida de PPTs (multimodal con GPT-4o)
- Notificaciones push para sesiones programadas (mobile)
- Exportar portafolio de producciones del aprendiz (PDF o markdown)
- Generación de un diagrama del grafo de prerequisitos como imagen exportable

### WON'T HAVE (this time, queda explícitamente fuera del MVP-1)

| Feature excluida | A qué MVP futuro pertenece |
|---|---|
| Detección afectiva con intervención calibrada (Principio 5) | MVP-2 |
| Modo protégé inverso (parte de Principio 4) | MVP-2 — en MVP-1 sólo hay modelado experto |
| Debrief metacognitivo semanal (agente A8) | MVP-2 |
| Repetición espaciada FSRS | MVP-2 — en MVP-1 la decisión es binaria dominado/no |
| Mapas conceptuales y visuales generados | MVP-2 |
| Niveles Bloom L4-L6 | MVP-2 — en MVP-1 cubrimos L1-L3 (Recordar, Comprender, Aplicar) |
| Pagos / cuotas / cobranza | Fuera del cluster doctoral |
| Multi-idioma | Fase 2 |
| Modo offline real (service worker pre-cache) | Fase 2 |
| Integración con Zotero / Mendeley | Fase 2 |
| API pública para terceros | Fase 2 o nunca |
| Modo colaborativo entre aprendices | Fase 3 |

---

## 6. Decisiones técnicas formalizadas

### D1 — Dónde vive la inteligencia ✅ CERRADA

**Decisión:** **Híbrido.**

- **Pre-generación (al ingestar el material, una vez por curso):** el grafo de prerequisitos, las unidades de sentido, las micro-lecciones base con su problema de fallo productivo, la instrucción canónica, la rúbrica de expectativas, el catálogo de misconcepciones típicas, y la tarea generativa.
- **Runtime LLM (cada vez que el aprendiz responde):** evaluación de respuestas abiertas contra la rúbrica, decisión de acreditación, reformulación cuando el diálogo no converge, generación del feedback personalizado de cierre.

**Por qué:** la pre-generación reduce el costo recurrente y la latencia. El runtime LLM se reserva para lo único que no se puede predecir: la respuesta específica del aprendiz. La cascada Sonnet → Opus (D3) opera dentro del runtime.

**Consecuencias:**
- El costo más alto del sistema es la ingestión inicial de un curso (one-time, amortizado en N sesiones).
- El runtime es predecible y controlable.
- La adaptabilidad pedagógica vive en el evaluador, no en el diseñador.
- El agente A3 (Diseñador instruccional) corre solo durante ingestión, lo que simplifica el runtime.

---

### D2 — Orquestación ✅ CERRADA

**Decisión:** **Sin n8n.** Flujos directos en Next.js API routes para operaciones cortas. **Trigger.dev** o **Inngest** para jobs largos (ingestión completa de un curso, que toma minutos).

**Por qué:**
- Elimina una pieza de infraestructura que el investigador debe mantener.
- Mejor privacidad: los textos académicos no pasan por un orquestador externo.
- Menor superficie operacional: menos cosas que pueden caerse.
- La visualización que ofrecía n8n se reemplaza con buen logging estructurado y un panel de admin que muestra el estado de cada job.

**Decisión secundaria (a confirmar en Fase 2):** Trigger.dev vs Inngest. Ambos tienen free tier suficiente para MVP-1. Comparación postergada hasta fase de implementación.

**Consecuencias:**
- El flujo de ingestión es un job largo que el aprendiz dispara y observa progresar (con SSE o polling).
- El flujo de sesión es síncrono y rápido (API route directa).
- Toda la orquestación es código TypeScript versionado en el repo.

---

### D4 — Stack frontend ✅ CERRADA (revisada)

**Decisión:** **Desktop-first como norma metodológica, mobile como complemento.** Next.js 14 con App Router, PWA con responsive design y dos layouts diferenciados.

**Por qué la revisión:** El aprendizaje doctoral profundo requiere subir PDFs, leer pasajes largos, diálogos extensos, producción de Tier 2-3 (300-500 palabras), revisión del dashboard y exploración del grafo del campo. Forzar todo a mobile sacrificaría profundidad por ubicuidad. La profundidad es exactamente lo que Socrates protege.

**Diferenciación de canales:**

| Función | Desktop (canónico) | Mobile (complemento) |
|---|---|---|
| Subir material de un curso | ✓ | — |
| Vista completa del plan | ✓ | Versión reducida |
| Sesión profunda con diálogo extenso | ✓ | — |
| Sesión corta de 3-5 min (micro-dosis) | ✓ | ✓ |
| Producción Tier 1 (síntesis 100 palabras) | ✓ | ✓ |
| Producción Tier 2-3 (300-500 palabras) | ✓ | — |
| Vista del grafo de prerequisitos | ✓ | Versión simplificada |
| Dashboard completo | ✓ | Versión reducida (próximas unidades, racha, alertas) |
| Notificaciones push de micro-dosis | — | ✓ |
| Lectura rápida de feedback | ✓ | ✓ |
| Configuración de horarios y preferencias | ✓ | — |

**Consecuencias:**
- Implementamos responsive design pero con dos vistas claramente diferenciadas, no una sola vista escalada.
- El backend es el mismo; sólo cambian los componentes visibles según breakpoint.
- En el MVP-1 priorizamos la experiencia desktop completa. La experiencia mobile reducida queda como Should Have.

---

### D5 — Backend ✅ CERRADA

**Decisión:** **Supabase todo en uno.** Auth + Postgres + Storage + Edge Functions (cuando aplique).

**Configuración obligatoria desde día uno:**
- RLS habilitada en todas las tablas con datos de usuario.
- Policy: cada query filtra por `user_id` o `course_id` propiedad del usuario autenticado.
- Defense-in-depth: las queries del backend también filtran por user_id en código, no confiar solo en RLS.
- Los PDFs en Supabase Storage con buckets privados y signed URLs para acceso temporal.
- Backups automáticos de Supabase activos desde el inicio.

**Por qué:**
- Velocidad de implementación crítica en MVP-1.
- Familiaridad del investigador.
- RLS de Postgres es mecanismo robusto para multi-tenancy con baja superficie de error.

---

### D6 — Modelo de operación ✅ CERRADA

**Decisión:** **Multi-usuario controlado desde día uno**, sin pagos, sin marketing, sin cuotas.

**Implementación:**
- Auth con Supabase (email + password en MVP-1).
- Tabla `invited_users` (whitelist) — solo emails preautorizados pueden registrarse.
- Sin pasarela de pago, sin flujo de recuperación de password complejo en MVP-1 (reset por admin manual si hace falta).
- Sin marketing público; el repo es privado.

**Por qué:**
- Agregar multi-usuario después de un MVP single-user es más caro que diseñar multi-usuario desde el inicio.
- Permite validación temprana con estudiantes del investigador sin construir una segunda versión.
- Mantiene Socrates dentro del cluster doctoral, no como producto comercial.

---

### D11 — Definición del MVP-1 ✅ CERRADA

**Decisión:** El MVP-1 es la versión más pequeña que entrega valor real al primer usuario (el investigador):

**Funcionalidad incluida:**
- Un curso por aprendiz (en MVP-1; multi-curso en MVP-2)
- Una fecha límite por curso
- 1 o más PDFs como material
- Modo único: examen (sin selector de modo en MVP-1; el modo es implícito)
- Niveles Bloom L1-L3 (Recordar, Comprender, Aplicar)
- Diálogo socrático estructurado básico (Principio 3 en versión funcional)
- Acreditación de unidad con evidencia trazable
- Plan adaptativo que respeta fecha límite y velocidad observada

**Agentes activos:**
- A1 — Lector (extracción de texto del PDF)
- A2 — Analista semántico (unidades de sentido + grafo de prerequisitos)
- A3 — Diseñador instruccional (micro-lecciones + rúbricas + catálogos)
- A4 — Evaluador socrático (diálogo + decisión de acreditación)
- A7 — Auditor de calidad (verifica fidelidad antes de entregar al aprendiz)

**Agentes diferidos a MVP-2:**
- A5 — Adaptador FSRS (en MVP-1 la adaptación es algorítmica simple)
- A6 — Productor visual (sin visuales generados)
- A8 — Coach metacognitivo (sin debrief semanal)
- A9 — Detector afectivo (sin detección de estado)

**Principios pedagógicos cubiertos en MVP-1:**
- ✓ Principio 1 (Fallo productivo)
- ✓ Principio 2 (Grafo de prerequisitos + frontera de aprendibilidad)
- ✓ Principio 3 (Diálogo socrático estructurado)
- ⚠ Principio 4 (Aprendizaje cognitivo + protégé inverso) — sólo modelado experto, sin protégé inverso
- ✗ Principio 5 (Detección afectiva) — diferido a MVP-2
- ⚠ Principio 6 (Salida generativa) — sí Tier 1, parcialmente Tier 2, sin Tier 3 todavía

**Por qué este recorte:**
- Cubre los principios fundacionales 1, 2, 3 que son los más distintivos del A9.
- Permite validar el pipeline completo de ingestión + sesión + acreditación con el menor número de variables.
- El propio investigador puede ser el primer usuario en menos de [estimación pendiente].
- Las features diferidas (MVP-2) son mejoras incrementales sobre un sistema ya funcional, no reescrituras.

---

### Decisiones que quedan abiertas (no bloquean MVP-1)

| ID | Razón de no cerrarse ahora |
|---|---|
| D3 — Modelo evaluador (cascada Sonnet→Opus o solo Opus) | Decisión de calibración. Empezamos con Sonnet siempre y subimos a cascada o a Opus si la evaluación degrada. Se cierra en fase de implementación. |
| D7 — Errores y caídas | Fase 2 del producto. MVP-1 puede usar fail-closed con buen mensaje de error. |
| D8 — Telemetría detallada | Esquema de eventos básico en MVP-1, sofisticación en MVP-2. |
| D9 — Privacidad detallada | Política de privacidad mínima viable antes del primer usuario no-investigador. MVP-1 sólo es para el investigador. |
| D10 — Validación empírica | Diseño cuasi-experimental para MVP-2 cuando haya N>1. |

---

## 7. Métricas de éxito del MVP-1

### Métricas obligatorias

| Métrica | Target | Cómo se mide |
|---|---|---|
| **El investigador completa al menos 1 curso real con Socrates** | 1 curso completo en el primer trimestre de uso | Auto-reporte + evidencia trazable en la base de datos |
| **Cada acreditación tiene evidencia recuperable** | 100% | Query a la tabla de eventos: cada decisión de acreditación tiene log de diálogo asociado |
| **Costo de API por curso completo** | < $10 USD | Suma de tokens consumidos × precios de API, por `course_id` |
| **Latencia del evaluador (p95)** | < 5 segundos | Telemetría: `eval_response_time_p95` por sesión |
| **Tasa de retención del usuario único (investigador)** | ≥ 5 días/semana durante el período de uso | Eventos de login por día |
| **Precisión de la acreditación (cualitativa)** | El investigador no acredita unidades que en discusión real demuestra no entender | Auto-reporte mensual |
| **Latencia de ingestión de un curso (p95)** | < 15 minutos para un curso de 5 PDFs | Telemetría: `ingestion_duration` por curso |

### Métricas que NO se miden en MVP-1

- **Comparación con grupo control** — requiere N>1 y diseño cuasi-experimental, va en MVP-2.
- **Aprendizaje sin la herramienta (métrica de Bastani)** — requiere protocolo cuasi-experimental, va en MVP-2 con D10.
- **NPS o satisfacción multi-usuario** — sólo hay un usuario.
- **Engagement de tipo Duolingo (DAU, WAU, retention curves)** — métrica de producto comercial, no aplica.

### Criterio de avance a MVP-2

**El MVP-1 se declara exitoso (y se cierra para empezar MVP-2) cuando:**
1. El investigador ha completado un curso real.
2. La trazabilidad de cada acreditación es verificable.
3. El investigador reporta cualitativamente que la comprensión persistió en una discusión real con su asesor.
4. El costo es viable.

Si una de estas condiciones no se cumple, el MVP-1 se itera (no se avanza) hasta que se cumpla.

---

## 8. Restricciones críticas (no negociables)

1. **El comportamiento socrático no es opcional.** Si el sistema empieza a entregar respuestas en lugar de preguntas, deja de ser Socrates.
2. **Toda interacción produce evidencia estructurada.** No se puede declarar que un hito de aprendizaje fue alcanzado sin un diálogo socrático que lo verificó.
3. **El tiempo del aprendiz es sagrado.** Latencia importa.
4. **Privacidad de datos académicos.** Los textos del aprendiz pueden ser borradores no publicados o material protegido. RLS desde día uno.
5. **Costo controlado.** Cada interacción tiene un costo. El sistema debe ser viable para uso diario sostenido.
6. **Desktop como norma metodológica, mobile como complemento.**
7. **Separación de roles en el sistema mismo.** El agente A3 (diseñador) no es el mismo que A4 (evaluador), y el A7 (auditor) verifica el output del A3 antes de que el aprendiz lo vea. Esta es la traducción interna del Principio IV&V del estándar de desarrollo.

---

## 9. Registro de decisiones de la Fase 1

| Decisión | Fecha | Estado | Documento |
|---|---|---|---|
| Codename Socrates | 2026-04-10 | Cerrada | README, PROJECT_STATE |
| Repo público en arudloff/tutor-de-estudio | 2026-04-10 | Cerrada | git remote |
| Multi-agente con separación de roles | 2026-04-10 | Cerrada | docs/03 |
| D1 — Inteligencia híbrida (pre-gen + runtime LLM acotado) | 2026-04-10 | Cerrada | este doc § 6 |
| D2 — Sin n8n, Next.js routes + Trigger.dev/Inngest | 2026-04-10 | Cerrada | este doc § 6 |
| D4 — Desktop-first norma + mobile complemento | 2026-04-10 | Cerrada (revisada) | este doc § 6 |
| D5 — Supabase todo en uno con RLS día uno | 2026-04-10 | Cerrada | este doc § 6 |
| D6 — Multi-usuario controlado desde día uno | 2026-04-10 | Cerrada | este doc § 6 |
| D11 — Definición de MVP-1 (4 agentes, P1-P3, modo único, L1-L3) | 2026-04-10 | Cerrada | este doc § 6 |
| D3 — Cascada Sonnet→Opus | 2026-04-10 | Diferida a implementación | docs/04 |
| D7-D10 | 2026-04-10 | Diferidas a MVP-2 o posterior | docs/04 |

---

## 10. Output: lo que esta Fase 1 entrega como input para la Fase 2

Para entrar a la Fase 2 de `/ingeniería` (Diseño de Procesos), tenemos:

- ✅ JTBD canónico que define el job que el sistema debe servir
- ✅ Pains y gains mapeados con relievers/creators específicos
- ✅ Impact map del objetivo a las features
- ✅ Features clasificadas por Kano
- ✅ MoSCoW completo del MVP-1 con tres procesos centrales identificados:
  1. **Ingestión de material** (subir PDFs → grafo + lecciones base)
  2. **Sesión de aprendizaje** (notificación → micro-lección → diálogo → acreditación)
  3. **Acreditación de hito** (diálogo socrático estructurado → decisión PASS/FAIL → recalculo)
- ✅ Decisiones técnicas bloqueantes resueltas (D1, D2, D4, D5, D6, D11)
- ✅ Métricas de éxito definidas
- ✅ Restricciones críticas explícitas

**Lo que la Fase 2 producirá:**
- Service blueprint del proceso central (sesión de aprendizaje)
- Modelo tripartito de Barros para los tres procesos centrales
- State machines para curso, unidad, sesión y hito
- SIPOC del sistema completo
- User Story Map con corte explícito MVP-1
