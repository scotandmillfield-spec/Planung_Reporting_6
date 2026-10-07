"""Abb. 3.36 – Dice."""
# Muster: Würfel aus Abb. 3.33 (Produkt nach links, Zeit nach unten, Region nach hinten). Der Teilwürfel aus zwei
# Produkten, zwei Jahren und zwei Regionen ist rot hervorgehoben (sichtbar auf Vorder-, Ober- und Seitenfläche); ein
# gestrichelter Pfeil verbindet ihn mit der Sicht, für die er herausgeschnitten wird.
STEM = "Dice"
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from bookfig import Fig, P  # noqa: E402
from _olap import standardwuerfel, NB  # noqa: E402

W, H = 110, 67.0


def build(theme):
    f = Fig(W, H, theme, STEM)
    w, sp, b = standardwuerfel(f, 20.0, 16.5, auswahl={"i": (2, 4), "j": (0, 2), "k": (0, 2)})
    # Sicht des Produktmanagers
    dx, dy = w["d"]
    zx = w["fx"] + w["bw"] + 1.0 * dx            # Mitte der hervorgehobenen Zellen auf der Seitenfläche
    zy = w["fy"] + 1.0 * w["z"] + 1.0 * dy
    bx, bb = 72.0, 38.0
    paras = [P(f"Sicht Produktmanager – Detailanalyse", size=7.5, bold=True),
             P(f"Produktumsatz selektierter Produkte in den Jahren 2010 und 2011 in den Regionen Deutschland "
               f"und Frankreich", size=7.0, space_before=1.0)]
    bh = f.measure(paras, bb) + 0.4
    by = zy - 3.0
    f.box(bx, by, bb, bh, paras, role="box", align="l", name="Sicht Produktmanager")
    f.arrow([(bx, zy), (zx, zy)], role="info", dash="sysDash", name="Verweis Teilwürfel")
    return f
