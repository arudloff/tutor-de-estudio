# 01 — Visión de Socrates

> Documento de visión del proyecto.
> Fecha: 2026-04-10
> Estado: borrador estable (cerrado para fase de exploración, abierto para fase de ingeniería)

## El problema que resolvemos

El estudiante doctoral típico desperdicia entre 40% y 60% de su tiempo de estudio en estrategias inefectivas: re-leer, subrayar, tomar notas sin síntesis, repasar lo que ya domina. Mientras tanto, los textos se acumulan, las fechas se acercan y la presión genera dos respuestas igualmente disfuncionales: cramming superficial o evitación con culpa. La oferta tecnológica reciente —tutores basados en LLMs— promete resolver esto, pero la evidencia empírica muestra que mal diseñados producen el efecto opuesto: aprendizaje aparente con atrofia real (Bastani et al., 2025, *PNAS*).

El problema, formulado con precisión: **¿cómo construir un sistema basado en IA que acelere el aprendizaje doctoral sin generar deuda cognitiva?**

## La visión del producto

Socrates es un sistema de tutoría doctoral basado en inteligencia artificial diseñado para alimentar el procesador inconsciente del aprendiz —no para sustituirlo. Su comportamiento básico:

1. El aprendiz le entrega los textos que debe comprender (PDFs, capítulos, presentaciones) y la fecha límite para hacerlo.
2. Socrates descompone los textos en unidades de sentido y construye un grafo de prerequisitos del campo.
3. Socrates genera un plan de aprendizaje calibrado al tiempo disponible diario y la fecha límite.
4. Durante el día, Socrates entrega micro-dosis de aprendizaje vía notificaciones a la PWA en el celular del aprendiz: 3-5 minutos cada una.
5. Cada micro-dosis sigue una secuencia pedagógica específica: primero un problema que el aprendiz no sabe resolver (fallo productivo), después la instrucción canónica, después un diálogo socrático estructurado para verificar comprensión real, y al final una tarea generativa breve.
6. Socrates evalúa cada respuesta no como correcto/incorrecto sino como evidencia de comprensión a un nivel específico de Bloom (recordar, comprender, aplicar, analizar, evaluar, crear).
7. Socrates detecta el estado emocional del aprendiz vía señales conductuales y adapta el tono de la siguiente intervención.
8. Periódicamente, Socrates invierte el rol y pide al aprendiz que le enseñe el concepto a él, como si fuera un estudiante de otro campo (efecto del aprendiz protégé).
9. Cuando llega un hito (sesión, examen, fecha de entrega), Socrates corre una verificación final: el diálogo socrático más exigente, sin scaffolding, para acreditar el dominio.

## Lo que distingue a Socrates

| Otros tutores de IA | Socrates |
|---|---|
| Entregan respuestas | Hace mejores preguntas |
| Optimizan el desempeño con la herramienta | Optimiza el desempeño sin la herramienta |
| Linealizan el contenido | Modela la disciplina como grafo de prerequisitos |
| Repiten la misma pregunta | Reformula el enfoque cuando el aprendiz no comprende |
| Tratan al estudiante como receptor | Lo trata como agente que produce, enseña y critica |
| Una sola modalidad de evaluación | Diálogo socrático estructurado + producción + evaluación afectiva |
| Indiferentes al estado emocional | Detecta confusión, frustración, aburrimiento, flujo, y responde diferente a cada uno |
| Uniformes en la entrega | Adapta intensidad a fecha límite + tiempo disponible + velocidad observada |

## Casos de uso primarios (en orden de prioridad)

1. **Doctorado del propio investigador**, para preparar seminarios, exámenes y discusiones críticas en la escuela doctoral. Este es el primer beneficiario y la primera fuente de retroalimentación empírica.
2. **Estudiantes del investigador**, en cursos de pregrado y posgrado donde se les pide leer y comprender literatura académica. La lógica pedagógica del tutor sirve por igual para preparar un examen final y para preparar una discusión de seminario.
3. **Otros doctorandos** (eventualmente), si la herramienta resulta efectiva en uso real y el investigador decide compartirla.
4. **Investigadores activos** que necesitan asimilar literatura nueva fuera de su campo principal (caso: hibridación interdisciplinar).

