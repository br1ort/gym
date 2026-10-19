#!/usr/bin/env python3
"""Genera los íconos PWA de FitLog Lite (mancuerna verde sobre fondo oscuro)."""
import os
from PIL import Image, ImageDraw

BG = (13, 15, 20)        # #0d0f14
ACCENT = (61, 220, 132)  # #3ddc84
ACCENT_DIM = (43, 184, 106)  # #2bb86a

OUT = os.path.join(os.path.dirname(__file__), '..', 'icons')


def draw_dumbbell(size: int) -> Image.Image:
    img = Image.new('RGB', (size, size), BG)
    d = ImageDraw.Draw(img)
    s = size / 512.0  # escala base 512

    def rect(x0, y0, x1, y1, fill, radius=0):
        coords = [x0 * s, y0 * s, x1 * s, y1 * s]
        if radius:
            d.rounded_rectangle(coords, radius=radius * s, fill=fill)
        else:
            d.rectangle(coords, fill=fill)

    # Barra central (barra de peso)
    rect(176, 236, 336, 276, ACCENT_DIM, radius=20)

    # Placas internas (más cercanas al centro)
    rect(140, 200, 176, 312, ACCENT, radius=18)
    rect(336, 200, 372, 312, ACCENT, radius=18)

    # Placas externas (más grandes)
    rect(96, 176, 140, 336, ACCENT, radius=22)
    rect(372, 176, 416, 336, ACCENT, radius=22)

    return img


def main():
    os.makedirs(OUT, exist_ok=True)
    specs = {
        'icon-192.png': 192,
        'icon-512.png': 512,
        'icon-512-maskable.png': 512,
        'apple-touch-icon.png': 180,
    }
    for name, size in specs.items():
        img = draw_dumbbell(size)
        # Para maskable: añadir padding extra (zona segura 80%) redibujando
        if 'maskable' in name:
            padded = Image.new('RGB', (size, size), BG)
            inner = draw_dumbbell(int(size * 0.7))
            off = (size - inner.width) // 2
            padded.paste(inner, (off, off))
            img = padded
        img.save(os.path.join(OUT, name), 'PNG')
        print(f'generado {name} ({size}x{size})')


if __name__ == '__main__':
    main()
