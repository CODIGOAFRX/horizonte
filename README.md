# Horizonte

Una caída desde la órbita de la Tierra hasta el borde de un agujero negro, ligada al scroll y calculada en el navegador.

Publicada en [pedrogomez.dev/proyecto/horizonte](https://pedrogomez.dev/proyecto/horizonte/).

## Qué es

Ocho escenas que avanzan y retroceden con el scroll. Cada una enseña una idea de la relatividad general y deja ver sus números:

| Escena | Qué se ve | Cómo se dibuja |
|---|---|---|
| Portada | Un agujero negro con su disco de acreción y el cielo girando despacio a su alrededor | WebGL: un rayo de luz por píxel, integrado en la métrica de Schwarzschild |
| Curvatura | Una malla que se hunde bajo una masa y una bola que cae por ella | Canvas 2D con proyección en perspectiva; la bola se integra paso a paso con la pendiente del pozo |
| Planetas | Los ocho planetas, con tu peso en cada uno | WebGL: ruido procedural sobre una esfera; la Tierra lleva sus costas reales |
| Tiempo | Dos relojes que se separan al bajar | Canvas 2D, de la Tierra al horizonte en escala logarítmica |
| Luz | Rayos que se curvan o caen | Canvas 2D: la misma integración de geodésicas, ahora en el plano |
| Descenso | La bajada hasta el horizonte de Sagitario A* | El sombreador de la portada, con la cámara ligada al scroll |
| Agujero de gusano | Una garganta entre dos hojas | Canvas 2D: superficie de revolución de la métrica de Ellis |
| Travesía | La cámara cruza la garganta y sale ante otra galaxia | WebGL: un rayo por píxel, integrado en la métrica de Ellis |

No hay vídeo, imágenes ni librerías. Tampoco analítica, cookies ni peticiones a terceros. El único dato que no sale de una fórmula es el contorno de los continentes: una máscara de tierra y mar de 1024 × 512 celdas calcada de [Natural Earth](https://www.naturalearthdata.com/) (dominio público), que ocupa 14 KB dentro de [`app/tierra.js`](app/tierra.js). El color, el hielo y las nubes de la Tierra siguen siendo ruido.

## La física

Todo está en [`app/fisica.js`](app/fisica.js), sin dependencias del DOM, y el test lo comprueba contra valores conocidos:

- Radio de Schwarzschild: `rs = 2GM / c²`.
- Ritmo de un reloj quieto en un campo gravitatorio: `dτ/dt = √(1 − rs/r)`.
- Factor de Lorentz: `γ = 1 / √(1 − v²/c²)`.
- Trayectoria de la luz: `d²x/dλ² = −(3/2)·h²·x / r⁵`, que reproduce las órbitas exactas de un fotón en Schwarzschild. De ahí salen la esfera de fotones (1,5 rs), la sombra (2,6 rs) y la desviación de 1,75 segundos de arco junto al Sol.
- Luz en un agujero de gusano de Ellis: `l'' = h²·l / (b₀² + l²)²`. Los rayos con `h < b₀` cruzan la garganta; por eso la boca se ve como una esfera con otro cielo dentro.
- Marea, temperatura de Hawking y tiempo de evaporación.
- Los dos colores de la página son los de un cuerpo negro a 12 000 K y a 3 200 K.

Simplificaciones que conviene saber: el agujero negro no gira (Schwarzschild, no Kerr), la cámara está quieta en cada punto (sin aberración por la caída; en la portada da una vuelta lenta al agujero), el disco es una lámina fina con velocidad orbital newtoniana y la malla de la curvatura es una analogía en dos dimensiones: la bola sigue la pendiente del pozo y una guía suave la deja en órbita circular para que no se salga de la malla.

## Desarrollo

Hace falta Node 22 o posterior. No hay dependencias que instalar.

```bash
npm run dev
```

Abre http://127.0.0.1:8090/proyecto/horizonte/.

```bash
npm test
```

```bash
npm run deploy
```

El despliegue construye `dist/` y lo publica con Wrangler como archivos estáticos de un Worker de Cloudflare, en las rutas de `wrangler.jsonc`.

Para regenerar el mapa de la Tierra hacen falta los contornos `ne_50m_land` y `ne_50m_lakes` de Natural Earth en GeoJSON:

```bash
node scripts/tierra.mjs ne_50m_land.geojson ne_50m_lakes.geojson
```

## Accesibilidad

La página se lee completa sin JavaScript y sin WebGL. Con `prefers-reduced-motion` las escenas dejan de fijarse y no hay movimiento ambiente. Cada canvas tiene su descripción y las cifras viven en el DOM.

## Créditos

Diseño y código de Pedro Gómez. Costas de [Natural Earth](https://www.naturalearthdata.com/), de dominio público. Tipografía [Computer Modern Unicode](https://ctan.org/pkg/cm-unicode), con licencia SIL Open Font ([`app/fonts/OFL.txt`](app/fonts/OFL.txt)).
