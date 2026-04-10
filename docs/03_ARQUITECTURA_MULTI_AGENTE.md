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
| A2 | Analista semántico | Descomponer el texto en unidades de sentido, construir el grafo de prerequisitos, glosario jerarquizado, posicionamiento en literatura | Claude Opus | Razonamiento profundo sobre textos densos |
| A3 | Diseñador instruccional | Para cada unidad, diseñar la secuencia pedagógica completa: problema de fallo productivo, instrucción canónica, rúbrica de expectativas, catálogo de misconcepciones expandido, tarea generativa | Claude Sonnet | Buen balance creatividad/costo |
| A4 | Evaluador socrático | Conducir el diálogo de verificación, detectar evidencia de dominio o ausencia de dominio, decidir cierre del diálogo | Claude Opus | Necesita razonamiento fino para distinguir comprensión de memorización |
| A5 | Adaptador (planificador) | Recalcular el plan de aprendizaje según fecha límite, tiempo disponible, velocidad observada, resultados de cada hito | Algorítmico (FSRS) + Claude Sonnet para reformulación | Mayormente lógica, LLM solo para reformular enfoque pedagógico |
| A6 | Productor visual | Generar mapas mentales, diagramas, infografías, líneas de tiempo, mapas conceptuales | Mermaid + D3 + DALL-E 3 | Herramientas especializadas, no LLM genérico |
| A7 | Auditor de calidad | Verificar que las unidades de sentido son fieles al texto fuente, que las rúbricas son completas, que el catálogo de misconcepciones cubre los puntos contraintuitivos del texto, que la progresión es coherente | Claude Opus (agente independiente del diseñador) | Rol de verificación independiente: nunca el mismo agente que produjo lo verifica |
| A8 | Coach metacognitivo | Generar el debrief semanal del aprendiz: dónde está, qué dominó, qué le falta, cómo se compara con su propio progreso anterior | Claude Sonnet | Necesita empatía + datos, no razonamiento pesado |
| A9 | Detector afectivo | Clasificar el estado emocional del aprendiz a partir de señales conductuales (latencia, longitud de respuesta, patrones de error, comportamiento de re-lectura) | Algorítmico + posible LLM ligero | Mayormente clasificación de patrones, no requiere modelo de razonamiento |
| A10 | Verificador de cobertura | Verificar de manera independiente que el A2 asignó el 100% del texto sustantivo del PDF a alguna unidad de sentido. Aprobar o rechazar la ingestión por cobertura | Claude Opus (independiente del A2 y del A7) | Es un rol adversarial estricto; necesita razonamiento fino para distinguir contenido sustantivo del no-sustantivo, y no tener sesgo hacia aprobar lo que ya está hecho |

## Know-how heredado de SILA en los agentes A2 y A3

> Esta sección documenta cómo Socrates internaliza el conocimiento metodológico del sistema previo SILA del investigador. Ver `docs/05_ESTRATEGIA.md` § 10 para la regla completa de integración. La síntesis: **SILA es ancestro metodológico, no componente runtime**. Socrates procesa el PDF una sola vez con su propio pipeline; los prompts del A2 y A3 incluyen las instrucciones que SILA aplica.

### A2 — Analista semántico (responsabilidades expandidas)

El A2 produce, a partir del texto completo del PDF, los siguientes artefactos internos:

1. **Esqueleto argumentativo** (heredado de SILA § A.2): descomposición paso a paso de qué afirma el autor, cómo lo demuestra, en qué sección lo demuestra. Estructura tabular: PASO N · QUÉ AFIRMA · CÓMO LO DEMUESTRA · UBICACIÓN.

2. **Unidades de sentido a granularidad fina**: a diferencia de SILA, que opera al nivel de sección, el A2 desciende al nivel de proposición. Una sección puede contener varias unidades de sentido independientes con sus propios prerequisitos.

3. **Glosario jerarquizado de conceptos** (heredado de SILA § C): cada concepto identificado se clasifica con peso CRÍTICO (◆◆◆ — sin él el argumento colapsa), IMPORTANTE (◆◆ — necesario para comprensión plena) o COMPLEMENTARIO (◆ — enriquece pero no es central). Para cada concepto: definición de 2-3 oraciones, anidamientos (Contiene → / Es parte de → / Requiere → / Produce →), tensiones con otros conceptos, origen (propio del autor / tomado de otro autor / síntesis).

