# 04 — Decisiones abiertas

> Lo que aún no se ha resuelto y debe resolverse antes (o durante) `/ingeniería`.
> Cada decisión incluye opciones, criterio de evaluación y un favorito provisorio.

## Estado de cierre (actualizado 2026-04-11)

| ID | Tema | Estado | Resolución | Documento |
|---|---|---|---|---|
| D1 | Dónde vive la inteligencia | ✅ CERRADA | Híbrido (pre-gen + runtime LLM acotado) | docs/05 § 6 |
| D2 | Orquestación | ✅ CERRADA | Sin n8n. Next.js routes + Trigger.dev/Inngest | docs/05 § 6 |
| D3 | Modelo evaluador | ⏸ DIFERIDA | A fase de implementación. Empezar con Sonnet, escalar a cascada o Opus si calidad degrada | — |
| D4 | Stack frontend | ✅ CERRADA (revisada) | Desktop-first norma metodológica + mobile complemento. Next.js 14 PWA | docs/05 § 6 |
| D5 | Backend | ✅ CERRADA | Supabase todo en uno con RLS día uno | docs/05 § 6 |
| D6 | Modelo de operación | ✅ CERRADA | Multi-usuario controlado desde día uno (whitelist) | docs/05 § 6 |
| D7 | Errores y caídas | ⏸ DIFERIDA | A MVP-2 o fase 2 de producto. MVP-1 usa fail-closed con buen mensaje | — |
| D8 | Telemetría | ⏸ PARCIAL | Esquema básico de eventos en MVP-1. Sofisticación en MVP-2 | — |
| D9 | Privacidad | ⏸ DIFERIDA | Política mínima viable antes del primer usuario no-investigador | — |
| D10 | Validación empírica | ⏸ DIFERIDA | Diseño cuasi-experimental para MVP-2 | — |
| D11 | Definición de MVP-1 | ✅ CERRADA (revisada 2026-04-11) | 6 agentes activos en MVP-1 (A1, A2, A3, A4, A7, A10, A12). P1-P3 cubiertos, P4 parcial, P5 ausente, P6 parcial. Modo único = examen, Bloom L1-L3. **POA obligatorio desde día uno** | docs/05 § 6, § 12 |
| D12 | Integración con SILA | ✅ CERRADA | Internalización del know-how de SILA en los prompts de A2 y A3. SILA es ancestro metodológico, no componente runtime | docs/05 § 10 |
| D13 | Multi-PDF como capacidad arquitectónica | ✅ CERRADA | Multi-PDF es first-class desde el modelo de datos. MVP-1 entrega 1 PDF/curso. MVP-1.5 activa multi-PDF con A2_corpus, A3_corpus y A10_corpus | docs/03 § Procesamiento multi-PDF |
| **D14** | **Roles explícitos de PDFs en el corpus** | ✅ **CERRADA 2026-04-11** | Taxonomía de 5 roles: principal, equivalente, complementario, referencial, contrapunto. Flujo híbrido: aprendiz propone, A2_corpus sugiere ajustes informados por POA, aprendiz decide. Razón trazada en BD. **Activo desde MVP-1.5** | docs/03 § Roles de PDFs |
| **D15** | **Modo libro y conversación de curaduría** | ✅ **CERRADA 2026-04-11** | 3 modos por tamaño: artículo (≤30 pp), capítulo (30-80 pp), libro (>80 pp). Modo libro requiere conversación con A11 (Curador de corpus, agente nuevo). 3 niveles dentro de libro: núcleo (pipeline completo), lectura rápida (A2 + A3 ligero), referencial (consulta runtime A4). Cobertura 100% del A10 se calcula solo sobre los capítulos núcleo. **Activo desde MVP-2** | docs/03 § A11 Curador |
| **D16** | **Sprints de aprendizaje como concepto de primera clase** | ✅ **CERRADA 2026-04-11** | Sprint = bloque temático coherente con arco propio (puerta de entrada → unidades por grafo → conexiones → acreditación integradora → producción de cierre). 2 estrategias: capas de profundidad o bloques temáticos. **Modelo de datos lo soporta desde MVP-1** (latente). UI activa en MVP-1.5/MVP-2 | docs/03 § Sprints, docs/05 § 12 |
| **D17** | **Perfil de Objetivo del Aprendiz (POA)** | ✅ **CERRADA 2026-04-11** | POA con 3 componentes (contexto del aprendiz, objetivo del curso, conocimientos previos relevantes) como input obligatorio al crear curso. Anclaje teórico: **Ausubel estricto** (las 3 condiciones del aprendizaje significativo). Terminología: "aprendizaje significativo" (Ausubel 1963/1968) — agregar referencia al A9 en próximo ciclo de corrección | docs/05 § 12 |
| **D18** | **A12 Entrevistador de objetivos como agente nuevo** | ✅ **CERRADA 2026-04-11** | A12 separado de A11 (no se colapsan). Razón: dos conversaciones distintas — A12 es sobre el aprendiz, A11 es sobre los textos. A12 conduce la entrevista de entrada, antes de subir PDFs, y produce el POA. **Activo desde MVP-1** | docs/03 § A12 Entrevistador |
| **D19** | **Propagación del POA al A3 y al A4 en runtime** | ✅ **CERRADA 2026-04-11** | POA persistido en BD del curso, pasado como contexto en cada llamada LLM relevante. A3 (diseño) recibe POA al generar fallo productivo, rúbrica, catálogo de misconcepciones y tarea generativa. A4 (runtime) recibe POA en cada turno del diálogo. Costo adicional: ~< 2000 tokens/llamada. Aceptado. A8 (MVP-2) reportará progreso contra el objetivo declarado | docs/03 § Propagación POA, docs/05 § 12 |

