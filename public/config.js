/* =========================================================================
   CONFIGURACIÓN DE LA ESTACIÓN  "¿NO NOS CREES?"
   -------------------------------------------------------------------------
   Todo lo que se toca a mano (resolución de la pantalla, tiempos, textos
   fijos, URL del archivo online) está aquí. No hace falta tocar app.js.
   ========================================================================= */

window.CONFIG = {

  /* --- Pantalla física de la instalación ---------------------------------
     El recorrido está maquetado para este lienzo y se escala solo para
     encajar en la pantalla real, con bandas negras si hace falta.
     Vertical 1080 x 1920. Para una pantalla horizontal: 1920 x 1080.        */
  LIENZO_ANCHO: 1080,
  LIENZO_ALTO: 1920,

  /* --- Tiempos (milisegundos) ----------------------------------------------- */
  MS_CITA: 9000,           // cuánto se ve la pantalla de CITA antes de pasar a FINAL
  MS_FINAL_REINICIO: 30000, // cuánto se ve FINAL antes de volver sola a ESPERA
  MS_ERROR_QR: 2600,       // cuánto se ve "EXPEDIENTE NO IDENTIFICADO"
  MS_VIDEO_MAX: 0,         // 0 = esperar a que el vídeo termine solo; si >0, corta a los X ms

  /* --- Webcam / lectura de QR --------------------------------------------- */
  ESCANEO_INTERVALO_MS: 180,   // cada cuánto se analiza un fotograma buscando el QR
  ESCANEO_REPETIR_MISMO_MS: 4000, // ignora el mismo QR si se relee antes de este tiempo

  /* --- Textos fijos (los del diseño; edítalos aquí si cambian) ----------- */
  TXT: {
    marca: 'Esto con Franco sí pasaba:',
    espera_titulo: 'Esto con\nFranco sí\npasaba.',
    espera_instruccion: 'Escanea el código QR de las fotografías en la cámara de la parte inferior.',
    error_qr: 'EXPEDIENTE NO IDENTIFICADO',
    final_titulo: 'Detrás de cada expediente había una persona, una familia y una vida atravesada por el miedo.',
    final_texto: 'Escanea el código QR con tu teléfono para poder acceder al archivo de Memorial Oral y conocer las historias de 126 supervivientes de la Dictadura Franquista.',
    camara_no_disponible: 'Cámara no disponible. Abre ?dev=1 para el modo de prueba.'
  },

  /* --- QR de la pantalla FINAL ------------------------------------------------
     Este QR SÍ es una URL (se escanea con el móvil del visitante).
     PLACEHOLDER: sustitúyela por la dirección real del archivo online y
     vuelve a ejecutar  python3 qrs/generar-qr.py  para regenerar la imagen. */
  URL_ARCHIVO_ONLINE: 'https://ejemplo.org/memorial-oral'
};
