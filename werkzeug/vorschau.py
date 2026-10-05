#!/usr/bin/env python3
"""Erzeugt die Vorschaubilder der Abbildungsinventur.

Aufruf (im Ordner der Inventur):
    python3 werkzeug/vorschau.py [--quelle QUELLE.pdf] [--alles]

  --quelle   PDF der Abbildungssammlung 5. Auflage (eine Folie je Seite). Nur nötig, wenn die
             Originalvorschauen (vorschau/original/) fehlen oder neu entstehen sollen.
  --alles    alle Vorschauen neu erzeugen, auch wenn sie schon aktuell sind

Ergebnis:
  vorschau/original/folie_NNN.jpg        Folie zugeschnitten, groß (Lupe)
  vorschau/original/klein/folie_NNN.jpg  Folie zugeschnitten, klein (Karte)
  vorschau/neu/<stem>.jpg                neue Fassung, klein (Karte) – aus abbildungen/**/<stem>.png
  vorschau/neu/gross/<stem>.png          gesetzte LaTeX-Tabelle bzw. Listing (Lupe), aus tabellen/<stem>.tex
"""
import argparse
import glob
import os
import re
import shutil
import subprocess
import tempfile

from PIL import Image, ImageChops

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
KLEIN = 560      # Breite der Kartenvorschau in px (für 2x-Bildschirme bei ca. 280 px Anzeige)
GROSS = 1600     # Höchstbreite der Lupenansicht
Image.MAX_IMAGE_PIXELS = None


def p(*teile):
    return os.path.join(ROOT, *teile)


def veraltet(ziel, quelle, alles):
    return alles or not os.path.exists(ziel) or os.path.getmtime(ziel) < os.path.getmtime(quelle)


def zuschneiden(im, rand=14, schwelle=242):
    grau = im.convert("L")
    maske = grau.point(lambda v: 255 if v < schwelle else 0)
    box = maske.getbbox()
    if not box:
        return im
    x0, y0, x1, y1 = box
    return im.crop((max(0, x0 - rand), max(0, y0 - rand), min(im.width, x1 + rand), min(im.height, y1 + rand)))


def jpeg(im, ziel, breite, hoehe=None, qualitaet=80):
    im = im.convert("RGB")
    hoehe = hoehe or breite * 3
    im.thumbnail((breite, hoehe), Image.LANCZOS)
    os.makedirs(os.path.dirname(ziel), exist_ok=True)
    im.save(ziel, "JPEG", quality=qualitaet, optimize=True, progressive=True)


def originale(quelle, alles):
    os.makedirs(p("vorschau", "original", "klein"), exist_ok=True)
    with tempfile.TemporaryDirectory() as tmp:
        subprocess.run(["pdftoppm", "-r", "150", "-png", quelle, os.path.join(tmp, "f")], check=True)
        seiten = sorted(glob.glob(os.path.join(tmp, "f-*.png")))
        for s in seiten:
            n = int(re.search(r"-(\d+)\.png$", s).group(1))
            gross = p("vorschau", "original", f"folie_{n:03d}.jpg")
            klein = p("vorschau", "original", "klein", f"folie_{n:03d}.jpg")
            if os.path.exists(gross) and not alles:
                continue
            im = zuschneiden(Image.open(s).convert("RGB"))
            jpeg(im, gross, GROSS, qualitaet=82)
            jpeg(im, klein, KLEIN, qualitaet=78)
    print(f"Originalvorschauen: {len(seiten)} Folien")


def neue(alles):
    n = 0
    for png in sorted(glob.glob(p("abbildungen", "*", "*.png"))):
        stem = os.path.splitext(os.path.basename(png))[0]
        ziel = p("vorschau", "neu", f"{stem}.jpg")
        if veraltet(ziel, png, alles):
            jpeg(Image.open(png), ziel, KLEIN, qualitaet=80)
            n += 1
    print(f"Neue Vorschauen (Abbildungen): {n} erzeugt")


VORLAGE = r"""\documentclass[10pt]{article}
\usepackage[T1]{fontenc}
\usepackage[utf8]{inputenc}
\usepackage{mathptmx}
\usepackage{booktabs,tabularx,amsmath,listings}
\usepackage[labelsep=space,labelfont=bf,font=small,skip=4pt]{caption}
\usepackage[paperwidth=118mm,paperheight=297mm,textwidth=110mm,textheight=285mm,top=6mm,left=4mm]{geometry}
\pagestyle{empty}
\renewcommand{\tablename}{Tab.}
\renewcommand{\figurename}{Abb.}
\renewcommand{\thetable}{%(nr)s}
\renewcommand{\thefigure}{%(nr)s}
\begin{document}
\input{%(datei)s}
\end{document}
"""


def tabellen(alles):
    if not shutil.which("pdflatex"):
        print("pdflatex fehlt – Tabellenvorschauen übersprungen")
        return
    n = 0
    for tex in sorted(glob.glob(p("tabellen", "*.tex"))):
        stem = os.path.splitext(os.path.basename(tex))[0]
        nr = re.sub(r"^(tab|lst)_", "", stem).replace("-", ".")
        gross = p("vorschau", "neu", "gross", f"{stem}.png")
        klein = p("vorschau", "neu", f"{stem}.jpg")
        if not veraltet(gross, tex, alles):
            continue
        with tempfile.TemporaryDirectory() as tmp:
            # \input mit Pfad ohne Leerzeichen: Datei in den Arbeitsordner kopieren
            shutil.copy(tex, os.path.join(tmp, "inhalt.tex"))
            with open(os.path.join(tmp, "v.tex"), "w", encoding="utf-8") as fh:
                fh.write(VORLAGE % {"nr": nr, "datei": "inhalt.tex"})
            r = subprocess.run(["pdflatex", "-interaction=nonstopmode", "v.tex"], cwd=tmp, capture_output=True, text=True)
            if r.returncode != 0 or not os.path.exists(os.path.join(tmp, "v.pdf")):
                print(f"  {stem}: LaTeX-Fehler – siehe Protokoll")
                continue
            log = open(os.path.join(tmp, "v.log"), encoding="latin-1").read()
            if "Overfull \\hbox" in log:
                print(f"  {stem}: Achtung, Overfull hbox (zu breit für 110 mm)")
            subprocess.run(["pdftoppm", "-r", "300", "-png", "-singlefile", "v.pdf", "s"], cwd=tmp, check=True)
            im = zuschneiden(Image.open(os.path.join(tmp, "s.png")).convert("RGB"), rand=24)
            os.makedirs(os.path.dirname(gross), exist_ok=True)
            im.save(gross, optimize=True)
            jpeg(im, klein, KLEIN, qualitaet=82)
            n += 1
    print(f"Neue Vorschauen (LaTeX): {n} erzeugt")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--quelle")
    ap.add_argument("--alles", action="store_true")
    a = ap.parse_args()
    if a.quelle:
        originale(a.quelle, a.alles)
    elif not glob.glob(p("vorschau", "original", "folie_*.jpg")):
        print("Hinweis: keine Originalvorschauen vorhanden – mit --quelle <Abbildungssammlung.pdf> erzeugen")
    neue(a.alles)
    tabellen(a.alles)


if __name__ == "__main__":
    main()