**Agentes activos del sistema (12 totales, actualizado 2026-04-11):** A1 (Lector), A2 (Analista semántico), A3 (Diseñador instruccional), A4 (Evaluador socrático), A5 (Adaptador), A6 (Productor visual), A7 (Auditor de fidelidad), A8 (Coach metacognitivo), A9 (Detector afectivo), A10 (Verificador de cobertura), **A11 (Curador de corpus)**, **A12 (Entrevistador de objetivos)**.

**Agentes activos en MVP-1:** A1, A2, A3, A4, A7, A10, **A12** (entrevista POA al crear curso). Total: 7 agentes en MVP-1 (uno más que el plan previo, por D18).

**Decisiones bloqueantes de código:** todas cerradas. **D14-D19 cerradas el 2026-04-11.** Listo para Fase 2 de /ingeniería.

---

## Detalle histórico (referencia, las decisiones cerradas mantienen su análisis original)

## D1 — Dónde vive la inteligencia

**Pregunta.** Cuando el aprendiz responde algo y Socrates evalúa, ¿esa evaluación se hace en runtime contra un LLM, o se usa contenido pre-generado al cargar el material?

**Opciones.**
1. **Pre-generación total.** Al cargar el PDF, A3 genera todas las micro-lecciones completas, todas las rúbricas, todos los catálogos de misconcepciones, todas las preguntas. El runtime es solo lookup. Costo: alto al ingestar, bajo en uso. Adaptabilidad: baja.
2. **Runtime total.** Cada micro-lección y cada evaluación se generan en el momento. Costo: alto y proporcional al uso. Adaptabilidad: máxima.
3. **Híbrido (mi favorito provisorio).** Pre-generar el grafo, las unidades, las micro-lecciones base y las rúbricas. Reservar el LLM para evaluación de respuestas abiertas y para reformulación cuando el diálogo no está convergiendo. Costo medio en ambos lados, adaptabilidad alta donde importa.

**Criterio de decisión.** El costo proyectado por aprendiz por mes debe ser < $20. La latencia de respuesta debe ser < 3 segundos en el 95% de los casos.

**Estado.** Pendiente. Decidir antes de codificar el primer flujo de evaluación.

---

## D2 — Self-host n8n vs n8n cloud vs alternativa

**Pregunta.** ¿Dónde corre n8n?

**Opciones.**
1. **Self-host (Docker en VPS o Raspberry Pi).** Costo: $5-20/mes infra. Privacidad: total. Mantenimiento: yo. Latencia: depende del host.
2. **n8n cloud.** Costo: $20-50/mes. Privacidad: los flujos pasan por n8n. Mantenimiento: cero. Latencia: buena.
3. **Alternativa más simple sin n8n.** Trigger.dev, Inngest, o flujos directos en API routes de Next.js. Costo: free tier alcanza, después variable. Privacidad: mejor que n8n cloud, peor que self-host. Mantenimiento: parte del código.

