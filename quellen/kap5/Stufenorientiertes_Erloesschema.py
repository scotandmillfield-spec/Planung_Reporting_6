"""Abb. 5.28 – Stufenorientiertes Erlösschema."""
# Bauweg D (Schema, keine Analyse-Tabelle): Das Original enthält keine Werte, sondern drei Zustände derselben
# Hierarchie – NettoNetto-Umsatz zugeklappt (+), eine Stufe aufgeklappt (−) mit Skonti und Nettoumsatz, zwei
# Stufen aufgeklappt mit Rabatte und Bruttoumsatz. Die Zeichen +/− sind Auf-/Zuklappschalter, keine Rechenzeichen.
# Muster: drei Gruppen (gestrichelte Container) nebeneinander, Zeilen als Boxen mit Einzug je Stufe, Zeilen auf
# gemeinsamen Achsen. Knoten (fett im Original) box_hi, Blätter box, Schalter als kleine weiße Box am Zeilenende.
STEM = "Stufenorientiertes_Erloesschema"
from bookfig import Fig, P

W = 110
GAP = 3.0                        # Abstand der Zustände
CW = (W - 0.6 - 2 * GAP) / 3     # Breite eines Zustands
PAD = 1.6                        # Innenabstand Container
RH, RG = 4.6, 1.0                # Zeilenhöhe, Zeilenabstand
IND = 3.5                        # Einzug je Stufe
TG = 3.0                         # Schalter (Quadrat)
MINUS = chr(0x2212)

# Zeilen: (Text, Stufe, Knoten?, Schalter)
ZUSTAENDE = [
    [("NettoNetto-Umsatz", 0, True, "+")],
    [("NettoNetto-Umsatz", 0, True, MINUS),
     ("Skonti", 1, False, None),
     ("Nettoumsatz", 1, True, "+")],
    [("NettoNetto-Umsatz", 0, True, MINUS),
     ("Skonti", 1, False, None),
     ("Nettoumsatz", 1, True, MINUS),
     ("Rabatte", 2, False, None),
     ("Bruttoumsatz", 2, False, None)],
]


def build(theme):
    n = max(len(z) for z in ZUSTAENDE)
    HC = PAD + n * RH + (n - 1) * RG + PAD
    H = round(HC + 0.6, 1)
    f = Fig(W, H, theme, STEM)

    y0 = 0.3
    for k, zeilen in enumerate(ZUSTAENDE):
        cx = 0.3 + k * (CW + GAP)
        f.box(cx, y0, CW, HC, None, role="container", name=f"Zustand {k + 1}")
        for i, (txt, stufe, knoten, schalter) in enumerate(zeilen):
            x = cx + PAD + stufe * IND
            w = CW - 2 * PAD - stufe * IND
            y = y0 + PAD + i * (RH + RG)
            f.box(x, y, w, RH, [P(txt, bold=knoten)], role="box_hi" if knoten else "box", align="l",
                  name=f"Z{k + 1} {txt}")
            if schalter:
                f.box(x + w - 0.8 - TG, y + (RH - TG) / 2, TG, TG, [P(schalter, bold=True)], role="box_plain",
                      ins=(0.0, 0.0), name=f"Z{k + 1} Schalter {txt}")
    return f
