---
name: Horizonte
description: El artículo de física hecho paisaje. Una caída instrumentada hasta el borde de un agujero negro.
colors:
  frio: "#bfd3ff"
  calido: "#ffb87b"
  fondo: "#04060b"
  fondo-2: "#0b101b"
  texto: "#ece7dc"
  tenue: "#a4abba"
  linea: "rgb(191 211 255 / 0.2)"
typography:
  display: { fontFamily: "CMU Serif, Latin Modern Roman, Times New Roman, serif", fontSize: "clamp(4.2rem, 1rem + 15vw, 12rem)", fontWeight: 400, lineHeight: 0.86, letterSpacing: "-0.035em" }
  headline: { fontFamily: "CMU Serif, Latin Modern Roman, Times New Roman, serif", fontSize: "clamp(2.1rem, 1.3rem + 3vw, 3.6rem)", fontWeight: 400, lineHeight: 1.04, letterSpacing: "-0.015em" }
  title: { fontFamily: "CMU Serif, Latin Modern Roman, Times New Roman, serif", fontSize: "clamp(1.7rem, 1.2rem + 1.8vw, 2.5rem)", fontWeight: 400, lineHeight: 1.1 }
  body: { fontFamily: "CMU Serif, Latin Modern Roman, Times New Roman, serif", fontSize: "clamp(1.125rem, 0.95rem + 0.5vw, 1.3125rem)", fontWeight: 400, lineHeight: 1.5 }
  label: { fontFamily: "CMU Bright, Helvetica Neue, Arial, sans-serif", fontSize: "0.9rem", fontWeight: 400, lineHeight: 1.3 }
spacing:
  margen: "clamp(1.25rem, 5vw, 5rem)"
  parrafo: "1.1rem"
  fila-lectura: "0.45rem"
  bloque: "clamp(6rem, 18vh, 11rem)"
components:
  lecturas: { backgroundColor: "rgb(4 6 11 / 0.7)", textColor: "{colors.texto}", typography: "{typography.label}", padding: "0.2rem 0.9rem 0.3rem", width: "min(24.8rem, 36vw)" }
  campo-numero: { backgroundColor: "transparent", textColor: "{colors.texto}", width: "4.6rem" }
  campo-numero-hover: { backgroundColor: "rgb(255 184 123 / 0.1)" }
  deslizador: { height: "2.75rem", width: "100%" }
  salto: { backgroundColor: "{colors.calido}", textColor: "{colors.fondo}", padding: "0.4rem 0.8rem" }
---

# Design System: Horizonte

## Overview

**Creative North Star: "El artículo de física hecho paisaje"**

La página es una caída y el scroll es la coordenada radial. Cada escena es un plano fijo a pantalla completa, dibujado en código (WebGL o canvas 2D), con una columna de texto que pasa por encima y un cuadro de lecturas que cambia con la posición. Sobria y exacta: letra de TeX, trazo fino de diagrama, negro con tinte azul. No hay rasters, tarjetas, sombras ni iconos (la única excepción son las costas de la Tierra, calcadas de un mapa real); la imagen es el cálculo. **Key Characteristics:** un plano fijo por idea; dos colores con significado físico; cifras vivas en un instrumento, nunca sueltas en el texto; ecuaciones compuestas en HTML; lectura completa sin JavaScript, sin WebGL y con movimiento reducido.

## Colors

Negro azulado y hueso, con dos temperaturas de cuerpo negro como únicos acentos.

- **Primary, Ámbar 3 200 K** (`calido`): lo profundo y lento, y todo lo que se puede tocar o está activo: subrayado de enlaces, hover, foco, selección, cursor, borde de campos, resultado de una lectura, subtítulo de planeta.
- **Secondary, Azul blanco 12 000 K** (`frio`): lo lejano y rápido: ecuaciones, símbolos de variable en las lecturas, rayos que escapan, reloj lejano.
- **Neutral:** `fondo` (página y velos), `fondo-2` (reserva, sin uso ahora), `texto` (hueso cálido), `tenue` (etiquetas, notas, autor, pie), `linea` (filete de 1px, frío al 20 %).

**Regla de las Dos Temperaturas.** `frio` y `calido` se derivan de la fórmula del cuerpo negro y un test lo comprueba; no se retocan a ojo ni se añade un tercer acento. Donde hay una magnitud continua (profundidad, avance, velocidad) se mezcla de frío a cálido: barra de avance, pista del deslizador, malla, reloj que baja. **Regla del Color Físico.** Solo los renders WebGL salen de la pareja: el disco usa una rampa de temperatura (rojo oscuro, ámbar, blanco, azul) y cada planeta su albedo. Los diagramas en canvas usan únicamente `frio`, `calido` y `texto` con alfa, y negro puro para el agujero.

