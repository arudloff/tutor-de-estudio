# 99 — Decisiones propuestas pendientes de confirmación

> **Estado:** Propuestas articuladas al cierre de la sesión del 2026-04-10 pero NO confirmadas por el investigador.
> **Al retomar:** revisar este documento primero, responder las confirmaciones, y recién entonces tocar docs/03, docs/04, docs/05.
> **NO mover a estado CERRADA sin confirmación explícita del investigador.**

---

## Contexto de origen

Al final de la sesión del 2026-04-10 emergieron dos ideas del investigador que requieren formalización antes de avanzar a Fase 2 de /ingeniería:

**Idea A** (Mensaje del investigador): "al incorporar varios pdf sería importante indicar el rol de cada uno... lo otro que soporte que algunos pdf sean libros, tal vez en caso de pdf muy extensos solo permita uno o subdivida y cree una suerte de sprints de aprendizaje por capa de profundidad o por bloques de unidades temáticas, tal vez todas esas decisiones se deben ir tomando en conjunto con el usuario".

**Idea B** (Mensaje del investigador): "socrates debe también conocer el objetivo del aprendiz, qué desafío espera resolver por medio de este aprendizaje, para qué espera estar habilitado luego de recorrer esta experiencia de aprendizaje. Eso es lo otro a tener en cuenta es que socrates por medio de este diseño instruccional y diálogo socrático, lo que hace es diseña e implementa una experiencia de aprendizaje significativo".

Claude propuso seis decisiones para cerrar estas ideas (D14-D16 de la Idea A, D17-D19 de la Idea B), pero el investigador pidió respaldar todo antes de confirmar. Las propuestas quedan aquí en estado PROPUESTA, listas para confirmación al retomar.

---

## D14 (PROPUESTA) — Roles explícitos de PDFs en el corpus

**Pregunta:** ¿Cómo el aprendiz declara el rol de cada PDF del corpus, y cómo Socrates trata esa información?

**Propuesta de taxonomía — 5 roles:**

| Rol | Significado | Implicación pedagógica |
|---|---|---|
| **Principal** | El texto central del curso o de una unidad temática. Fuente de los conceptos fundamentales. Puede haber varios. | Sus unidades tienen peso completo en el grafo, todas sus misconcepciones entran al catálogo, sus afirmaciones citables son prioritarias en el diseño de rúbricas |
| **Equivalente** | Texto al mismo nivel que otro principal. Funcionalmente intercambiable en ciertos contextos. | Sus unidades se fusionan con las del principal compatible en unidades multi-fuente convergente |
| **Complementario** | Texto que amplía, ejemplifica, aplica o matiza a los principales. No aporta conceptos nuevos fundamentales pero enriquece los que hay. | Sus unidades se marcan como extensiones. Entran al grafo como nodos hoja que no bloquean el avance. Catálogo de misconcepciones hereda solo las suyas propias |
| **Referencial** | Texto citado como apoyo, fuente original o lectura recomendada que el aprendiz NO debe dominar en profundidad. | Sus unidades NO entran al grafo de aprendibilidad. El A4 puede consultar su contenido en runtime para responder preguntas del aprendiz pero no se le evalúa comprensión |
| **Contrapunto** | Texto incluido deliberadamente porque contradice o tensiona a los principales. Su valor está en la tensión. | Sus unidades generan específicamente unidades multi-fuente en tensión en el diseño integrado. El A4 puede presentar preguntas adversariales que exigen posicionarse |

**Propuesta de flujo de asignación — Híbrido:**

El aprendiz propone al subir cada PDF (control manual del investigador). Después de la Fase 1 del pipeline de ingestión (análisis individual, antes del cruce inter-textual), el A2_corpus inspecciona la propuesta, la contrasta con lo que ve en los textos, y puede sugerir ajustes justificados ("el PDF que marcaste como complementario parece contener el concepto X que no aparece en los principales — ¿seguro que es complementario y no equivalente?"). El aprendiz acepta, rechaza o mantiene. La decisión final es del aprendiz. La razón de cada decisión queda trazada.

**Estado:** PROPUESTA. El investigador no confirmó.

**Pregunta para confirmación:** ¿Taxonomía de 5 roles OK? ¿Alguno sobra o falta? ¿Flujo híbrido de asignación (aprendiz propone, A2_corpus sugiere, aprendiz decide) OK?

---

## D15 (PROPUESTA) — Modo libro y conversación de curaduría

**Pregunta:** ¿Cómo procesa Socrates PDFs extensos (libros, capítulos largos) sin violar la regla de cobertura del 100% y sin desperdiciar tokens procesando capítulos que el aprendiz no necesita dominar?

**Propuesta de tres modos de procesamiento por tamaño:**

