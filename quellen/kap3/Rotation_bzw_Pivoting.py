"""Abb. 3.34 – Rotation bzw. Pivoting."""
# Muster: drei Datenwürfel wie Abb. 3.33 im Dreieck (oben Mitte, unten links und rechts), verbunden durch drei rote
# Pfeile „Rotation“ im Kreis (unten links → oben → unten rechts → unten links), wie im Original.
# Die Würfel zeigen dieselben Daten gedreht: Jede Dimension behält ihre Zahl an Elementen (Produkt 4, Zeit 5,
# Region 3 wie in Abb. 3.33), deshalb ändern sich mit der Drehung die Seitenverhältnisse.
# Die linke Beschriftung steht unter dem Pfeil neben der Vorderseite, damit drei Würfel in 110 mm passen.
STEM = "Rotation_bzw_Pivoting"
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from bookfig import Fig, P, text_width_mm  # noqa: E402
from _olap import wuerfel, achsen, kennzahlen  # noqa: E402

W, H = 110, 88.5
Z = 4.0                                   # Zellgröße
N = {"Produkt": 4, "Zeit": 5, "Region": 3}  # Elemente je Dimension


def wuerfel_mit_achsen(f, fx, fy, links, hinten, unten, name, lang_hinten=1.3):
    w = wuerfel(f, fx, fy, nx=N[links], ny=N[unten], nz=N[hinten], zelle=Z, name=name)
    kennzahlen(f, w, zeile=1, size=7.0, name=f"{name} Kennzahlen")
    sp, b = achsen(f, w, links, hinten, unten, lw=1.0, size=7.0, lang=(4.0, lang_hinten, 5.0), links_stil="unter")
    return w, sp, b


def build(theme):
    f = Fig(W, H, theme, STEM)
    rot = theme.accent

    # oben Mitte: Region | Produkt | Zeit
    fyA = 12.0
    a, spA, b = wuerfel_mit_achsen(f, 44.0, fyA, "Region", "Produkt", "Zeit", "Würfel oben")
    # unten links: Produkt | Region | Zeit (wie Abb. 3.33)
    fyU = 55.0
    c, spC, _ = wuerfel_mit_achsen(f, 14.2, fyU, "Produkt", "Region", "Zeit", "Würfel unten links")
    # unten rechts: Region | Zeit | Produkt
    r, spB, _ = wuerfel_mit_achsen(f, 67.2, fyU, "Region", "Zeit", "Produkt", "Würfel unten rechts", lang_hinten=1.2)

    lw = 1.0
    lab = lambda x, y, w_, al, n: f.text(x, y, w_, 4.0, [P("Rotation", size=7.5, bold=True, italic=True, color=rot)],
                                        align=al, anchor="m", name=n)
    # 1) unten links → oben: von der Oberseite senkrecht hoch, dann waagerecht an die Vorderseite des oberen Würfels
    xa = c["fx"] + c["t"][0] + 2.0
    ya = fyA + 12.0
    ya_start = c["fy"] + c["t"][1] - 0.4
    f.arrow([(xa, ya_start), (xa, ya), (a["fx"], ya)], role="accent", lw=lw, name="Rotation 1")
    lab(xa - 15.6, (ya + ya_start) / 2 - 2.0, 14.0, "r", "Beschriftung Rotation 1")
    # 2) oben → unten rechts: von der rechten Seitenfläche nach rechts, dann hinunter auf die Oberseite
    x0 = a["v"][0] + a["t"][0] + 0.4
    xb = r["v"][0] + r["t"][0] * 0.62
    yb_end = r["fy"] + r["t"][1] - 0.4
    f.arrow([(x0, ya), (xb, ya), (xb, yb_end)], role="accent", lw=lw, name="Rotation 2")
    lab(xb + 1.6, (ya + yb_end) / 2 - 2.0, 14.0, "l", "Beschriftung Rotation 2")
    # 3) unten rechts → unten links: waagerecht zwischen den Würfeln
    yc = fyU + 13.0
    x_start = r["fx"] - 0.4
    x_end = c["v"][0] + c["t"][0] + 0.6
    f.arrow([(x_start, yc), (x_end, yc)], role="accent", lw=lw, name="Rotation 3")
    lab(x_end, yc + 0.6, x_start - x_end, "c", "Beschriftung Rotation 3")
    return f
