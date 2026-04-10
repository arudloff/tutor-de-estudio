# 02 — Los seis principios pedagógicos de Socrates

> Derivados del artículo A9 del cluster doctoral *Coexistir con lo que nos excede*.
> Fundamentados en evidencia empírica de las ciencias del aprendizaje y los sistemas tutores inteligentes.
> Cada principio es un criterio verificable de diseño.

## Principio 1 — Fallo productivo: la lucha precede a la instrucción

**Idea central.** El orden estándar de la enseñanza —primero explicar, después pedir aplicación— produce comprensión más superficial que el orden inverso. El aprendiz que lucha con un problema que aún no sabe resolver activa su procesador inconsciente, recupera conocimiento previo, intenta analogías fallidas y construye contraste cognitivo. Cuando posteriormente se entrega la explicación canónica, esta aterriza en una estructura mental ya activada.

**Evidencia.** Sinha y Kapur (2021), meta-análisis en *Review of Educational Research*: tamaños de efecto entre d = 0.36 y d = 0.58 para comprensión conceptual y transferencia, comparado con la secuencia tradicional instrucción-primero. Kapur (2024), libro fundacional del campo.

**Implementación en Socrates.** Antes de presentar cualquier concepto teórico, el sistema entrega un problema o una situación que el concepto explica, sin nombrarlo. El aprendiz produce intentos parciales. Solo entonces el sistema introduce el concepto y muestra cómo reformula y profundiza esos intentos iniciales.

**Cómo verificar que se está aplicando.**
- Toda micro-lección comienza con una tarea, no con una explicación.
- El sistema registra los intentos del aprendiz antes de entregar la instrucción canónica.
- El número de intentos generados predice la profundidad del aprendizaje en evaluaciones posteriores.

**Anti-patrón.** Empezar con la definición y después pedir aplicación. Esto es el orden tradicional, y la evidencia muestra que es inferior.

---

## Principio 2 — Grafo de prerequisitos y frontera de aprendibilidad

**Idea central.** El conocimiento de un dominio no es una lista lineal de items, es un orden parcial. Cada concepto tiene prerequisitos sin los cuales no es comprensible, y consecuentes que se vuelven aprendibles cuando se domina. El sistema debe operar siempre en la frontera de aprendibilidad: el conjunto de conceptos cuyos prerequisitos están satisfechos pero el aprendiz aún no domina.

**Evidencia.** Falmagne y Doignon (1985), trabajo fundacional sobre Knowledge Space Theory. Operacionalizado en ALEKS desde los años 90 con resultados consistentes en matemáticas y ciencias. Anderson et al. (1995), Cognitive Tutor basado en ACT-R, con evidencia ESSA Tier 1.

**Implementación en Socrates.** El agente A2 (Analista semántico) construye, a partir de los textos cargados, un grafo dirigido donde los nodos son unidades de sentido y los arcos son relaciones de prerequisito. El estado de conocimiento del aprendiz es un subconjunto del grafo, y el sistema siempre selecciona como próxima micro-lección un nodo de la frontera.

**Lo que un LLM aporta sobre KST clásico.** En matemáticas escolares, el grafo de prerequisitos lo construye un humano experto del dominio. En investigación doctoral, el grafo es contextual al campo y al estudiante: el camino para entender la genealogía foucaultiana no es idéntico al camino para entender la teoría de campos bourdieana, y depende de lo que el estudiante ya ha leído. Los LLMs permiten inferir relaciones de prerequisito desde la propia literatura y mantener el grafo dinámicamente.

**Cómo verificar que se está aplicando.**
- El sistema no presenta una unidad cuyos prerequisitos no estén marcados como dominados.
- El sistema no presenta una unidad ya dominada (excepto en repaso espaciado).
- El grafo es visible para el aprendiz en el dashboard como mapa del campo.

**Anti-patrón.** Lista lineal de "lección 1, lección 2, ..., lección N" sin tomar en cuenta lo que el aprendiz ya sabe.

---

## Principio 3 — Diálogo socrático estructurado por expectativa-misconception

**Idea central.** El diálogo socrático abierto —preguntas libres sin estructura— es ineficiente y depende de la pericia del interlocutor. La alternativa documentada es el diálogo dirigido por expectativas y misconcepciones pre-identificadas. Para cada concepto, el sistema sabe de antemano qué ideas debe contener un entendimiento sofisticado y qué errores típicos cometen los aprendices al primer encuentro. El diálogo navega para eliciar las primeras y atacar los segundos.

**Evidencia.** Graesser et al. (2014), AutoTutor: 10 experimentos controlados con más de mil participantes, tamaños de efecto entre 0.2 y 1.5, media 0.81. Crucialmente, los autores demuestran que el contenido del diálogo es lo que produce el aprendizaje, no la animación, voz o interfaz visual del sistema. Esto significa que la técnica es directamente transferible a tutores basados en LLMs.

