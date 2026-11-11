// Arranque: liga cada escena al scroll, pinta sólo las visibles y escribe sus lecturas en el DOM.
import { portada, descenso, planetas, travesia } from './gl.js';
import { curvatura, relojes, luz, gusano } from './escenas.js';
import { lorentz, SGR_A, tHawking, evaporacion, radioS, ANIO, num, cifras } from './fisica.js';

const raiz = document.documentElement;
const quieto = matchMedia('(prefers-reduced-motion: reduce)');
const FABRICAS = { portada, curvatura, planetas, relojes, luz, descenso, gusano, travesia };

const escenas = [];
for (const seccion of document.querySelectorAll('[data-escena]')) {
    const canvas = seccion.querySelector('canvas');
    let escena = null;
    try { escena = FABRICAS[seccion.dataset.escena](canvas, seccion); } catch (e) { console.warn(e); }
    if (!escena) { seccion.classList.add('sin-gl'); continue; }
    const salidas = {};
    for (const el of seccion.querySelectorAll('[data-v]')) (salidas[el.dataset.v] ??= []).push(el);
    escenas.push({ seccion, canvas, escena, salidas, previo: {}, visto: false });
}

// Valores fijos que también se calculan
const fijos = {
    'rs-sgr': `${cifras(radioS(SGR_A) / 1e9)} millones de km`,
    'hawking-t': `${cifras(tHawking(SGR_A) * 1e15)} milbillonésimas de kelvin`,
    'hawking-e': String(Math.round(Math.log10(evaporacion(SGR_A) / ANIO))),
};
for (const el of document.querySelectorAll('[data-fijo]')) el.textContent = fijos[el.dataset.fijo];

// Velocidad: factor de Lorentz
const vel = document.querySelector('#velocidad');
if (vel) {
    const pintaVel = () => {
        const beta = 1 - 10 ** -(vel.value / 100 * 4);          // de 0 a 0,9999 c, con detalle cerca de c
        const g = lorentz(beta);
        vel.setAttribute('aria-valuetext', `${num(beta * 100, 4)} por ciento de la velocidad de la luz`);
        document.querySelector('[data-vel=beta]').textContent = `${num(beta * 100, beta > 0.99 ? 4 : 1)} % de c`;
        document.querySelector('[data-vel=gamma]').textContent = cifras(g, 4);
        document.querySelector('[data-vel=viaje]').textContent = `${cifras(10 * g)} años`;
    };
    vel.addEventListener('input', pintaVel); pintaVel();
}

const cabecera = document.querySelector('[data-capitulo]');
const avance = document.querySelector('.avance i');
let ultimo = 0, reloj = 0, sucio = true;

function cuadro(ahora) {
    const dt = Math.min((ahora - ultimo) / 1000 || 0, 0.1); ultimo = ahora;
    const parado = quieto.matches;
    if (!parado) reloj += dt;
    const vh = innerHeight;
    let capitulo = '';
    for (const e of escenas) {
        const r = e.seccion.getBoundingClientRect();
        if (r.top < vh * 0.5 && r.bottom > vh * 0.5) capitulo = e.seccion.dataset.titulo || (e.previo.r ? `r = ${e.previo.r} radios` : '');
        if (r.bottom < -40 || r.top > vh + 40) continue;
        if (parado && e.visto && !sucio) continue;
        const p = parado ? Number(e.seccion.dataset.quieto ?? 0.5) : Math.min(1, Math.max(0, -r.top / Math.max(1, r.height - vh)));
        const c = e.canvas, esc = e.escena.escala ?? Math.min(devicePixelRatio || 1, 2);
        const w = Math.max(2, Math.round(c.clientWidth * esc)), h = Math.max(2, Math.round(c.clientHeight * esc));
        if (c.width !== w || c.height !== h) { c.width = w; c.height = h; }
        const v = e.escena.pintar(p, parado ? 40 : reloj + 40, w, h, parado ? 0 : dt) || {};
        e.visto = true;
        for (const k in v) {
            if (e.previo[k] === v[k]) continue;
            e.previo[k] = v[k];
            if (k.startsWith('--')) e.seccion.style.setProperty(k, v[k]);
            else for (const el of e.salidas[k] || []) el.textContent = v[k];
        }
    }
    sucio = false;
    if (cabecera && cabecera.textContent !== capitulo) cabecera.textContent = capitulo;
    if (avance) avance.style.transform = `scaleX(${Math.min(1, scrollY / Math.max(1, raiz.scrollHeight - vh))})`;
    requestAnimationFrame(cuadro);
}

const marcar = () => { raiz.classList.toggle('quieto', quieto.matches); sucio = true; };
quieto.addEventListener('change', marcar);
addEventListener('resize', () => { sucio = true; });
document.querySelector('#masa')?.addEventListener('input', () => { sucio = true; });
marcar();
raiz.classList.remove('sin-js');
// Las letras del canvas esperan a la tipografía
document.fonts?.ready.then(() => { sucio = true; });
requestAnimationFrame(cuadro);
