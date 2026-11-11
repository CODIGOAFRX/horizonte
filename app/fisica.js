// Física de Horizonte: constantes, fórmulas y la integración de los rayos de luz.
// Lo usan las escenas y el test; no toca el DOM.

export const G = 6.6743e-11;          // m³ kg⁻¹ s⁻²
export const C = 299792458;           // m/s
export const HBAR = 1.054571817e-34;  // J s
export const KB = 1.380649e-23;       // J/K
export const MSOL = 1.98847e30;       // kg
export const ANIO = 31557600;         // s (año juliano)
export const G0 = 9.80665;            // m/s², gravedad estándar

export const SGR_A = 4.297e6 * MSOL;  // Sagitario A* (GRAVITY, 2022)

export const PLANETAS = [
    { nombre: 'Mercurio', M: 3.3011e23, R: 2.4397e6 },
    { nombre: 'Venus', M: 4.8675e24, R: 6.0518e6 },
    { nombre: 'Tierra', M: 5.9722e24, R: 6.371e6 },
    { nombre: 'Marte', M: 6.4171e23, R: 3.3895e6 },
    { nombre: 'Júpiter', M: 1.8982e27, R: 6.9911e7 },
    { nombre: 'Saturno', M: 5.6834e26, R: 5.8232e7 },
    { nombre: 'Urano', M: 8.681e25, R: 2.5362e7 },
    { nombre: 'Neptuno', M: 1.02413e26, R: 2.4622e7 },
];

// Radio de Schwarzschild, gravedad en superficie y velocidad de escape
export const radioS = M => 2 * G * M / (C * C);
export const gravedad = (M, R) => G * M / (R * R);
export const vEscape = (M, R) => Math.sqrt(2 * G * M / R);

// Ritmo de un reloj quieto a r = (1 + e)·rs frente a uno lejano: dτ/dt = √(1 − rs/r).
// Se parametriza con e = r/rs − 1 para no perder cifras ni muy lejos ni pegado al horizonte.
export const ritmo = e => Math.sqrt(e / (1 + e));
export const atraso = e => (e > 1e6 ? 1 / (2 * (1 + e)) : 1 - ritmo(e));

export const lorentz = beta => 1 / Math.sqrt(1 - beta * beta);

// Aceleración de marea entre dos puntos separados d metros, a distancia r de la masa M
export const marea = (M, r, d = 2) => 2 * G * M * d / r ** 3;

// Hawking: temperatura del horizonte y tiempo de evaporación
export const tHawking = M => HBAR * C ** 3 / (8 * Math.PI * G * M * KB);
export const evaporacion = M => 5120 * Math.PI * G * G * M ** 3 / (HBAR * C ** 4);

// Desviación de un rayo que pasa a distancia b de la masa M, en campo débil (radianes)
export const desviacion = (M, b) => 4 * G * M / (C * C * b);

// Parámetro de impacto crítico: por debajo, la luz no escapa (en radios de Schwarzschild)
export const B_CRITICO = 3 * Math.sqrt(3) / 2;

// Trayectoria de un rayo de luz en el plano, en unidades de rs. Entra por x = -x0 viajando hacia +x
// con parámetro de impacto b. La órbita exacta de un fotón en Schwarzschild cumple
// d²x/dλ² = −(3/2)·h²·x/r⁵ con h = |x × v| constante.
export function rayo(b, x0, max = 4000) {
    let x = -x0, y = b, vx = 1, vy = 0;
    const h2 = b * b;
    const pts = [x, y];
    let capturado = false;
    for (let i = 0; i < max; i++) {
        const r2 = x * x + y * y, r = Math.sqrt(r2);
        if (r < 1) { capturado = true; break; }
        if (r > x0 * 1.5 && x * vx + y * vy > 0) break;
        const dt = Math.min(Math.max(0.04 * r, 0.01), x0 / 40);
        const k = -1.5 * h2 / (r2 * r2 * r);
        vx += k * x * dt; vy += k * y * dt;
        x += vx * dt; y += vy * dt;
        pts.push(x, y);
    }
    return { pts, capturado, giro: capturado ? NaN : Math.abs(Math.atan2(vy, vx)) };
}

// Color de un cuerpo negro a T kelvin (aproximación de Tanner Helland), [r, g, b] de 0 a 255
export function cuerpoNegro(T) {
    const t = T / 100;
    const lim = v => Math.round(Math.min(255, Math.max(0, v)));
    const r = t <= 66 ? 255 : 329.698727446 * (t - 60) ** -0.1332047592;
    const g = t <= 66 ? 99.4708025861 * Math.log(t) - 161.1195681661 : 288.1221695283 * (t - 60) ** -0.0755148492;
    const b = t >= 66 ? 255 : t <= 19 ? 0 : 138.5177312231 * Math.log(t - 10) - 305.0447927307;
    return [lim(r), lim(g), lim(b)];
}
export const hex = ([r, g, b]) => '#' + [r, g, b].map(v => v.toString(16).padStart(2, '0')).join('');

// Números con formato español
const fmt = new Map();
export function num(v, dec = 0) {
    if (!fmt.has(dec)) fmt.set(dec, new Intl.NumberFormat('es-ES', { minimumFractionDigits: dec, maximumFractionDigits: dec }));
    return fmt.get(dec).format(v);
}
// Tres cifras significativas, sin notación científica
export function cifras(v, n = 3) {
    if (v === 0) return '0';
    v = Number(v.toPrecision(n));
    const dec = Math.max(0, n - 1 - Math.floor(Math.log10(Math.abs(v))));
    return num(v, Math.min(dec, 12));
}
// Una duración en la unidad que mejor se lee
export function duracion(s) {
    const u = [[ANIO, 'años'], [86400, 'días'], [3600, 'h'], [60, 'min'], [1, 's'], [1e-3, 'ms'], [1e-6, 'µs'], [1e-9, 'ns']];
    const [k, nombre] = u.find(([k]) => s >= k) || u.at(-1);
    return `${cifras(s / k)} ${nombre}`;
}
