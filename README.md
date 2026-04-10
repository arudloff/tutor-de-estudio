# Socrates — Tutor doctoral hibridado

> **Estado:** Diseño pre-código (fase de exploración cerrada, fase de ingeniería pendiente)
> **Codename:** Socrates
> **Repo:** [arudloff/tutor-de-estudio](https://github.com/arudloff/tutor-de-estudio)
> **Investigador:** Alejandro Rudloff Muñoz — Doctorado en Management, Universidad de Talca

## Qué es

Un sistema de tutoría basado en inteligencia artificial diseñado para acelerar el aprendizaje doctoral sin generar deuda cognitiva. Recibe textos académicos (PDFs, capítulos, presentaciones) y una fecha límite, los descompone en unidades de sentido, y entrega micro-dosis de aprendizaje progresivo durante el día. Cada concepto se enseña con la secuencia *fallo productivo → instrucción → diálogo socrático adaptativo → producción*. Se adapta al rendimiento observado y al tiempo disponible. Eventualmente expandible a estudiantes de pregrado y posgrado del investigador.

## Por qué existe

El experimento de Bastani et al. (2025, *PNAS*) demostró empíricamente que el mismo modelo de IA (GPT-4) puede producir aprendizaje real o atrofia cognitiva según el marco pedagógico que gobierna su comportamiento. Sin guardrails pedagógicos, los estudiantes terminan 17% **peor** que el grupo control después de usar la herramienta. Con guardrails socráticos, no hay daño residual. **La tecnología no es la variable. La instrucción es la variable.** Socrates es la operacionalización doctoral de esa lección.

## En qué se ancla

Este proyecto es la **continuación empírica** del artículo A9 del cluster doctoral [*Coexistir con lo que nos excede*](https://github.com/arudloff/tutor-de-estudio) ("El tutor que no genera deuda: principios pedagógicos para sistemas de inteligencia artificial que aceleran el aprendizaje doctoral sin atrofiar al aprendiz", Rudloff, 2026). El A9 propone seis principios pedagógicos derivados de la evidencia empírica de los últimos 30 años de ciencias del aprendizaje y sistemas tutores inteligentes. Socrates implementa esos seis principios en un sistema concreto.

Los seis principios son:

1. **Fallo productivo** (Kapur 2024): la lucha cognitiva precede a la instrucción
2. **Grafo de prerequisitos + frontera de aprendibilidad** (Falmagne & Doignon, ALEKS): operar siempre en la zona donde los prerequisitos se cumplen pero el concepto aún no se domina
3. **Diálogo socrático estructurado por expectativa-misconception** (Graesser, AutoTutor): no dialogo abierto, sino dirigido por rúbricas de comprensión y catálogos de errores típicos
4. **Aprendizaje cognitivo + protégé inverso** (Collins, Brown & Newman; Chase et al., Betty's Brain): el experto modela su razonamiento y el aprendiz periódicamente enseña al sistema
5. **Detección afectiva e intervención calibrada**: las intervenciones difieren según el estado emocional detectado, no solo según el contenido
6. **Salida generativa estructurada** (Wittrock; Fiorella & Mayer): el aprendiz produce algo en cada interacción, nunca solo recibe

## Lo que NO es

- **No es un wrapper de ChatGPT.** Si lo fuera, replicaría la paradoja de Bastani: aprendizaje aparente con atrofia diferida.
- **No es un sistema de flashcards.** Las flashcards optimizan la métrica equivocada (reconocimiento ≠ comprensión profunda).
- **No es un tutor genérico.** Está calibrado específicamente para el aprendizaje doctoral, donde el costo de la deuda cognitiva es categórico (ver A6 del cluster).

## Estado actual del proyecto

Este repositorio contiene **diseño, no código**. La fase de exploración, investigación bibliográfica y articulación teórica está completa. La siguiente fase es la formalización de requisitos vía el skill `/ingeniería`, después la arquitectura técnica, y solo entonces la implementación de un MVP.

## Estructura del repo

```
.
├── README.md                        ← Este archivo
├── PROJECT_STATE.md                 ← Estado actual completo (auto-documentado)
├── CONTEXT_RESUME.md                ← Para retomar después de pausas largas
├── docs/
│   ├── 01_VISION.md                 ← Visión completa del producto
│   ├── 02_PRINCIPIOS_PEDAGOGICOS.md ← Los 6 principios + evidencia empírica
│   ├── 03_ARQUITECTURA_MULTI_AGENTE.md ← Los 8 agentes + orquestación n8n
│   ├── 04_DECISIONES_ABIERTAS.md    ← Lo que falta resolver antes de codificar
│   └── A9_REFERENCIA.md             ← Link al artículo doctoral fundacional
└── .gitignore
```

## Vinculación con el cluster doctoral

Socrates no es un proyecto independiente. Es la implementación práctica del marco teórico desarrollado en el cluster doctoral *Coexistir con lo que nos excede*. La vinculación es estructural:

| Artículo del cluster | Aporta a Socrates |
|---|---|
| A1 — Deuda intelectual | El problema que Socrates evita |
| A4 — Modelo dual del cerebro | El criterio para evaluar cada decisión de diseño |
| A6 — Deuda no negociable | La razón por la que Socrates no puede aceptar trade-offs en aprendizaje |
| A3 — Diseño organizacional hibridado | El marco institucional para adoptarlo |
| A9 — El tutor que no genera deuda | La fundamentación pedagógica directa de Socrates |

## Licencia

Sin licencia formal mientras esté en desarrollo de investigación doctoral. Reservado © 2026 Alejandro Rudloff Muñoz.
