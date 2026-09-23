/* =========================================================================
   CONFIGURACIÓN DE LA ESTACIÓN  "¿NO NOS CREES?"
   -------------------------------------------------------------------------
   Todo lo que se toca a mano (resolución de la pantalla, tiempos, textos)
   está aquí. No hace falta tocar app.js.
   ========================================================================= */

window.CONFIG = {

  /* --- Pantalla física de la instalación ---------------------------------
     El recorrido está maquetado para este lienzo y se escala solo para
     encajar en la pantalla real, con bandas negras si hace falta.
     Vertical 1080 x 1920. Para una pantalla horizontal: 1920 x 1080.        */
  LIENZO_ANCHO: 1080,
  LIENZO_ALTO: 1920,

  /* --- Tiempos (milisegundos) ----------------------------------------------- */
  MS_IMAGEN: 10000,       // cuánto se ve cada IMAGEN de la secuencia
  MS_VIDEO_MAX: 0,        // 0 = cada vídeo dura lo suyo; si >0, lo corta a los X ms
  MS_ERROR_QR: 2600,      // cuánto se ve "EXPEDIENTE NO IDENTIFICADO"

  /* --- Webcam / lectura de QR --------------------------------------------- */
  ESCANEO_INTERVALO_MS: 110,   // cada cuánto se analiza un fotograma buscando el QR
  ESCANEO_REPETIR_MISMO_MS: 4000, // ignora el mismo QR si se relee antes de este tiempo

  /* --- Textos ----------------------------------------------------------------
     La pantalla de ESPERA es una imagen (public/img/espera-primer-plano.png),
     su texto va rotulado dentro del PNG. Los vídeos e imágenes de la
     secuencia van a pantalla completa, sin texto encima. Aquí solo quedan
     los dos avisos que sí genera el código.                                  */
  TXT: {
    error_qr: 'EXPEDIENTE NO IDENTIFICADO',
    camara_no_disponible: 'Cámara no disponible. Abre ?dev=1 para el modo de prueba.'
  }
};
