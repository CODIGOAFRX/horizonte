// Escenas en canvas 2D: la malla curvada, los dos relojes, los rayos de luz y la garganta del agujero de gusano.
import { rayo, ritmo, atraso, ANIO, B_CRITICO, num, cifras, duracion } from './fisica.js';

const FRIO = [191, 211, 255], CALIDO = [255, 184, 123], TEXTO = [236, 231, 220];
const rgba = (c, a) => `rgba(${c[0]},${c[1]},${c[2]},${a})`;
const mix3 = (a, b, t) => [0, 1, 2].map(i => Math.round(a[i] + (b[i] - a[i]) * t));
const mezcla = (a, b, t) => a + (b - a) * t;
const lim = x => Math.min(1, Math.max(0, x));
const suave = (a, b, x) => { const t = lim((x - a) / (b - a)); return t * t * (3 - 2 * t); };
// Centro de la figura: a la derecha en pantallas anchas, arriba en las estrechas
const encuadre = (w, h) => (w / h > 1.15 ? { cx: w * 0.66, cy: h * 0.5, ancho: true } : { cx: w * 0.5, cy: h * 0.36, ancho: false });

// Proyección con una cámara elevada E radianes sobre el plano
function camara(E, S, cx, cy, fuga = 0.33) {
    const cE = Math.cos(E), sE = Math.sin(E);
    return (x, y, z) => {
        const k = 1 / (1 + (z * cE - y * sE) * fuga);
        return [cx + x * S * k, cy - (y * cE + z * sE) * S * k, k];
    };
}

// La bola de prueba de la malla. Se mueve por el plano (x, z) con la aceleración que le da la pendiente
// del pozo, −K·∇pozo con pozo(d) = −D·s/√(d² + s²): sin masa va recta y con ella se curva. Cuando hay
// masa, una guía suave (proporcional a `m`) la lleva a la órbita circular de radio R_ORBITA, con la
// velocidad que esa órbita pide en ese pozo, para que no acabe ni dentro de la masa ni fuera de la malla.
// Si sale por el borde se vuelve a lanzar. Devuelve true cuando ha habido relanzamiento.
const R_ORBITA = 0.66, V_BOLA = 0.57, K_POZO = 6, BORDE = 1.5;
export function lanzaBola(b = {}) { b.x = -BORDE; b.z = R_ORBITA; b.vx = V_BOLA; b.vz = 0; return b; }
export function pasoBola(b, D, s, m, dt) {
    const d2 = b.x * b.x + b.z * b.z, d = Math.sqrt(d2) || 1e-6;
    const a = K_POZO * D * s / (d2 + s * s) ** 1.5;
    b.vx -= a * b.x * dt; b.vz -= a * b.z * dt;
    const k = 1.6 * suave(0.1, 0.5, m) * dt;
    if (k > 0) {
        const sentido = b.x * b.vz - b.z * b.vx < 0 ? -1 : 1, vc = d * Math.sqrt(a), vr = (R_ORBITA - d) * 1.5;
        b.vx += ((-b.z * sentido * vc + b.x * vr) / d - b.vx) * k;
        b.vz += ((b.x * sentido * vc + b.z * vr) / d - b.vz) * k;
    }
    b.x += b.vx * dt; b.z += b.vz * dt;
    if (Math.abs(b.x) > BORDE || Math.abs(b.z) > BORDE) { lanzaBola(b); return true; }
    return false;
}
// Forma del pozo y de la masa según el avance p de la escena: primero aparece la masa (m) y luego se comprime (c)
export function pozoDe(p) {
    const m = suave(0.04, 0.38, p), c = suave(0.5, 1, p);
    return { m, c, D: m * (0.42 + 2.3 * c), s: mezcla(0.45, 0.11, c), R: mezcla(0.17, 0.035, c) * m };
}

