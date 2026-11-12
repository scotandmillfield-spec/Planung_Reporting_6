"""Abb. 4.5 – Matrixorganisation."""
# Muster: Matrix als Kastenraster – Spaltenköpfe (Sparten) und Zeilenköpfe (Funktionen) grau, Schnittfelder weiß,
# „Matrix“ in der Ecke. Drei Dimensionen mit je einem Achsenpfeil: divisional oder regional (waagerecht über den
# Spalten), funktional (senkrecht links der Zeilenköpfe) und Niederlassungen als dritte Dimension (gestaffelte
# Ebenen hinter dem Spaltenblock, schräger Pfeil nach hinten oben – flach, ohne 3D-Effekt).
# Darunter in Rot die Ausrichtung von Reporting/Planung (wie die roten Aussagen in Abb. 4.3 und 4.4).
# Serie Abb. 4.3–4.5: X0, WL, G, BH wie in den anderen beiden Skripten; die Spalten sind hier etwas schmaler,
# weil rechts Platz für die gestaffelten Ebenen und den schrägen Pfeil bleibt.
STEM = "Matrixorganisation"
from bookfig import Fig, P

W = 110
DOTS = "…"
NB = chr(0xA0)

# ---- gemeinsames Raster der Serie (Abb. 4.3 Funktionale, 4.4 Divisionale, 4.5 Matrixorganisation) ----
X0 = 0.3                       # linke Außenkante
WL = 23.0                      # linke Spalte (Zeilenköpfe der Matrix)
G = 2.4                        # Abstand zwischen Kästen
XU = X0 + WL + G               # erste Spalte
BH = 8.0                       # Kastenhöhe
LH = 3.6                       # Höhe einer Beschriftungszeile

# ---- dritte Dimension ----
PAD = 1.0                      # Rand der Ebene um den Spaltenblock
D = 1.8                        # Versatz je Ebene (nach rechts oben)
NE = 2                         # Ebenen hinter der vorderen
TIP = 1.6                      # Überstand des schrägen Pfeils über die hinterste Ebene
XR = W - 0.3 - PAD - NE * D - TIP   # rechte Kante des Spaltenblocks
WU = (XR - XU - 3 * G) / 4     # Spaltenbreite (vier Spalten)

SPARTEN = ["Sparte 1", "Sparte 2", DOTS, "Sparte n"]
FUNKTIONEN = ["Vertrieb", "Einkauf", DOTS]
AUSRICHTUNG = "Reporting/Planung ist auf die Matrixorganisation ausgerichtet"
XA = X0 + 1.2                  # senkrechter Achsenpfeil „funktional“
XZ = X0 + 2.8                  # linke Kante der Zeilenköpfe


def build(theme):
    t = theme
    y0 = 0.3                                     # Zeile der Achsenbeschriftungen oben
    yAx = y0 + LH + 1.0                          # waagerechter Achsenpfeil
    ySp = yAx + 1.3 + NE * D + PAD               # Spartenköpfe (Oberkante hinterste Ebene 1,3 mm unter dem Pfeil)
    yFk = ySp + BH + 0.9                         # Beschriftung „Funktional“
    yR = [yFk + LH + 0.6 + i * (BH + G) for i in range(len(FUNKTIONEN))]
    yEnd = yR[-1] + BH                           # Unterkante der Matrix
    yT = yEnd + PAD + 2.2                        # roter Text
    H = round(yT + LH + 0.3, 1)

    f = Fig(W, H, theme, STEM)
    xs = [XU + i * (WU + G) for i in range(4)]

    # Ebenen der dritten Dimension (hinten zuerst), vordere Ebene trägt den Spaltenblock
    ex, ey = XU - PAD, ySp - PAD
    ew, eh = XR - XU + 2 * PAD, yEnd - ySp + 2 * PAD
    for k in range(NE, -1, -1):
        f.box(ex + k * D, ey - k * D, ew, eh, None, role="box_plain", name=f"Ebene Niederlassung {k + 1}")

    # Achsenpfeile: divisional oder regional (waagerecht), funktional (senkrecht), Niederlassungen (schräg)
    xAe = XR - 5.0                               # Pfeilende mit Abstand zum schrägen Pfeil
    f.arrow([(XU, yAx), (xAe, yAx)], size="sm", name="Achse divisional oder regional")
    f.text(XU, y0, xAe - XU, LH, [P("Divisional oder regional", italic=True)], align="c", anchor="b",
           name="Dimension divisional oder regional")
    x1, y1 = ex + ew, ey                         # rechte obere Ecke der vorderen Ebene
    s = NE * D + TIP
    f.arrow([(x1, y1), (x1 + s, y1 - s)], size="sm", name="Achse Niederlassungen")
    f.text(x1 + s - 30.5, y0, 30, LH, [P(f"Niederlassungen{NB}1–n", italic=True)], align="r", anchor="b",
           name="Dimension Niederlassungen")
    f.arrow([(XA, yR[0]), (XA, yEnd)], size="sm", name="Achse funktional")
    f.text(X0, yFk, WL, LH, [P("Funktional", italic=True)], align="c", anchor="b", name="Dimension funktional")

    # Ecke
    f.text(XZ, ySp, X0 + WL - XZ, BH, [P("Matrix", bold=True)], align="c", anchor="m", name="Matrix")

    # Spaltenköpfe, Zeilenköpfe und Schnittfelder
    for x, sp in zip(xs, SPARTEN):
        f.box(x, ySp, WU, BH, [P(sp)], name=f"Kopf {sp}")
    for y, fk in zip(yR, FUNKTIONEN):
        f.box(XZ, y, X0 + WL - XZ, BH, [P(fk)], name=f"Zeile {fk}")
        for x, sp in zip(xs, SPARTEN):
            f.box(x, y, WU, BH, None, role="box_plain", name=f"Feld {fk} × {sp}")

    # Ausrichtung von Reporting/Planung
    f.text(X0, yT, W - 0.6, LH, [P(AUSRICHTUNG, bold=True, color=t.accent)], align="c", anchor="t",
           name="Ausrichtung")
    return f
