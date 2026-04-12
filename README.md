# Socrates — Tutor doctoral hibridado

> **Estado:** MVP-1 en construcción — Sprint S0 (Bootstrap) completado el 2026-04-11
> **Codename:** Socrates
> **Repo:** [arudloff/tutor-de-estudio](https://github.com/arudloff/tutor-de-estudio)
> **Investigador:** Alejandro Rudloff Muñoz — Doctorado en Management, Universidad de Talca

## Qué es

Un sistema de tutoría basado en inteligencia artificial diseñado para acelerar el aprendizaje doctoral sin generar deuda cognitiva. Recibe textos académicos (PDFs, capítulos, libros) y una fecha límite, los descompone en unidades de sentido, y entrega micro-dosis de aprendizaje progresivo durante el día. Cada concepto se enseña con la secuencia *fallo productivo → instrucción → diálogo socrático adaptativo → producción*. Se adapta al rendimiento observado y al tiempo disponible.

## Por qué existe

El experimento de Bastani et al. (2025, *PNAS*) demostró empíricamente que el mismo modelo de IA (GPT-4) puede producir aprendizaje real o atrofia cognitiva según el marco pedagógico que gobierna su comportamiento. Sin guardrails pedagógicos, los estudiantes terminan 17% **peor** que el grupo control después de usar la herramienta. Con guardrails socráticos, no hay daño residual. **La tecnología no es la variable. La instrucción es la variable.** Socrates es la operacionalización doctoral de esa lección.

## En qué se ancla

Este proyecto es la **continuación empírica** del artículo A9 del cluster doctoral *Coexistir con lo que nos excede* ("El tutor que no genera deuda: principios pedagógicos para sistemas de inteligencia artificial que aceleran el aprendizaje doctoral sin atrofiar al aprendiz", Rudloff, 2026). El A9 propone seis principios pedagógicos derivados de la evidencia empírica de los últimos 30 años de ciencias del aprendizaje y sistemas tutores inteligentes. Socrates implementa esos seis principios en un sistema concreto.

Los seis principios pedagógicos:

1. **Fallo productivo** (Kapur 2024): la lucha cognitiva precede a la instrucción
2. **Grafo de prerequisitos + frontera de aprendibilidad** (Falmagne & Doignon, ALEKS)
3. **Diálogo socrático estructurado por expectativa-misconception** (Graesser, AutoTutor)
4. **Aprendizaje cognitivo + protégé inverso** (Collins, Brown & Newman)
5. **Detección afectiva e intervención calibrada**
6. **Salida generativa estructurada** (Wittrock; Fiorella & Mayer)

A estos seis principios, Socrates agrega un **anclaje teórico explícito** en el **aprendizaje significativo de Ausubel** (1963, 1968) como fundamento del Perfil de Objetivo del Aprendiz (POA). Las 3 condiciones de Ausubel (material potencialmente significativo + estructura cognitiva previa relevante + disposición del aprendiz) se operacionalizan en los 3 componentes del POA capturado por el agente A12.

## Arquitectura multi-agente

Socrates opera con **12 agentes** especializados, cada uno con responsabilidad delimitada (separación de roles por el principio IV&V del estándar de desarrollo):

- **A1** Lector — extrae texto y estructura de PDFs
- **A2** Analista semántico — descompone en unidades de sentido + grafo de prerequisitos
- **A3** Diseñador instruccional — genera fallo productivo, rúbrica, catálogo de misconcepciones, tarea generativa (recibe POA en contexto)
- **A4** Evaluador socrático — conduce diálogo, evalúa evidencia, acredita (recibe POA en contexto)
- **A5** Adaptador — recalcula plan adaptativo
- **A6** Productor visual (MVP-2) — genera mapas conceptuales, diagramas
- **A7** Auditor de calidad — verifica fidelidad verbatim de citas
- **A8** Coach metacognitivo (MVP-2) — debrief semanal contra POA
- **A9** Detector afectivo (MVP-2) — clasifica estado emocional del aprendiz
- **A10** Verificador de cobertura — garantiza 100% sustantivo del PDF cubierto
- **A11** Curador de corpus (MVP-2) — conversación de curaduría para libros
- **A12** Entrevistador de objetivos — captura el POA (activo desde MVP-1)

Ver [docs/03_ARQUITECTURA_MULTI_AGENTE.md](docs/03_ARQUITECTURA_MULTI_AGENTE.md) para el detalle completo.

## Stack técnico (MVP-1)

- **Frontend:** Next.js 14 (App Router, TypeScript strict, Tailwind CSS)
- **Backend / Auth / DB / Storage:** Supabase (Postgres + RLS desde día uno, bucket privado para PDFs)
- **LLMs:** Anthropic Claude Opus + Sonnet (A2, A3, A4, A7, A10, A11, A12) + OpenAI GPT-4o (A1 visión)
- **Orquestación:** Next.js API routes para operaciones cortas + Trigger.dev/Inngest (pendiente de decisión en S3) para jobs largos de ingestión
- **Testing:** Vitest con tests adversariales obligatorios para código de enforcement
- **CI:** GitHub Actions (audit secrets + audit RLS + typecheck + tests + npm audit)
- **Hooks:** Husky pre-commit con audit-secrets + audit-rls + typecheck + tests

## Lo que NO es

- **No es un wrapper de ChatGPT.** Los 12 agentes con responsabilidades separadas garantizan que cada decisión pedagógica tenga auditoría independiente.
- **No es un sistema de flashcards.** Las flashcards optimizan reconocimiento, no comprensión profunda.
- **No es un tutor genérico.** Está calibrado específicamente para aprendizaje doctoral.

## Cómo arrancarlo localmente

### Requisitos
- Node.js ≥ 20
- npm ≥ 10
- Cuenta de Supabase (plan free alcanza para desarrollo)
- API key de Anthropic
- API key de OpenAI

### Setup

```bash
# 1. Clonar
git clone https://github.com/arudloff/tutor-de-estudio.git
cd tutor-de-estudio

# 2. Instalar dependencias
npm install

# 3. Configurar variables de entorno
cp .env.example .env.local
# Editar .env.local con las credenciales reales

# 4. Preparar DB (S1 — cuando esté implementado)
#    Por ahora, aplicar manualmente la migración 0001_init.sql
#    en el SQL editor de Supabase o con la CLI:
#    supabase db push

# 5. Ejecutar en dev
npm run dev
# → http://localhost:3000
```

### Scripts disponibles

```bash
npm run dev              # Servidor de desarrollo
npm run build            # Build de producción
npm run start            # Servidor de producción
npm run lint             # ESLint
npm run typecheck        # TypeScript sin emit
npm run test             # Tests con Vitest
npm run test:watch       # Tests en modo watch
npm run test:coverage    # Tests con reporte de cobertura
npm run audit:secrets    # Escaneo de secretos hardcodeados
npm run audit:rls        # Verificación de RLS en migraciones SQL
npm run db:migrate       # Aplicar migraciones pendientes (stub en S0)
```

## Estructura del repo

```
.
├── README.md                         ← Este archivo
├── PROJECT_STATE.md                  ← Estado actual completo
├── CONTEXT_RESUME.md                 ← Para retomar después de pausas
├── package.json                      ← Dependencias + scripts
├── tsconfig.json                     ← TypeScript strict
├── next.config.mjs                   ← Next.js + CSP security headers
├── tailwind.config.ts                ← Tailwind
├── vitest.config.ts                  ← Vitest + threshold de cobertura 70%
├── .env.example                      ← Template de variables de entorno
├── .github/workflows/ci.yml          ← CI (audits + typecheck + tests + npm audit)
├── .husky/pre-commit                 ← Git pre-commit hook bloqueante
├── app/                              ← Next.js App Router
│   ├── layout.tsx
│   ├── page.tsx
│   └── globals.css
├── lib/
│   ├── env.ts                        ← Validación de env con Zod (fail-fast)
│   ├── supabase/
│   │   ├── client.ts                 ← Client para browser (anon key)
│   │   ├── server.ts                 ← Client para Server Components
│   │   └── admin.ts                  ← Admin client (service role, solo backend)
│   └── db/
│       ├── types.ts                  ← Tipos de la DB
│       └── migrations/
│           └── 0001_init.sql         ← Tablas invited_users + course con RLS
├── scripts/
│   ├── audit-secrets.mjs             ← Escaneo de secretos
│   ├── audit-rls.mjs                 ← Verificación de RLS
│   └── db-migrate.mjs                ← Runner de migraciones (stub en S0)
├── tests/
│   ├── setup.ts                      ← Setup común con env dummy
│   ├── env.test.ts                   ← Tests adversariales de validación de env
│   └── migrations.test.ts            ← Tests estáticos de las migraciones SQL
└── docs/
    ├── 01_VISION.md                  ← Visión completa
    ├── 02_PRINCIPIOS_PEDAGOGICOS.md  ← Los 6 principios + evidencia
    ├── 03_ARQUITECTURA_MULTI_AGENTE.md ← Los 12 agentes
    ├── 04_DECISIONES_ABIERTAS.md     ← Registro de 14 decisiones cerradas + diferidas
    ├── 05_ESTRATEGIA.md              ← Fase 1 de /ingeniería (estrategia + POA + Ausubel)
    ├── 06_PROCESOS.md                ← Fase 2 de /ingeniería (procesos + state machines)
    ├── 07_REQUISITOS.md              ← Fase 3 de /ingeniería (12 historias INVEST + DDL)
    ├── 99_DECISIONES_PENDIENTES.md   ← Histórico del cierre de D14-D19
    └── A9_REFERENCIA.md              ← Link al artículo doctoral fundacional
```

## Enforcement de calidad (3 capas)

Este repo implementa las 3 capas de enforcement definidas en el estándar de desarrollo del investigador:

1. **Capa 1 — Git pre-commit hook** (`.husky/pre-commit`): bloquea el commit si el secret scan, el RLS scan, el typecheck o los tests fallan. Bypass prohibido salvo autorización explícita.
2. **Capa 2 — CI en GitHub Actions** (`.github/workflows/ci.yml`): bloquea el merge si los mismos checks fallan en el entorno limpio de CI, más `npm audit` high/critical.
3. **Capa 3 — CLAUDE.md global del investigador**: reglas de activación de protocolos por acción (no por skill), agente auditor YUNQUE Nivel 2 al cierre de cada sprint, QA Report obligatorio en cada entregable.

Si Claude ignora la capa 3, las capas 1 y 2 atrapan el error mecánicamente.

## Roadmap del MVP-1

| Sprint | Entrega | Estado |
|---|---|---|
| **S0** | Bootstrap: scaffold + env + Supabase clients + migración inicial + hooks + CI | ✅ COMPLETO (2026-04-11) |
| **S1** | Auth + esquema base + whitelist (HU-1, HU-2) | Pendiente |
| **S2** | A12 + POA + state machine (HU-3, HU-4) | Pendiente |
| **S3** | Upload PDFs + pipeline A1 → A2 → A10 (HU-5, HU-6) | Pendiente |
| **S4** | A3 con POA + A7 fidelidad (HU-7) | Pendiente |
| **S5** | Sesión completa con A4 + artifact + recálculo A5 (HU-8 a 11) | Pendiente |
| **S6** | Dashboard + hardening + auditoría final (HU-12) | Pendiente |

Ver [docs/07_REQUISITOS.md](docs/07_REQUISITOS.md) para el detalle de las 12 historias con criterios Given-When-Then.

## Vinculación con el cluster doctoral

| Artículo del cluster | Aporta a Socrates |
|---|---|
| A1 — Deuda intelectual | El problema que Socrates evita |
| A4 — Modelo dual del cerebro | El criterio para evaluar cada decisión de diseño |
| A6 — Deuda no negociable | La razón por la que Socrates no acepta trade-offs |
| A3 — Diseño organizacional hibridado | El marco institucional para adoptarlo |
| A9 — El tutor que no genera deuda | La fundamentación pedagógica directa |

## Licencia

Sin licencia formal mientras esté en desarrollo de investigación doctoral. Reservado © 2026 Alejandro Rudloff Muñoz.