4. **Grafo de prerequisitos formal** (aporte propio de Socrates, no en SILA): los conceptos del glosario jerarquizado se conectan en un grafo dirigido donde los arcos son relaciones de prerequisito explícitas. Es la estructura sobre la cual el agente A5 calcula la frontera de aprendibilidad.

5. **Posicionamiento en literatura** (heredado de SILA § A.1): a qué debate responde el texto, con quién dialoga, qué gap llena, qué tradición teórica representa, qué relevancia doctoral tiene.

6. **Cruce con otros artículos del mismo curso** (aporte propio de Socrates, no en SILA): cuando el curso tiene más de un artículo, el A2 identifica relaciones de convergencia, tensión y continuidad entre ellos, ampliando el grafo a nivel de corpus.

**Prompt operacional del A2** (resumen): «Analiza este texto académico aplicando el conocimiento metodológico desarrollado en SILA por el investigador para procesamiento doctoral profundo. Tu análisis debe producir el esqueleto argumentativo, unidades de sentido a granularidad de proposición, glosario jerarquizado con tres niveles de peso y relaciones de anidamiento y tensión, posicionamiento en literatura y grafo formal de prerequisitos. La calibración de peso CRÍTICO/IMPORTANTE/COMPLEMENTARIO debe seguir el criterio de SILA: CRÍTICO si sin él el argumento colapsa, IMPORTANTE si es necesario para comprensión plena, COMPLEMENTARIO si solo enriquece. Tu output es input estructurado para el agente A3 y para el grafo de aprendibilidad».

### A3 — Diseñador instruccional (responsabilidades expandidas)

El A3 produce, para cada unidad de sentido del A2, los siguientes artefactos internos:

1. **Identificación de afirmaciones citables verbatim** (heredado de SILA § A.5): las 6-8 frases del texto directamente usables, organizadas por función argumental (definir el concepto central, justificar el enfoque, explicar el mecanismo, debatir con otra posición, fundamentar una herramienta, distinguir conceptos relacionados). El A3 las extrae con su ubicación exacta en el texto.

2. **Problema de fallo productivo** (aporte propio de Socrates, no en SILA): para cada unidad, un problema o situación que el concepto explica, redactado de forma que el aprendiz pueda intentar resolverlo sin haber visto la instrucción canónica. Este es el corazón del Principio 1 del A9 y no tiene equivalente en SILA.

3. **Instrucción canónica condensada**: la explicación del concepto en lenguaje directo, basada en las afirmaciones citables del autor. Es lo que el aprendiz recibe DESPUÉS de haber luchado con el problema, no antes.

4. **Rúbrica de expectativas** (Principio 3 del A9): las 5-8 ideas que un aprendiz que ha comprendido el concepto debe poder articular, defender o aplicar. Cada expectativa es falsable y trazable contra el texto fuente.

5. **Catálogo de misconcepciones expandido**:
   - **Semilla heredada de SILA § A.4**: los 3-5 puntos contraintuitivos donde el aprendiz típicamente cae (alertas de lectura). El A3 los toma como entrada inicial.
   - **Expansión propia de Socrates**: el A3 analiza el texto completo y agrega 5-10 misconcepciones adicionales que SILA no había identificado, llegando a un catálogo de 8-15 entradas por unidad. Cada misconcepción incluye: descripción del error típico, por qué el aprendiz cae en él, cómo el A4 lo puede detectar en el diálogo, cómo reformular la instrucción cuando se detecta.

6. **Tarea generativa de cierre** (Principio 6 del A9, Tier 1-2-3 según unidad): la producción que el aprendiz debe hacer al final de la sesión. Tier 1 para unidades fundamentales (síntesis 100 palabras, tabla comparativa, tres ejemplos del contexto del aprendiz). Tier 2 para unidades intermedias (respuesta crítica 300 palabras, mapa de argumentos). Tier 3 para unidades avanzadas (análisis teórico 500 palabras, diseño de estudio, peer review).

7. **Contexto para modelado experto** (Principio 4 del A9 — sólo modelado experto en MVP-1, sin protégé inverso): cuando aplica, el A3 prepara el "expert think-aloud" que el A4 puede usar para verbalizar el proceso de razonamiento académico que un investigador maduro aplicaría a esa unidad.

