"""Abb. 5.35 – BI-Analysespektrum (in Anlehnung an Lanquillon und Mallow 2015, S. 56, nach Eckerson 2007)."""
# Muster: Viertelkreis-Ringe im Achsenkreuz wie im Original (Komplexität über Wert für ein Unternehmen), innen
# Reporting, außen Präskription; je Ring ein Ankerpunkt mit gepunkteter Führungslinie zur Analyseart rechts
# (Begriff über, Grundfrage unter der Linie). Serie mit Abb. 5.36/5.37: Begriffe der Analyse- und Prognosephasen wie
# in Abb. 5.36, Reihenfolge von einfach (innen/unten) nach komplex (außen/oben).
# Rot-Rosa-Abstufung → Grauabstufung (innen dunkel, außen hell, weiße Trennfugen wie im Original); kein Rot, weil
# kein Ring hervorgehoben ist. Achsentitel „Komplexität“ waagerecht an der Pfeilspitze statt gedreht.
# Übertragen: Prescription/Prediction → Präskription/Prädiktion; Descriptive/Diagnostic/Real-time Analytics →
# Deskriptive/Diagnostische Analyse, Real-Time-Analyse; Predictive/Prescriptive Analytics → Prädiktive/Präskriptive
# Prognose (Begriffe aus Abb. 5.36, dort mit denselben Grundfragen).
STEM = "BI-Analysespektrum"
import math
from bookfig import Fig, P, arc_pts

W = 110
X0 = 9.0                         # Ursprung x
R = 57.0                         # Außenradius
RADIEN = [0.30, 0.46, 0.64, 0.82, 1.00]
FUELL = ["A9A9A9", "BEBEBE", "D2D2D2", "E2E2E2", "EFEFEF"]
RINGE = ["Reporting", "OLAP", "Monitoring", "Prädiktion", "Präskription"]
TEXT_H = [0.185, 0.385, 0.565, 0.745, 0.915]     # Höhe der Ringbeschriftung (Anteil R)
LEIT_H = [0.12, 0.325, 0.50, 0.68, 0.855]        # Höhe der Führungslinie
ARTEN = [("Deskriptive Analyse", "Was ist geschehen?"),
         ("Diagnostische Analyse", "Warum ist es geschehen?"),
         ("Real-Time-Analyse", "Was geschieht gerade?"),
         ("Prädiktive Prognose", "Was könnte geschehen?"),
         ("Präskriptive Prognose", "Was soll geschehen?")]
XL = 76.0                        # Beschriftung rechts


def build(theme):
    t = theme
    ytip = 5.0
    Y0 = ytip + 4.6 + R
    xtip = X0 + R + 7.0
    H = round(Y0 + 4.4, 1)
    f = Fig(W, H, theme, STEM)

    # ---------------- Ringe (von außen nach innen, weiße Fugen)
    for i in reversed(range(5)):
        r = RADIEN[i] * R
        pts = [(X0, Y0)] + arc_pts(X0, Y0, r, 0, 90, step=1.5)
        f.poly(pts, closed=True, fill=FUELL[i], line="FFFFFF", lw=1.6, name=f"Ring {RINGE[i]}")
    for i, s in enumerate(RINGE):
        yc = Y0 - TEXT_H[i] * R
        f.text(X0 + 1.2, yc - 1.6, 18.0, 3.2, [P(s, bold=True)], anchor="m", bg=FUELL[i], name=f"Ring {s}")

    # ---------------- Achsen
    f.arrow([(X0, Y0), (X0, ytip)], name="Achse Komplexität")
    f.arrow([(X0, Y0), (xtip, Y0)], name="Achse Wert")
    lab = dict(size=6.5)
    f.text(0.3, 0.3, 30.0, 3.4, [P("Komplexität", size=6.5, bold=True)], anchor="m", name="Titel Komplexität")
    f.text(0.3, ytip + 1.2, X0 - 2.0 - 0.3, 3.2, [P("hoch", **lab)], align="r", anchor="t", name="Komplexität hoch")
    f.text(0.3, Y0 + 0.6, X0 + 4.0, 3.2, [P("gering", **lab)], align="l", anchor="t", name="gering")
    f.text(X0 + 12.0, Y0 + 0.6, R - 18.0, 3.2, [P("Wert für ein Unternehmen", size=6.5, bold=True)], align="c",
           anchor="t", name="Titel Wert")
    f.text(xtip - 10.0, Y0 + 0.6, 10.0, 3.2, [P("hoch", **lab)], align="r", anchor="t", name="Wert hoch")

    # ---------------- Führungslinien und Analysearten
    for i, (art, frage) in enumerate(ARTEN):
        lo = RADIEN[i - 1] if i else 0.0
        rm = ((lo + RADIEN[i]) / 2 if i else 0.18) * R
        hy = LEIT_H[i] * R
        mx = X0 + math.sqrt(max(0.0, rm * rm - hy * hy))
        my = Y0 - hy
        f.line([(mx, my), (W - 0.3, my)], color=t.arrow, lw=0.6, dash="sysDot", name=f"Führungslinie {art}")
        d = 0.75
        f.poly([(mx - d, my), (mx, my - d), (mx + d, my), (mx, my + d)], closed=True, fill=t.arrow, line=None,
               name=f"Anker {art}")
        f.text(XL, my - 3.3, W - 0.3 - XL, 3.1, [P(art, bold=True)], align="l", anchor="b", name=art)
        f.text(XL, my + 0.3, W - 0.3 - XL, 3.1, [P(frage, italic=True)], align="r", anchor="t", name=frage)
    return f
