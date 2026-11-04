"""Abb. 4.1 – Einfluss der Holding-Art auf Planung und Reporting."""
# Muster: drei Spalten (strategisch, taktisch, operativ) mit gestrichelten Trennlinien; je Holding-Art ein Kasten,
# dessen Breite die Reichweite der Steuerung über die Ebenen zeigt (Reichweiten wie im Original).
# Die Steuerungsinhalte stehen zeilenweise, sodass jede Holding-Art eine Zeile mehr hat als die vorige.
STEM = "Einfluss_der_Holding-Art_auf_Planung_und_Reporting"
from bookfig import Fig, P

W = 110
X0, XR = 0.3, W - 0.3
CW = (XR - X0) / 3                 # Spaltenbreite
EBENEN = ["strategisch", "taktisch", "operativ"]
WERT = "Steuerung über wertorientierte Ziele und Größen"
HOLDINGS = [  # (Titel, Zeilen, rechte Kante in Spalten – wie im Original)
    ("Finanz-Holding", [WERT], 1.94),
    ("Strategische Holding", [WERT, "sowie strategische Ziele und deren Maßnahmen und Kennzahlen"], 2.26),
    ("Management-Holding", [WERT + ",", "strategische Ziele und deren Maßnahmen und Kennzahlen sowie",
                            "operative Steuerung monetärer und nicht-monetärer Kennzahlen"], 3.0),
]
GAP = 3.0                          # Abstand zwischen den Kästen
INS = (1.6, 1.0)


def paras(titel, zeilen):
    return [P(titel, bold=True, align="l")] + [P(z, align="l", space_before=1.2 if i == 0 else 0)
                                               for i, z in enumerate(zeilen)]


def build(theme):
    t = theme
    tmp = Fig(W, 30, theme)
    geo = []
    y = 0.3 + 4.0 + 2.0              # unter den Spaltenköpfen
    for titel, zeilen, reich in HOLDINGS:
        w = min(XR, X0 + reich * CW) - X0
        h = tmp.measure(paras(titel, zeilen), w, ins=INS)
        geo.append((X0, y, w, h, titel, zeilen))
        y += h + GAP
    H = round(y - GAP + 2.2, 1)       # Trennlinien laufen etwas über den letzten Kasten hinaus

    f = Fig(W, H, theme, STEM)
    # Spaltenköpfe und Trennlinien
    for i, e in enumerate(EBENEN):
        f.text(X0 + i * CW, 0.3, CW, 4.0, [P(e, size="head", bold=True)], align="c", anchor="m", name=f"Ebene {e}")
    cont = t.role("container")
    for i in (1, 2):
        x = X0 + i * CW
        f.line([(x, 0.6), (x, H - 0.3)], color=cont.line, lw=cont.lw, dash="sysDash", name=f"Trennlinie {i}")
    # Holding-Arten
    for x, y, w, h, titel, zeilen in geo:
        f.box(x, y, w, h, paras(titel, zeilen), align="l", anchor="m", ins=INS, name=titel)
    return f