## Lo que NO está en la visión

- **No es un agente conversacional general.** Si lo fuera, el aprendiz lo usaría para resumir y producir output, no para aprender. Eso es exactamente la paradoja de Bastani.
- **No es un sistema de generación de fichas Anki.** Anki optimiza retención de items aislados; Socrates optimiza comprensión integrada y transferencia.
- **No reemplaza al asesor de tesis.** Socrates es para el procesamiento de literatura y conceptos; el asesor es para la conducción del proyecto, la construcción del argumento original y el juicio académico de fondo.
- **No tiene como objetivo "convertir" al investigador en usuario dependiente.** Su criterio de éxito es la mejora de capacidades sin la herramienta posterior al uso, igual que el GPT Tutor de Bastani.
- **No es un producto comercial inicialmente.** Es una herramienta de investigación doctoral que eventualmente podría serlo.

## Restricciones críticas

1. **El comportamiento socrático no es opcional.** Si el sistema empieza a entregar respuestas en lugar de preguntas, deja de ser Socrates. Esta es la única regla no negociable del producto.
2. **Toda interacción produce evidencia estructurada.** No se puede declarar que un hito de aprendizaje fue alcanzado sin un diálogo socrático que lo verificó.
3. **El tiempo del aprendiz es sagrado.** Si el sistema gasta 10 minutos en cosas que no son aprendizaje, es un mal sistema. La latencia importa.
4. **Privacidad de datos académicos.** Los textos del aprendiz pueden ser borradores no publicados, lecturas confidenciales o material protegido por copyright. No se envían a APIs sin gobernanza explícita y consentimiento.
5. **Costo controlado.** Cada interacción tiene un costo de API. El sistema debe ser viable para uso diario sostenido sin ser prohibitivamente caro.
6. **Mobile-first.** El estudiante doctoral usa el celular en intersticios del día. Una herramienta solo de escritorio no encaja en su realidad.

## Stakeholders

| Stakeholder | Qué espera | Qué le da Socrates |
|---|---|---|
| Aprendiz doctoral | Comprender más en menos tiempo, sin atrofia | Micro-dosis durante el día, evaluación honesta, adaptación al tiempo disponible |
| Asesor de tesis | Que sus dirigidos lleguen preparados a las reuniones | Aprendices que pueden discutir con profundidad, no solo recitar |
| Escuela doctoral | Calidad académica de los egresados | Doctorandos que conservan capacidad de pensar sin la herramienta |
| Investigador-builder (Alejandro) | Una herramienta que sirva para su propio doctorado y para sus estudiantes | Producto utilizable y fundamentado teóricamente en el cluster |
| Cluster doctoral (A9) | Una operacionalización del marco teórico | Caso empírico que valida o refuta los seis principios |

## Criterios de éxito iniciales

Antes de declarar que Socrates "funciona", debe cumplir lo siguiente:

1. **Cumple la regla de Bastani.** Aprendices que usan Socrates demuestran capacidad sin la herramienta igual o mejor que aprendices que estudiaron sin tutor. Si esto no se cumple, Socrates es una versión sofisticada del problema que pretende resolver.
2. **El diálogo socrático produce evidencia trazable.** Cada hito acreditado tiene un registro del diálogo que lo justificó, y el registro permite a un evaluador externo confirmar que el aprendiz efectivamente comprende.
3. **El aprendiz lo usa voluntariamente más de un mes.** Las herramientas que se abandonan después de la primera semana no producen aprendizaje. La retención voluntaria es la métrica conductual fundamental.
4. **El aprendiz reporta menor frustración y mayor sentido de progreso** comparado con su forma habitual de estudiar.
5. **El primer caso real (el propio investigador) muestra mejora medible** en la velocidad de comprensión de literatura nueva.

## Lo que viene después de la visión

La visión está cerrada. La siguiente fase es la formalización de requisitos vía `/ingeniería` (estrategia → proceso → requisitos verificables), y desde ahí la arquitectura técnica y la construcción del MVP.