**Prompt operacional del A3** (resumen): «Para cada unidad de sentido producida por el A2, diseña la secuencia pedagógica completa de Socrates: problema de fallo productivo, instrucción canónica condensada, rúbrica de expectativas falsables, catálogo de misconcepciones expandido, tarea generativa de cierre. Para identificar las misconcepciones, parte de la metodología de SILA para detectar puntos contraintuitivos (alertas de lectura: el argumento es contraintuitivo, un término técnico se usa de forma distinta a su uso cotidiano, existe una distinción crítica que si se pierde el resto parece contradictorio, el ejemplo es simplificación extrema), y luego expande con tu propio análisis del texto completo hasta llegar a 8-15 misconcepciones por unidad. Para identificar las afirmaciones citables, aplica el criterio de SILA: 6-8 frases verbatim organizadas por función argumental con su ubicación exacta. El problema de fallo productivo, la rúbrica de expectativas y la tarea generativa son aporte propio de Socrates y no tienen equivalente en SILA — diséñalos desde cero según el A9».

### A7 — Auditor de calidad (criterios heredados de SILA)

El A7 verifica fidelidad de los outputs del A3 contra el PDF. Hereda de SILA dos criterios:

1. **Fidelidad verbatim de las citas**: SILA en su sección "Verificación de calidad verbatim" exige que las citas extraídas del texto coincidan al 99% con la fuente original (después de normalización de whitespace, comillas tipográficas y guiones). El A7 aplica el mismo criterio a las afirmaciones citables que el A3 produjo: cada cita verbatim debe coincidir con el PDF al 99%+.

2. **Cobertura de los puntos contraintuitivos**: el A7 verifica que el catálogo de misconcepciones del A3 efectivamente incluye los puntos donde un aprendiz típico cae, usando como criterio mínimo los tipos de SILA (argumento contraintuitivo, término técnico con uso distinto al cotidiano, distinción crítica que si se pierde rompe el resto, simplificación extrema en un ejemplo).

El A7 NO verifica la cobertura del 100% del PDF — esa responsabilidad pertenece al A10 (Verificador de cobertura), que es un rol independiente y separado por exigencia del principio IV&V del estándar de desarrollo del investigador.

### A10 — Verificador de cobertura (rol adversarial separado)

> **Por qué existe este agente como pieza separada:** la auditoría de cobertura no puede ser ejecutada por el mismo agente que construyó el catálogo de unidades (A2), porque sería auto-verificación — exactamente el anti-patrón que el estándar de desarrollo del investigador prohíbe (regla IV&V del BoK, separación de roles obligatoria). Tampoco puede ser ejecutada por el A7, porque el A7 ya tiene el rol de auditor de fidelidad de citas y misconcepciones, y mezclar dos auditorías en un solo agente diluye el foco adversarial. El A10 es un rol independiente, con un solo trabajo, ejecutado por un agente que no vio el proceso de construcción del A2 — solo recibe el PDF y el catálogo de unidades, y verifica.

> **Regla no negociable:** Ningún pasaje sustantivo del PDF puede quedar sin asignar a al menos una unidad de sentido. Si un pasaje queda huérfano, el A2 debe re-procesarlo y el A10 debe verificar la nueva cobertura antes de aprobar la ingestión.

**Por qué esta regla es crítica:** un pipeline de IA que extrae lo "más importante" de un texto y descarta el resto está, en realidad, decidiendo unilateralmente qué del autor merece ser comprendido. Eso es exactamente la trampa de Bastani aplicada al diseñador instruccional. Socrates necesita garantizar que el aprendiz tenga acceso a todo el argumento del autor, no a la versión condensada que un LLM consideró suficiente.

**Por qué un agente separado y no una verificación interna del A2:** si el A2 audita su propia cobertura, tiene un sesgo estructural: cualquier párrafo que el A2 consideró "no importante suficiente como para crear una unidad" tampoco lo va a marcar como huérfano, porque ya tomó la decisión implícita de descartarlo. El A10 llega sin ese sesgo: para él, todos los párrafos sustantivos son candidatos a estar cubiertos, y la carga de la prueba está en el A2 (¿por qué no creaste unidad para este párrafo?). Esto es exactamente la lógica adversarial del devil's advocate de /dr aplicada a la fase de ingestión.