export function curvatura(canvas) {
    const ctx = canvas.getContext('2d');
    // Estado de la bola y su estela (x, z de los últimos instantes); `fijo` es el avance ya resuelto en quieto
    const bola = lanzaBola(), estela = [], PASO = 1 / 120;
    let fijo = -1;
    return {
        pintar(p, t, w, h, dt) {
            const { cx, cy, ancho } = encuadre(w, h);
            const { m, c, D, s, R } = pozoDe(p);
            const pozo = d => -D * s / Math.sqrt(d * d + s * s);
            const S = (ancho ? Math.min(w * 0.3, h * 0.52) : w * 0.46);
            const P = camara(1.02, S, cx, cy - S * 0.12 * m);
            ctx.clearRect(0, 0, w, h);
            ctx.lineWidth = Math.max(1, h / 900);
            const N = 26, SEG = 44, L = 1.3;
            for (let eje = 0; eje < 2; eje++) for (let i = 0; i <= N; i++) {
                const a = -L + 2 * L * i / N;
                let ant = null;
                for (let j = 0; j <= SEG; j++) {
                    const b = -L + 2 * L * j / SEG;
                    const x = eje ? a : b, z = eje ? b : a, y = pozo(Math.hypot(x, z));
                    const q = P(x, y, z);
                    if (ant) {
                        const borde = 1 - suave(0.8, 1.3, Math.max(Math.abs(x), Math.abs(z)));
                        ctx.strokeStyle = rgba(mix3(FRIO, CALIDO, lim(-y / 0.9)), (0.16 + 0.5 * lim(-y / 0.6)) * borde * q[2]);
                        ctx.beginPath(); ctx.moveTo(ant[0], ant[1]); ctx.lineTo(q[0], q[1]); ctx.stroke();
                    }
                    ant = q;
                }
            }
            // La masa: la misma, cada vez en menos sitio
            if (m > 0.01) {
                const q = P(0, pozo(0) + R, 0);
                const g = ctx.createRadialGradient(q[0] - R * S * 0.3, q[1] - R * S * 0.3, 0, q[0], q[1], R * S * q[2]);
                g.addColorStop(0, rgba(mix3(TEXTO, CALIDO, c), 1)); g.addColorStop(1, rgba(mix3(CALIDO, [60, 20, 0], 0.5 + 0.4 * c), 1));
                ctx.fillStyle = g; ctx.beginPath(); ctx.arc(q[0], q[1], Math.max(1.5, R * S * q[2]), 0, 7); ctx.fill();
            }
            // La bola de prueba: recta sin masa, en órbita con ella. Avanza con el tiempo real, en pasos cortos;
            // en quieto se resuelve una vez por posición, dejándola correr unos segundos desde el lanzamiento
            const avanza = seg => {
                for (let n = Math.ceil(seg / PASO), i = 0; i < n; i++) {
                    if (pasoBola(bola, D, s, m, seg / n)) estela.length = 0;
                    estela.push(bola.x, bola.z);
                }
                if (estela.length > 240) estela.splice(0, estela.length - 240);
            };
            if (dt) { avanza(dt); fijo = -1; } else if (p !== fijo) { fijo = p; lanzaBola(bola); estela.length = 0; avanza(7.5); }
            const n = estela.length / 2;
            for (let k = (n - 1) % 4; k < n; k += 4) {
                const x = estela[2 * k], z = estela[2 * k + 1], ultima = k === n - 1;
                const q = P(x, pozo(Math.hypot(x, z)) + 0.02, z);
                const borde = 1 - suave(0.8, 1.3, Math.max(Math.abs(x), Math.abs(z)));
                ctx.fillStyle = rgba(TEXTO, (ultima ? 1 : 0.5 * k / n) * borde);
                ctx.beginPath(); ctx.arc(q[0], q[1], (ultima ? 4 : 1.4) * Math.max(1, h / 800) * q[2], 0, 7); ctx.fill();
            }
            return { compacidad: num(m * mezcla(0.04, 1, c * c), 2) };
        },
    };
}

// Hitos del descenso en log10(e), con e = r/rs − 1. Los pasos del texto caen sobre ellos.
const HITOS = [
    [8.857, 'superficie de la Tierra'], [5.372, 'superficie del Sol'], [3.285, 'enana blanca'],
    [0.279, 'estrella de neutrones'], [-4, 'a 0,0001 radios del horizonte'], [-9.575, 'planeta de Miller'],
];
const RUTA = [8.857, 4.3, 0.279, -4, -9.575];