| Tamaño del PDF | Modo de procesamiento |
|---|---|
| Hasta ~30 páginas (artículo estándar) | Modo artículo: una sola pasada del A2, cobertura 100% como siempre |
| 30-80 páginas (capítulo largo o working paper extenso) | Modo capítulo: el A1 detecta la estructura de secciones, el A2 procesa por secciones en paralelo y después integra, cobertura del A10 se calcula globalmente |
| 80+ páginas (libro o parte de libro) | Modo libro: requiere **conversación de curaduría** con el aprendiz antes de procesar |

**Propuesta de flujo en modo libro:**

1. El A1 extrae solo la estructura: tabla de contenidos, títulos de capítulo, extensión de cada capítulo.
2. Un agente nuevo (propuesto como **A11 — Curador de corpus**) conduce una conversación estructurada con el aprendiz:
   - ¿Qué capítulos son esenciales para tu objetivo con este curso?
   - ¿Hay capítulos que el autor o el asesor te dijo que puedes saltar?
   - ¿Este libro es principal, complementario, referencial? (conecta con D14)
   - ¿Tu objetivo es comprensión profunda de todo o dominio selectivo de capítulos clave?
3. El A11 propone una curaduría con base en la conversación: "Capítulos 1, 3, 4, 7 como núcleo de dominio; capítulos 2, 5 como lectura rápida sin acreditación profunda; capítulos 6, 8, 9 como referenciales descartados".
4. El aprendiz acepta, ajusta o rechaza.
5. Solo los capítulos "núcleo de dominio" se procesan con el pipeline completo (A2 + A10 + A3 + A7). Los "lectura rápida" se procesan con versión ligera (A2 extrae unidades pero A3 genera solo instrucción canónica breve sin fallo productivo ni catálogo expandido). Los "referenciales" no se procesan — quedan disponibles para consulta del A4 en runtime si el aprendiz pregunta algo específico.

**Cobertura del 100% en modo libro:** se calcula solo sobre los capítulos "núcleo de dominio", no sobre el libro completo. Los capítulos "lectura rápida" y "referenciales" tienen su propio régimen de cobertura (parcial, documentado).

**Estado:** PROPUESTA. El investigador no confirmó.

**Pregunta para confirmación:** ¿Tres modos por tamaño OK? ¿A11 como agente nuevo (separado del A10 y el A7) OK? ¿Los tres niveles de procesamiento dentro de modo libro (núcleo/lectura rápida/referencial) OK?

---

## D16 (PROPUESTA) — Sprints de aprendizaje como concepto de primera clase

**Pregunta:** ¿Cómo se organiza el aprendizaje cuando el corpus es grande (libro, multi-PDF extenso) y no se puede recorrer linealmente?

**Propuesta — Concepto de sprint de aprendizaje:**

Un sprint es un bloque temático coherente con su propio arco pedagógico:

```
SPRINT DE APRENDIZAJE
├── Puerta de entrada: problema de fallo productivo que abre el bloque
├── N unidades de sentido ordenadas por el grafo de prerequisitos
├── Conexiones explícitas con sprints anteriores
├── Acreditación del sprint: diálogo socrático que integra las unidades
└── Producción de cierre del sprint: tarea generativa Tier 2 o 3 que exige síntesis
```

El aprendiz acredita el sprint completo cuando puede integrar sus unidades en una respuesta coherente, no unidad por unidad.

**Dos estrategias de división en sprints:**

| Estrategia | Criterio | Cuándo usarla |
|---|---|---|
| **Por capas de profundidad** | El mismo material se recorre varias veces, cada vez profundizando (Bloom L1-L2 primero, L3-L4 después, L5-L6 al final) | Cuando el material es complejo y el aprendiz tiene tiempo — permite consolidación espaciada |
| **Por bloques temáticos** | El material se divide en secciones temáticas independientes, cada una dominada en profundidad antes de pasar al siguiente | Cuando hay presión de tiempo o cuando el material tiene estructura naturalmente modular |

El aprendiz elige la estrategia en la conversación con el A11, informado por la sugerencia del A2_corpus según el carácter del texto.

**Activación por MVP:**
- **MVP-1 (1 PDF/curso):** modelo de datos soporta sprints pero la funcionalidad no se usa (un artículo estándar no amerita dividirse en sprints)
- **MVP-1.5 (multi-PDF artículos):** los sprints pueden usarse para agrupar artículos temáticamente
- **MVP-2 (libros):** funcionalidad completa, incluida la conversación de curaduría del A11 y las dos estrategias

**Estado:** PROPUESTA. El investigador no confirmó.

