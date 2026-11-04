"""Abb. 4.9 – Einführungsprozess für die Planung und das Reporting."""
# Muster: Prozesskette in einer senkrechten Achse – neun gleich breite Schritte, Pfeile zwischen den Schritten
# (ersetzen die Aufzählung mit dem langen Pfeil daneben). Schrittbreite wie in Abb. 4.24.
STEM = "Einfuehrungsprozess_fuer_die_Planung_und_das_Reporting"
from bookfig import Fig, P

W = 110
SCHRITTE = [
    "Festlegung der Rahmenbedingungen",
    "Informationsbedarfs- und Ist-Analyse",
    "Best-Practice-Abgleich",
    "Blueprint",
    "Soll- bzw. Fachkonzept",
    "IT-Auswahl",
    "IT-Konzept",
    "IT-Implementierung",
    "Coaching/Schulung",
]
SW, SH, GAP = 64.0, 5.0, 3.6     # Schrittbreite, -höhe, Abstand (Pfeil)


def build(theme):
    y0 = 0.3
    ys = [y0 + i * (SH + GAP) for i in range(len(SCHRITTE))]
    H = round(ys[-1] + SH + 0.3, 1)
    f = Fig(W, H, theme, STEM)
    x = (W - SW) / 2
    cx = W / 2
    for i, (s, y) in enumerate(zip(SCHRITTE, ys)):
        f.box(x, y, SW, SH, [P(s)], role="box", name=f"Schritt {i + 1} {s}"[:40])
        if i:
            f.arrow([(cx, ys[i - 1] + SH), (cx, y)], name=f"Pfeil {i}→{i + 1}")
    return f
