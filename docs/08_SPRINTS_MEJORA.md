# 08 — Sprints de mejora post-MVP-1

> Creado: 2026-04-14
> Contexto: análisis de gaps entre lo diseñado (docs/05-07) y lo implementado (S0-S6).
> El MVP-1 funciona y fue validado por el usuario, pero tiene simplificaciones que afectan
> la calidad pedagógica, la seguridad y el cumplimiento del estándar YUNQUE.

---

## Análisis de gaps: diseñado vs implementado

### Simplificaciones que afectan calidad pedagógica

| Diseño (docs/07) | Implementación actual | Impacto |
|---|---|---|
| A2, A4, A10 con Claude Opus | Usa Sonnet (por rate limit 30K/min) | Análisis y evaluación menos profundos |
| A4 acredita con ≥70% de rúbrica (CHK-AGENT-008) | A4 decide libremente | Puede acreditar comprensión que no existe |
| Evidence trazable con message_log_ids reales (AC-9.4) | Genera UUIDs falsos | Trazabilidad rota |
| Rúbrica ≥5 items + misconceptions ≥3 (AC-7.5) | No se valida en código | A3 puede generar artefactos incompletos |

### Simplificaciones que afectan flujo de usuario

| Diseño | Implementación | Impacto |
|---|---|---|
| Auto-avance entre unidades | Requiere F5 manual | Fricción que rompe el flow |
| Sesiones se cierran limpiamente | Sesiones abandonadas dejan unidades bloqueadas | Requiere cleanup manual en DB |
| Artifact generativo al cierre de cada sesión | A veces no se muestra, hay que recargar | Principio 6 (salida generativa) incompleto |

### Simplificaciones que afectan seguridad

| Diseño | Implementación | Impacto |
|---|---|---|
| State machine enforced (transiciones inválidas → 409) | No se validan transiciones en código | Se puede saltar estados |
| Defense-in-depth en todos los endpoints | Algunos usan admin client sin verificar user_id | Potencial leak entre usuarios |
| npm audit limpio | 16 vulnerabilidades pendientes | Riesgo de seguridad |

### Lo diseñado que NO se implementó

| Feature | Documento | Prioridad |
|---|---|---|
| Tests de integración contra Supabase real | docs/07 §5 | Alta |
| Lighthouse Performance >85, Accessibility >90 | docs/07 §5 | Media |
| Auditoría YUNQUE Nivel 2 para S1-S6 | docs/07 §6 DoD | Alta |
| QA Report en cada entregable | CLAUDE.md obligatorio | Alta |
| Plan adaptativo real del A5 (prerequisitos, proyección) | docs/06 §2.3 | Media |
| Skip directo a evaluación de hito | docs/05 §5 Should Have | Baja |

---

## Sprint M1 — Rigor del evaluador

> **Prioridad: CRÍTICA.** Sin esto, Socrates puede acreditar comprensión falsa — la trampa de Bastani.
> **Bloquea:** M2 (sin rigor, el flujo mejorado es cosmético)

| # | Tarea | AC verificable |
|---|---|---|
| 1 | A4 usa Opus en vez de Sonnet | Respuestas con profundidad verificable en logs |
| 2 | A4 valida ≥70% de rúbrica antes de PASS | `hito_accreditation.evidence.rubric_items_satisfied.length >= rubric.items.length * 0.7` |
| 3 | Evidence trazable real (IDs de message_log reales) | `hito_accreditation.evidence.message_log_ids` existen en tabla `message_log` |
| 4 | A2 y A10 usan Opus (calidad de análisis) | Unidades con descripciones de >50 palabras, no genéricas |
| 5 | Rate limit strategy: subir plan API o implementar queue con delays automáticos | Pipeline completa sin intervención manual |

**Dependencia externa:** evaluar créditos Anthropic restantes y si el plan free alcanza para Opus.

---

## Sprint M2 — Flujo sin fricción

> **Prioridad: ALTA.** El usuario no debería tocar F5 ni limpiar la DB manualmente.

| # | Tarea | AC verificable |
|---|---|---|
| 1 | Auto-avance: al cerrar sesión, router.push a la siguiente unidad | No requiere F5 entre unidades |
| 2 | Cleanup de sesiones abandonadas: al cargar `/learn`, cerrar sesiones >30 min y liberar unidades | Unidades `in_session` de >30 min pasan a `available` automáticamente |
| 3 | Flujo de artifact completo: después de PASS, mostrar tarea generativa sin recargar | El aprendiz produce y envía el artifact en la misma vista |
| 4 | Reprocesar unidades `audited_fail`: proceso que re-ejecuta A3+A7 | Las 12 unidades pasan a `available` o quedan con justificación |
| 5 | Indicador de rate limit en UI con countdown visible | El aprendiz sabe por qué espera |

---

## Sprint M3 — State machine + seguridad

> **Prioridad: ALTA.** El diseño exige transiciones válidas y defense-in-depth real.
> **Bloquea:** M5 (no deployar sin seguridad)

