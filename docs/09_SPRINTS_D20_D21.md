# 09 — Sprints de implementación D20 (Lectura Socrática) + D21 (Dashboard de metacognición)

> Creado: 2026-04-15
> Decisiones cerradas: D20 y D21
> Constructos pedagógicos integrados: SOLO (Biggs), Toulmin, BKT, ZDP (Vygotsky), ENA, SRL (Zimmerman)
> Herramientas del aprendiz: inventario con recuerdo espaciado, notas personales, mini-test diagnóstico

---

## Decisiones cerradas

### D20 — Lectura Socrática (CERRADA 2026-04-15)

El A4 introduce pasajes del texto fuente en capas progresivas durante el diálogo socrático. El texto del autor es un tercer participante que confirma, desafía y matiza las respuestas del aprendiz.

**Flujo pedagógico:**
1. Fase 1 — Fallo productivo (sin texto)
2. Fase 2 — Instrucción canónica (mediación A3)
3. Fase 3 — Diálogo conceptual (turnos 1-3, verificar comprensión base)
4. Fase 4 — Lectura Socrática (turnos 4-6+): exposición en capas (oración → párrafo → argumento), confrontación textual, comparación inter-textual (multi-PDF)
5. Fase 5 — Producción anclada al texto (cita obligatoria del autor)

**Capacidades:**
- Exposición en capas (oración → párrafo → argumento)
- Confrontación textual (pasajes que desafían la respuesta del aprendiz)
- Lectura comparativa (multi-fuente en MVP-1.5)
- Mapa de pasajes visitados (metacognición textual)
- Producción anclada al texto (cita obligatoria)

### D21 — Dashboard de metacognición con 10 secciones (CERRADA 2026-04-15)

Dashboard orientado a la metacognición del aprendiz, no a gamificación. Responde: "¿Estoy realmente aprendiendo, o solo pasando unidades?"

**10 secciones:**
1. Progreso vs deadline (velocidad, proyección, alerta at_risk)
2. Perfil de aprendiz (IBC — Índice de Brecha Cognitiva)
3. Profundidad SOLO (distribución de niveles, tendencia, nivel dominante)
4. Argumentación Toulmin (6 componentes, recomendación personalizada)
5. Convergencia + ZDP (turnos para acreditación, calibración de dificultad)
6. Red de conceptos ENA (grafo de conexiones del aprendiz vs grafo experto)
7. Cobertura textual (pasajes discutidos, citas propias, confrontaciones)
8. Inventario de conceptos (recuerdo espaciado con diálogo socrático)
9. Notas personales (vinculadas a unidades, pasajes, misconcepciones)
10. Mini-test (diagnóstico + checkpoint + simulacro)

**Constructos pedagógicos:**
- SOLO Taxonomy (Biggs 1982): profundidad observable de comprensión
- Toulmin Model (1958): estructura argumentativa
- Bayesian Knowledge Tracing: dominio probabilístico (no binario)
- Zona de Desarrollo Próximo (Vygotsky 1978): calibración de dificultad
- Epistemic Network Analysis (Shaffer 2017): conexiones entre conceptos
- Self-Regulated Learning (Zimmerman 2000): debrief activo al cierre

---

## Sprints de implementación

### Sprint D1 — A4 con clasificación SOLO + Toulmin
- Expandir prompt A4 con clasificación por turno
- Migración 0006_analysis.sql con RLS
- Endpoints de analytics SOLO y Toulmin
- Test adversarial del clasificador
- **Auditoría:** agente Nivel 2 verifica consistencia de clasificación

### Sprint D2 — Dashboard Bloques 1-2-5 (datos existentes)
- Progreso + IBC + convergencia + ZDP
- Endpoint consolidado /api/courses/:id/analytics/dashboard
- Cálculo IBC normalizado 0-1
- Proyección deadline con alerta at_risk
- UI responsive y accesible

### Sprint D3 — Dashboard Bloques 3-4 (SOLO + Toulmin visual)
- Requiere D1
- Distribución SOLO + Toulmin con gráficos
- Recomendaciones argumentativas personalizadas (6 reglas)
- Historial temporal de evolución

### Sprint D4 — Lectura Socrática (D20)
- Prompt A4 expandido con Fase 4
- Exposición en capas (oración → párrafo → argumento)
- Confrontación textual
- Migración text_exposure con RLS
- UI de cita diferenciada + TTS más lento para citas
- Tarea generativa con cita obligatoria
- **Auditoría:** agente adversarial verifica fidelidad de pasajes

### Sprint D5 — Inventario de conceptos + FSRS
- Requiere D4
- Migración concept_inventory con RLS
- FSRS simplificado para spacing
- Mini-diálogo de repaso (2-3 turnos)
- UI desplegable con filtros

### Sprint D6 — Notas personales
- Migración learner_note con RLS
- Vinculación a unidades, pasajes, misconcepciones
- Tags, búsqueda, filtros
- Detección de patrones (#cambio_conceptual)
- Exportar como markdown

### Sprint D7 — Red de conceptos (ENA) + dominio probabilístico
- Requiere D1
- Tracking de conexiones inter-concepto
- Grafo visual (nodos + arcos)
- Comparación con grafo experto
- BKT simplificado con decaimiento temporal

### Sprint D8 — Mini-test diagnóstico + simulacro
- Requiere D1, D5
- Generador de preguntas (5 tipos)
- Evaluador SEPARADO del generador (IV&V)
- 3 momentos: diagnóstico, checkpoint, simulacro
- Actualiza IBC y reprograma repasos

### Sprint D9 — Cobertura textual + debrief SRL
- Requiere D4
- Mapa de cobertura del PDF
- Debrief al cierre de sesión
- Reflexión del aprendiz persistida
- Feed de insights

### Sprint D10 — Integración + auditoría final + deploy
- Página unificada /courses/:id/analytics
- Auditoría YUNQUE Nivel 2 completa
- QA Report consolidado
- ≥20 tests nuevos
- Deploy a Vercel
- Documentación actualizada

---

## Orden de ejecución

```
Paralelo 1:  D1 + D2 + D6     (sin dependencias entre sí)
Paralelo 2:  D3 + D4           (D3 requiere D1; D4 independiente)
Secuencial:  D5 → D7 → D8 → D9 → D10
```

Total estimado: 8-12 sesiones.

---

## Exclusiones explícitas (no se implementa)

- XP, puntos, niveles, streaks (gamificación superficial)
- Comparación entre aprendices (anti-patrón académico)
- Tiempo "en la app" como métrica (vanity metric)
- Número de respuestas correctas (no hay "correctas")
