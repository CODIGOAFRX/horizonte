// Comprueba la física contra valores conocidos, los colores contra su fórmula y las reglas del texto.
// En Windows `node --test` se queda colgado: ejecuta `node test/horizonte.test.mjs`.
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import * as f from '../app/fisica.js';

const repo = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const cerca = (a, b, tol, nombre) => assert.ok(Math.abs(a - b) <= tol * Math.abs(b), `${nombre}: ${a} frente a ${b}`);
const pruebas = {
    'radio de Schwarzschild del Sol, unos 2,95 km': () => cerca(f.radioS(f.MSOL), 2953, 0.001, 'rs'),
    'gravedad de la Tierra': () => cerca(f.gravedad(5.9722e24, 6.371e6), 9.82, 0.002, 'g'),
    'velocidad de escape de la Tierra': () => cerca(f.vEscape(5.9722e24, 6.371e6), 11186, 0.001, 've'),
    'el Sol desvía la luz 1,75 segundos de arco': () => cerca(f.desviacion(f.MSOL, 6.957e8) * 206264.8, 1.751, 0.002, 'desviación'),
    'estrella de neutrones: el reloj va al 81 %': () => cerca(f.ritmo(1.9), 0.8094, 0.001, 'ritmo'),
    'retraso en la Tierra: unos 22 ms al año': () => cerca(f.atraso(10 ** 8.857) * f.ANIO, 0.0219, 0.02, 'atraso'),
    'planeta de Miller: una hora son siete años': () => cerca(1 / f.ritmo(10 ** -9.575) / (7 * 8766), 1, 0.03, 'Miller'),
    'factor de Lorentz a 0,6 c': () => cerca(f.lorentz(0.6), 1.25, 1e-9, 'gamma'),
    'temperatura de Hawking de un agujero solar': () => cerca(f.tHawking(f.MSOL), 6.17e-8, 0.002, 'T'),
    'evaporación de un agujero solar: 2e67 años': () => cerca(f.evaporacion(f.MSOL) / f.ANIO, 2.1e67, 0.02, 't'),
    'un rayo por debajo del parámetro crítico cae': () => assert.equal(f.rayo(f.B_CRITICO - 0.05, 60).capturado, true),
    'un rayo por encima del parámetro crítico escapa': () => assert.equal(f.rayo(f.B_CRITICO + 0.05, 60).capturado, false),
    'de lejos, la integración da la desviación de campo débil (2/b)': () => cerca(f.rayo(200, 4000).giro, 2 / 200, 0.03, 'giro'),
    'los colores de la hoja de estilos son los del cuerpo negro': async () => {
        const css = await readFile(resolve(repo, 'app/horizonte.css'), 'utf8');
        assert.ok(css.includes(`--frio: ${f.hex(f.cuerpoNegro(12000))}`), f.hex(f.cuerpoNegro(12000)));
        assert.ok(css.includes(`--calido: ${f.hex(f.cuerpoNegro(3200))}`), f.hex(f.cuerpoNegro(3200)));
    },
    'los números se escriben en español': () => { assert.equal(f.num(1234.5, 1), '1234,5'); assert.equal(f.cifras(0.012345), '0,0123'); },
    'el texto no lleva rayas': async () => {
        for (const a of ['app/index.html', 'app/horizonte.css', 'app/horizonte.js', 'app/escenas.js', 'app/gl.js', 'app/fisica.js', 'README.md', 'CLAUDE.md']) {
            assert.ok(!/[–—]/.test(await readFile(resolve(repo, a), 'utf8')), `raya en ${a}`);
        }
    },
};
let fallos = 0;
for (const [nombre, prueba] of Object.entries(pruebas)) {
    try { await prueba(); console.log(`ok    ${nombre}`); } catch (e) { fallos++; console.log(`FALLA ${nombre}\n      ${e.message}`); }
}
console.log(fallos ? `\n${fallos} fallos` : `\n${Object.keys(pruebas).length} pruebas correctas`);
process.exit(fallos ? 1 : 0);
