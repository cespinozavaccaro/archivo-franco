#!/usr/bin/env python3
"""
Lee las carpetas public/media/EXP-00X/ y escribe en data/expedientes.json
la "secuencia" de cada expediente: la lista ordenada de vídeos e imágenes
que se reproducen al escanear ese QR.

  - El ORDEN lo marca el nombre del archivo (ordenación natural: 1_, 2_, 10_...).
  - El TIPO se deduce por la extensión:
        vídeo  -> .mp4 .webm .mov .m4v .ogv
        imagen -> .jpg .jpeg .png .webp .gif .avif
  - Los vídeos duran lo que dura el vídeo; las imágenes, MS_IMAGEN (config.js).

Se conservan el resto de campos del JSON (nombre, año, descripción...).
Vuelve a ejecutarlo cada vez que cambies el contenido de las carpetas.

Uso:   python3 tools/indexar-media.py
"""

import json
import pathlib
import re

RAIZ = pathlib.Path(__file__).resolve().parent.parent
MEDIA = RAIZ / "public" / "media"
JSON_EXP = RAIZ / "public" / "data" / "expedientes.json"

VIDEO = {".mp4", ".webm", ".mov", ".m4v", ".ogv"}
IMAGEN = {".jpg", ".jpeg", ".png", ".webp", ".gif", ".avif"}


def clave_natural(nombre: str):
    # "10_foto.jpg" -> [10, '_foto.jpg']  para ordenar 2 antes que 10
    partes = re.split(r"(\d+)", nombre.lower())
    return [int(p) if p.isdigit() else p for p in partes]


def carpeta_de(id_exp: str) -> pathlib.Path:
    # "EXP-001" -> media/EXP-001
    return MEDIA / id_exp


def secuencia_de(id_exp: str):
    carpeta = carpeta_de(id_exp)
    if not carpeta.is_dir():
        return [], [f"(no existe la carpeta {carpeta.relative_to(RAIZ)})"]

    items, avisos = [], []
    archivos = sorted(
        (p for p in carpeta.iterdir() if p.is_file() and not p.name.startswith(".")),
        key=lambda p: clave_natural(p.name),
    )
    for p in archivos:
        ext = p.suffix.lower()
        rel = f"media/{id_exp}/{p.name}"
        if ext in VIDEO:
            items.append({"tipo": "video", "src": rel})
        elif ext in IMAGEN:
            items.append({"tipo": "imagen", "src": rel})
        else:
            avisos.append(f"ignorado (extensión no reconocida): {p.name}")

    n_vid = sum(1 for i in items if i["tipo"] == "video")
    n_img = sum(1 for i in items if i["tipo"] == "imagen")
    if not items:
        avisos.append("carpeta vacía: no hay contenido para este expediente")
    else:
        avisos.append(f"{n_vid} vídeo(s) + {n_img} imagen(es)")
    return items, avisos


def main():
    expedientes = json.loads(JSON_EXP.read_text(encoding="utf-8"))
    for exp in expedientes:
        seq, avisos = secuencia_de(exp["id"])
        exp["secuencia"] = seq
        print(f"{exp['id']}:")
        for a in avisos:
            print(f"   - {a}")
        for i, it in enumerate(seq, 1):
            print(f"     {i}. {it['tipo']:6}  {it['src']}")

    JSON_EXP.write_text(
        json.dumps(expedientes, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
    )
    print(f"\nActualizado {JSON_EXP.relative_to(RAIZ)}")


if __name__ == "__main__":
    main()