**Pregunta para confirmación:** ¿Sprint como concepto de primera clase en el modelo de datos desde MVP-1 OK? ¿Las dos estrategias (capas / bloques) cubren los casos reales del investigador? ¿Activación diferida a MVP-2 OK?

---

## D17 (PROPUESTA) — Perfil de Objetivo del Aprendiz (POA)

**Pregunta:** ¿Qué información sobre el aprendiz y su objetivo debe Socrates capturar al crear el curso, para diseñar una experiencia calibrada a ese contexto específico?

**Origen teórico:** observación del investigador de que Socrates es diseñador de experiencias de aprendizaje significativo (en el sentido de Ausubel 1963), no solo entregador de contenido con técnicas pedagógicas aplicadas encima. El aprendizaje significativo requiere conexión intencional entre lo nuevo y la estructura cognitiva previa del aprendiz + disposición del aprendiz + material con organización lógica. Sin información sobre el aprendiz y su objetivo, el A3 diseña en el vacío.

**Propuesta — Tres componentes del POA:**

**Componente 1 — Contexto del aprendiz**
- Quién es (doctorando, estudiante de máster, profesional que estudia)
- En qué disciplina/programa está
- En qué fase de su trabajo está (empezando, en medio, cerrando)
- Cuál es su campo específico de investigación o trabajo

**Componente 2 — Objetivo del curso**
- ¿Para qué desafío específico necesita este aprendizaje? (examen, seminario, presentación, defensa, discusión con asesor, construcción de marco teórico, clase que debe dar, lectura de contexto para tesis)
- ¿Para qué quiere estar habilitado al terminar? (reproducir el marco de un autor, defender una posición propia, aplicar un concepto a su caso, explicar a otros, dialogar críticamente, sintetizar con otras fuentes)
- ¿Qué considerará él mismo como señal de éxito al terminar el curso?

**Componente 3 — Conocimientos previos relevantes**
- ¿Qué autores o conceptos de este campo ya conoce bien?
- ¿Qué ha leído antes que se conecta con estos textos?
- ¿Qué ideas previas tiene sobre los temas del curso que podrían ser puntos de anclaje o puntos de fricción?
- ¿Hay tradiciones teóricas con las que ya trabaja y desde las cuales va a leer estos textos?

**Implicaciones en el diseño instruccional (A3):**
- El fallo productivo conecta con el contexto real del aprendiz, no es genérico
- La rúbrica de expectativas tiene elementos universales del concepto + elementos específicos del objetivo
- El catálogo de misconcepciones prioriza las críticas para el objetivo específico
- Las tareas generativas producen artefactos directamente útiles para el desafío real

**Implicaciones en el diálogo socrático (A4):**
- Calibra el tono al contexto del aprendiz
- Enfatiza en las preguntas los aspectos relevantes al objetivo
- Acredita un hito cuando ve evidencia suficiente **para el objetivo** declarado, no para un estándar universal abstracto
- Reformulaciones referencian el contexto real del aprendiz

**Estado:** PROPUESTA. El investigador no confirmó.

**Pregunta pendiente para el investigador:** Cuando hablas de "experiencia de aprendizaje significativo", ¿usas el término específicamente en el sentido de Ausubel (aprendizaje significativo vs mecánico, con las tres condiciones de material + estructura cognitiva + disposición), o en un sentido más amplio (aprendizaje con sentido personal, relevante, con propósito)? El concepto es el mismo pero el término importa para la coherencia con el cluster doctoral y para decidir si agregamos Ausubel como referencia al A9 en el próximo ciclo de correcciones del artículo.

**Pregunta para confirmación:** ¿POA con los tres componentes como input obligatorio de todo curso OK? ¿Terminología "aprendizaje significativo" OK o prefieres "aprendizaje contextualizado", "aprendizaje con propósito", u otro término?

---

## D18 (PROPUESTA) — A12, Entrevistador de objetivos, como agente nuevo

**Pregunta:** ¿Quién conduce la conversación de entrada con el aprendiz para capturar el POA?

**Propuesta:**

Un nuevo agente **A12 — Entrevistador de objetivos** conduce la conversación de entrada cuando el aprendiz crea un curso nuevo, antes de que el A11 haga la curaduría de corpus y antes de que corra el pipeline de ingestión.

**Alternativa a evaluar:** colapsar el A12 con el A11 (un solo "Curador de experiencia" que hace tanto objetivos como roles de corpus). Es más simple pero mezcla dos tipos de conversación distintos: objetivos es sobre el aprendiz, curaduría es sobre los textos. Mi inclinación es mantenerlos separados, pero el investigador decide.

**Orden cronológico propuesto:**

