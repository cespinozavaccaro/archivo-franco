#!/usr/bin/env python3
"""
Genera imágenes PROVISIONALES para la pantalla de ESPERA de la estación 2:

    public/img/espera-fondo.jpg          (rejilla de retratos de archivo, en bucle)
    public/img/espera-primer-plano.png   (la "ficha" amarilla, con transparencia)

Son PLACEHOLDERS para poder ver la pantalla funcionando. Cuando tengas el
arte definitivo ("cuestionario fondo" y "cuestionario en primer plano"),
sustituye estos dos archivos manteniendo el mismo nombre y proporción
(1080 de ancho; el primer plano, lienzo completo 1080x1920 con transparencia)
y NO hace falta volver a ejecutar este script.

El fondo está pensado para animarse en bucle: en la web se apilan DOS copias
y se desplazan; al recorrer una altura completa, la segunda copia queda
exactamente donde estaba la primera, así que el bucle no tiene costura,
sea cual sea el contenido de la imagen.

Uso:
    python3 tools/generar-espera-placeholder.py
"""

import pathlib

from PIL import Image, ImageDraw, ImageFont, ImageOps, ImageFilter

RAIZ = pathlib.Path(__file__).resolve().parent.parent
IMG = RAIZ / "public" / "img"
FUENTES = RAIZ / "public" / "assets" / "fonts"

ANCHO = 1080
ALTO = 1920

NEGRO = (11, 11, 11)
AMARILLO = (239, 232, 0)
BLANCO = (255, 255, 255)


# ---------------------------------------------------------------------------
# 1. FONDO: contact sheet de retratos de archivo
# ---------------------------------------------------------------------------
def generar_fondo() -> None:
    retratos = sorted((IMG / "fondo").glob("retrato-*.jpg"))
    if not retratos:
        raise SystemExit("No hay retratos en public/img/fondo/")

    cols = 4
    filas = 7
    celda_w = ANCHO // cols          # 270
    celda_h = 360
    alto_total = filas * celda_h     # 2520

    lienzo = Image.new("RGB", (ANCHO, alto_total), (18, 18, 17))
    draw = ImageDraw.Draw(lienzo)

    i = 0
    for f in range(filas):
        for c in range(cols):
            ruta = retratos[i % len(retratos)]
            i += 1
            foto = Image.open(ruta).convert("L")            # a blanco y negro
            foto = ImageOps.autocontrast(foto, cutoff=1)
            foto = ImageOps.fit(foto, (celda_w - 6, celda_h - 6), Image.LANCZOS)
            foto = foto.convert("RGB")
            x = c * celda_w + 3
            y = f * celda_h + 3
            lienzo.paste(foto, (x, y))
            draw.rectangle([x - 3, y - 3, x + celda_w - 3, y + celda_h - 3],
                           outline=(0, 0, 0), width=3)

    destino = IMG / "espera-fondo.jpg"
    lienzo.save(destino, quality=86)
    print(f"  {destino.relative_to(RAIZ)}  ({lienzo.width}x{lienzo.height})")


# ---------------------------------------------------------------------------
# 2. PRIMER PLANO: la "ficha" amarilla pautada, sobre lienzo transparente
# ---------------------------------------------------------------------------
def _fuente(nombre: str, tam: int) -> ImageFont.FreeTypeFont:
    return ImageFont.truetype(str(FUENTES / nombre), tam)


def generar_primer_plano() -> None:
    lienzo = Image.new("RGBA", (ANCHO, ALTO), (0, 0, 0, 0))
    draw = ImageDraw.Draw(lienzo)

    margen_x = 84
    card_x0, card_x1 = margen_x, ANCHO - margen_x          # 84 .. 996
    renglon = 150
    pad_top = 70
    n_rules_titulo = 3      # Esto con / Franco sí / pasaba.
    n_rules_vacios = 2
    instruccion_h = 190
    card_h = pad_top + (n_rules_titulo + n_rules_vacios) * renglon + 6 + instruccion_h + 64
    card_y0 = (ALTO - card_h) // 2
    card_y1 = card_y0 + card_h

    # cuerpo de la ficha
    draw.rectangle([card_x0, card_y0, card_x1, card_y1], fill=AMARILLO)

    # pautas horizontales (a lo ancho de la ficha, con un pequeño margen)
    rule_x0, rule_x1 = card_x0 + 22, card_x1 - 22
    fuente_titulo = _fuente("playfair-display-700.ttf", 150)
    titulo = ["Esto con", "Franco sí", "pasaba."]

    y = card_y0 + pad_top
    # una pauta por encima del título
    draw.line([rule_x0, y, rule_x1, y], fill=NEGRO, width=3)
    for linea in titulo:
        base = y + renglon
        draw.text((card_x0 + 150, base), linea, font=fuente_titulo,
                  fill=NEGRO, anchor="ls")
        draw.line([rule_x0, base + 6, rule_x1, base + 6], fill=NEGRO, width=3)
        y = base + 6
    for _ in range(n_rules_vacios):
        y += renglon
        draw.line([rule_x0, y, rule_x1, y], fill=NEGRO, width=3)

    # bloque de instrucción: pauta arriba, viñeta negra, texto, pauta abajo
    y += 40
    draw.line([rule_x0, y, rule_x1, y], fill=NEGRO, width=3)
    texto = ("Escanea el código QR de las\n"
             "fotografías en la cámara de la\n"
             "parte inferior.")
    fuente_txt = _fuente("inter-700.ttf", 34)
    ty = y + 42
    draw.multiline_text(((card_x0 + card_x1) // 2 + 46, ty), texto,
                        font=fuente_txt, fill=NEGRO, anchor="ma",
                        align="center", spacing=12)
    r = 30
    draw.ellipse([card_x0 + 96 - r, ty + 44 - r, card_x0 + 96 + r, ty + 44 + r],
                 fill=NEGRO)
    y = ty + 150
    draw.line([rule_x0, y, rule_x1, y], fill=NEGRO, width=3)

    # perforaciones de archivador: círculos blancos con borde negro,
    # montados sobre el borde izquierdo de la ficha
    huecos = 5
    hy0, hy1 = card_y0 + 150, card_y1 - 170
    for k in range(huecos):
        cy = hy0 + (hy1 - hy0) * k / (huecos - 1)
        rr = 30
        draw.ellipse([card_x0 - rr, cy - rr, card_x0 + rr, cy + rr],
                     fill=BLANCO, outline=NEGRO, width=5)

    destino = IMG / "espera-primer-plano.png"
    lienzo.save(destino)
    print(f"  {destino.relative_to(RAIZ)}  ({lienzo.width}x{lienzo.height})")


if __name__ == "__main__":
    print("Generando placeholders de la pantalla de ESPERA...")
    generar_fondo()
    generar_primer_plano()
    print("Hecho. Sustituye estos dos archivos por el arte definitivo cuando lo tengas.")
