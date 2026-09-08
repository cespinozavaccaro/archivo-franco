/* =========================================================================
   SERVIDOR LOCAL — estación "¿NO NOS CREES?"
   -------------------------------------------------------------------------
   La Raspberry Pi 5 hace de servidor: reparte los archivos de /public por
   HTTP en http://localhost:3000 . No necesita internet ni dependencias
   externas: usa solo módulos incluidos en Node.js.

   Por qué hace falta un servidor y no abrir el index.html directamente:
   el navegador solo permite usar la webcam (getUserMedia) y hacer fetch()
   del JSON en un "contexto seguro", y http://localhost cuenta como tal;
   abrir el archivo con file:// no funcionaría.

   Arranque:   npm start        (o:  node server.js)
   ========================================================================= */

const http = require('http');
const fs = require('fs');
const path = require('path');

const PUERTO = process.env.PORT || 3000;
const RAIZ_PUBLICA = path.join(__dirname, 'public');

const TIPOS_MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.vtt': 'text/vtt; charset=utf-8',
  '.ttf': 'font/ttf',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2'
};

// Sirve un archivo soportando "Range" (necesario para que <video> pueda
// buscar/adelantar y para que algunos navegadores lo reproduzcan).
function servirArchivo(rutaAbsoluta, peticion, respuesta) {
  const estad = fs.statSync(rutaAbsoluta);
  const tipo = TIPOS_MIME[path.extname(rutaAbsoluta).toLowerCase()] || 'application/octet-stream';
  const rango = peticion.headers.range;

  if (rango) {
    const [desdeStr, hastaStr] = rango.replace(/bytes=/, '').split('-');
    const desde = parseInt(desdeStr, 10) || 0;
    const hasta = hastaStr ? parseInt(hastaStr, 10) : estad.size - 1;
    respuesta.writeHead(206, {
      'Content-Range': `bytes ${desde}-${hasta}/${estad.size}`,
      'Accept-Ranges': 'bytes',
      'Content-Length': hasta - desde + 1,
      'Content-Type': tipo
    });
    fs.createReadStream(rutaAbsoluta, { start: desde, end: hasta }).pipe(respuesta);
    return;
  }

  respuesta.writeHead(200, {
    'Content-Type': tipo,
    'Content-Length': estad.size,
    'Cache-Control': 'no-cache'
  });
  fs.createReadStream(rutaAbsoluta).pipe(respuesta);
}

const servidor = http.createServer((peticion, respuesta) => {
  // Solo lectura: GET (y HEAD). Nada más.
  if (peticion.method !== 'GET' && peticion.method !== 'HEAD') {
    respuesta.writeHead(405).end('Metodo no permitido');
    return;
  }

  let ruta = decodeURIComponent(peticion.url.split('?')[0]);
  if (ruta === '/') ruta = '/index.html';

  // Normaliza y bloquea cualquier intento de salir de /public (../../).
  const rutaAbsoluta = path.normalize(path.join(RAIZ_PUBLICA, ruta));
  if (!rutaAbsoluta.startsWith(RAIZ_PUBLICA)) {
    respuesta.writeHead(403).end('Prohibido');
    return;
  }

  fs.stat(rutaAbsoluta, (error, estad) => {
    if (error || !estad.isFile()) {
      respuesta.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      respuesta.end('No encontrado: ' + ruta);
      return;
    }
    try {
      servirArchivo(rutaAbsoluta, peticion, respuesta);
    } catch (e) {
      respuesta.writeHead(500).end('Error del servidor');
    }
  });
});

servidor.listen(PUERTO, '0.0.0.0', () => {
  console.log('');
  console.log('  ¿NO NOS CREES?  — archivo histórico (estación 2)');
  console.log('  ----------------------------------------------------');
  console.log(`  Pantalla de la instalación:  http://localhost:${PUERTO}/`);
  console.log(`  Modo de prueba (sin webcam): http://localhost:${PUERTO}/?dev=1`);
  console.log('  (Ctrl+C para parar)');
  console.log('');
});
