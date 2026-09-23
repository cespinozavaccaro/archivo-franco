# ¿NO NOS CREES? — estación 2

Consulta de un archivo histórico mediante códigos QR, dentro de la
instalación *"50 años en libertad"*.

El visitante acerca una pieza de archivo (con un QR en el reverso) a la
webcam. El sistema lee el QR, identifica el expediente y reproduce en
pantalla completa la secuencia de vídeos e imágenes de esa persona.

> **Sistema independiente.** Corre en su propia Raspberry Pi 5 y no tiene
> nada que ver con la estación 1 (*"Esto con Franco sí pasaba"* /
> cuestionario). El código de la estación 1 vive en la carpeta hermana
> `../experiencia_franco/` y no se toca desde aquí.

> **Contenido de prueba.** Los 3 expedientes son placeholder. Los
> contenidos históricos reales se incorporan sin tocar el código (ver
> *7. Cambiar contenido*).

> **Vídeos no incluidos en este repo.** `public/media/EXP-00X/` guarda 2
> vídeos + 3 imágenes por expediente; los vídeos pesan 39–99 MB cada uno
> (~360 MB en total) y están excluidos de git (`.gitignore`) para no
> acercarse al límite de 100 MB de GitHub ni hacer el repo pesado.
> **Respáldalos aparte** (copia a un disco/USB externo) — si se pierden,
> el código sigue funcionando pero no hay nada que reproducir.

---

## 1. Recorrido

```
ESPERA ──(se lee un QR)──▶ EXPEDIENTE (secuencia: vídeos + imágenes) ──▶ ESPERA
```

| Estado | Qué se ve |
|---|---|
| **ESPERA** | Fondo (rejilla de retratos) en bucle lento y desenfocado, con la ficha amarilla en primer plano: *"Esto con Franco sí pasaba."* e instrucción para acercar el QR. La webcam escanea en segundo plano. Si el QR no está en la base de datos: *"EXPEDIENTE NO IDENTIFICADO"*. |
| **EXPEDIENTE** | La `secuencia` del expediente (vídeos + imágenes) a pantalla completa, sin texto superpuesto, con una barra de progreso abajo del todo. Vídeos: duran lo suyo. Imágenes: `MS_IMAGEN` (10 s). |

La webcam **escanea sin parar**, también durante la reproducción: enseñar
otro QR cambia de expediente al vuelo (el mismo QR que ya se está viendo
se ignora). Al terminar la secuencia, vuelve sola a ESPERA.

---

## 2. Estructura

```
archivo-franco/
├── server.js                  servidor local (Node, sin dependencias)
├── kiosco.sh                  arranque a pantalla completa (autostart)
├── package.json
├── public/
│   ├── index.html             las 2 pantallas (ESPERA / EXPEDIENTE)
│   ├── style.css
│   ├── app.js                 estados + webcam + lectura de QR + secuencia
│   ├── config.js               resolución, tiempos, textos
│   ├── lib/jsQR.js            lector de QR (local, sin internet)
│   ├── assets/fonts/          Playfair Display + Inter (local) + fonts.css
│   ├── data/expedientes.json   BASE DE DATOS: id, nombre y secuencia
│   ├── media/EXP-00X/         2 vídeos + 3 imágenes por expediente (no en git)
│   └── img/                   fondo y ficha de ESPERA, retratos, favicon
├── qrs/
│   ├── generar-qr.py          genera los QR a partir de expedientes.json
│   └── expediente-00X.png     imprimir y pegar en el reverso de cada pieza
└── tools/
    ├── indexar-media.py       reconstruye "secuencia" desde public/media/
    └── generar-espera-placeholder.py
```

---

## 3. Requisitos en la Raspberry Pi 5

- **Node.js** (v18 o superior). Comprobar: `node --version`.
  Si no está: `sudo apt update && sudo apt install -y nodejs`
