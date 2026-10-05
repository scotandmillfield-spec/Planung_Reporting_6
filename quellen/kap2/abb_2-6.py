"""Abb. 2.6 – Dimensionen der Reportingdefinition."""
# Muster: Koordinatensystem mit drei Dimensionen – Prozesskette als senkrechte Achse (von unten nach oben),
# Empfänger als waagerechte Achse, Inhalt als Diagonale in die Fläche.
STEM = "abb_2-6"
from bookfig import Fig, P

W = 110
SHY = chr(0xAD)
SCHRITTE = [  # von oben nach unten
    "Informations-\nanalyse/-nutzung",
    "Berichtsbereitstellung",
    "Berichtsaufbereitung",
    f"Informations{SHY}aufbereitung und -verwaltung",
    "Datenbeschaffung",
    f"Informations{SHY}bedarfs{SHY}ermittlung",
]


def build(theme):
    CX, CW, GAP = 0.6, 32.0, 3.4
    OX = CX + CW + 3.0
    tmp = Fig(W, 30, theme)
    hs = [max(4.6, tmp.measure([P(s, bold=True)], CW)) for s in SCHRITTE]
    y0 = 9.4
    ys = [y0]
    for h in hs[:-1]:
        ys.append(ys[-1] + h + GAP)
    OY = ys[-1] + hs[-1] + 1.4
    H = round(OY + 1.2 + 5.6 + 1.2 + 4.4, 1)
    f = Fig(W, H, theme, STEM)
    t = theme
    # Fläche der Informationen
    f.box(OX + 1.2, y0, W - 0.4 - (OX + 1.2), OY - 1.2 - y0, None, role="band", name="Inhalt")
    ym = (y0 + OY - 1.2) / 2
    f.text(OX + 16, ym - 9, W - 2 - (OX + 16), 12,
           [P("Informationen aus Betrieb und Umwelt", italic=True, size=7.5),
            P("(inhaltlicher Umfang des Reportings)", italic=True)],
           align="c", anchor="m", name="Inhalt Text", bg=t.role("band").fill)
    # Achsen
    f.arrow([(OX, OY), (OX, 1.0)])
    f.arrow([(OX, OY), (W - 0.4, OY)])
    f.arrow([(OX + 0.6, OY - 0.6), (OX + 19.5, ym + 2.2)])
    f.text(0, 0.2, OX - 1.2, 8.6, [P("Prozesse des Reportings", italic=True, bold=True, size="head")],
           align="c", anchor="m", name="Achse Prozesse")
    # Prozesskette
    for s, y, h in zip(SCHRITTE, ys, hs):
        f.box(CX, y, CW, h, [P(s, bold=True)], role="box", name=s.replace(SHY, "")[:30])
    for i in range(len(SCHRITTE) - 1):
        f.arrow([(CX + CW / 2, ys[i + 1]), (CX + CW / 2, ys[i] + hs[i])])
    # Empfänger
    ew = (W - 0.4 - OX - 1.2) / 2
    for i, txt in enumerate(["Interne Adressaten", "Externe Adressaten"]):
        f.box(OX + 1.2 + i * ew + (0.6 if i else 0), OY + 1.2, ew - 0.6, 5.6, [P(txt, bold=True)], role="box")
    f.text(OX, OY + 1.2 + 5.6 + 0.8, W - 0.4 - OX, 4.0,
           [P("Empfänger des Reportings", italic=True, bold=True, size="head")], align="c", anchor="m",
           name="Achse Empfänger")
    return f
