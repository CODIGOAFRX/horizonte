// Calca las costas reales de la Tierra y las deja en app/tierra.js como una máscara de tierra y mar.
// Parte de los contornos de Natural Earth a escala 1:50 000 000 (dominio público, naturalearthdata.com):
//   node scripts/tierra.mjs ne_50m_land.geojson ne_50m_lakes.geojson
// La máscara mide 1024 × 512 celdas en proyección equirrectangular, de sur a norte y de 180° O a 180° E.
// Cada fila se guarda como longitudes de tramo alternas (mar, tierra, mar...) en base64.
import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const W = 1024, H = 512;
const [, , rutaTierra, rutaLagos] = process.argv;
if (!rutaTierra) throw new Error('Falta la ruta del GeoJSON de tierra');

const poligonos = async ruta => {
    const geo = JSON.parse(await readFile(ruta, 'utf8'));
    return geo.features.flatMap(f => (f.geometry.type === 'Polygon' ? [f.geometry.coordinates] : f.geometry.coordinates));
};

// Relleno par e impar por filas: cada polígono (con sus huecos) pinta `valor` en la máscara
function rellena(mascara, lista, valor) {
    for (const anillos of lista) {
        let sur = 90, norte = -90;
        for (const [, lat] of anillos[0]) { sur = Math.min(sur, lat); norte = Math.max(norte, lat); }
        const j0 = Math.max(0, Math.floor((sur + 90) / 180 * H - 0.5)), j1 = Math.min(H - 1, Math.ceil((norte + 90) / 180 * H - 0.5));
        for (let j = j0; j <= j1; j++) {
            const lat = -90 + (j + 0.5) * 180 / H, cortes = [];
            for (const anillo of anillos) for (let k = 0; k < anillo.length - 1; k++) {
                const [x0, y0] = anillo[k], [x1, y1] = anillo[k + 1];
                if ((y0 <= lat) !== (y1 <= lat)) cortes.push(x0 + (x1 - x0) * (lat - y0) / (y1 - y0));
            }
            cortes.sort((a, b) => a - b);
            for (let k = 0; k + 1 < cortes.length; k += 2) {
                const i0 = Math.max(0, Math.ceil((cortes[k] + 180) / 360 * W - 0.5)), i1 = Math.min(W - 1, Math.floor((cortes[k + 1] + 180) / 360 * W - 0.5));
                for (let i = i0; i <= i1; i++) mascara[j * W + i] = valor;
            }
        }
    }
}

const mascara = new Uint8Array(W * H);
rellena(mascara, await poligonos(rutaTierra), 1);
if (rutaLagos) rellena(mascara, await poligonos(rutaLagos), 0);

const bytes = [];
const tramo = n => { while (n > 127) { bytes.push(n & 127 | 128); n >>= 7; } bytes.push(n); };
for (let j = 0; j < H; j++) {
    let actual = 0, largo = 0;
    for (let i = 0; i < W; i++) {
        if (mascara[j * W + i] === actual) largo++; else { tramo(largo); actual ^= 1; largo = 1; }
    }
    tramo(largo);
}
const tierra = mascara.reduce((s, v) => s + v, 0) / (W * H);
const b64 = Buffer.from(bytes).toString('base64');
const salida = resolve(dirname(fileURLToPath(import.meta.url)), '../app/tierra.js');
await writeFile(salida, `// Generado por scripts/tierra.mjs: no se edita a mano.
// Máscara de tierra y mar calcada de Natural Earth 1:50m (dominio público). ${W} × ${H} celdas equirrectangulares,
// de sur a norte y de 180° O a 180° E; cada fila son longitudes de tramo alternas (mar, tierra, mar...).
export const ANCHO = ${W}, ALTO = ${H};
const DATOS = '${b64}';

// Devuelve la máscara como un byte por celda: 0 mar, 255 tierra
export function mascaraTierra() {
    const bin = atob(DATOS), m = new Uint8Array(ANCHO * ALTO);
    let k = 0;
    for (let j = 0; j < ALTO; j++) {
        let i = 0, valor = 0;
        while (i < ANCHO) {
            let n = 0, d = 0, b;
            do { b = bin.charCodeAt(k++); n |= (b & 127) << d; d += 7; } while (b & 128);
            if (valor) m.fill(255, j * ANCHO + i, j * ANCHO + i + n);
            i += n; valor ^= 255;
        }
    }
    return m;
}
`);
console.log(`Escrito ${salida}: ${bytes.length} bytes de tramos, ${b64.length} en base64, ${(tierra * 100).toFixed(1)} % de celdas con tierra`);