**Implementación en Socrates.** Para cada unidad de sentido, el agente A3 (Diseñador instruccional) genera dos artefactos junto al contenido: una rúbrica de expectativas (las 5-8 ideas que un aprendiz que comprende el concepto debe articular, defender o aplicar) y un catálogo de misconcepciones típicas (los errores que los aprendices doctorales suelen cometer). El agente A4 (Evaluador socrático) usa ambos como insumos del diálogo. El cierre del diálogo no ocurre cuando se alcanza un número de turnos sino cuando el sistema tiene evidencia suficiente para acreditar o no el dominio.

**Cómo verificar que se está aplicando.**
- Cada concepto tiene rúbrica y catálogo antes de cualquier interacción con el aprendiz.
- El log del diálogo permite a un evaluador externo identificar qué expectativas el aprendiz cumplió y qué misconcepciones manifestó.
- El sistema acredita o no acredita un hito con justificación trazable.

**Anti-patrón.** Diálogo genuinamente abierto sin estructura. Anti-patrón equivalente: opción múltiple sin diálogo (que produce ilusión de saber).

---

## Principio 4 — Aprendizaje cognitivo y aprendiz protégé inverso

**Idea central.** Lo que distingue a un investigador formado de un estudiante avanzado no es el conocimiento explícito sino las heurísticas tácitas sobre cómo leer un argumento, cómo evaluar evidencia, cómo reconocer una limitación metodológica. Estas heurísticas no se enseñan explícitamente en la mayoría de los programas doctorales. Los modelos de lenguaje grandes permiten, por primera vez, que un sistema modele explícitamente el proceso de razonamiento experto. Y permiten también invertir el rol: el aprendiz periódicamente le enseña al sistema, lo que produce procesamiento más profundo que el estudio para sí mismo.

**Evidencia.** Collins, Brown y Newman (1989), trabajo fundacional sobre aprendizaje cognitivo, seis métodos: modelado, coaching, scaffolding, articulación, reflexión, exploración. Chase et al. (2009), Stanford AAA Lab, sistema Betty's Brain: estudiantes que creían enseñar a un agente virtual mostraron mayor esfuerzo, mayor tiempo de lectura preparatoria, y mejor aprendizaje que estudiantes que estudiaban para sí mismos.

**Implementación en Socrates.** Dos mecanismos complementarios.

*Modelado experto.* El sistema verbaliza explícitamente su proceso de razonamiento cuando el aprendiz pregunta cómo abordar un problema. No dice "la respuesta es X". Dice "cuando me encuentro con un debate como este, primero pregunto qué afirma cada lado a nivel de mecanismo, no de conclusión; después pregunto qué evidencia distinguiría entre ambos; después noto que la evidencia del primer lado proviene del contexto X y la del segundo del contexto Y..."

*Protégé inverso.* Periódicamente, el sistema le pide al aprendiz que le enseñe un concepto, posicionándose como un estudiante de master en otra disciplina. El sistema entonces formula preguntas estratégicamente naif. La preparación para enseñar al sistema activa el procesador inconsciente más profundamente que el estudio para sí mismo.

**Cómo verificar que se está aplicando.**
- El sistema produce, al menos una vez por unidad, un episodio de modelado experto.
- El sistema invierte el rol al menos una vez por hito de aprendizaje.
- El log del diálogo del aprendiz como maestro es revisable y acredita el dominio igual que el diálogo del aprendiz como estudiante.

**Anti-patrón.** Sistema que solo entrega respuestas y nunca verbaliza el proceso. Anti-patrón equivalente: nunca invertir el rol.

---

## Principio 5 — Detección afectiva e intervención calibrada

**Idea central.** El aprendizaje no es puramente cognitivo. El mismo aprendiz, frente al mismo contenido, requiere intervenciones radicalmente distintas según su estado afectivo. Un aprendiz frustrado necesita reconocimiento y reformulación; un aprendiz aburrido necesita aumento de desafío; un aprendiz confundido necesita scaffolding inmediato; un aprendiz en flujo necesita que no se le interrumpa. Los tutores tradicionales (humanos e inteligentes) responden al contenido pero no al estado, e intervienen mal en al menos tres de los cuatro casos.

**Evidencia.** Literatura reciente sobre sistemas tutores afectivos documenta que la detección del estado afectivo del aprendiz mediante señales conductuales —sin cámara, sin sensores fisiológicos— es factible con precisiones moderadas pero suficientes para gatillar intervenciones diferenciadas con valor esperado positivo. Las señales utilizables son la latencia de respuesta, los patrones de error, la longitud y elaboración de las respuestas, los comportamientos de re-lectura, y la velocidad de interacción.

**Implementación en Socrates.** El agente A9 (Detector afectivo) observa señales conductuales en cada interacción y clasifica el estado del aprendiz en uno de cinco modos: confusión, frustración, aburrimiento, flujo, neutral. El agente A4 (Evaluador) recibe esta clasificación junto con la respuesta y selecciona el protocolo de intervención correspondiente.

