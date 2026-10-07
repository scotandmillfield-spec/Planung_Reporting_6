"""Abb. 3.40 – Split und Merge."""
# Muster: Würfel wie Abb. 3.37 mit zusätzlichem rotem Pfeil „Dimension Filiale“ (die Dimension, nach der aufgeteilt
# wird), daneben der Umsatz nach Monat, gesamt und je Filiale. Pfeile wie in 3.37: durchgezogen = Merge (Filialen zur
# Summe zusammenführen), gestrichelt = Split (Summe auf die Filialen aufteilen); Legende unter der Tabelle.
# Die senkrechten Pfeile des Originals (Monate → Quartal) sind entfallen: Sie stammen aus Abb. 3.37 und zeigen einen
# Roll-Up über die Zeit, nicht Split und Merge. 110 mm breit; „Dimension Produkt“ steht über dem Pfeil.
STEM = "Split_und_Merge"
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from bookfig import Fig, P  # noqa: E402
from _olap import drillwuerfel, umsatztabelle, legende_roll, dim_text, text_width_mm  # noqa: E402

W, H = 110, 55.0
UMSATZ = [(20000, 11000, 9000), (15000, 6000, 9000), (22000, 10000, 12000), (57000, 27000, 30000)]


def build(theme):
    f = Fig(W, H, theme, STEM)
    rot = theme.accent
    for z in UMSATZ:
        assert z[0] == z[1] + z[2]
    w, sp, b = drillwuerfel(f, 15.0, 23.0, hinten_stil="ueber")
    # vierte Dimension Filiale: von der Oberseite nach links oben
    dx, dy = w["d"]
    start = (w["fx"] + w["bw"] / 4 + w["t"][0] / 2, w["fy"] + w["t"][1] / 2)
    spitze = (w["fx"] - 3.0, w["fy"] - 14.0)
    f.arrow([start, spitze], role="accent", lw=1.0, name="Dimension Filiale")
    dim_text(f, spitze[0], spitze[1] - 0.8, b, "Filiale", align="c", anchor="b", size=7.0, farbe=rot)

    t, feld = umsatztabelle(f, 46.5, 2.0, ("Summe", "Filiale A", "Filiale B"), UMSATZ,
                            breiten=(16.0, 15.8, 15.8, 15.9), senkrecht=False)
    legende_roll(f, 47.1, t.y + t.h + 3.0, 55.0,
                 eintraege=(("Merge (Aggregation)", False), ("Split (Disaggregation)", True)))
    return f
