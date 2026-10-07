"""Abb. 3.39 – Drill-Across."""
# Muster: wie Abb. 3.37 (Würfel, Umsatz nach Monat und Region, Quartalsumsatz nach Produkt); darunter ein zweiter
# Würfel mit der Dimension Kunde statt Region – der rote Pfeil „Drill-Across“ führt vom einen zum anderen. Rechts neben
# dem Produktumsatz der Umsatz je Produkt und Kunde; gestrichelte Pfeile (Disaggregation wie in 3.37) von den
# Produktwerten in die Kundenzeilen.
# Korrektur gegenüber dem Original: Die Trekking-Bike-Zeile ergab 12.000 € statt 13.000 € und die Kundensummen 56.000 €
# statt 57.000 €. Kunde A beim Trekking Bike 5.000 € statt 4.000 € (Kundensumme A 20.000 € statt 19.000 €).
STEM = "Drill-Across"
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from bookfig import Fig, P  # noqa: E402
from _olap import drillwuerfel, umsatztabelle, produkttabelle, Tabelle, zahl, text_width_mm, PRODUKTE  # noqa: E402

W, H = 155, 91.0
UMSATZ = [(20000, 13000, 7000), (15000, 7000, 8000), (22000, 12000, 10000), (57000, 32000, 25000)]
TAB_X, TAB_Y = 66.0, 2.0
PROD_Y = 48.0
KUNDEN = ("Kunde A", "Kunde B", "Kunde C", "Kunde D")
# Umsatz 1. Quartal je Produkt und Kunde (Zeilen wie PRODUKTE)
JE_KUNDE = [(10000, 0, 5000, 5000), (3000, 2000, 1000, 1000), (2000, 3000, 0, 12000), (5000, 3000, 2000, 3000)]


def build(theme):
    f = Fig(W, H, theme, STEM)
    rot = theme.accent
    for (_, v), zeile in zip(PRODUKTE, JE_KUNDE):
        assert sum(zeile) == v, (v, zeile)

    w1, sp1, b = drillwuerfel(f, 15.0, 13.0, name="Würfel Region")
    w2, sp2, _ = drillwuerfel(f, 15.0, 58.5, links="Kunde", farben={"links": rot}, name="Würfel Kunde",
                              auswahl={"j": (0, 3)})
    # Drill-Across: von der Dimension Region zur Dimension Kunde
    xa = 7.0
    ya0 = w1["fy"] + 1.0 + 2 * 7.0 * 0.3528 * 1.2 + 0.4 + 1.0
    ya1 = w2["fy"] + 0.4
    f.arrow([(xa, ya0), (xa, ya1)], role="accent", lw=1.0, name="Drill-Across")
    f.text(xa + 1.4, (ya0 + ya1) / 2 + 4.0, 20.0, 4.0, [P("Drill-Across", size=7.5, bold=True, color=rot)],
           anchor="m", name="Beschriftung Drill-Across")

    t, feld = umsatztabelle(f, TAB_X, TAB_Y, ("Summe", "Deutschland", "Frankreich"), UMSATZ)
    pt, pfeld = produkttabelle(f, t.cx(1), PROD_Y, von=feld[(3, 0)])

    # Umsatz je Produkt und Kunde, Zeilen wie die Produkttabelle
    x0 = pt.x + pt.b + 3.0
    kt = Tabelle(x0, PROD_Y, [(W - x0) / 4] * 4, pt.kopf_h, pt.zeilen_h, pt.n, summe_ab=pt.n - 1)
    kt.linien(f, name="Kunden")
    summen = [sum(z[k] for z in JE_KUNDE) for k in range(4)]
    assert sum(summen) == 57000
    halb = (text_width_mm("00.000", 7.0) + 1.2) / 2
    for k, kunde in enumerate(KUNDEN):
        kt.text(f, k, -1, kunde, bold=True, rand=0.4, name=f"Kunden Kopf {kunde}")
        for z, werte in enumerate([*JE_KUNDE, summen]):
            txt = zahl(werte[k])
            x1 = kt.cx(k) + halb
            f.text(x1 - 12.0, kt.zy(z) - 2.5, 12.0, 5.0, [P(txt, size=7.0)], align="r", anchor="m",
                   name=f"Kunden {kunde} {z}")
    # Pfeile von den Produktwerten in die Kundenzeilen
    for z, (fx0, fy0, fx1, fy1, _, _) in enumerate(pfeld):
        yy = (fy0 + fy1) / 2
        f.arrow([(fx1 + 0.6, yy), (kt.x - 0.6, yy)], dash="sysDash", lw=0.75, name=f"Drill-Across Zeile {z + 1}")
    return f
