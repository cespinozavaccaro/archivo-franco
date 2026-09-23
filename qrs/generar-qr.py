#!/usr/bin/env python3
"""
Genera los códigos QR de los EXPEDIENTES de la estación "¿NO NOS CREES?".

Cada QR contiene ÚNICAMENTE el identificador en texto plano, SIN URLs:
    EXP-001, EXP-002, EXP-003 ...
Se leen con la webcam de la instalación.
    -> se guardan en  qrs/expediente-00X.png

Los ids salen de  public/data/expedientes.json, así los QR nunca se
desincronizan de la base de datos: para añadir un expediente, añádelo al
JSON y vuelve a ejecutar este script.

Uso:
    python3 qrs/generar-qr.py
"""

import json
import pathlib
import re

import qrcode

AQUI = pathlib.Path(__file__).resolve().parent
RAIZ = AQUI.parent
JSON_EXPEDIENTES = RAIZ / "public" / "data" / "expedientes.json"


def slug_archivo(id_expediente: str) -> str:
    # "EXP-001" -> "expediente-001.png"
    numero = re.sub(r"[^0-9]", "", id_expediente) or id_expediente.lower()
    return f"expediente-{numero}.png"


def guardar_qr(datos: str, destino: pathlib.Path, box_size: int = 20) -> None:
    qr = qrcode.QRCode(
        version=None,
        error_correction=qrcode.constants.ERROR_CORRECT_M,
        box_size=box_size,   # px por módulo -> QR grande, bueno para imprimir
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


if __name__ == "__main__":
    main()
    print("\nHecho. Imprime los QR y pégalos en el reverso de cada pieza.")