- **Python 3** con `qrcode` y `pillow` — solo para (re)generar los QR o el
  fondo placeholder. Comprobar: `python3 -c "import qrcode, PIL"`
  Si falta: `sudo apt install -y python3-qrcode python3-pil`
- **Webcam USB** conectada.
- No hace falta internet.

---

## 4. Ejecutar

```bash
cd archivo-franco
npm start            # equivale a:  node server.js
```

Abrir en el navegador de la Pi:

- Instalación:      <http://localhost:3000/>
- Modo de prueba (sin webcam): <http://localhost:3000/?dev=1>
- Diagnóstico de cámara/QR:    <http://localhost:3000/?debug=1>

### Arranque automático (kiosco)

`kiosco.sh` arranca el servidor si hace falta y abre Chromium a pantalla
completa (`--kiosk`) sobre `http://localhost:3000/`, con la webcam
concedida sola y autoplay con sonido. Se lanza solo al iniciar sesión,
desde `~/.config/autostart/experiencia-franco.desktop`.

Para salir de la experiencia: **Alt+F4** (cierra Chromium; el servidor
sigue vivo). Para lanzarlo a mano: `./kiosco.sh`.

---

## 5. Probar desde Visual Studio Code

1. `File ▸ Open Folder…` → carpeta `archivo-franco`.
   (O en remoto: extensión **Remote - SSH**, conectar a la Pi, abrir la
   carpeta.)
2. Terminal integrada: `npm start`.
3. Abrir <http://localhost:3000/?dev=1>. El panel **MODO PRUEBA**
   (abajo a la derecha) permite abrir EXP-001 / EXP-002 / EXP-003 y
   *Reiniciar* sin usar la webcam.
4. Para probar el escaneo real: abrir <http://localhost:3000/>, permitir
   la cámara y enseñar uno de los QR de `qrs/` (impreso o en otra
   pantalla).

> La webcam solo lee el QR. No graba ni guarda ninguna imagen del visitante.

---

## 6. Los códigos QR

Cada QR contiene **solo el identificador en texto plano** (`EXP-001`,
`EXP-002`, `EXP-003`) — sin URLs.

Regenerarlos (por ejemplo tras añadir un expediente):

```bash
python3 qrs/generar-qr.py
```

Genera `qrs/expediente-00X.png` — para **imprimir y pegar** en el
reverso de cada pieza física.

---

## 7. Cambiar contenido (sin tocar el código)

**Textos, tiempos, resolución:** `public/config.js`.

**Expedientes:** pon los archivos en `public/media/EXP-00X/`, con el
nombre empezando por un número que marca el orden
(`1_entrevista.mp4`, `2_foto.jpg`…) — 2 vídeos + 3 imágenes por
expediente. Después ejecuta:

```bash
python3 tools/indexar-media.py
```

que reconstruye `secuencia` en `public/data/expedientes.json` a partir
de esos archivos. **El JSON no se edita a mano.**

Para un expediente nuevo: añade su `{id, nombre}` a `expedientes.json`,
pon sus archivos en `public/media/<ID>/`, ejecuta `indexar-media.py` y
`generar-qr.py`, e imprime el QR nuevo.

**Fondo y ficha de ESPERA:** sustituir `public/img/espera-fondo.jpg` y
`public/img/espera-primer-plano.png` (mismos nombres).

**Tipografías:** Playfair Display (serif) e Inter (sans), incluidas en
`public/assets/fonts/`. Si hay una tipografía definitiva, dejar el
`.ttf`/`.woff2` ahí y ajustar `assets/fonts/fonts.css` y las variables
`--serif` / `--sans` de `style.css`.

---

## 8. Pendiente / a confirmar

- Contenidos históricos definitivos (los 3 expedientes actuales son de
  prueba).
- Diseño definitivo del aviso *"EXPEDIENTE NO IDENTIFICADO"*.
- Tipografía definitiva si no es Playfair Display / Inter.
