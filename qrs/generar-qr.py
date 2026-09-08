#!/usr/bin/env python3
"""
Genera los códigos QR de la estación "¿NO NOS CREES?".

1) QR de cada EXPEDIENTE (uno por pieza física):
   contienen ÚNICAMENTE el identificador en texto plano, SIN URLs:
   EXP-001, EXP-002, EXP-003 ...
   Se leen con la webcam de la instalación.
   -> se guardan en  qrs/expediente-00X.png

2) QR de la pantalla FINAL:
   este SÍ es una URL (el visitante lo escanea con su móvil para ir al
   archivo online). La dirección se lee de  public/config.js
   (constante URL_ARCHIVO_ONLINE), así hay una sola fuente de verdad.
   -> se guarda en  public/img/qr-final.png

Uso:
    python3 qrs/generar-qr.py

Los ids salen de  public/data/expedientes.json, así los QR nunca se
desincronizan de la base de datos: para añadir un expediente, añádelo al
JSON y vuelve a ejecutar este script.
"""

import json
import pathlib
import re

import qrcode

AQUI = pathlib.Path(__file__).resolve().parent
RAIZ = AQUI.parent
JSON_EXPEDIENTES = RAIZ / "public" / "data" / "expedientes.json"
CONFIG_JS = RAIZ / "public" / "config.js"
QR_FINAL = RAIZ / "public" / "img" / "qr-final.png"


def slug_archivo(id_expediente: str) -> str:
    # "EXP-001" -> "expediente-001.png"
    numero = re.sub(r"[^0-9]", "", id_expediente) or id_expediente.lower()
    return f"expediente-{numero}.png"


def url_archivo_online() -> str:
    """Lee URL_ARCHIVO_ONLINE de public/config.js."""
    m = re.search(r"URL_ARCHIVO_ONLINE\s*:\s*'([^']+)'", CONFIG_JS.read_text(encoding="utf-8"))
    return m.group(1) if m else "https://ejemplo.org/memorial-oral"


def guardar_qr(datos: str, destino: pathlib.Path, box_size: int = 20) -> None:
    qr = qrcode.QRCode(
        version=None,
        error_correction=qrcode.constants.ERROR_CORRECT_M,
        box_size=box_size,   # px por módulo -> QR grande, bueno para imprimir/pantalla
        border=4,            # "quiet zone" estándar
    )
    qr.add_data(datos)
    qr.make(fit=True)
    qr.make_image(fill_color="black", back_color="white").save(destino)


def main() -> None:
    print("QR de expedientes (para las piezas físicas):")
    for expediente in json.loads(JSON_EXPEDIENTES.read_text(encoding="utf-8")):
        id_expediente = expediente["id"]
        destino = AQUI / slug_archivo(id_expediente)
        guardar_qr(id_expediente, destino)
        print(f"  {id_expediente:>8}  ->  {destino.relative_to(RAIZ)}")

    url = url_archivo_online()
    QR_FINAL.parent.mkdir(parents=True, exist_ok=True)
    guardar_qr(url, QR_FINAL)
    print("\nQR de la pantalla FINAL (URL del archivo online):")
    print(f"  {url}  ->  {QR_FINAL.relative_to(RAIZ)}")


if __name__ == "__main__":
    main()
    print("\nHecho. Imprime los QR de expediente y pégalos en el reverso de cada pieza.")