**Cuadro de auditoría de cobertura del A10:**

```
┌─────────────────────────────────────────────────────────────────┐
│ AUDITORÍA DE COBERTURA DEL PDF — Agente A10 (independiente)      │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│ Separación de roles (regla IV&V del estándar de desarrollo):     │
│   - El A10 es un agente diferente al A2 (Analista) y al A7       │
│     (Auditor de fidelidad). Tres roles, tres agentes.            │
│   - El A10 NO ve el proceso de razonamiento del A2. Solo recibe  │
│     el PDF y el catálogo de unidades como inputs externos.       │
│   - El A10 NO comparte contexto con el A7. Su único trabajo es   │
│     verificar cobertura, no fidelidad de citas ni misconcepciones│
│   - El A10 ejecuta en una llamada LLM independiente, con su      │
│     propio prompt, sin historia de las llamadas previas.         │
│                                                                  │
│ Input:                                                           │
│   - Texto completo del PDF dividido en chunks de párrafo         │
│   - Catálogo de unidades de sentido producidas por el A2         │
│   - Por cada unidad: lista de spans textuales del PDF que la     │
│     fundamentan (start_offset, end_offset, hash del párrafo)     │
│                                                                  │
│ Cálculo:                                                         │
│   1. Tomar todos los párrafos del PDF                            │
│   2. Marcar cada párrafo como CUBIERTO si al menos una unidad    │
│      lo referencia en su lista de spans fundamentales            │
│   3. Marcar como NO COBERTURABLE los párrafos identificados      │
│      en pre-proceso como no-sustantivos:                         │
│      - Encabezados y pies de página repetitivos                  │
│      - Numeración de página                                      │
│      - Bibliografía y referencias                                │
│      - Agradecimientos                                           │
│      - Información de contacto / afiliación                      │
│      - Tablas de figuras / listas de abreviaturas                │
│   4. Marcar el resto como HUÉRFANO si no está cubierto           │
│                                                                  │
│ Métricas:                                                        │
│   - cobertura_sustantiva = párrafos_cubiertos / párrafos_sustantivos │
│   - párrafos_huérfanos = lista de párrafos sustantivos sin       │
│     ninguna unidad asignada                                      │
│   - solapamiento_promedio = unidades_que_referencian_un_párrafo  │
│     promediado sobre todos los párrafos cubiertos                │
│                                                                  │
│ Umbrales de aprobación:                                          │
│   - cobertura_sustantiva ≥ 100% → PASS                           │
│   - cobertura_sustantiva < 100% → FAIL → A2 reprocesa            │
│                                                                  │
│ Reporte:                                                         │
│   - Tabla por sección del PDF: párrafos totales, sustantivos,    │
│     cubiertos, huérfanos, % cobertura                            │
│   - Lista de párrafos huérfanos con su contenido textual y       │
│     ubicación, ordenados por sección                             │
│   - Justificación de cada párrafo marcado NO COBERTURABLE        │
│     (para que el investigador pueda auditar la auditoría)        │
│   - Solapamiento promedio (warning si > 3.0: posible             │
│     sobre-fragmentación; warning si < 1.1: posible bajo nivel    │
│     de cruces conceptuales)                                      │
│                                                                  │
│ Persistencia:                                                    │
│   - El reporte de cobertura se guarda en la base de datos        │
│     asociado al curso, recuperable por el usuario en cualquier   │
│     momento desde el panel de admin del curso                    │
│   - Cada unidad de sentido tiene en su registro la lista de      │
│     spans del PDF que la fundamentan (audit trail bidireccional) │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

**Mecanismo de re-procesamiento cuando hay huérfanos:**

1. El A10 detecta que hay párrafos sustantivos sin cobertura.
2. El A10 emite un reporte estructurado con la lista específica de párrafos huérfanos y los párrafos marcados NO COBERTURABLE por el A2 que el A10 considera disputables.
3. El reporte se envía al A2 (no al A7 ni a ningún otro agente).
4. El A2 los analiza y decide para cada uno:
   - **Crear una nueva unidad de sentido** que los cubra.
   - **Extender una unidad existente** para que su lista de spans incluya el párrafo huérfano (cuando el contenido del párrafo refuerza una unidad ya identificada pero no estaba enlazado).
   - **Justificar la exclusión** marcándolo como NO COBERTURABLE en el catálogo de excepciones, con razón explícita (ej: "este párrafo es solo una transición narrativa sin contenido conceptual nuevo"). El A10 reevalúa esta justificación en la siguiente iteración.
5. El A10 vuelve a calcular la cobertura sobre el nuevo catálogo del A2. Si hay nuevas unidades creadas, **el A3 las procesa** (fallo productivo, instrucción canónica, rúbrica, catálogo de misconcepciones, tarea generativa) y el A7 las audita por fidelidad de citas. La cobertura del A10 corre antes que el A3 y el A7 para evitar trabajo desperdiciado.
6. El ciclo A2 ↔ A10 se repite hasta que `cobertura_sustantiva = 100%` o el A10 acepta todas las justificaciones de exclusión del A2.
7. Hay un **límite de iteraciones** (3 por defecto) entre A2 y A10. Si después de 3 iteraciones sigue habiendo huérfanos sin justificar o exclusiones disputadas, el A10 marca la ingestión como FAIL_REVIEW y el investigador debe inspeccionar manualmente. Esto es preferible a aprobar silenciosamente una ingestión incompleta.

**Posición del A10 en el pipeline de ingestión:**

```
PDF → A1 (Lector) → A2 (Analista, primera pasada)
                         │
                         ▼
                    A10 (Verificador de cobertura)
                         │
                  ┌──────┴──────┐
                  │             │
                FAIL          PASS
                  │             │
                  ▼             ▼
              A2 reprocesa    A3 (Diseñador instruccional)
              ↑     │              │
              │     │              ▼
              └─────┘          A7 (Auditor de fidelidad)
                                  │
                           ┌──────┴──────┐
                           │             │
                         FAIL          PASS
                           │             │
                           ▼             ▼
                       A3 reprocesa   Persistir en DB
                       ↑     │
                       │     │
                       └─────┘
