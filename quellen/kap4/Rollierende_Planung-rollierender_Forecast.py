"""Abb. 4.12 – Rollierende Planung/rollierender Forecast."""
# Muster: Zeitachse mit Quartalsgrenzen (1. Jan. 11 … 1. Jan. 13) und einer Zeile je Planungszeitpunkt.
# Stilregeln Ist/Plan/Vorschau: lfd. Ist anthrazit, Plan weiß mit anthrazitfarbener Kontur, ggf. überarbeiteter Plan
# (rollierender Forecast) grau #8F8F8F, Ist für den Plan-Ist-Vergleich rot (Schlüsselelement wie im Original).
# Die Legende entfällt: Jede Kategorie ist einmal direkt im Balken beschriftet. Die gelbe Fläche hinter allen
# Zeilen ist als Ist-Abschnitt je Zeile umgesetzt; die beiden Zeilen ohne eigenen Inhalt (nur lfd. Ist bis
# 1. Jan. 13) entfallen, an ihrer Stelle trennt ein Abstand die Planungszeilen von den Ist-Zeilen.
STEM = "Rollierende_Planung-rollierender_Forecast"
from bookfig import Fig, P

W = 110
X0, XR = 0.3, W - 0.3
N = 10                                   # Quartalsspalten: Q4/10 … Q1/13
CW = (XR - X0) / N
DATEN = ["1. Jan. 11", "1. Apr. 11", "1. Jul. 11", "1. Okt. 11", "1. Jan. 12", "1. Apr. 12", "1. Jul. 12",
         "1. Okt. 12", "1. Jan. 13"]     # Quartalsgrenzen 1 … 9
IST, PLAN, FC, PIV = "ist", "plan", "fc", "piv"
STIL = {  # Füllung, Kontur, Textfarbe
    IST: ("3A3F44", "none", "FFFFFF"),
    PLAN: ("FFFFFF", "3A3F44", "1A1A1A"),
    FC: ("8F8F8F", "none", "1A1A1A"),
    PIV: ("C62828", "none", "FFFFFF"),
}
# Zeilen: Liste (Kategorie, von Grenze, bis Grenze, Beschriftung)
ZEILEN = [
    [(IST, 0, 1, None), (PLAN, 1, 5, "Plan"), (FC, 5, 10, "ggf. überarbeiteter Plan")],
    [(IST, 0, 5, "lfd. Ist"), (PLAN, 5, 6, None), (FC, 6, 10, None)],
    [(IST, 0, 6, None), (PLAN, 6, 7, None), (FC, 7, 10, None)],
    [(IST, 0, 7, None), (PLAN, 7, 8, None), (FC, 8, 10, None)],
    [(IST, 0, 8, None), (PLAN, 8, 9, None), (FC, 9, 10, None)],
    [(IST, 0, 9, None), (PLAN, 9, 10, None)],
    None,                                                    # Abstand Planungszeilen | Ist-Zeilen
    [(IST, 0, 5, None), (PIV, 5, 9, "Ist für Plan-Ist-Vergleich")],
    [(IST, 0, 10, "lfd. Ist")],
]
BH, PITCH, TRENN = 3.6, 5.0, 2.6         # Balkenhöhe, Zeilenabstand, zusätzlicher Abstand der Gruppen
FUGE = 0.4                               # weiße Fuge zwischen benachbarten Abschnitten
Y_ACHSE = 3.0                            # Unterkante der Datumsbeschriftung
GITTER = "A9A9A9"


def bx(b):
    return X0 + b * CW


def build(theme):
    t = theme
    ys, y = [], Y_ACHSE + 1.4
    for z in ZEILEN:
        if z is None:
            y += TRENN
            continue
        ys.append(y)
        y += PITCH
    yend = ys[-1] + BH + 0.8
    H = round(yend + 0.3, 1)
    f = Fig(W, H, theme, STEM)

    # Zeitachse: Datumsbeschriftung und Gitterlinien an den Quartalsgrenzen
    for k, d in enumerate(DATEN, start=1):
        x = bx(k)
        f.text(x - CW / 2, 0.3, CW, Y_ACHSE - 0.3, [P(d, size="small")], align="c", anchor="b", name=f"Datum {d}")
        f.line([(x, Y_ACHSE + 0.4), (x, yend)], color=GITTER, lw=0.4, name=f"Gitter {d}")

    # Balken
    zeilen = [z for z in ZEILEN if z is not None]
    for i, (z, y) in enumerate(zip(zeilen, ys)):
        for kat, a, b, txt in z:
            xa = bx(a) + (FUGE / 2 if a > 0 else 0)
            xb = bx(b) - (FUGE / 2 if b < N else 0)
            fill, line, tc = STIL[kat]
            paras = [P(txt, size="small")] if txt else None
            f.box(xa, y, xb - xa, BH, paras, role="box", rounded=False, fill=fill, line=line,
                  lw=0.75 if line != "none" else None, text_color=tc, ins=(0.6, 0.4),
                  name=f"Zeile {i + 1} {kat} {a}-{b}")

    # Stichtag 1. Jan. 13 (rot gepunktet wie im Original)
    f.line([(bx(9), Y_ACHSE + 0.4), (bx(9), yend)], color=t.accent, lw=1.0, dash="sysDot", name="Stichtag 1. Jan. 13")
    return f
