# Horizonte

Una caída desde la órbita de la Tierra hasta el borde de un agujero negro, ligada al scroll y calculada en el navegador.

Publicada en [pedrogomez.dev/proyecto/horizonte](https://pedrogomez.dev/proyecto/horizonte/).

## Qué es

Siete escenas que avanzan y retroceden con el scroll. Cada una enseña una idea de la relatividad general y deja ver sus números:

| Escena | Qué se ve | Cómo se dibuja |
|---|---|---|
| Portada | Un agujero negro con su disco de acreción | WebGL: un rayo de luz por píxel, integrado en la métrica de Schwarzschild |
| Curvatura | Una malla que se hunde bajo una masa | Canvas 2D con proyección en perspectiva |
| Planetas | Los ocho planetas, con tu peso en cada uno | WebGL: ruido procedural sobre una esfera |
| Tiempo | Dos relojes que se separan al bajar | Canvas 2D, de la Tierra al horizonte en escala logarítmica |
| Luz | Rayos que se curvan o caen | Canvas 2D: la misma integración de geodésicas, ahora en el plano |
| Descenso | La bajada hasta el horizonte de Sagitario A* | El sombreador de la portada, con la cámara ligada al scroll |
| Agujero de gusano | Una garganta entre dos hojas | Canvas 2D: superficie de revolución de la métrica de Ellis |

No hay vídeo, imágenes ni librerías. Tampoco analítica, cookies ni peticiones a terceros.

## La física

Todo está en [`app/fisica.js`](app/fisica.js), sin dependencias del DOM, y el test lo comprueba contra valores conocidos:

- Radio de Schwarzschild: `rs = 2GM / c²`.
- Ritmo de un reloj quieto en un campo gravitatorio: `dτ/dt = √(1 − rs/r)`.
- Factor de Lorentz: `γ = 1 / √(1 − v²/c²)`.
- Trayectoria de la luz: `d²x/dλ² = −(3/2)·h²·x / r⁵`, que reproduce las órbitas exactas de un fotón en Schwarzschild. De ahí salen la esfera de fotones (1,5 rs), la sombra (2,6 rs) y la desviación de 1,75 segundos de arco junto al Sol.
- Marea, temperatura de Hawking y tiempo de evaporación.
- Los dos colores de la página son los de un cuerpo negro a 12 000 K y a 3 200 K.

Simplificaciones que conviene saber: el agujero negro no gira (Schwarzschild, no Kerr), la cámara está quieta en cada punto (sin aberración por la caída), el disco es una lámina fina con velocidad orbital newtoniana y la malla de la curvatura es una analogía en dos dimensiones.

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

## Accesibilidad

La página se lee completa sin JavaScript y sin WebGL. Con `prefers-reduced-motion` las escenas dejan de fijarse y no hay movimiento ambiente. Cada canvas tiene su descripción y las cifras viven en el DOM.

## Créditos

Diseño y código de Pedro Gómez. Tipografía [Computer Modern Unicode](https://ctan.org/pkg/cm-unicode), con licencia SIL Open Font ([`app/fonts/OFL.txt`](app/fonts/OFL.txt)).