```

El A10 corre **antes** del A3 deliberadamente: si hay huérfanos en la cobertura, no tiene sentido invertir tokens diseñando lecciones para unidades incompletas. Primero se garantiza el 100% de cobertura, después se diseña la pedagogía sobre el catálogo verificado.

**Por qué la cobertura es 100% y no 95%:**

Un umbral del 95% suena razonable pero significa que el 5% del texto del autor queda sin enseñarse. En un PDF de 30 páginas, eso es 1.5 páginas de contenido del autor que el aprendiz nunca verá. Para un curso doctoral donde la profundidad es no negociable, eso es inaceptable. La excepción válida es la lista explícita de tipos NO COBERTURABLES (encabezados, bibliografía, agradecimientos, afiliaciones), que se calcula sobre el texto sustantivo, no sobre el texto total.

**Cómo el aprendiz audita la auditoría:**

El reporte de cobertura es accesible desde el panel del curso. El aprendiz puede:
- Ver el % de cobertura del PDF (debe ser 100% sustantivo).
- Inspeccionar qué párrafos quedaron marcados NO COBERTURABLES y por qué.
- Para cada unidad de sentido, ver qué pasajes del PDF la fundamentan (links bidireccionales).
- Para cada pasaje del PDF, ver a qué unidades pertenece.

Esto convierte al sistema en **auditable por el propio aprendiz**, no solo por el A10 interno. Es coherente con el principio de Socrates: la confianza no se declara, se verifica.

## Procesamiento multi-PDF: un curso, varios textos, un solo diseño instruccional integrado

> **Por qué esto es necesario:** un curso doctoral típico tiene entre 5 y 15 lecturas obligatorias por unidad temática, no una sola. Procesar cada PDF de forma aislada y después yuxtaponer sus unidades de sentido es la forma incorrecta de hacerlo: pierde exactamente lo que el A9 sección 5.2 (grafo de prerequisitos) y el cluster doctoral identifican como el aporte central — las **relaciones entre textos**, las convergencias, las tensiones, los conceptos compartidos, los autores que dialogan entre sí. Un curso doctoral no es la suma de sus PDFs; es la red que se forma entre ellos.

### El concepto de "corpus de curso"

Un curso en Socrates tiene como input no un PDF sino un **corpus**: un conjunto ordenado de PDFs que el aprendiz debe comprender en bloque para una fecha límite. El pipeline de ingestión opera sobre el corpus completo, no sobre cada PDF por separado:

```
CORPUS DEL CURSO (N PDFs)
     │
     ▼