```
Aprendiz crea curso nuevo
       │
       ▼
A12 (Entrevistador de objetivos)
  Conversa sobre contexto + objetivo + conocimientos previos
  Produce el POA del curso
       │
       ▼
Aprendiz sube PDFs del corpus
       │
       ▼
A1 extrae estructura (tabla de contenidos, longitud)
       │
       ▼
A11 (Curador de corpus)
  Recibe como input: POA + estructura de los PDFs
  Conversa sobre roles (D14), modo libro (D15), sprints (D16)
  Puede hacer preguntas informadas por el POA:
    "Para tu objetivo de construir marco teórico, este libro
     es probablemente referencial más que principal — ¿OK?"
       │
       ▼
Pipeline de ingestión:
  A1 (texto completo) → A2 (unidades) → A10 (cobertura 100%)
       │
       ▼
A3 (Diseñador instruccional)
  Recibe como input: POA + unidades + grafo
  Diseña la experiencia calibrada al objetivo del aprendiz
       │
       ▼
A7 (Auditor de fidelidad) + persistencia
```

**Estado:** PROPUESTA. El investigador no confirmó.

**Pregunta para confirmación:** ¿A12 como agente nuevo, separado del A11, OK? ¿O prefieres colapsarlos en un solo agente curador?

---

## D19 (PROPUESTA) — Propagación del POA al A3 y al A4 en runtime

**Pregunta:** ¿El POA debe estar disponible para el A3 (Diseñador instruccional) en fase de diseño y para el A4 (Evaluador socrático) en runtime?

**Propuesta:**

Sí, en ambos. El POA se persiste en el esquema de base de datos del curso y se pasa como contexto en cada llamada LLM relevante.

- **A3 (diseño):** recibe el POA junto con las unidades del A2 cuando genera problema de fallo productivo, rúbrica de expectativas, catálogo de misconcepciones y tarea generativa. El diseño queda calibrado al objetivo.
- **A4 (runtime):** recibe el POA junto con el texto fuente, las unidades y la historia del diálogo. Cada turno del diálogo puede enfatizar aspectos relevantes al objetivo y la acreditación se decide contra ese objetivo.

**Costo:** aumenta levemente el tamaño del contexto en cada llamada LLM del A3 y A4 (el POA es texto, no grande, probablemente < 2000 tokens). Este costo es el precio de la calibración al aprendiz. Es proporcionalmente pequeño comparado con el beneficio.

**Implicación para el A8 (Coach metacognitivo, MVP-2):** el debrief semanal puede reportar no solo cobertura sino **progreso contra el objetivo declarado** — cuánto más cerca está el aprendiz de estar "habilitado para X". Esto es motivacionalmente mucho más potente que un porcentaje de cobertura.

**Estado:** PROPUESTA. El investigador no confirmó.

**Pregunta para confirmación:** ¿POA propagado a A3 y A4 OK? ¿Costo adicional de tokens aceptable?

---

## Resumen de decisiones pendientes

| ID | Tema | Propuesta resumida | Estado |
|---|---|---|---|
| D14 | Roles explícitos de PDFs | Taxonomía de 5 roles + flujo híbrido | PROPUESTA |
| D15 | Modo libro y curaduría | 3 modos por tamaño + A11 nuevo + 3 niveles (núcleo/rápida/referencial) | PROPUESTA |
| D16 | Sprints de aprendizaje | First-class en modelo de datos + 2 estrategias (capas/bloques) + activación MVP-2 | PROPUESTA |
| D17 | Perfil de Objetivo del Aprendiz (POA) | 3 componentes (contexto/objetivo/conocimientos previos) como input obligatorio | PROPUESTA |
| D18 | A12 Entrevistador de objetivos | Agente nuevo separado del A11, conversación de entrada antes del corpus | PROPUESTA |
| D19 | Propagación del POA al A3 y A4 | POA en contexto LLM en diseño y runtime | PROPUESTA |

## Al retomar la sesión

1. Leer este documento primero
2. Responder las preguntas de confirmación de cada decisión (ideal: en bloque, o una por una si se quiere discutir)
3. Si el investigador confirma alguna: pasarla a CERRADA, documentar en docs/03, docs/04, docs/05 y PROJECT_STATE
4. Si el investigador modifica alguna: actualizar la propuesta aquí antes de cerrarla
5. Si el investigador rechaza alguna: marcar como DESCARTADA con razón registrada
6. Después de cerrar las seis: pasar a Fase 2 de /ingeniería (docs/06_PROCESOS.md)

**NO avanzar a Fase 2 sin haber resuelto las seis decisiones** — la Fase 2 necesita saber si existe POA, si hay A11 y A12, cómo funciona el modo libro y los sprints, para poder hacer el Service Blueprint, las state machines y el User Story Map correctamente.
