"""Abb. 4.24 – Qualitätssicherungsprozess."""
# Muster: Aufzählungsblock als Stapel gleich breiter Kästen (ohne Pfeile – das Original zeigt keine Reihenfolge).
# Kastenbreite wie die Schritte in Abb. 4.9. Bildtitel „Qualitätssicherungsprozess:“ entfällt (Caption).
STEM = "Qualitaetssicherungsprozess"
from bookfig import Fig, P

W = 110
PUNKTE = [
    "Informationsbedarfsanalyse und -änderungen",
    "Prozessqualitätsprüfung und -änderungen",
    "Organisatorische Qualitätsprüfung und -änderungen",
    "Datenqualitätsprüfung und -steuerung",
    "Informationssystem-Qualitätsprüfung und -steuerung",
]
SW, SH, GAP = 64.0, 5.0, 1.6     # Breite und Höhe wie Abb. 4.9


def build(theme):
    y0 = 0.3
    ys = [y0 + i * (SH + GAP) for i in range(len(PUNKTE))]
    H = round(ys[-1] + SH + 0.3, 1)
    f = Fig(W, H, theme, STEM)
    x = (W - SW) / 2
    for i, (s, y) in enumerate(zip(PUNKTE, ys)):
        f.box(x, y, SW, SH, [P(s)], role="box", name=f"Punkt {i + 1} {s}"[:40])
    return f
