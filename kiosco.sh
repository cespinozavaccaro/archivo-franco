#!/bin/bash
# =========================================================================
#  Arranca la estación 2  "¿NO NOS CREES?"  a pantalla completa (kiosco).
#  Se lanza al iniciar sesión desde:
#     ~/.config/autostart/experiencia-franco.desktop
#
#  Salir de la experiencia:  Alt + F4   (cierra Chromium; el servidor
#  Node sigue vivo, así que puedes volver a lanzar este script sin más).
# =========================================================================
set -u

DIR="/home/admin/Desktop/experiencia_franco_rasp2/archivo-franco"
URL="http://localhost:3000/"
NODE="/usr/bin/node"
CHROMIUM="/usr/bin/chromium"
PERFIL="$HOME/.config/chromium-kiosco"   # perfil propio: no depende de otra Chromium abierta

# Todo lo que imprima este script va a un log, para poder diagnosticar.
exec >>"$DIR/kiosco.log" 2>&1
echo "=== $(date '+%F %T')  arrancando kiosco ==="

# 1) Servidor local (Node). Si el puerto 3000 no responde, se arranca
#    desligado de este script (setsid) para que siga vivo aunque se
#    cierre Chromium.
if ! curl -sf -o /dev/null "$URL"; then
  echo "servidor caído -> arrancando  node server.js"
  ( cd "$DIR" && setsid "$NODE" server.js >>"$DIR/server.log" 2>&1 & )
fi

# 2) Esperar a que el servidor responda (máx ~20 s).
for _ in $(seq 1 40); do
  curl -sf -o /dev/null "$URL" && break
  sleep 0.5
done

# 3) Chromium a pantalla completa sobre la experiencia, con perfil propio.
#    --use-fake-ui-for-media-stream : concede la webcam sin diálogo.
#    --autoplay-policy=...          : los vídeos suenan sin tocar nada.
#    Las opciones de "crash bubble" evitan el "¿restaurar páginas?" tras
#    un apagón.
exec "$CHROMIUM" \
  --user-data-dir="$PERFIL" \
  --ozone-platform=wayland \
  --kiosk "$URL" \
  --no-first-run \
  --no-default-browser-check \
  --noerrdialogs \
  --disable-session-crashed-bubble \
  --hide-crash-restore-bubble \
  --disable-infobars \
  --disable-translate \
  --disable-features=TranslateUI \
  --disable-pinch \
  --overscroll-history-navigation=0 \
  --password-store=basic \
  --check-for-update-interval=31536000 \
  --autoplay-policy=no-user-gesture-required \
  --use-fake-ui-for-media-stream