| # | Tarea | AC verificable |
|---|---|---|
| 1 | Función `validateTransition(from, to)` para course, poa, pdf, sense_unit, learning_session | Transición inválida → 409 con mensaje claro |
| 2 | Cada endpoint verifica state machine antes de operar | Test adversarial: `draft → ingesting` directo → 409 |
| 3 | Defense-in-depth: auditar todos los endpoints con admin client, agregar user_id check | Test: usuario A no puede ver/modificar datos de usuario B |
| 4 | npm audit fix: resolver las 16 vulnerabilidades | `npm audit --audit-level=high` = 0 |
| 5 | Regenerar service_role key + rotar en .env.local | Key vieja invalidada |

---

## Sprint M4 — Auditoría retroactiva YUNQUE

> **Prioridad: MEDIA.** El estándar exige auditoría Nivel 2 por sprint. Se saltó en S1-S6.
> **Bloquea:** M5 (no deployar sin auditoría)

| # | Tarea | AC verificable |
|---|---|---|
| 1 | Agente auditor Nivel 2 audita S1-S6 contra docs/07 | Reporte PASS/FAIL por sprint con evidencia |
| 2 | QA Report consolidado del MVP-1 completo | Las 15 dimensiones clasificadas |
| 3 | Tests de integración: al menos 1 test contra Supabase real con RLS adversarial | Test: JWT user A → query course user B → 0 rows |
| 4 | Lighthouse CI: Performance >85, Accessibility >90 | Resultado guardado como artefacto CI |
| 5 | Actualizar docs/07 con los cambios de implementación | docs/07 refleja la realidad del código |

---

## Sprint M5 — Deploy + acceso remoto

> **Prioridad: MEDIA.** El usuario no debería necesitar `npm run dev` para estudiar.
> **Requiere:** M3 y M4 cerrados.

| # | Tarea | AC verificable |
|---|---|---|
| 1 | Deploy a Vercel conectado al repo GitHub | URL pública HTTPS accesible |
| 2 | Variables de entorno en Vercel | La app funciona en producción |
| 3 | CSP de producción sin unsafe-eval | Lighthouse Security headers PASS |
| 4 | Dominio personalizado (opcional) | URL memorable |
| 5 | PWA manifest + service worker básico | Instalable como app en mobile/desktop |

---

## Sprint M6 — MVP-1.5 (multi-PDF + sprints temáticos)

> **Prioridad: BAJA (post-deploy).** Activa D13, D14, D16 diseñadas pero latentes.
> **Requiere:** M5 cerrado.

| # | Tarea | AC verificable |
|---|---|---|
| 1 | Subir N PDFs por curso con rol (D14: 5 roles) | UI de upload con dropdown de rol |
| 2 | A2_corpus: cruce inter-textual entre PDFs | Unidades multi-fuente generadas |
| 3 | A10_corpus: cobertura del corpus completo | Coverage report a nivel corpus |
| 4 | Sprints temáticos manuales (D16) | UI para crear/editar sprints |
| 5 | Edición posterior del POA (D17 ampliada) | El aprendiz puede actualizar su objetivo |

---

## Sprint M7 — MVP-2 features (largo plazo)

> Lo que el diseño define para MVP-2. Se prioriza según evidencia del uso real.

| # | Feature | Decisión de diseño |
|---|---|---|
| 1 | A11 Curador de corpus (modo libro, D15) | Conversación de curaduría para libros >80pp |
| 2 | A8 Coach metacognitivo | Debrief semanal con progreso vs POA |
| 3 | A9 Detección afectiva | Adaptar tono según estado del aprendiz |
| 4 | A6 Productor visual | Mapas conceptuales, diagramas |
| 5 | FSRS (repetición espaciada) | Reemplaza plan simple del A5 |
| 6 | Bloom L4-L6 | Análisis, evaluación, creación |
| 7 | Modo protégé inverso (P4 completo) | El aprendiz le enseña al sistema |

---

## Orden de ejecución recomendado

```
M1 (rigor A4) → M2 (flujo) → M3 (seguridad) → M4 (auditoría) → M5 (deploy) → M6 (MVP-1.5) → M7 (MVP-2)
     ↓                                              ↓
  CRÍTICO                                      GATE de deploy
```

| Sprint | Foco | Sesiones estimadas | Bloquea |
|---|---|---|---|
| **M1** | Rigor del A4 | 1 | M2 |
| **M2** | Flujo sin fricción | 1 | — |
| **M3** | Seguridad + state machine | 1 | M5 |
| **M4** | Auditoría YUNQUE | 1 | M5 |
| **M5** | Deploy a Vercel | 1 | M6 |
| **M6** | Multi-PDF + sprints | 2-3 | M7 |
| **M7** | MVP-2 features | Largo plazo | — |

---

## Métricas de éxito post-mejora

| Métrica | Target actual (MVP-1) | Target post-M1-M5 |
|---|---|---|
| Acreditación con evidence verificable | Parcial (UUIDs falsos) | 100% con IDs reales |
| Transiciones de estado validadas | 0% | 100% |
| npm audit high/critical | 16 pendientes | 0 |
| Lighthouse Accessibility | No medido | >90 |
| Auto-avance entre unidades | F5 manual | Automático |
| Tiempo de setup para estudiar | `npm run dev` + localhost | URL pública |