export function relojes(canvas) {
    const ctx = canvas.getContext('2d');
    let lejos = 0, aqui = 0;
    return {
        pintar(p, t, w, h, dt) {
            const { cx, ancho, ...e0 } = encuadre(w, h), cy = ancho ? h * 0.39 : e0.cy;
            const k = Math.min(p * (RUTA.length - 1), RUTA.length - 1.0001), i = Math.floor(k);
            const le = mezcla(RUTA[i], RUTA[i + 1], k - i), e = 10 ** le, f = ritmo(e), at = atraso(e);
            // Cada reloj da una vuelta cada diez segundos de su propio tiempo; quieto, enseña la proporción
            if (dt) { lejos += dt * 0.6; aqui += dt * 0.6 * f; } else { lejos = 0.62; aqui = 0.62 * f; }
            ctx.clearRect(0, 0, w, h);
            const R = ancho ? Math.min(w * 0.1, h * 0.17) : Math.min(w * 0.2, h * 0.12);
            const u = Math.max(1, h / 800), dp = h / Math.max(1, canvas.clientHeight);
            const esfera = (x, y, vuelta, color, rotulo) => {
                ctx.strokeStyle = rgba(color, 0.9); ctx.lineWidth = u * 1.2;
                ctx.beginPath(); ctx.arc(x, y, R, 0, 7); ctx.stroke();
                for (let j = 0; j < 60; j++) {
                    const a = j / 60 * 6.2832, l = j % 5 ? 0.05 : 0.12;
                    ctx.strokeStyle = rgba(color, j % 5 ? 0.35 : 0.8);
                    ctx.beginPath(); ctx.moveTo(x + Math.sin(a) * R * (1 - l), y - Math.cos(a) * R * (1 - l));
                    ctx.lineTo(x + Math.sin(a) * R * 0.97, y - Math.cos(a) * R * 0.97); ctx.stroke();
                }
                // arco barrido y aguja
                const a = (vuelta % 1) * 6.2832;
                ctx.fillStyle = rgba(color, 0.1);
                ctx.beginPath(); ctx.moveTo(x, y); ctx.arc(x, y, R * 0.84, -1.5708, a - 1.5708); ctx.closePath(); ctx.fill();
                ctx.strokeStyle = rgba(color, 1); ctx.lineWidth = u * 2;
                ctx.beginPath(); ctx.moveTo(x - Math.sin(a) * R * 0.12, y + Math.cos(a) * R * 0.12);
                ctx.lineTo(x + Math.sin(a) * R * 0.84, y - Math.cos(a) * R * 0.84); ctx.stroke();
                ctx.fillStyle = rgba(color, 1); ctx.beginPath(); ctx.arc(x, y, u * 3, 0, 7); ctx.fill();
                ctx.font = `italic ${Math.round(Math.max(R * 0.16, 13 * dp))}px "CMU Serif", serif`; ctx.textAlign = 'center';
                ctx.fillText(rotulo, x, y + R * 1.34);
            };
            esfera(cx - R * 1.3, cy, lejos, FRIO, 'lejos de toda masa');
            esfera(cx + R * 1.3, cy, aqui, mix3(FRIO, CALIDO, lim((8.857 - le) / 9)), 'aquí');
            // Escala logarítmica de profundidad, con los hitos
            const x0 = cx - R * 2.3, x1 = cx + R * 2.3, y = cy + R * 1.85;
            const px = v => mezcla(x0, x1, (8.857 - v) / (8.857 + 9.575));
            ctx.strokeStyle = rgba(TEXTO, 0.35); ctx.lineWidth = u;
            ctx.beginPath(); ctx.moveTo(x0, y); ctx.lineTo(x1, y); ctx.stroke();
            let cerca = HITOS[0];
            for (const hito of HITOS) {
                ctx.beginPath(); ctx.moveTo(px(hito[0]), y - u * 5); ctx.lineTo(px(hito[0]), y + u * 5); ctx.stroke();
                if (Math.abs(hito[0] - le) < Math.abs(cerca[0] - le)) cerca = hito;
            }
            ctx.fillStyle = rgba(CALIDO, 1);
            ctx.beginPath(); ctx.moveTo(px(le), y - u * 7); ctx.lineTo(px(le) - u * 6, y - u * 18); ctx.lineTo(px(le) + u * 6, y - u * 18); ctx.fill();
            ctx.fillStyle = rgba(TEXTO, 0.8); ctx.font = `${Math.round(Math.max(R * 0.14, 13 * dp))}px "CMU Serif", serif`;
            ctx.textAlign = 'left'; ctx.fillText('Tierra', x0, y + R * 0.26);
            ctx.textAlign = 'right'; ctx.fillText('horizonte', x1, y + R * 0.26);
            const x = 1 + e;
            return {
                r: e > 100 ? cifras(x) : e >= 0.01 ? num(x, 2) : `1 + ${cifras(e)}`,
                factor: at < 1e-3 ? `1 − ${cifras(at)}` : cifras(f),
                lectura: at < 1e-3 ? `Aquí el reloj atrasa ${duracion(at * ANIO)} al año.` : `Una hora de aquí son ${duracion(3600 / f)} lejos.`,
                hito: Math.abs(cerca[0] - le) < 0.5 ? cerca[1] : 'en camino',
            };
        },
    };
}