*Confusión detectada* (pausas largas, múltiples re-intentos, variantes de "no entiendo"): scaffold inmediato, petición al aprendiz de identificar la parte específica que resulta confusa, oferta de un ejemplo trabajado o explicación alternativa.

*Frustración detectada* (cascada de errores, respuestas cortas, latencia creciente): reconocimiento explícito antes de redirigir, reducción temporal de la dificultad, construcción de éxito, retorno gradual al nivel anterior.

*Aburrimiento detectado* (respuestas muy rápidas, formularias, sin elaboración): aumento inmediato del desafío, introducción de una perspectiva contraintuitiva, presentación de un caso que rompe el patrón.

*Flujo detectado* (tiempo de respuesta apropiado, respuestas elaboradas, preguntas proactivas): no interrumpir, extender la sesión, proteger el estado.

**Cómo verificar que se está aplicando.**
- Cada interacción tiene una clasificación afectiva registrada.
- Las intervenciones del sistema difieren entre estados afectivos para el mismo contenido.
- Las intervenciones equivocadas son de bajo costo (un breve reconocimiento empático no daña incluso si el estado afectivo no era el detectado).

**Anti-patrón.** Tratamiento uniforme del aprendiz independiente de su estado emocional.

---

## Principio 6 — Salida generativa estructurada

**Idea central.** La instrucción mejor diseñada produce aprendizaje deficiente si no se cierra con la producción de algo por parte del aprendiz. La selección, organización e integración activa de información produce procesamiento más profundo que la recepción pasiva, sin importar cuán bien organizada esté la recepción.

**Evidencia.** Wittrock (1974), trabajo fundacional sobre aprendizaje generativo. Fiorella y Mayer (2016), síntesis de las ocho estrategias generativas con tamaños de efecto entre d = 0.40 y d = 0.77 para técnicas como síntesis en propias palabras, dibujo de mapas conceptuales, auto-explicación, predicción, formulación de preguntas y enseñanza a otros.

**Implementación en Socrates.** El sistema define un currículo de producción paralelo al currículo conceptual. Las producciones cumplen tres funciones simultáneas: son actividades generativas que profundizan el procesamiento, son instrumentos de evaluación que revelan el estado real de comprensión, y se acumulan en un portafolio que avanza directamente la tesis del aprendiz.

*Tier 1 (encuentro inicial con un concepto).* Síntesis de cien palabras en propias palabras, tabla comparativa, tres ejemplos del concepto extraídos del contexto profesional del aprendiz.

*Tier 2 (consolidación).* Respuesta crítica de trescientas palabras a un argumento, mapa de argumentos, mini-revisión de tres posiciones competidoras.

*Tier 3 (dominio).* Análisis teórico de quinientas palabras de un fragmento de datos usando el marco aprendido, diseño de un estudio que pondría a prueba un claim, revisión por pares de un fragmento de artículo.

**Cómo verificar que se está aplicando.**
- Toda interacción significativa termina con una tarea productiva, no con un cierre receptivo.
- El portafolio acumulado es revisable como evidencia objetiva de comprensión.
- Las producciones del Tier 3 son indistinguibles cualitativamente del trabajo doctoral propiamente dicho.

**Anti-patrón.** Cierre con "¿entendiste? haz click para continuar". Anti-patrón equivalente: opción múltiple como única forma de evaluación.

---

## Cómo los seis principios se integran

Los seis principios no son una lista de técnicas independientes. Son un sistema. La micro-lección típica en Socrates los activa todos en secuencia:

```
   FALLO PRODUCTIVO          → activa procesador inconsciente, prepara la instrucción
        ↓
   INSTRUCCIÓN MÍNIMA        → entregada solo cuando el aprendiz ya luchó
        ↓
   DIÁLOGO SOCRÁTICO         → estructurado por expectativa-misconception (Graesser)
        ↓ ↑
   DETECCIÓN AFECTIVA        → en paralelo, calibra el tono de cada turno
        ↓
   MODELADO EXPERTO          → si el aprendiz necesita ver el proceso de razonamiento
        ↓
   PRODUCCIÓN GENERATIVA     → cierra el ciclo y deja artefacto en el portafolio
        ↓
   FRONTERA DE APRENDIBILIDAD → la siguiente unidad es la que ahora es aprendible
```

El sistema solo es Socrates si los seis están presentes. Si falta uno, es otra cosa.

## Referencia al artículo doctoral

Estos principios son la operacionalización del marco teórico desarrollado en:

> Rudloff, A. (2026). El tutor que no genera deuda: principios pedagógicos para sistemas de inteligencia artificial que aceleran el aprendizaje doctoral sin atrofiar al aprendiz. *Artículo A9, Cluster de Investigación: Coexistir con lo que nos excede*. Universidad de Talca, Doctorado en Management.

Ubicación local: `G:\Mi unidad\DOCTORADO\Organizaciones Hibridadas\Cluster de Investigación_publicación\A9_Tutor_Sin_Deuda.docx`
