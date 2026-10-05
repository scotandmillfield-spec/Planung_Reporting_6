#!/usr/bin/env python3
"""Vergleichsblatt für die Abnahme: Original | Neu (Farbe) | Neu (Graustufendruck).

Aufruf:
    python3 scripts/vergleich.py --orig original.png --neu out/abb_2-1.png \
        [--grau out/_graustufen/abb_2-1_grau.png] [--titel "Abb. 2.1"] --out vergleich_abb_2-1.png

Mehrere Abbildungen auf einem Blatt: --orig/--neu/--grau/--titel mehrfach angeben (gleiche Reihenfolge).
Ohne --orig werden nur Farbe und Graustufen nebeneinandergestellt.
"""
import argparse
import os

from PIL import Image, ImageDraw, ImageFont


def _font(bold, size):
    for p in ("/usr/share/fonts/truetype/liberation/LiberationSans-%s.ttf" % ("Bold" if bold else "Regular"),):
        if os.path.exists(p):
            return ImageFont.truetype(p, size)
    return ImageFont.load_default()


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--orig", action="append", default=[])
    ap.add_argument("--neu", action="append", required=True)
    ap.add_argument("--grau", action="append", default=[])
    ap.add_argument("--titel", action="append", default=[])
    ap.add_argument("--out", required=True)
    ap.add_argument("--breite", type=int, default=1100, help="Spaltenbreite in px")
    a = ap.parse_args()

    FB, FR = _font(True, 40), _font(False, 28)
    n = len(a.neu)
    rows = []
    for i in range(n):
        neu = Image.open(a.neu[i]).convert("RGB")
        grau_p = a.grau[i] if i < len(a.grau) else os.path.join(
            os.path.dirname(a.neu[i]), "_graustufen", os.path.basename(a.neu[i]).replace(".png", "_grau.png"))
        cols = []
        if i < len(a.orig) and a.orig[i]:
            cols.append(("Original", Image.open(a.orig[i]).convert("RGB")))
        cols.append(("Neu · Farbe", neu))
        if os.path.exists(grau_p):
            cols.append(("Neu · Graustufendruck", Image.open(grau_p).convert("RGB")))
        scaled = []
        for lbl, im in cols:
            w = a.breite
            h = round(im.height * w / im.width)
            scaled.append((lbl, im.resize((w, h), Image.LANCZOS)))
        rows.append((a.titel[i] if i < len(a.titel) else os.path.basename(a.neu[i]), scaled))

    pad, gap = 60, 60
    ncols = max(len(r[1]) for r in rows)
    W = pad * 2 + ncols * a.breite + (ncols - 1) * gap
    H = pad + sum(70 + 50 + max(im.height for _, im in r[1]) + 50 for r in rows)
    sheet = Image.new("RGB", (W, H), "white")
    d = ImageDraw.Draw(sheet)
    y = pad
    for titel, cols in rows:
        d.text((pad, y), titel, font=FB, fill="#1A1A1A")
        y += 70
        for j, (lbl, im) in enumerate(cols):
            x = pad + j * (a.breite + gap)
            d.text((x, y), lbl, font=FR, fill="#4D4D4D")
            sheet.paste(im, (x, y + 50))
            d.rectangle([x - 1, y + 49, x + im.width, y + 50 + im.height], outline="#D0D0D0")
        y += 50 + max(im.height for _, im in cols) + 50
    sheet.save(a.out, optimize=True)
    print("geschrieben:", a.out, sheet.size)


if __name__ == "__main__":
    main()
