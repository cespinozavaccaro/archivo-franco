/* =========================================================================
   "¿NO NOS CREES?"  ·  estación 2  ·  lógica
   -------------------------------------------------------------------------
   Recorrido:
     ESPERA  --(se lee un QR con la webcam)-->  EXPEDIENTE (vídeo)
             --(termina el vídeo / toque)---->  CITA
             --(temporizador / toque)-------->  FINAL
             --(temporizador / toque)-------->  ESPERA  (limpio, listo)

   La webcam SOLO lee el QR. No se muestra ni se guarda ninguna imagen.
   Los textos, tiempos y la resolución están en config.js.
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
    EXPEDIENTE: $('#p-expediente'),
    CITA: $('#p-cita'),
    FINAL: $('#p-final')
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
    // Título de la ficha: una <span class="linea"> por renglón (cada una
    // se subraya en CSS, imitando la hoja pautada del diseño).
    var cont = $('.ficha-titulo');
    cont.innerHTML = '';
    C.TXT.espera_titulo.split('\n').forEach(function (linea) {
      var s = document.createElement('span');
      s.className = 'linea';
      s.textContent = linea;
      cont.appendChild(s);
    });
    // Dos renglones vacíos bajo el título, como en el diseño.
    var relleno = $('.ficha-relleno');
    relleno.innerHTML = '';
    for (var i = 0; i < 2; i++) {
      var v = document.createElement('span');
      v.className = 'linea';
      v.textContent = ' ';
      relleno.appendChild(v);
    }

    $('.ficha-instruccion-txt').textContent = C.TXT.espera_instruccion;
    $('.ficha-error').textContent = C.TXT.error_qr;
    $('.barra-marca').textContent = C.TXT.marca;
    $('.cita-marca').textContent = C.TXT.marca;
    $('#final-titulo').textContent = C.TXT.final_titulo;
    $('#final-texto').textContent = C.TXT.final_texto;
    $('#aviso-camara').textContent = C.TXT.camara_no_disponible;
  }

  /* ---------------------------------------------------------------------
     Fondo de ESPERA: rejilla de retratos de archivo desenfocada
     --------------------------------------------------------------------- */
  function construirFondo() {
    var cont = $('.fondo-archivo');
    var TOTAL = 24;      // 4 columnas x 6 filas
    var DISTINTOS = 6;   // retratos placeholder disponibles
    for (var i = 0; i < TOTAL; i++) {
      var img = document.createElement('img');
      var n = (i % DISTINTOS) + 1;
      img.src = 'img/fondo/retrato-' + (n < 10 ? '0' + n : n) + '.jpg';
      img.alt = '';
      cont.appendChild(img);
    }
  }

  /* ---------------------------------------------------------------------
     Recorrido
     --------------------------------------------------------------------- */
  var video = $('#video-testimonio');

  function abrirExpediente(id) {
    var exp = null;
    for (var i = 0; i < expedientes.length; i++) {
      if (expedientes[i].id === id) { exp = expedientes[i]; break; }
    }
    if (!exp) { avisarNoIdentificado(); return; }

    cancelarTemporizadores();
    pausarEscaneo();

    $('.barra-nombre').textContent = exp.nombre || '';
    $('#subtitulos').textContent = exp.subtitulos || '';
    $('#cita-texto').textContent = exp.cita || '';

    video.src = exp.video || '';
    try { video.currentTime = 0; } catch (e) {}

    mostrar('EXPEDIENTE');
    reproducirVideo();

    video.onended = irACita;
    if (C.MS_VIDEO_MAX > 0) {
      programar(C.MS_VIDEO_MAX, function () { video.pause(); irACita(); });
    }
  }

  function reproducirVideo() {
    // Intenta con sonido; si el navegador lo bloquea, sin sonido
    // (los subtítulos siguen visibles). En kiosco, arrancar Chromium con
    // --autoplay-policy=no-user-gesture-required para que suene siempre.
    video.muted = false;
    var p = video.play();
    if (p && p.catch) {
      p.catch(function () {
        video.muted = true;
        video.play().catch(function () {});
      });
    }
  }

  function irACita() {
    cancelarTemporizadores();
    video.onended = null;
    video.pause();
    mostrar('CITA');
    programar(C.MS_CITA, irAFinal);
  }

  function irAFinal() {
    cancelarTemporizadores();
    mostrar('FINAL');
    programar(C.MS_FINAL_REINICIO, reiniciar);
  }

  function reiniciar() {
    cancelarTemporizadores();
    video.pause();
    video.onended = null;
    video.removeAttribute('src');
    video.load();
    $('.barra-nombre').textContent = '';
    $('#subtitulos').textContent = '';
    $('#cita-texto').textContent = '';
    ocultarError();
    mostrar('ESPERA');
    reanudarEscaneo();
  }

  /* Tocar la pantalla adelanta (no en ESPERA, no sobre el panel de dev) */
  document.addEventListener('pointerdown', function (e) {
    if (e.target.closest && e.target.closest('#dev')) return;
    if (estado === 'CITA') irAFinal();
    else if (estado === 'FINAL') reiniciar();
  });

  /* ---------------------------------------------------------------------
     Aviso "EXPEDIENTE NO IDENTIFICADO" (sobre la ficha de ESPERA)
     --------------------------------------------------------------------- */
  var tError = 0;
  function avisarNoIdentificado() {
    if (estado !== 'ESPERA') return;
    $('.ficha-error').hidden = false;
    $('.ficha-instruccion').hidden = true;
    clearTimeout(tError);
    tError = setTimeout(ocultarError, C.MS_ERROR_QR);
  }
  function ocultarError() {
    $('.ficha-error').hidden = true;
    $('.ficha-instruccion').hidden = false;
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

  function reanudarEscaneo() { escaneando = true; }
  function pausarEscaneo() { escaneando = false; }

  function iniciarCamara() {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      $('#aviso-camara').hidden = false;
      return;
    }
    navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
      audio: false
    }).then(function (stream) {
      cam.srcObject = stream;
      var p = cam.play();
      if (p && p.catch) { p.catch(function () {}); }
      $('#aviso-camara').hidden = true;
      reanudarEscaneo();
    }).catch(function (err) {
      // Sin cámara la instalación no escanea, pero el modo ?dev=1 sigue OK
      console.warn('Webcam no disponible:', err && err.message);
      $('#aviso-camara').hidden = false;
    });
  }

  function bucleEscaneo() {
    requestAnimationFrame(bucleEscaneo);

    if (!escaneando || estado !== 'ESPERA') return;
    var ahora = performance.now();
    if (ahora - ultimoAnalisisEn < C.ESCANEO_INTERVALO_MS) return;
    ultimoAnalisisEn = ahora;

    if (cam.readyState !== 4) return;          // HAVE_ENOUGH_DATA
    var w = cam.videoWidth, h = cam.videoHeight;
    if (!w || !h) return;

    lienzo.width = w;
    lienzo.height = h;
    ctx.drawImage(cam, 0, 0, w, h);

    var datos;
    try { datos = ctx.getImageData(0, 0, w, h); } catch (e) { return; }

    var res = jsQR(datos.data, w, h, { inversionAttempts: 'dontInvert' });
    if (!res || !res.data) return;

    var texto = res.data.trim();
    if (texto === ultimoTexto && ahora - ultimoTextoEn < C.ESCANEO_REPETIR_MISMO_MS) return;
    ultimoTexto = texto;
    ultimoTextoEn = ahora;

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
    if (encontrado) abrirExpediente(encontrado.id);
    else avisarNoIdentificado();
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

  /* ---------------------------------------------------------------------
     Arranque
     --------------------------------------------------------------------- */
  function iniciar() {
    ajustarEscala();
    pintarTextosFijos();
    construirFondo();

    var params = new URLSearchParams(window.location.search);
    var DEV = params.has('dev') || window.location.hash.indexOf('dev') !== -1;

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

        // Atajo de desarrollo para ver una pantalla concreta y dejarla
        // quieta:  ?dev=1&ir=expediente|cita|final&exp=EXP-002
        var ir = DEV && params.get('ir');
        if (ir) {
          var exp = params.get('exp') || 'EXP-001';
          abrirExpediente(exp);
          if (ir === 'cita') irACita();
          if (ir === 'final') { irACita(); irAFinal(); }
          CONGELAR = true;
          cancelarTemporizadores();
        }
      });
  }

  iniciar();
})();
