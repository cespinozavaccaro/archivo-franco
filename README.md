# ¿NO NOS CREES? — estación 2

Consulta de un archivo histórico mediante códigos QR, dentro de la
instalación *"50 años en libertad"*.

El visitante acerca una pieza de archivo (con un QR en el reverso) a la
webcam. El sistema lee el QR, identifica el expediente y muestra en la
pantalla el testimonio de esa persona.

> **Sistema independiente.** Corre en su propia Raspberry Pi 5 y no tiene
> nada que ver con la estación 1 (*"Esto con Franco sí pasaba"* /
> cuestionario). El código de la estación 1 vive en la carpeta hermana
> `../experiencia_franco/` y no se toca.

> **Contenido de prueba.** Los 3 expedientes, las fotos, los vídeos y los
> textos son **PLACEHOLDER**. Los contenidos históricos reales se
> incorporarán después, sin tocar el código (ver *Cambiar contenido*).

---

## 1. Recorrido

```
ESPERA ──(se lee un QR)──▶ EXPEDIENTE (vídeo) ──▶ CITA ──▶ FINAL ──▶ ESPERA
```

| Estado | Qué se ve |
|---|---|
| **ESPERA** | Rejilla de retratos de archivo desenfocada + ficha amarilla: *"Esto con Franco sí pasaba."* e instrucción para acercar el QR. La webcam escanea en segundo plano. Si el QR no está en la base de datos: *"EXPEDIENTE NO IDENTIFICADO"*. |
| **EXPEDIENTE** | Vídeo del testimonio a pantalla completa, barra amarilla superior (marca + nombre) y banda amarilla inferior con subtítulos. |
| **CITA** | Pantalla amarilla con una cita entresacada del vídeo. |
| **FINAL** | Pantalla negra: *"Detrás de cada expediente había una persona…"* + QR al archivo online. A los 30 s vuelve sola a ESPERA. |

Tocar la pantalla adelanta desde CITA y FINAL. Desde EXPEDIENTE se pasa
solo al terminar el vídeo (o con `MS_VIDEO_MAX` en `config.js`).

---

## 2. Estructura

```
archivo-franco/
├── server.js                 servidor local (Node, sin dependencias)
├── package.json
├── public/
│   ├── index.html            las 4 pantallas
│   ├── style.css
│   ├── app.js                estados + webcam + lectura de QR
│   ├── config.js             ← resolución, tiempos, textos, URL del archivo online
│   ├── lib/jsQR.js           lector de QR (local, sin internet)
│   ├── assets/fonts/         Playfair Display + Inter (local) + fonts.css
│   ├── data/expedientes.json ← BASE DE DATOS de expedientes
│   ├── img/
│   │   ├── expediente-00X.jpg   foto de cada persona (placeholder)
│   │   ├── qr-final.png         QR de la pantalla FINAL (generado)
│   │   └── fondo/retrato-0X.jpg retratos del fondo de ESPERA (placeholder)
│   └── videos/expediente-00X.mp4  testimonios (placeholder)
└── qrs/
    ├── generar-qr.py         genera los QR
    └── expediente-00X.png    ← imprimir y pegar en el reverso de cada pieza
```

---

## 3. Requisitos en la Raspberry Pi 5

- **Node.js** (v18 o superior). Comprobar: `node --version`.
  Si no está: `sudo apt update && sudo apt install -y nodejs`
- **Python 3** con `qrcode` y `pillow` — solo para (re)generar los QR.
  Comprobar: `python3 -c "import qrcode, PIL"`
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

- Instalación:            <http://localhost:3000/>
- Modo de prueba:         <http://localhost:3000/?dev=1>

### Pantalla de la instalación (kiosco)

Pantalla **vertical 1080×1920** (configurable en `config.js`). Chromium a
pantalla completa, con permiso de cámara automático y autoplay con sonido:

```bash
chromium-browser --kiosk --app=http://localhost:3000/ \
  --use-fake-ui-for-media-stream \
  --autoplay-policy=no-user-gesture-required
```

- `--use-fake-ui-for-media-stream`: concede el permiso de la webcam sin
  preguntar (sigue siendo la cámara real; solo evita el aviso, que en un
  kiosco sin ratón nadie podría aceptar).
- `--autoplay-policy=no-user-gesture-required`: deja que el vídeo del
  testimonio suene sin que nadie toque la pantalla.

El arranque automático (servicio `systemd` + Chromium al iniciar sesión)
se añadirá en una fase posterior, igual que en la estación 1.

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

Regenerarlos (por ejemplo tras añadir un expediente o cambiar la URL del
archivo online):

```bash
python3 qrs/generar-qr.py
```

Genera:

- `qrs/expediente-00X.png` — para **imprimir y pegar** en el reverso de
  cada pieza física.
- `public/img/qr-final.png` — el QR de la pantalla FINAL, a partir de
  `URL_ARCHIVO_ONLINE` en `config.js`.

---

## 7. Cambiar contenido (sin tocar el código)

**Textos, tiempos, resolución, URL del archivo online:** `public/config.js`.

**Expedientes:** `public/data/expedientes.json`. Un objeto por persona:

```json
{
  "id": "EXP-001",
  "nombre": "María Perez",
  "año": "XXXX",
  "fotografia": "img/expediente-001.jpg",
  "video": "videos/expediente-001.mp4",
  "subtitulos": "Transcripción del testimonio…",
  "cita": "Frase entresacada del vídeo.",
  "descripcion": "Descripción breve.",
  "testimonio": "Texto breve del testimonio."
}
```

- Sustituir los `.mp4` en `public/videos/` y los `.jpg` en `public/img/`
  manteniendo el nombre (o cambiar la ruta en el JSON).
- Para un expediente nuevo: añadir su objeto al JSON, poner sus archivos
  y ejecutar `python3 qrs/generar-qr.py`.
- Campos usados hoy en pantalla: `nombre`, `video`, `subtitulos`, `cita`.
  `año`, `fotografia`, `descripcion` y `testimonio` se guardan para cuando
  se decida mostrarlos.

**Fondo de ESPERA y fotos:** reemplazar los `.jpg` de `public/img/fondo/`
y `public/img/` (mismos nombres).

**Tipografías:** el diseño usa Playfair Display (serif) e Inter (sans),
incluidas en `public/assets/fonts/`. Si hay una tipografía definitiva,
dejar el `.ttf`/`.woff2` en esa carpeta y ajustar `assets/fonts/fonts.css`
y las variables `--serif` / `--sans` de `style.css`.

---

## 8. Pendiente / a confirmar

- Diseños definitivos de ESPERA y del aviso *"EXPEDIENTE NO IDENTIFICADO"*
  (ahora reconstruidos a partir de la descripción y del lenguaje visual).
- URL real del archivo online (`URL_ARCHIVO_ONLINE`, ahora placeholder) y
  confirmar el texto de la pantalla FINAL ("archivo de Memorial Oral",
  "126 supervivientes").
- Contenidos históricos reales (fotos, vídeos, testimonios, citas).
- Tipografía definitiva si no es Playfair Display / Inter.
- Arranque automático (`systemd` + kiosco).
