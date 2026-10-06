"""Abb. 2.5 – Ziele und Aufgaben der Planung."""
# Muster: Hierarchie von unten nach oben – Ausgangsbox, Verteilerbus auf vier Teilfunktionen,
# Sammelbus in eine senkrechte Kette von Zielfunktionen.
STEM = "Ziele_und_Aufgaben_der_Planung"
from bookfig import Fig, P

W = 110
SHY = chr(0xAD)

KETTE = ["Zielerreichungsfunktion", "Innovationsfunktion", "Steuerungsfunktion", "Zielsetzungsfunktion"]
FUNKTIONEN = [f"Informations- und Dokumentations{SHY}funktion", f"Koordinations-/ Integrations{SHY}funktion",
              f"Gestaltungs- und Prognose{SHY}funktion", f"Anreiz- und Motivations{SHY}funktion"]


def build(theme):
    KW, KH, KG = 44.0, 5.6, 3.6         # Kette: Breite, Höhe, Abstand
    FW, FG = 25.6, 2.2                  # Teilfunktionen
    tmp = Fig(W, 30, theme)
    fh = max(tmp.measure([P(t)], FW) for t in FUNKTIONEN)
    yk = [0.4 + i * (KH + KG) for i in range(len(KETTE))]
    ybus1 = yk[-1] + KH + 3.2
    yf = ybus1 + 3.4
    ybus2 = yf + fh + 3.4
    yp = ybus2 + 3.2
    H = round(yp + KH + 0.4, 1)
    f = Fig(W, H, theme, STEM)
    t = theme
    cx = W / 2
    kx = cx - KW / 2
    for txt, y in zip(KETTE, yk):
        f.box(kx, y, KW, KH, [P(txt, bold=True)], role="box", name=txt)
    for a, b in zip(yk[1:], yk[:-1]):
        f.arrow([(cx, a), (cx, b + KH)])
    x0 = (W - (4 * FW + 3 * FG)) / 2
    fx = [x0 + i * (FW + FG) + FW / 2 for i in range(4)]
    for i, txt in enumerate(FUNKTIONEN):
        f.box(fx[i] - FW / 2, yf, FW, fh, [P(txt)], role="box", name=txt.replace(SHY, "")[:30])
    # Sammelbus Teilfunktionen -> Zielsetzungsfunktion
    f.line([(fx[0], ybus1), (fx[-1], ybus1)], color=t.arrow, lw=t.arrow_lw)
    for x in fx:
        f.line([(x, yf), (x, ybus1)], color=t.arrow, lw=t.arrow_lw)
    f.arrow([(cx, ybus1), (cx, yk[-1] + KH)])
    # Verteilerbus Planung/Kontrolle -> Teilfunktionen
    f.box(kx, yp, KW, KH, [P("Planung/Kontrolle", bold=True)], role="box", name="Planung/Kontrolle")
    f.line([(cx, yp), (cx, ybus2)], color=t.arrow, lw=t.arrow_lw)
    f.line([(fx[0], ybus2), (fx[-1], ybus2)], color=t.arrow, lw=t.arrow_lw)
    for x in fx:
        f.arrow([(x, ybus2), (x, yf + fh)])
    for x in (fx[1], fx[2]):
        f.ellipse(x - 0.45, ybus1 - 0.45, 0.9, 0.9, fill=t.arrow, line="none", name="Knoten")
        f.ellipse(x - 0.45, ybus2 - 0.45, 0.9, 0.9, fill=t.arrow, line="none", name="Knoten")
    f.ellipse(cx - 0.45, ybus2 - 0.45, 0.9, 0.9, fill=t.arrow, line="none", name="Knoten")
    f.ellipse(cx - 0.45, ybus1 - 0.45, 0.9, 0.9, fill=t.arrow, line="none", name="Knoten")
    return f
