/* =========================================================================
   "¿NO NOS CREES?"  ·  estación 2  ·  lógica
   -------------------------------------------------------------------------
   Recorrido:
     ESPERA  --(se lee un QR con la webcam)-->  EXPEDIENTE
       EXPEDIENTE reproduce la "secuencia" de ese QR: vídeos (duran lo
       suyo) e imágenes (MS_IMAGEN) que se encadenan solas.
     --(termina el último elemento)-------->  ESPERA  (limpio, listo)

   La webcam escanea SIN PARAR, también durante la reproducción: enseñar
   otro QR cambia de expediente al instante (el mismo QR se ignora).
   Pantalla sin táctil ni ratón: todo el avance es automático.
   La webcam SOLO lee el QR. No se muestra ni se guarda ninguna imagen.
   El contenido de cada QR está en public/media/EXP-00X/ e indexado en
   data/expedientes.json (tools/indexar-media.py). Tiempos: config.js.
   ========================================================================= */

(function () {
  'use strict';

  var C = window.CONFIG;
  var $ = function (sel, raiz) { return (raiz || document).querySelector(sel); };

  /* ---------------------------------------------------------------------
     Escalado del escenario a la pantalla real
     --------------------------------------------------------------------- */
  var escenario = $('#escenario');

  function ajustarEscala() {
    escenario.style.width = C.LIENZO_ANCHO + 'px';
    escenario.style.height = C.LIENZO_ALTO + 'px';
    var k = Math.min(
      window.innerWidth / C.LIENZO_ANCHO,
      window.innerHeight / C.LIENZO_ALTO
    );
    escenario.style.transform = 'translate(-50%, -50%) scale(' + k + ')';
  }
  window.addEventListener('resize', ajustarEscala);

  /* ---------------------------------------------------------------------
     Estado / pantallas
     --------------------------------------------------------------------- */
  var expedientes = [];
  var estado = 'ESPERA';
  var temporizadores = [];
  var CONGELAR = false;   // ?ir=... (modo dev): parar los avances automáticos

  function programar(ms, fn) {
    if (CONGELAR) return;
    var t = setTimeout(fn, ms);
    temporizadores.push(t);
  }
  function cancelarTemporizadores() {
    temporizadores.forEach(clearTimeout);
    temporizadores = [];
  }

  var pantallas = {
    ESPERA: $('#p-espera'),
    EXPEDIENTE: $('#p-expediente')
  };

  function mostrar(nombre) {
    estado = nombre;
    Object.keys(pantallas).forEach(function (k) {
      pantallas[k].classList.toggle('activa', k === nombre);
    });
  }

  /* ---------------------------------------------------------------------
     Textos fijos (del diseño; se editan en config.js)
     --------------------------------------------------------------------- */
  function pintarTextosFijos() {
    // La pantalla de ESPERA son dos imágenes (fondo en bucle + ficha), su
    // texto va dentro del PNG. Los vídeos van a pantalla completa, sin
    // texto encima. Aquí solo quedan el aviso de error y el de cámara.
    $('.espera-error').textContent = C.TXT.error_qr;
    $('#aviso-camara').textContent = C.TXT.camara_no_disponible;
  }

  /* ---------------------------------------------------------------------
     Recorrido
     --------------------------------------------------------------------- */
  var video = $('#video-secuencia');
  var imgSec = $('#img-secuencia');
  var barraFill = $('.barra-progreso-relleno');

  var secuencia = [];        // elementos del expediente en curso
  var secIdx = 0;            // elemento que se está reproduciendo
  var expedienteActual = ''; // id del expediente que se está viendo ('' = ninguno)

  /* ---- Barra de progreso del elemento en curso -----------------------
     Imágenes: por tiempo (MS_IMAGEN). Vídeos: por currentTime/duration,
     así se ajusta sola a la duración real de cada vídeo. */
  var progRAF = 0;
  var progModo = '';   // 'imagen' | 'video'
  var progT0 = 0;

  function iniciarProgreso(modo) {
    progModo = modo;
    progT0 = performance.now();
    barraFill.style.width = '0';
    cancelAnimationFrame(progRAF);
    progRAF = requestAnimationFrame(tickProgreso);
  }
  function tickProgreso() {
    progRAF = requestAnimationFrame(tickProgreso);
    var p = 0;
    if (progModo === 'imagen') {
      p = (performance.now() - progT0) / C.MS_IMAGEN;
    } else {
      var d = video.duration;
      p = (d && isFinite(d) && d > 0) ? (video.currentTime / d) : 0;
    }
    if (p < 0) p = 0; else if (p > 1) p = 1;
    barraFill.style.width = (p * 100).toFixed(2) + '%';
  }
  function pararProgreso() {
    cancelAnimationFrame(progRAF);
    progRAF = 0;
    barraFill.style.width = '0';
  }

  function abrirExpediente(id) {
    var exp = null;
    for (var i = 0; i < expedientes.length; i++) {
      if (expedientes[i].id === id) { exp = expedientes[i]; break; }
    }
    if (!exp) { avisarNoIdentificado(); return; }

    // La cámara sigue leyendo mientras se reproduce: NO se pausa el escaneo.
    // Enseñar otro QR cambia de expediente al vuelo.
    cancelarTemporizadores();

    // Secuencia definida en data/expedientes.json (tools/indexar-media.py).
    // Si un expediente todavía no la tiene, se usa el vídeo antiguo suelto.
    secuencia = (exp.secuencia && exp.secuencia.length)
      ? exp.secuencia
      : (exp.video ? [{ tipo: 'video', src: exp.video }] : []);
    secIdx = 0;
    expedienteActual = exp.id;

    mostrar('EXPEDIENTE');
    reproducirElemento();
  }

  function reproducirElemento() {
    cancelarTemporizadores();
    video.onended = null;

    var it = secuencia[secIdx];
    if (!it) { reiniciar(); return; }        // se acabó la secuencia -> ESPERA

    if (it.tipo === 'video') {
      imgSec.hidden = true;
      imgSec.removeAttribute('src');
      video.hidden = false;

      video.src = it.src;
      try { video.currentTime = 0; } catch (e) {}
      reproducirVideo();
      iniciarProgreso('video');

      video.onended = siguienteElemento;
      if (C.MS_VIDEO_MAX > 0) {
        programar(C.MS_VIDEO_MAX, function () { video.pause(); siguienteElemento(); });
      }
    } else {                                 // imagen: a pantalla completa
      video.pause();
      video.removeAttribute('src');
      video.load();
      video.hidden = true;

      imgSec.hidden = false;
      imgSec.src = it.src;
      iniciarProgreso('imagen');
      programar(C.MS_IMAGEN, siguienteElemento);
    }
  }

  function siguienteElemento() {
    cancelarTemporizadores();
    video.onended = null;
    secIdx++;
    reproducirElemento();
  }

  function reproducirVideo() {
    // Intenta con sonido; si el navegador lo bloquea, sin sonido. En kiosco,
    // arrancar Chromium con --autoplay-policy=no-user-gesture-required.
    video.muted = false;
    var p = video.play();
    if (p && p.catch) {
      p.catch(function () {
        video.muted = true;
        video.play().catch(function () {});
      });
    }
  }

  function reiniciar() {
    cancelarTemporizadores();
    pararProgreso();
    video.pause();
    video.onended = null;
    video.removeAttribute('src');
    video.load();
    video.hidden = false;
    imgSec.hidden = true;
    imgSec.removeAttribute('src');
    secuencia = [];
    secIdx = 0;
    expedienteActual = '';
    ocultarError();
    mostrar('ESPERA');
    reanudarEscaneo();
  }

  /* ---------------------------------------------------------------------
     Aviso "EXPEDIENTE NO IDENTIFICADO" (sobre la ficha de ESPERA)
     --------------------------------------------------------------------- */
  var tError = 0;
  function avisarNoIdentificado() {
    if (estado !== 'ESPERA') return;
    $('.espera-error').hidden = false;
    clearTimeout(tError);
    tError = setTimeout(ocultarError, C.MS_ERROR_QR);
  }
  function ocultarError() {
    $('.espera-error').hidden = true;
  }

  /* ---------------------------------------------------------------------
     Webcam + lectura de QR
     --------------------------------------------------------------------- */
  var cam = $('#camara');
  var lienzo = $('#lienzo-qr');
  var ctx = lienzo.getContext('2d', { willReadFrequently: true });

  var escaneando = false;
  var ultimoTexto = '';
  var ultimoTextoEn = 0;
  var ultimoAnalisisEn = 0;

  // Diagnóstico (solo se rellena/pinta si hay ?dev=1 o ?debug=1)
  var DEBUG = false;
  var camaraOk = false;
  var diag = { intentos: 0, hallado: '', lee: 0 };

  function reanudarEscaneo() { escaneando = true; }
  function pausarEscaneo() { escaneando = false; }

  function iniciarCamara() {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      mostrarAvisoCamara('este navegador no permite getUserMedia');
      return;
    }
    // 1º intento: pedir resolución alta. Si falla por las restricciones,
    // 2º intento: cualquier cámara. Sin facingMode: en una webcam USB de
    // sobremesa "environment" a veces confunde a Chromium.
    var altaRes = { video: { width: { ideal: 1280 }, height: { ideal: 720 } }, audio: false };
    navigator.mediaDevices.getUserMedia(altaRes)
      .catch(function () { return navigator.mediaDevices.getUserMedia({ video: true, audio: false }); })
      .then(function (stream) {
        cam.srcObject = stream;
        var p = cam.play();
        if (p && p.catch) { p.catch(function () {}); }
        $('#aviso-camara').hidden = true;
        camaraOk = true;
        reanudarEscaneo();
      })
      .catch(function (err) {
        // Sin cámara la instalación no escanea, pero el modo ?dev=1 sigue OK
        var nombre = (err && (err.name || err.message)) || 'error desconocido';
        console.warn('Webcam no disponible:', nombre);
        mostrarAvisoCamara(nombre);
      });
  }

  function mostrarAvisoCamara(detalle) {
    var el = $('#aviso-camara');
    el.textContent = C.TXT.camara_no_disponible + (detalle ? '  [' + detalle + ']' : '');
    el.hidden = false;
  }

  function bucleEscaneo() {
    requestAnimationFrame(bucleEscaneo);

    // Se escanea en ESPERA y también mientras se reproduce un EXPEDIENTE
    // (para poder cambiar de expediente enseñando otro QR).
    if (!escaneando || (estado !== 'ESPERA' && estado !== 'EXPEDIENTE')) { pintarDiag(); return; }
    var ahora = performance.now();
    if (ahora - ultimoAnalisisEn < C.ESCANEO_INTERVALO_MS) return;
    ultimoAnalisisEn = ahora;

    if (cam.readyState < 2) { pintarDiag(); return; }   // < HAVE_CURRENT_DATA
    var w = cam.videoWidth, h = cam.videoHeight;
    if (!w || !h) { pintarDiag(); return; }

    // Analizamos a una resolución de trabajo modesta: jsQR va más rápido y
    // los QR impresos se leen igual de bien. El vídeo real puede ser 1280.
    var escala = Math.min(1, 640 / w);
    var cw = Math.round(w * escala), ch = Math.round(h * escala);
    lienzo.width = cw;
    lienzo.height = ch;
    ctx.drawImage(cam, 0, 0, cw, ch);

    var datos;
    try { datos = ctx.getImageData(0, 0, cw, ch); } catch (e) { pintarDiag(); return; }

    diag.intentos++;
    var res = jsQR(datos.data, cw, ch, { inversionAttempts: 'attemptBoth' });
    diag.hallado = (res && res.data) ? res.data : '';
    pintarDiag();
    if (!res || !res.data) return;

    var texto = res.data.trim();
    if (texto === ultimoTexto && ahora - ultimoTextoEn < C.ESCANEO_REPETIR_MISMO_MS) return;
    ultimoTexto = texto;
    ultimoTextoEn = ahora;
    diag.lee++;

    manejarLectura(texto);
  }

  function manejarLectura(texto) {
    var limpio = texto.replace(/\s+/g, '').toUpperCase();
    var soloAlnum = limpio.replace(/[^A-Z0-9]/g, '');
    var encontrado = null;
    for (var i = 0; i < expedientes.length; i++) {
      var idA = expedientes[i].id.toUpperCase();
      if (idA === limpio || idA.replace(/[^A-Z0-9]/g, '') === soloAlnum) {
        encontrado = expedientes[i];
        break;
      }
    }
    if (!encontrado) { avisarNoIdentificado(); return; }
    // Si ya se está viendo ese mismo expediente, no reiniciarlo.
    if (estado === 'EXPEDIENTE' && encontrado.id === expedienteActual) return;
    abrirExpediente(encontrado.id);
  }

  /* ---------------------------------------------------------------------
     Modo desarrollo  (?dev=1  o  #dev)
     --------------------------------------------------------------------- */
  function activarDev() {
    var dev = $('#dev');
    dev.hidden = false;
    dev.addEventListener('click', function (e) {
      var b = e.target.closest('button');
      if (!b) return;
      if (b.dataset.accion === 'reiniciar') reiniciar();
      else if (b.dataset.exp) abrirExpediente(b.dataset.exp);
    });
  }

  /* Panel de diagnóstico de cámara/QR: ?dev=1 o ?debug=1.
     Muestra el vídeo real de la webcam y un marcador con el estado, para
     ver en el sitio si entra imagen y si jsQR encuentra el código. */
  var diagCajaTxt = null;
  function crearDebug() {
    DEBUG = true;
    var caja = document.createElement('div');
    caja.id = 'cam-debug';
    var pre = document.createElement('div');
    pre.className = 'cam-debug-txt';
    caja.appendChild(pre);
    // el vídeo #camara pasa a ser visible dentro del panel
    cam.classList.add('cam-debug-visible');
    caja.appendChild(cam);
    document.body.appendChild(caja);
    diagCajaTxt = pre;
  }
  function pintarDiag() {
    if (!DEBUG || !diagCajaTxt) return;
    var est;
    if (!camaraOk) est = 'CÁMARA NO CONECTADA (sin permiso o sin dispositivo)';
    else if (!escaneando) est = 'parado';
    else if (estado === 'EXPEDIENTE') est = 'escaneando… (reproduciendo ' + (expedienteActual || '?') + ')';
    else est = 'escaneando…';
    diagCajaTxt.textContent =
      'cámara: ' + (cam.videoWidth || 0) + 'x' + (cam.videoHeight || 0) +
      '  readyState=' + cam.readyState +
      '\n' + est +
      '\nanálisis jsQR: ' + diag.intentos +
      '   lecturas OK: ' + diag.lee +
      '\núltimo QR visto: ' + (diag.hallado || '—');
  }

  /* ---------------------------------------------------------------------
     Arranque
     --------------------------------------------------------------------- */
  function iniciar() {
    ajustarEscala();
    pintarTextosFijos();

    var params = new URLSearchParams(window.location.search);
    var DEV = params.has('dev') || window.location.hash.indexOf('dev') !== -1;
    if (DEV || params.has('debug')) crearDebug();

    fetch('data/expedientes.json', { cache: 'no-store' })
      .then(function (r) { return r.json(); })
      .then(function (json) { expedientes = json || []; })
      .catch(function (e) {
        console.error('No se pudo cargar data/expedientes.json', e);
        expedientes = [];
      })
      .then(function () {
        mostrar('ESPERA');
        if (DEV) activarDev();
        requestAnimationFrame(bucleEscaneo);
        iniciarCamara();

        // Atajo de desarrollo:  ?dev=1&exp=EXP-002  entra directo en ese
        // expediente.  Añade &fijo=1 para congelar el 1er elemento (útil
        // para revisar una imagen sin que pase a los 10 s).
        var expDev = DEV && params.get('exp');
        if (expDev) {
          if (params.has('fijo')) CONGELAR = true;
          abrirExpediente(expDev);
        }
      });
  }

  iniciar();
})();
