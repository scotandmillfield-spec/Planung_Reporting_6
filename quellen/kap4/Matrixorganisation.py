"""Abb. 4.5 – Matrixorganisation."""
# Muster: Matrix als Kastenraster – Spaltenköpfe (Sparten mit ihren Niederlassungen) und Zeilenköpfe
# (Funktionen) grau, Schnittfelder weiß; Dimensionsnamen kursiv über den Köpfen, „Matrix“ in der Ecke.
# Serie Abb. 4.3–4.5: Raster (WL, G, WU, BH, VG) in allen drei Skripten identisch – die Spalten liegen exakt
# unter den Einheiten der Organigramme in Abb. 4.3 und 4.4.
STEM = "Matrixorganisation"
from bookfig import Fig, P

W = 110
DOTS = "…"

# ---- gemeinsames Raster der Serie (Abb. 4.3 Funktionale, 4.4 Divisionale, 4.5 Matrixorganisation) ----
X0, XR = 0.3, W - 0.3          # Außenkanten
WL = 23.0                      # linke Spalte (andere Geschäftsausrichtungen bzw. Zeilenköpfe der Matrix)
G = 2.4                        # Abstand zwischen Kästen
XU = X0 + WL + G               # erste Einheit
WU = (XR - XU - 3 * G) / 4     # Breite einer Einheit (vier Spalten)
BH = 8.0                       # Kastenhöhe
VG = 5.0                       # senkrechter Abstand zwischen den Ebenen

SPARTEN = ["Sparte 1", "Sparte 2", DOTS, "Sparte n"]
NIEDERLASSUNGEN = ["Niederlassung 1–n", "Niederlassung 1–n", DOTS, "Niederlassung 1–n"]
FUNKTIONEN = ["Vertrieb", "Einkauf", DOTS]
LH = 3.6                       # Höhe einer Beschriftungszeile (Dimensionsname)


def build(theme):
    y0 = 0.3
    ySp = y0 + LH + (VG - LH) / 2 + 0.6          # Spartenköpfe
    yNl = ySp + BH + G                           # Niederlassungen
    yFk = yNl + BH + (VG - LH) / 2 + 0.6         # Beschriftung „Funktional“
    yR = [yFk + LH + (VG - LH) / 2 + 0.6 + i * (BH + G) for i in range(len(FUNKTIONEN))]
    H = round(yR[-1] + BH + 0.3, 1)

    f = Fig(W, H, theme, STEM)
    xs = [XU + i * (WU + G) for i in range(4)]

    # Dimensionsnamen und Ecke
    f.text(XU, y0, XR - XU, LH, [P("Divisional/Regional", italic=True)], align="c", anchor="b",
           name="Dimension divisional/regional")
    f.text(X0, ySp, WL, yNl + BH - ySp, [P("Matrix", bold=True)], align="c", anchor="m", name="Matrix")
    f.text(X0, yFk, WL, LH, [P("Funktional", italic=True)], align="c", anchor="b", name="Dimension funktional")

    # Spaltenköpfe: Sparten und ihre Niederlassungen
    for x, sp, nl in zip(xs, SPARTEN, NIEDERLASSUNGEN):
        f.box(x, ySp, WU, BH, [P(sp)], name=f"Kopf {sp}")
        f.box(x, yNl, WU, BH, [P(nl)], name=f"Niederlassungen {sp}")

    # Zeilenköpfe und Schnittfelder
    for y, fk in zip(yR, FUNKTIONEN):
        f.box(X0, y, WL, BH, [P(fk)], name=f"Zeile {fk}")
        for x, sp in zip(xs, SPARTEN):
            f.box(x, y, WU, BH, None, role="box_plain", name=f"Feld {fk} × {sp}")
    return f