┌────────────────────────────────────────────────┐
│ Fase 1 — Análisis individual (paralelo por PDF)│
│                                                 │
│ Para cada PDF_i del corpus:                    │
│   A1_i → extrae texto del PDF_i                │
│   A2_i → unidades de sentido + glosario        │
│           jerarquizado + esqueleto + posicio-  │
│           namiento individual                  │
│   A10_i → verifica cobertura del 100% del      │
│            PDF_i (independiente por PDF)       │
│   A2_i ↔ A10_i hasta cobertura 100%            │
└────────────────────┬────────────────────────────┘
                     │
                     ▼
┌────────────────────────────────────────────────┐
│ Fase 2 — Análisis del corpus (cruce entre PDFs)│
│                                                 │
│ A2_corpus (instancia especial del A2):         │
│   - Recibe todos los outputs de A2_i           │
│   - Identifica conceptos COMPARTIDOS entre     │
│     PDFs (ej: "capital social" aparece en      │
│     Bourdieu, Putnam y Coleman)                │
│   - Identifica relaciones de CONVERGENCIA      │
│     (textos que dicen lo mismo de manera       │
│     distinta) — heredado de SILA § E "Mapa de  │
│     diálogos inter-textuales"                  │
│   - Identifica relaciones de TENSIÓN (textos   │
│     que se contradicen o compiten)             │
│   - Identifica APERTURAS (un texto plantea     │
│     preguntas que otro responde)               │
│   - Identifica DEPENDENCIAS DE LECTURA (un     │
│     texto presupone conceptos de otro: ej:     │
│     leer Coleman antes de Putnam)              │
│                                                 │
│ Produce:                                        │
│   - Grafo de prerequisitos UNIFICADO al nivel  │
│     del corpus (no al nivel de cada PDF)       │
│   - Mapa de relaciones inter-textuales         │
│   - Orden sugerido de lectura                   │
└────────────────────┬────────────────────────────┘
                     │
                     ▼
┌────────────────────────────────────────────────┐
│ Fase 3 — Diseño instruccional integrado        │
│                                                 │
│ A3_corpus diseña el plan pedagógico ÚNICO:     │
│   - Las unidades del MVP no son "unidades de   │
│     PDF_i" sino unidades del corpus, donde una │
│     unidad puede integrar pasajes de varios    │
│     PDFs si tratan el mismo concepto desde     │
│     ángulos distintos                          │
│   - Para cada unidad: problema de fallo        │
│     productivo (P1), instrucción canónica que  │
│     puede citar a varios autores, rúbrica de   │
│     expectativas que puede exigir distinguir   │
│     entre dos versiones del mismo concepto en  │
│     dos autores, catálogo de misconcepciones   │
│     que incluye confundir las posiciones de    │
│     dos autores                                │
│   - Para algunas unidades: tarea generativa    │
│     que pide al aprendiz INTEGRAR varios       │
│     autores en una respuesta                   │
│                                                 │
│ A7 audita la fidelidad de las citas DE TODOS   │
│ los PDFs del corpus.                           │
│ A10_corpus audita que el 100% de los PDFs      │
│ esté cubierto por al menos una unidad del      │
│ diseño integrado (no solo de unidades         │
│ individuales por PDF).                         │
└────────────────────────────────────────────────┘
                     │
                     ▼
              Persistir el corpus completo
              en la base de datos del curso
