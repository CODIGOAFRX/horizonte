# Horizonte (pedrogomez.dev/proyecto/horizonte)

Web estática (HTML, CSS y JavaScript sin frameworks ni dependencias) servida por un Worker de Cloudflare. Todo el
texto de la web y de los comentarios va en español de España, sin rayas (el test lo comprueba).

- Contexto de producto: [PRODUCT.md](PRODUCT.md). Sistema visual: [DESIGN.md](DESIGN.md).
- Vista local: `npm run dev` (http://127.0.0.1:8090/proyecto/horizonte/). Hay que reconstruir tras cada cambio: el
  servidor sirve `dist/`.
- Tests: en Windows `node --test` se queda colgado; ejecuta `node test/horizonte.test.mjs`.
- Despliegue: `npm run deploy` (test, build y Wrangler). Pregunta antes de desplegar.

| Archivo | Qué hace |
|---|---|
| `app/fisica.js` | Constantes, fórmulas, integración de los rayos de luz y formato de números. Sin DOM; lo usa el test |
| `app/gl.js` | WebGL a mano: sombreador del agujero negro (portada y descenso) y de los planetas |
| `app/escenas.js` | Canvas 2D: malla curvada, relojes, rayos de luz y agujero de gusano |
| `app/horizonte.js` | Arranque: progreso de cada escena con el scroll, pintado sólo de las visibles y lecturas en el DOM |
| `scripts/build.mjs` | Copia `app/` a `dist/proyecto/horizonte`, pone la ruta base y versiona CSS y JS con su hash |

Cada escena es una `<section data-escena>` con un `.plano` fijo (canvas y lecturas) y unos `.paso` de texto que
pasan por encima. Su fábrica devuelve `pintar(p, t, w, h, dt)`, con `p` de 0 a 1, y ésta devuelve los valores que
se escriben en los `[data-v]` de la sección.

Reglas: las escenas avanzan y retroceden con el scroll (sólo se mueve solo el ambiente: rotación y disco), la
página se lee sin JavaScript y sin WebGL, y con `prefers-reduced-motion` no se fija nada. Los números que se
enseñan se calculan en `fisica.js`: no se escriben cifras a mano. Sin analítica, cookies ni peticiones a terceros.
La CSP no admite estilos ni scripts en línea.

## Skills de este proyecto

| Herramienta | Dónde | Cuándo usarla |
|---|---|---|
| Impeccable | `.claude/skills/impeccable` | Cualquier trabajo de diseño: `/impeccable critique`, `polish`, `audit`, `animate`. El contexto ya está iniciado (PRODUCT.md, DESIGN.md) |
| emil-design-eng | `.claude/skills/emil-design-eng` | Antes de añadir o tocar una animación: curvas, duraciones y criterio |
| review-animations | `.claude/skills/review-animations` | Revisar el movimiento ya hecho |
| break-ui | `.claude/skills/break-ui` | Probar la interfaz con datos feos (masa absurda, pantallas mínimas, textos largos) |
| untangle-codebase | `.claude/skills/untangle-codebase` | Si el código crece y hay que ordenarlo |
| Subagentes | `.claude/agents` | `frontend-developer`, `ui-designer`, `code-reviewer`, `accessibility-tester`, más los de Impeccable |
| Taste Skill | global (plugin) | Dirección de arte y revisión contra el aspecto genérico |
| UI UX Pro Max | global | Consultas de paletas, tipografías y pautas de UX |
| Web Design Guidelines | global | Auditar la interfaz contra las pautas de Vercel |
| Playwright CLI | global | Capturas y pruebas en navegador real |
| find-skills | global | Buscar una skill para algo que falte |
| scroll-world | global (plugin) | Genera imagen y vídeo con servicios de pago (Monid o Higgsfield): no generar nada sin preguntar a Pedro |
| claude-mem | global (plugin) | Memoria entre sesiones; se desactiva con `claude plugin disable claude-mem` |

`.claude/` e `.impeccable/` no se suben al repositorio.
