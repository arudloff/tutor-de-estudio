# Referencia al artículo A9 del cluster doctoral

> Socrates es la operacionalización empírica del marco teórico desarrollado en el artículo A9 del cluster doctoral *Coexistir con lo que nos excede*.

## Cita

Rudloff, A. (2026). El tutor que no genera deuda: principios pedagógicos para sistemas de inteligencia artificial que aceleran el aprendizaje doctoral sin atrofiar al aprendiz. *Artículo A9, Cluster de Investigación: Coexistir con lo que nos excede*. Universidad de Talca, Doctorado en Management.

## Ubicación local

- Documento Word: `G:\Mi unidad\DOCTORADO\Organizaciones Hibridadas\Cluster de Investigación_publicación\A9_Tutor_Sin_Deuda.docx`
- Script generador: `G:\Mi unidad\DOCTORADO\Organizaciones Hibridadas\Cluster de Investigación_publicación\gen_A9.js`
- Tabla de verificación de citas: `G:\Mi unidad\DOCTORADO\Organizaciones Hibridadas\Cluster de Investigación_publicación\A9_tabla_verificacion_citas.md`
- Manifiesto de auditoría /dr: `G:\Mi unidad\DOCTORADO\Organizaciones Hibridadas\Cluster de Investigación_publicación\A9_Tutor_Sin_Deuda.yunque-dr.json`

## Argumento central del A9

El experimento de Bastani et al. (2025, *PNAS*) demuestra que el mismo modelo de lenguaje (GPT-4) puede producir resultados de aprendizaje opuestos —mejora del 127% sin daño residual versus mejora aparente del 48% seguida de un deterioro del 17% por debajo del control— dependiendo únicamente del marco pedagógico que gobierna su comportamiento. La instrucción es la variable, no el modelo. El RCT de Kestin et al. (2025, *Scientific Reports*) extiende esta constatación al mostrar que un tutor de IA bien diseñado puede superar al aprendizaje activo en aula —el estándar empírico más alto previo a la era de la IA— en menos tiempo y con mayor engagement.

A partir de esa evidencia, el artículo deriva seis principios pedagógicos que distinguen a los tutores de IA que aceleran el aprendizaje de los que lo atrofian, los mapea al modelo dual del cerebro propuesto en el artículo A4 del cluster (10 bits/s consciente que la IA puede asumir + procesador inconsciente que la IA no puede replicar), y argumenta que el aprendizaje doctoral pertenece a la categoría de dominios donde la deuda cognitiva es no-negociable.

## Cómo Socrates implementa el A9

| Principio del A9 | Cómo Socrates lo operacionaliza |
|---|---|
| 1. Fallo productivo | Toda micro-lección comienza con un problema antes de la instrucción canónica |
| 2. Grafo de prerequisitos y frontera de aprendibilidad | El agente A2 construye el grafo dinámicamente desde los textos del aprendiz |
| 3. Diálogo socrático estructurado | El agente A3 genera rúbricas y catálogos de misconcepciones; el agente A4 los usa para conducir el diálogo |
| 4. Aprendizaje cognitivo y aprendiz protégé inverso | Modelado experto explícito + inversión periódica del rol |
| 5. Detección afectiva | El agente A9 clasifica el estado emocional desde señales conductuales y A4 calibra la intervención |
| 6. Salida generativa estructurada | Cada interacción cierra con producción del aprendiz, no con cierre receptivo |

## Estado del A9 al cierre de esta fase

- Versión: borrador post-corrección
- Quality gate: BORRADOR PASS sólido
- Anti-IA score estimado: ~88
- Trazabilidad estimada: 78
- Crítico compuesto estimado: 86
- Pendientes para gate CAPÍTULO: descargar PDFs faltantes (Bastani, Kestin), añadir páginas a citas pivote, calibrar registro prescriptivo en sección 5

## La conexión es estructural, no decorativa

Socrates no es un proyecto de software inspirado por un artículo doctoral. Es la implementación específica de los principios del artículo, diseñada para ser un caso empírico que pueda validar (o refutar) el marco teórico. Si Socrates funciona, el A9 gana evidencia empírica. Si Socrates no funciona, el A9 debe revisarse. Esta dependencia mutua es deliberada y constituye la integración entre la dimensión teórica y la dimensión práctica del programa doctoral del investigador.