```

### Tipos de unidades de sentido en un diseño multi-PDF

Cuando hay un solo PDF, todas las unidades de sentido pertenecen a ese PDF y pueden tratarse como "unidades del PDF". Cuando hay corpus, las unidades caen en cuatro categorías:

| Tipo | Descripción | Ejemplo |
|---|---|---|
| **Unidad mono-fuente** | Un concepto que solo aparece en un PDF del corpus | El concepto de "violencia simbólica" solo aparece en Bourdieu |
| **Unidad multi-fuente convergente** | Un concepto que varios autores tratan de manera consistente | "Capital social" en Bourdieu, Coleman y Putnam — los tres lo definen, con matices, pero apuntan al mismo fenómeno |
| **Unidad multi-fuente en tensión** | Un concepto donde los autores discrepan sustantivamente | "Función del Estado en la reproducción social" entre Bourdieu y Foucault |
| **Unidad de integración** | No es de ningún PDF en particular sino de la relación entre varios | "El debate teórico sobre la primacía de estructura vs agencia" — emerge del cruce, no está en ningún PDF aislado |

### Cómo el A10 verifica cobertura en multi-PDF

El A10 corre dos veces:

1. **A10 individual por PDF (Fase 1):** garantiza que cada PDF del corpus esté 100% cubierto por unidades, independientemente del corpus. Esto es exactamente el mismo cuadro de auditoría descrito antes, ejecutado N veces (una por PDF).

2. **A10 del corpus (Fase 3):** una vez que el A3 produjo el diseño instruccional integrado, el A10 verifica que ningún PDF del corpus quedó "huérfano del diseño" — es decir, que para cada PDF hay al menos una unidad del diseño integrado que lo cubre. Esto previene que un PDF individual tenga 100% de cobertura propia pero quede excluido del diseño porque el A3 decidió no incluir sus unidades en el plan pedagógico final.

**Métricas adicionales del A10 en modo corpus:**

- `cobertura_corpus_pct` = párrafos sustantivos cubiertos / total párrafos sustantivos del corpus
- `pdfs_huerfanos_del_diseño` = lista de PDFs cuyas unidades no aparecen en ninguna unidad del diseño instruccional final
- `solapamiento_inter_pdf_promedio` = cuántos PDFs cita en promedio una unidad de integración
- `unidades_por_tipo` = conteo de unidades mono-fuente / multi-fuente convergente / multi-fuente en tensión / de integración

### Implicaciones para D11 (definición del MVP-1)

D11 originalmente decía "MVP-1 = un PDF como input". Esta limitación necesita revisarse:

**Opción A — MVP-1 con un solo PDF.** Más simple, valida el pipeline básico. Pero no es realista: el investigador no tiene cursos de un solo PDF.

**Opción B — MVP-1 con multi-PDF desde el inicio.** Más complejo, pero refleja el caso real de uso. El A2_corpus, el A3_corpus y el A10_corpus son piezas adicionales pero conceptualmente claras.

**Opción C — MVP-1 con un solo PDF, MVP-1.5 con multi-PDF.** Iteración explícita, sin acumular complejidad de un golpe.

**Mi inclinación: Opción C.** El MVP-1 prueba el pipeline completo (A1 → A2 → A10 → A3 → A7) con un solo PDF para reducir variables. El MVP-1.5 (incremento corto sobre MVP-1) agrega la fase de cruce inter-textual y el manejo de corpus. Esto permite validar primero el caso simple antes de agregar la complejidad de las relaciones entre textos. Sin embargo, **el modelo de datos del MVP-1 debe estar diseñado desde el inicio para soportar multi-PDF** (las unidades de sentido deben tener `course_id`, no `pdf_id`, y deben tener `source_spans` que listen los pasajes que las fundamentan, posiblemente de varios PDFs en el futuro). Esto es decisión D13 nueva.

### Decisión D13 — Multi-PDF como capacidad de primera clase

**Decisión:** Multi-PDF es **capacidad arquitectónica desde el inicio**, pero el **MVP-1 entrega un solo PDF por curso** para validar el pipeline básico. El **MVP-1.5** activa multi-PDF agregando A2_corpus, A3_corpus y A10_corpus.

**Implicaciones para el modelo de datos** (se cierran en Fase 3 de /ingeniería):
- Las tablas se diseñan desde el MVP-1 con `course_id` como referencia primaria, no `pdf_id`.
- Una unidad de sentido tiene una lista de spans que identifica los pasajes que la fundamentan, donde cada span tiene `pdf_id` + offset. En el MVP-1 todos los spans de una unidad tendrán el mismo `pdf_id`; en el MVP-1.5 podrán tener varios.
- El grafo de prerequisitos es un grafo del curso, no de cada PDF.
- El plan adaptativo del A5 opera sobre el grafo del curso, indistintamente de cuántos PDFs lo originaron.

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
