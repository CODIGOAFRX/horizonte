# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

Estático sin frameworks: HTML, CSS y JavaScript con WebGL escrito a mano, sin dependencias de ejecución. Build propio en Node (`scripts/build.mjs`) y Worker de Cloudflare que sólo sirve archivos estáticos, igual que sphaera y palimpsesto. Decisión confirmada por Pedro.

## Users

Reclutadores y responsables técnicos que llegan desde el CV o el portfolio de Pedro Gómez (pedrogomez.dev). Dedican pocos minutos, casi siempre en un portátil, y buscan pruebas de oficio: gráficos en tiempo real, rigor y cuidado del detalle. Público secundario: cualquier persona curiosa por la física.

## Product Purpose

Horizonte es una experiencia visual ligada al scroll sobre la gravedad: un descenso desde la órbita de la Tierra hasta el horizonte de sucesos de un agujero negro, pasando por la curvatura del espaciotiempo, la dilatación del tiempo, las lentes gravitatorias y los agujeros de gusano. Tiene éxito si quien la visita entiende algo que no sabía y sale convencido de que Pedro sabe construir piezas técnicas y visuales.

## Positioning

Nada es vídeo ni imagen pregrabada: cada escena se dibuja en el navegador y cada número que se enseña sale de la fórmula real (Schwarzschild, dilatación gravitatoria y cinemática), calculada en directo según la posición del scroll.

## Operating Context

Pieza del portfolio, publicada en pedrogomez.dev/proyecto/horizonte junto a sphaera, catabasis, palimpsesto y otras. Se enlaza desde el CV. Repositorio público en GitHub (CODIGOAFRX/horizonte) que también se lee como muestra de código.

## Capabilities and Constraints

- Las escenas avanzan y retroceden con el scroll; nada se reproduce solo salvo el movimiento ambiente (rotación, disco de acreción).
- La página se lee sin JavaScript y sin WebGL; con `prefers-reduced-motion` no se fija nada ni hay movimiento ambiente.
- Texto en español de España, sin rayas.
- Sin analítica, sin cookies y sin peticiones a terceros.
- Los números que se enseñan se calculan; no se inventan cifras.
- El archivo pdimagearchive.org es opcional: Pedro pidió no centrarse en él y dibujar en código.
- Nada generado con servicios de pago (scroll-world, Monid, Higgsfield) sin preguntar antes.

## Brand Commitments

Nombre: Horizonte. Autor visible: Pedro Gómez, con enlace de vuelta al portfolio. Carta blanca en el diseño.

## Evidence on Hand

Constantes y fórmulas físicas públicas (G, c, masas y radios de la Tierra, el Sol y Sagitario A*). No hay testimonios ni métricas, y no se deben fabricar.

## Product Principles

1. La física manda: lo que se ve es consecuencia de la ecuación, no un adorno.
2. El scroll es el mando: el visitante controla la caída, hacia delante y hacia atrás.
3. Cada escena enseña una sola idea y la deja tocar.
4. La técnica se nota en el resultado y se puede comprobar en el código.
5. Funciona degradado: sin JavaScript, sin WebGL o con movimiento reducido sigue siendo una lectura completa.

## Accessibility & Inclusion

WCAG AA en contraste y navegación por teclado; controles interactivos con etiqueta y alternativa textual para cada escena; respeto de `prefers-reduced-motion`.
