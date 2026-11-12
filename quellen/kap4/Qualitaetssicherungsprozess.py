"""Abb. 4.24 – Qualitätssicherungsprozess."""
# Muster: Prozessschaubild (Revision 11/2026 nach Vorgabe der Prüfer) – die Informationsbedarfsanalyse und
# -änderungen sind der Auslöser (oben, hervorgehoben); über eine Sammelleitung stoßen sie die vier Prüfungen an,
# die nebeneinander parallel laufen. Bildtitel „Qualitätssicherungsprozess:“ entfällt (Caption).
STEM = "Qualitaetssicherungsprozess"
from bookfig import Fig, P

W = 110
SHY = chr(0xAD)
AUSLOESER = "Informationsbedarfsanalyse und -änderungen"
PRUEFUNGEN = [
    f"Prozess{SHY}qualitäts{SHY}prüfung und -änderungen",
    f"Organisatorische Qualitäts{SHY}prüfung und -änderungen",
    f"Daten{SHY}qualitäts{SHY}prüfung und -steuerung",
    f"Informations{SHY}system-Qualitäts{SHY}prüfung und -steuerung",
]
X0, XR = 0.3, W - 0.3
GAP = 2.4                        # Abstand der parallelen Prüfungen
AW, AH = 64.0, 6.0               # Auslöser
DROP = 9.0                       # senkrechter Abstand Auslöser → Prüfungen (Sammelleitung in der Mitte; Folienhöhe ≥ 25,4 mm)


def build(theme):
    t = theme
    tmp = Fig(W, 30, theme)
    pw = (XR - X0 - 3 * GAP) / 4
    ph = max(tmp.measure([P(s)], pw) for s in PRUEFUNGEN) + 0.4
    y0 = 0.3
    yP = y0 + AH + DROP
    H = round(yP + ph + 0.3, 1)
    f = Fig(W, H, theme, STEM)

    ax = (W - AW) / 2
    xs = [X0 + i * (pw + GAP) for i in range(4)]
    cs = [x + pw / 2 for x in xs]
    yb = y0 + AH + DROP / 2
    # Sammelleitung: Auslöser → vier parallele Prüfungen
    f.line([(W / 2, y0 + AH), (W / 2, yb)], color=t.arrow, lw=t.arrow_lw, name="Abgang Auslöser")
    f.line([(cs[0], yb), (cs[-1], yb)], color=t.arrow, lw=t.arrow_lw, name="Sammelleitung")
    f.ellipse(W / 2 - 0.45, yb - 0.45, 0.9, 0.9, role="box_strong", fill=t.arrow, line="none", name="Knoten")
    for i, c in enumerate(cs):
        f.arrow([(c, yb), (c, yP)], size="sm", name=f"Pfeil Prüfung {i + 1}")

    f.box(ax, y0, AW, AH, [P(AUSLOESER, bold=True)], role="box_hi", name="Auslöser Informationsbedarfsanalyse")
    for i, (x, s) in enumerate(zip(xs, PRUEFUNGEN)):
        f.box(x, yP, pw, ph, [P(s)], role="box", name=f"Prüfung {i + 1}")
    return f