## Typography

**Display y cuerpo:** CMU Serif, redonda e itálica, peso 400 único. **Medidas:** CMU Bright. Ambas autoalojadas (OFL).

- **Display:** solo el título de portada, pegado abajo a la izquierda.
- **Headline:** un titular por escena, en redonda, con `text-wrap: balance`.
- **Title:** itálica en `calido`; nombra el objeto del paso (cada planeta).
- **Body:** columna de 27 a 34rem; notas al 0.9em en `tenue`; ecuación al 1.25em en `frio`, sin partir línea.
- **Label:** lecturas, etiqueta del deslizador y pie, con cifras tabulares (0.78rem en la franja estrecha).

**Regla de la Medida.** CMU Bright aparece solo donde hay un dato medido o su etiqueta. La jerarquía se hace con tamaño, itálica y color; nunca con negrita, mayúsculas ni espaciado abierto. **Regla de la Variable.** Toda variable va en itálica serif, también dentro de una etiqueta sans y en los rótulos del canvas.

## Layout

Margen lateral único (`margen`) compartido por cabecera y texto. Escena: plano `sticky` de 100svh y, encima, pasos de 100svh con el texto centrado en vertical en una columna izquierda de 29rem; la figura vive a la derecha y las lecturas abajo a la derecha. Los bloques en flujo normal respiran con `bloque` y miden 46rem; la página acaba en el último plano, la travesía, cuyo paso final («Fin del viaje») lleva los tres enlaces de salida. Pantalla estrecha (`max-aspect-ratio: 115/100` o `max-width: 760px`): figura arriba, texto abajo, lecturas en una franja opaca de dos columnas pegada al borde inferior; desaparece el capítulo de la cabecera. Movimiento: el texto entra y sale con su posición en la ventana (opacidad, desenfoque de 8px y 1.5rem de desplazamiento, `animation-timeline: view()`); las transiciones de estado duran 0.2s con `cubic-bezier(0.16, 1, 0.3, 1)`. Con movimiento reducido o sin JavaScript nada se fija y todo se lee de corrido.

## Elevation & Depth

Sin sombras. La profundidad es tonal: velos de `fondo` en degradado hacia transparente (lateral en escritorio, inferior en portada y en estrecho) para que el texto se lea sobre la imagen, y fondo al 70 % bajo las lecturas.

## Shapes

Esquinas rectas en todo. Filetes de 1px como única estructura: separador de lecturas, borde inferior de campos, barra de raíz de las ecuaciones, subrayado de enlaces. Los únicos círculos son los de la física y el tirador del deslizador. En canvas, trazo de `max(1, h/900)` px con alfa, discontinuo para órbitas de referencia.

## Components

- **Cabecera:** fija, tres columnas (marca en itálica, capítulo en `tenue`, autor), sobre un degradado de `fondo` sin borde; barra de avance de 2px de frío a cálido en el filo superior.
- **Lecturas:** lista de definición; etiqueta en `tenue` a la izquierda, valor en `texto` a la derecha, filete entre filas. La fila ancha da la frase resultado en serif `calido`.
- **Campo numérico:** transparente, alineado a la derecha, solo borde inferior `calido`; hover con ámbar al 10 %.
- **Deslizador:** pista de 2px de frío a cálido, zona táctil de 2.75rem, tirador circular de `fondo` con borde `calido` que se rellena y crece al usarlo.
- **Enlaces:** color heredado con subrayado `calido` de 1px; hover en `calido`. Foco: contorno `calido` de 2px con 4px de separación.
- **Ecuación:** HTML con itálicas, subíndices y barra de raíz; nunca imagen.

## Do's and Don'ts

- **Do** dar a cada plano un cuadro de lecturas cuyos valores salgan de la fórmula y cambien con el scroll.
- **Do** dibujar en código y poner a cada canvas una alternativa textual que describa lo que ocurre.
- **Do** reservar `calido` para lo interactivo y lo profundo, y `frio` para lo lejano y lo matemático.
- **Don't** usar sombras, radios, tarjetas, negrita, mayúsculas espaciadas ni iconos.
- **Don't** añadir un tercer acento ni usar la pareja como decoración sin magnitud detrás.
- **Don't** poner una cifra que no se calcule, ni fijar o animar nada con movimiento reducido.
