// Vista local de dist/ con las cabeceras de _headers: http://127.0.0.1:8090/proyecto/horizonte/
import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { resolve, extname, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const dist = resolve(dirname(fileURLToPath(import.meta.url)), '..', 'dist');
const port = Number(process.env.PORT || 8090);
const csp = (await readFile(resolve(dist, '_headers'), 'utf8')).match(/Content-Security-Policy: (.+)/)[1];
const TIPOS = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json', '.svg': 'image/svg+xml', '.webp': 'image/webp', '.jpg': 'image/jpeg', '.woff2': 'font/woff2' };

http.createServer(async (req, res) => {
    let ruta = decodeURIComponent(new URL(req.url, 'http://x').pathname);
    if (ruta === '/' || ruta === '/proyecto/horizonte') return res.writeHead(302, { Location: '/proyecto/horizonte/' }).end();
    if (ruta.endsWith('/')) ruta += 'index.html';
    const archivo = resolve(dist, `.${ruta}`);
    if (!archivo.startsWith(dist)) return res.writeHead(403).end();
    try {
        const cuerpo = await readFile(archivo);
        res.writeHead(200, { 'Content-Type': TIPOS[extname(archivo)] || 'application/octet-stream', 'Content-Security-Policy': csp, 'Access-Control-Allow-Origin': '*' });
        res.end(cuerpo);
    } catch {
        res.writeHead(404).end('No encontrado');
    }
}).listen(port, '127.0.0.1', () => console.log(`Horizonte en local: http://127.0.0.1:${port}/proyecto/horizonte/`));