**Criterio de decisión.** Privacidad de datos académicos del aprendiz es prioridad alta. El investigador no quiere que borradores no publicados pasen por terceros sin necesidad. Pero también el investigador no es DevOps y debe poder mantener el sistema.

**Estado.** Pendiente. Mi inclinación: **alternativa 3** (Trigger.dev o flujos directos en Next.js) porque elimina una pieza de infraestructura que el investigador debe mantener. n8n era atractivo por la visualización, pero a costa de complejidad operacional.

---

## D3 — Modelo de evaluación de respuestas abiertas

**Pregunta.** ¿Qué modelo evalúa cada respuesta del aprendiz en el diálogo socrático?

**Opciones.**
1. **Claude Opus siempre.** Calidad máxima, costo máximo (~$15-30 input/$75 output por millón de tokens).
2. **Claude Sonnet siempre.** Calidad alta, costo medio (~$3 input/$15 output).
3. **Cascada: Sonnet primero, Opus solo si Sonnet reporta dudas.** Calidad alta promedio, costo medio-bajo.
4. **GPT-4o.** Calidad alta, costo similar a Sonnet, peor en razonamiento educativo según evidencia anecdótica reciente.

**Criterio de decisión.** El evaluador es el agente más crítico del sistema (la auditoría del A9 lo señaló explícitamente). La evaluación pobre destruye todo lo demás. Costo es preocupación pero no la principal.

**Estado.** Pendiente. Mi inclinación: **cascada Sonnet → Opus** para el MVP, monitoreando si la cascada degrada calidad.

---

## D4 — Stack frontend

**Pregunta.** ¿Qué framework para la PWA mobile-first?

**Opciones.**
1. **Next.js 14 con App Router.** Conocido por el investigador, ecosistema enorme, soporte PWA decente.
2. **Astro.** Mejor performance estática, peor en interactividad rica.
3. **SvelteKit.** Mejor DX y bundles más pequeños, comunidad menor.
4. **Remix.** Web standards puristas, buena para forms.

**Criterio de decisión.** Velocidad de desarrollo del investigador, calidad de la experiencia móvil, ecosistema para PWA con notificaciones push.

**Estado.** Pendiente, pero claramente inclinado a **Next.js 14** por familiaridad. Decisión a confirmar en `/ingeniería`.

---

## D5 — Backend / Auth / DB

**Pregunta.** ¿Supabase para todo o pieza por pieza?

**Opciones.**
1. **Supabase todo en uno.** Auth + Postgres + Storage + Edge Functions + Realtime. Conocido por el investigador. Velocidad alta.
2. **Auth separado (Clerk).** Mejor UX de auth, costo extra.
3. **Backend custom (Hono o Fastify) + DB managed (Neon o PlanetScale).** Más control, más código.

**Criterio de decisión.** Velocidad de implementación es crítica en fase MVP. Privacidad de datos del aprendiz debe estar resuelta de raíz (RLS).

**Estado.** Pendiente, claramente inclinado a **Supabase todo en uno** por familiaridad y velocidad. RLS configurada desde día uno (es regla del estándar de desarrollo del investigador).

---

## D6 — Modelo de negocio

**Pregunta.** ¿Socrates es solo para mí, abierto a mis estudiantes, o eventualmente comercial?

**Opciones.**
1. **Solo personal.** Sin auth multi-usuario, sin gestión de cuotas, sin gestión de pagos.
2. **Multi-usuario controlado (mis estudiantes).** Auth básica, sin pagos, control manual de quién accede.
3. **Producto comercial.** Auth, pagos, cuotas, soporte, marketing.

**Criterio de decisión.** Esto es investigación doctoral, no startup. La opción 3 distrae del propósito de la tesis.

**Estado.** Mi recomendación: **opción 2** desde el inicio (multi-usuario controlado) porque agregar auth multi-usuario después es costoso, y la opción 1 limita la posibilidad de validación con estudiantes reales. La opción 3 queda fuera del cluster doctoral por ahora.

---

## D7 — Manejo de errores y caída de modelos

**Pregunta.** Cuando un modelo de LLM falla (downtime, rate limit, error), ¿qué pasa con la sesión del aprendiz?

**Opciones.**
1. **Fail closed.** Mostrar error y pedir reintentar. Seguro pero frustrante.
2. **Fallback automático a otro modelo.** Si Claude Opus falla, usar Sonnet. Si Anthropic API falla, usar OpenAI. Continuidad alta, calidad variable.
3. **Modo offline parcial.** Pre-generar suficiente contenido del próximo plan para que el aprendiz pueda continuar incluso sin conexión.

