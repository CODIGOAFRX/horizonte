// Genera dist/proyecto/horizonte (servido en pedrogomez.dev/proyecto/horizonte) desde app/: pone la ruta
// base, versiona CSS y JS con un hash de su contenido y deja _headers en la raíz de dist, donde lo lee
// el Worker de archivos estáticos.
import { cp, readFile, rm, writeFile, rename, readdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const repo = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const base = '/proyecto/horizonte';
const dist = resolve(repo, 'dist');
const out = resolve(dist, base.slice(1));

await rm(dist, { recursive: true, force: true });
await cp(resolve(repo, 'app'), out, { recursive: true });
await rename(resolve(out, '_headers'), resolve(dist, '_headers'));

const modulos = (await readdir(out)).filter(f => f.endsWith('.js'));
const texto = Object.fromEntries(await Promise.all(modulos.map(async f => [f, await readFile(resolve(out, f), 'utf8')])));
const deps = f => [...texto[f].matchAll(/from '\.\/([^']+\.js)'/g)].map(m => m[1]);
// El hash de un módulo incluye el de los que importa: un cambio en la física renueva toda la cadena
const hashes = {};
const hash = f => hashes[f] ??= createHash('sha256').update(texto[f]).update(deps(f).map(hash).join()).digest('hex').slice(0, 10);
for (const f of modulos) {
    await writeFile(resolve(out, f), texto[f].replace(/from '\.\/([^']+\.js)'/g, (_, d) => `from './${d}?v=${hash(d)}'`));
}

let html = await readFile(resolve(out, 'index.html'), 'utf8');
for (const [marca, f] of html.matchAll(/\{\{v:([^}]+)\}\}/g)) {
    html = html.replace(marca, f.endsWith('.js') ? hash(f) : createHash('sha256').update(await readFile(resolve(out, f))).digest('hex').slice(0, 10));
}
html = html.replaceAll('{{BASE}}', base);
if (/\{\{/.test(html)) throw new Error('Queda una marca sin rellenar en index.html');
await writeFile(resolve(out, 'index.html'), html);
console.log(`Generado ${out}`);