export function luz(canvas) {
    const ctx = canvas.getContext('2d');
    return {
        pintar(p, t, w, h) {
            const { cx, cy } = encuadre(w, h);
            const W = Math.exp(mezcla(Math.log(500), Math.log(6), p));   // media altura de la vista, en rs
            const k = (h / 2) / W, x0 = (cx / k) * 1.05, x1 = (w - cx) / k;
            ctx.clearRect(0, 0, w, h);
            ctx.lineWidth = Math.max(1, h / 700); ctx.lineJoin = 'round';
            const N = 16;
            let capturados = 0, giro = 0;
            for (let i = -N; i <= N; i++) {
                const b = i / N * W * 0.96 + 1e-4;
                const r = rayo(b, x0);
                if (r.capturado) capturados++;
                if (i === N) giro = r.giro;
                const pts = r.pts;
                ctx.strokeStyle = rgba(r.capturado ? CALIDO : FRIO, r.capturado ? 0.85 : 0.6);
                ctx.beginPath(); ctx.moveTo(cx + pts[0] * k, cy - pts[1] * k);
                for (let j = 2; j < pts.length; j += 2) {
                    if (pts[j] > x1 * 1.3 && Math.abs(pts[j + 1]) < W * 3) { ctx.lineTo(cx + pts[j] * k, cy - pts[j + 1] * k); break; }
                    ctx.lineTo(cx + pts[j] * k, cy - pts[j + 1] * k);
                }
                ctx.stroke();
            }
            const cercaA = suave(60, 14, W);
            ctx.setLineDash([k * 0.16, k * 0.16]);
            ctx.strokeStyle = rgba(TEXTO, 0.55 * cercaA);
            ctx.beginPath(); ctx.arc(cx, cy, 1.5 * k, 0, 7); ctx.stroke();
            ctx.strokeStyle = rgba(CALIDO, 0.5 * cercaA);
            ctx.beginPath(); ctx.arc(cx, cy, B_CRITICO * k, 0, 7); ctx.stroke();
            ctx.setLineDash([]);
            // Rótulos de los dos círculos, cuando ya se distinguen
            const dp = h / Math.max(1, canvas.clientHeight);
            ctx.font = `italic ${Math.round(14 * dp)}px "CMU Serif", serif`; ctx.textAlign = 'left';
            ctx.fillStyle = rgba(TEXTO, 0.85 * suave(16, 9, W)); ctx.fillText('esfera de fotones', cx + 1.5 * k * 0.72, cy - 1.5 * k * 0.72 - 6 * dp);
            ctx.fillStyle = rgba(CALIDO, 0.9 * suave(16, 9, W)); ctx.fillText('sombra', cx + B_CRITICO * k * 0.72 + 6 * dp, cy + B_CRITICO * k * 0.72 + 14 * dp);
            ctx.fillStyle = '#000'; ctx.beginPath(); ctx.arc(cx, cy, Math.max(1.5, k), 0, 7); ctx.fill();
            ctx.strokeStyle = rgba(CALIDO, 0.9); ctx.beginPath(); ctx.arc(cx, cy, Math.max(1.5, k), 0, 7); ctx.stroke();
            const grados = giro * 180 / Math.PI;
            return {
                vista: `${cifras(2 * W)} radios`,
                impacto: `${cifras(W * 0.96)} radios`,
                giro: grados >= 1 ? `${num(grados, 1)}°` : `${num(grados * 60, 1)} minutos de arco`,
                capturados: `${capturados} de ${2 * N + 1}`,
            };
        },
    };
}

