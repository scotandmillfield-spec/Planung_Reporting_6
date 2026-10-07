"""Abb. 3.35 – Slice."""
# Muster: Würfel aus Abb. 3.33 (Produkt nach links, Zeit nach unten, Region nach hinten). Die Scheibe einer Region –
# die mittlere Ebene wie im Original – ist rot hervorgehoben (sichtbar auf Ober- und Seitenfläche); ein gestrichelter
# Pfeil verbindet sie mit der Sicht, für die sie geschnitten wird.
STEM = "Slice"
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from bookfig import Fig, P  # noqa: E402
from _olap import standardwuerfel, zelle_rechts  # noqa: E402

W, H = 110, 67.0


def build(theme):
    f = Fig(W, H, theme, STEM)
    w, sp, b = standardwuerfel(f, 20.0, 16.5, auswahl={"k": (1, 2)})
    # Sicht des Regionalleiters
    zx, zy = zelle_rechts(w, 2, 1)
    bx, bb = 76.0, 34.0
    bh = f.measure([P("Sicht Regionalleiter Deutschland", size=7.5, bold=True)], bb) + 0.4
    f.box(bx, zy - bh / 2, bb, bh, [P("Sicht Regionalleiter Deutschland", size=7.5, bold=True)], role="box",
          name="Sicht Regionalleiter")
    f.arrow([(bx, zy), (zx, zy)], role="info", dash="sysDash", name="Verweis Scheibe")
    return f
