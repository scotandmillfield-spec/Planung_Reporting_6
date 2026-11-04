"""Abb. 3.192 – Stufen der Absatz-/Umsatzplanung."""
# Muster: Treppe (Wasserfall) aus fünf Planungsstufen, die sich zum Gesamtabsatz/-umsatz addieren; die Höhe der
# Gesamtsäule entspricht der Summe der Stufen. Oben die Linie der Zielvorgabe, an der das Ergebnis gemessen wird
# (rote Pfeile von oben und unten: Abgleich nach oben oder unten). Unten die Zuordnung zur analytischen
# (Stufen 1–4, grau hervorgehoben) und stochastischen Planung (Stufe 5).
STEM = "Stufen_der_Absatz--Umsatzplanung"
from bookfig import Fig, P

W = 110.0
SHY = chr(0xAD)

STUFEN = [(f"Auftrags{SHY}bestand", 1.0), (f"Rahmen{SHY}verträge", 1.0), ("Angebote", 1.0),
          (f"Verkaufs{SHY}chancen", 1.2), (f"Restlicher Kunden{SHY}bedarf", 1.65)]
SW, SG = 15.0, 0.8            # Stufenbreite, Abstand
X0 = 0.3
GX, GW = 84.0, 14.0           # Gesamtsäule
ZX = 104.0                    # Pfeile der Zielvorgabe
HG = 47.0                     # Höhe der Gesamtsäule (= Summe der Stufen)
YT = 8.0                      # Linie der Zielvorgabe


def build(theme):
    YB = YT + HG              # Grundlinie
    BAND_Y, BAND_H = YB + 1.6, 10.2
    H = round(BAND_Y + BAND_H + 0.3, 1)
    f = Fig(W, H, theme, STEM)
    t = theme
    summe = sum(g for _, g in STUFEN)

    # Grund- und Ziellinie über die ganze Breite
    f.line([(0, YB), (W, YB)], color="8C8C8C", lw=0.5, name="Grundlinie")
    f.line([(0, YT), (W, YT)], color="8C8C8C", lw=0.5, name="Linie Zielvorgabe")

    # Treppe: jede Stufe beginnt auf der Höhe, an der die vorige endet
    unten = YB
    xs = []
    for i, (txt, g) in enumerate(STUFEN):
        h = HG * g / summe
        x = X0 + i * (SW + SG)
        xs.append(x)
        f.box(x, unten - h, SW, h, [P(txt)], role="box_hi" if i < 4 else "box", name=f"Stufe {i + 1}")
        if i < len(STUFEN) - 1:
            f.text(x, unten - h - 4.2, SW, 3.6, [P("+", bold=True)], align="c", anchor="m", name=f"Plus {i + 1}")
        unten -= h
    xr = xs[-1] + SW
    f.text(xr, YT + 1.0, GX - xr, 4.0, [P("=", bold=True)], align="c", anchor="m", name="Gleich")

    # Gesamtsäule
    f.box(GX, YT, GW, HG, [P(f"Gesamt{SHY}absatz/ -umsatz", bold=True)], role="header", name="Gesamtabsatz/-umsatz")

    # Zielvorgabe: Abgleich von oben und von unten (rot)
    f.arrow([(ZX, 0.4), (ZX, YT)], role="accent", lw=1.2, name="Zielvorgabe von oben")
    f.arrow([(ZX, YT + 7.6), (ZX, YT)], role="accent", lw=1.2, name="Zielvorgabe von unten")
    f.text(GX, 0.4, ZX - 1.6 - GX, YT - 1.2, [P("Zielvorgabe", bold=True, color=t.accent, nowrap=True)],
           align="r", anchor="b", name="Zielvorgabe")

    # Zuordnung zu den Planungsarten
    f.box(xs[0], BAND_Y, xs[3] + SW - xs[0], BAND_H, [P("Analytische Planung")], role="box_hi", name="Analytische Planung")
    f.box(xs[4], BAND_Y, SW, BAND_H, [P(f"Stochas{SHY}tische Planung")], role="box", name="Stochastische Planung")
    return f