export function gusano(canvas) {
    const ctx = canvas.getContext('2d');
    return {
        pintar(p, t, w, h) {
            const { cx, cy, ancho } = encuadre(w, h);
            const b0 = 0.42, Lm = 2.5;
            const S = (ancho ? Math.min(w * 0.17, h * 0.3) : w * 0.26) * mezcla(1, 1.25, suave(0.6, 1, p));
            const P = camara(mezcla(1.36, 0.16, suave(0, 0.62, p)), S, cx, cy, 0.12);
            const giro = t * 0.05;
            const punto = (l, phi) => {
                const rho = Math.sqrt(b0 * b0 + l * l);
                return P(rho * Math.cos(phi + giro), b0 * Math.asinh(l / b0), rho * Math.sin(phi + giro));
            };
            const color = l => mix3(CALIDO, FRIO, suave(-0.5, 0.5, l));
            ctx.clearRect(0, 0, w, h);
            ctx.lineWidth = Math.max(1, h / 900);
            const linea = (pts, c, a) => {
                ctx.strokeStyle = rgba(c, a); ctx.beginPath();
                pts.forEach((q, i) => (i ? ctx.lineTo(q[0], q[1]) : ctx.moveTo(q[0], q[1]))); ctx.stroke();
            };
            const NL = 30, NP = 28;
            for (let i = 0; i <= NL; i++) {
                const u = -1 + 2 * i / NL, l = Math.sign(u) * u * u * Lm;   // más anillos cerca de la garganta
                const pts = []; for (let j = 0; j <= 64; j++) pts.push(punto(l, j / 64 * 6.2832));
                linea(pts, color(l), 0.5 * (1 - 0.75 * Math.abs(u) ** 3));
            }
            for (let j = 0; j < NP; j++) for (let lado = -1; lado <= 1; lado += 2) {
                const pts = []; for (let i = 0; i <= 26; i++) pts.push(punto(lado * (i / 26) ** 1.6 * Lm, j / NP * 6.2832 - giro * 0.999));
                const g = ctx.createLinearGradient(pts[0][0], pts[0][1], pts.at(-1)[0], pts.at(-1)[1]);
                g.addColorStop(0, rgba(color(lado * 0.3), 0.45)); g.addColorStop(1, rgba(color(lado), 0));
                ctx.strokeStyle = g; ctx.beginPath();
                pts.forEach((q, i) => (i ? ctx.lineTo(q[0], q[1]) : ctx.moveTo(q[0], q[1]))); ctx.stroke();
            }
            // El viajero baja por un meridiano y cruza la garganta
            const lv = mezcla(2.2, -2.2, suave(0.3, 0.98, p)), phi = -1.5708 - giro;
            const estela = []; for (let i = 0; i <= 40; i++) estela.push(punto(mezcla(2.2, lv, i / 40), phi));
            ctx.lineWidth = Math.max(2, h / 400); linea(estela, TEXTO, 0.9);
            const q = estela.at(-1);
            ctx.fillStyle = rgba(TEXTO, 1); ctx.beginPath(); ctx.arc(q[0], q[1], Math.max(3.5, h / 180), 0, 7); ctx.fill();
            return {
                l: `${num(lv / b0, 2)} b₀`,
                contorno: `${num(2 * Math.PI * Math.sqrt(1 + (lv / b0) ** 2), 2)} b₀`,
                lado: lv > 0.05 ? 'universo de partida' : lv < -0.05 ? 'el otro lado' : 'en la garganta',
            };
        },
    };
}
