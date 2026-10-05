#!/usr/bin/env python3
"""Abnahmeblatt: Original, neues Druck-PNG und Graustufen-Kontrolle untereinander.

Aufruf:  python3 vergleich.py --original alt.png --neu out/abb_3-4.png --out out/vergleich_abb_3-4.png
Die Graustufenfassung wird aus <ordner von --neu>/_graustufen/<name>_grau.png gelesen (von build_dashboard.py erzeugt).
"""
import argparse
import os

from PIL import Image, ImageDraw, ImageFont

SCHRIFT = "/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf"


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--original", required=True)
    ap.add_argument("--neu", required=True)
    ap.add_argument("--out", required=True)
    ap.add_argument("--breite", type=int, default=1400)
    a = ap.parse_args()
    f = ImageFont.truetype(SCHRIFT, 30) if os.path.exists(SCHRIFT) else ImageFont.load_default()
    grau = os.path.join(os.path.dirname(os.path.abspath(a.neu)), "_graustufen",
                        os.path.basename(a.neu).replace(".png", "_grau.png"))
    teile = [("Vorher", a.original), ("Nachher – Druck-PNG", a.neu)]
    if os.path.exists(grau):
        teile.append(("Nachher – Graustufen-Kontrolle", grau))
    B = a.breite
    bilder = []
    for titel, pfad in teile:
        im = Image.open(pfad).convert("RGB")
        bilder.append((titel, im.resize((B, round(im.height * B / im.width)), Image.LANCZOS)))
    blatt = Image.new("RGB", (B + 80, sum(im.height + 70 for _, im in bilder) + 20), "white")
    d = ImageDraw.Draw(blatt)
    y = 20
    for titel, im in bilder:
        d.text((40, y), titel, font=f, fill="#1A1A1A")
        y += 50
        blatt.paste(im, (40, y))
        d.rectangle((39, y - 1, 40 + B, y + im.height), outline="#BDBDBD")
        y += im.height + 20
    blatt.save(a.out)
    print("geschrieben:", a.out, blatt.size)


if __name__ == "__main__":
    main()
