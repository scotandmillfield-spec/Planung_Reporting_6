"""Abb. 3.38 – Drill-Through."""
# Muster: wie Abb. 3.37 (Würfel, Umsatz nach Monat und Region, Quartalsumsatz nach Produkt); statt der Legende führt
# ein roter Pfeil „Drill-Through“ vom Umsatz des Mountain Bike (7.000 €) zu den zugrunde liegenden Belegen.
# Die Belegliste ist als kleine Tabelle (Beleg, Kunde, Umsatz) gesetzt; die sieben Belege zu je 1.000 € ergeben die
# 7.000 € des Mountain Bike – wie im Original.
STEM = "Drill-Through"
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from bookfig import Fig, P, text_width_mm  # noqa: E402
from _olap import drillwuerfel, umsatztabelle, produkttabelle, Tabelle, zahl  # noqa: E402

W, H = 155, 90.0
UMSATZ = [(20000, 13000, 7000), (15000, 7000, 8000), (22000, 12000, 10000), (57000, 32000, 25000)]
TAB_X, TAB_Y = 66.0, 2.0
PROD_Y = 48.0
BELEGE = [("Beleg 1", "Kunde A"), ("Beleg 2", "Kunde B"), ("Beleg 3", "Kunde A"), ("Beleg 4", "Kunde C"),
          ("Beleg 5", "Kunde D"), ("Beleg 6", "Kunde A"), ("Beleg 7", "Kunde B")]


def build(theme):
    f = Fig(W, H, theme, STEM)
    drillwuerfel(f, 15.0, 13.0)
    t, feld = umsatztabelle(f, TAB_X, TAB_Y, ("Summe", "Deutschland", "Frankreich"), UMSATZ)
    pt, pfeld = produkttabelle(f, t.cx(1), PROD_Y, von=feld[(3, 0)])

    # Belege des Mountain Bike
    bt = Tabelle(W - 40.0, PROD_Y, [11.0, 12.0, 17.0], pt.kopf_h, (pt.n * pt.zeilen_h) / len(BELEGE), len(BELEGE))
    bt.linien(f, name="Belege")
    for s, k in enumerate(("Beleg", "Kunde", "Umsatz in €")):
        bt.text(f, s, -1, k, align="r" if s == 2 else "l", bold=True, rand=0.6, name=f"Belege Kopf {k}")
    for z, (beleg, kunde) in enumerate(BELEGE):
        bt.text(f, 0, z, beleg, align="l", rand=0.6, name=f"Belege {beleg}")
        bt.text(f, 1, z, kunde, align="l", rand=0.6, name=f"Belege {beleg} Kunde")
        bt.text(f, 2, z, zahl(1000), align="r", rand=0.6, name=f"Belege {beleg} Umsatz")

    # Drill-Through vom Mountain Bike zu den Belegen
    x0, y0, x1, y1, _, _ = pfeld[1]
    yy = (y0 + y1) / 2
    xs, xe = x1 + 0.8, bt.x - 0.8
    f.arrow([(xs, yy), (xe, yy)], role="accent", lw=1.0, name="Drill-Through")
    f.text(xs, yy - 8.6, xe - xs, 8.0, [P("Drill-Through", size=7.5, bold=True, color=theme.accent)], align="c",
           anchor="b", name="Beschriftung Drill-Through")
    return f