**Criterio de decisión.** El tiempo del aprendiz es sagrado. No puede quedarse esperando porque un servicio cayó.

**Estado.** Pendiente. Inclinación: **combinación 2 + 3**. Fallback de modelo + cache offline de las próximas N micro-lecciones. Esto requiere arquitectura PWA con service workers desde el inicio.

---

## D8 — Métricas y telemetría

**Pregunta.** ¿Qué se mide y cómo se almacena?

**Lo que debe medirse para evaluar el MVP.**
- Tiempo total invertido por aprendiz por semana
- Número de micro-lecciones completadas
- Número de hitos acreditados
- Tasa de acreditación al primer intento vs múltiples intentos
- Frecuencia de cada estado afectivo detectado
- Costo de API por sesión
- Latencia de respuesta del sistema
- Tasa de retención del aprendiz (¿vuelve al día siguiente?)
- Resultado en evaluaciones sin la herramienta (la métrica de Bastani)

**Cómo almacenar.** Tabla de eventos en Supabase (event sourcing ligero), no solo agregados. Permite reanalizar después con preguntas que no anticipamos.

**Estado.** Pendiente de cerrar el esquema de eventos.

---

## D9 — Privacidad y consentimiento

**Pregunta.** ¿Qué se le dice al aprendiz sobre lo que el sistema sabe de él?

**Cosas que sabemos del aprendiz.**
- Qué textos cargó (potencialmente confidenciales)
- Sus respuestas en cada interacción
- Sus tiempos de respuesta y patrones de error
- Su estado afectivo inferido
- Su nivel de comprensión por concepto
- Sus debilidades persistentes

**Lo que el aprendiz debe poder hacer.**
- Borrar su cuenta y todos sus datos (delete account = delete data)
- Exportar todo lo que el sistema sabe de él (portabilidad)
- Configurar qué se manda a APIs de terceros (opcional pero deseable)
- Saber qué APIs de IA se usan y para qué

**Estado.** Pendiente de redactar política de privacidad mínima viable. Debe estar lista antes del primer aprendiz no-investigador.

---

## D10 — Validación empírica del A9

**Pregunta.** ¿Cómo medimos si Socrates efectivamente cumple los seis principios y produce el resultado prometido (aprendizaje sin deuda)?

**Lo difícil.** Requiere medir desempeño sin la herramienta después de un período de uso. Esto es exactamente la métrica de Bastani aplicada al contexto doctoral, y nadie la ha medido todavía en doctorado.

**Diseño tentativo.**
- N pequeño inicial: el propio investigador, durante un semestre, con seguimiento auto-reportado
- Posterior expansión a estudiantes del investigador, con consentimiento y diseño cuasi-experimental
- Comparación intra-sujeto: dominios estudiados con Socrates vs dominios estudiados sin Socrates en el mismo período
- Métrica clave: capacidad de discutir críticamente un concepto sin acceso a la herramienta vs con acceso

**Estado.** Pendiente de protocolo de evaluación. Esto eventualmente se convierte en datos para artículos doctorales posteriores, así que el diseño debe ser publicable.

---

## Resumen ejecutivo de decisiones pendientes

| ID | Tema | Mi inclinación | Bloquea código |
|---|---|---|---|
| D1 | Dónde vive la inteligencia | Híbrido | Sí |
| D2 | Orquestación | Trigger.dev o Next.js routes (no n8n) | Sí |
| D3 | Modelo evaluador | Cascada Sonnet→Opus | No (puede ajustarse) |
| D4 | Frontend | Next.js 14 | Sí |
| D5 | Backend | Supabase | Sí |
| D6 | Modelo de negocio | Multi-usuario controlado | Parcial |
| D7 | Errores y caídas | Fallback + offline cache | No (fase 2) |
| D8 | Telemetría | Event sourcing en Supabase | Parcial |
| D9 | Privacidad | Política mínima viable | No (antes del primer no-investigador) |
| D10 | Validación empírica | Protocolo cuasi-experimental | No (planeación tesis) |

Las decisiones que bloquean el código (D1, D2, D4, D5) deben cerrarse en `/ingeniería` fase 1 antes de escribir la primera línea.
