"""Abb. 5.31 – Zeilen- bzw. spaltenorientierte Speicherung."""
# Muster: links die Tabelle als Zellraster, rechts zwei Gruppen (gestrichelte Container) mit der Speicherfolge als
# Zellstreifen; Klammern fassen die Zellen je Zeile bzw. Spalte zusammen. Aufbau wie im Original.
# Hervorhebung des Originals (graue A-Zellen) bleibt als box_hi und ist zusätzlich in der Tabelle gesetzt: Die
# Werte von Spalte 1 liegen zeilenorientiert verstreut, spaltenorientiert zusammenhängend.
# Korrektur: Spaltenköpfe „Reihe 1–3“ → „Spalte 1–3“ (die Klammern rechts heißen „Spalte“); Klammern nummeriert.
# Pfeile orthogonal (Verzweigung ohne Knotenpunkt, Vorgabe aus Revision 2.5/3.6) statt zweier Schrägpfeile.
STEM = "Zeilen-_bzw_spaltenorientierte_Speicherung"
from bookfig import Fig, P

W = 110
RH = 4.4                         # Zeilenhöhe Tabelle und Streifen
TRW, TVW = 11.0, 12.2            # Tabelle: Kopfspalte, Wertespalten
GAPX = 9.0                       # Raum für die Pfeile
PAD = 1.6                        # Innenabstand Container
TH = 4.6                         # Titelzeile im Container
WERTE = ["A", "B", "C"]
ZEILEN = 4


def build(theme):
    t = theme
    TW = TRW + 3 * TVW
    XP = 0.3 + TW + GAPX                         # Container links
    PW = W - 0.3 - XP
    CW = (PW - 2 * PAD) / 12                     # Zellbreite im Streifen
    PH = PAD + TH + RH + 1.0 + 1.8 + 3.2 + PAD  # Titel, Streifen, Klammer, Beschriftung
    GY = 3.0
    H = round(0.3 + 2 * PH + GY + 0.3, 1)
    f = Fig(W, H, theme, STEM)
    A = f.arrow

    def zelle(x, y, w, txt, rolle="box_plain", bold=False, name=""):
        f.box(x, y, w, RH, [P(txt, bold=bold)], role=rolle, rounded=False, ins=(0.3, 0.3), name=name)

    def klammer(x1, x2, y, txt):
        f.line([(x1 + 0.4, y), (x1 + 0.4, y + 1.0), (x2 - 0.4, y + 1.0), (x2 - 0.4, y)], color=t.arrow, lw=0.5,
               name=f"Klammer {txt}")
        cx = (x1 + x2) / 2
        f.line([(cx, y + 1.0), (cx, y + 1.8)], color=t.arrow, lw=0.5, name=f"Klammer Mitte {txt}")
        f.text(x1 - 1.0, y + 1.9, x2 - x1 + 2.0, 3.2, [P(txt)], align="c", anchor="t", name=f"Klammer {txt}")

    # ---------------- Tabelle (links, senkrecht mittig)
    tab_h = (ZEILEN + 1) * RH
    ty = (H - tab_h) / 2
    tx = 0.3
    for j in range(3):
        zelle(tx + TRW + j * TVW, ty, TVW, f"Spalte {j + 1}", rolle="box", bold=True, name=f"Kopf Spalte {j + 1}")
    for i in range(ZEILEN):
        y = ty + (i + 1) * RH
        zelle(tx, y, TRW, f"Zeile {i + 1}", rolle="box", bold=True, name=f"Kopf Zeile {i + 1}")
        for j, v in enumerate(WERTE):
            zelle(tx + TRW + j * TVW, y, TVW, v, rolle="box_hi" if j == 0 else "box_plain",
                  name=f"Tabelle Z{i + 1} S{j + 1}")

    # ---------------- Speicherfolgen (rechts)
    def speicher(y0, titel, folge, gruppe, name_gr):
        f.box(XP, y0, PW, PH, None, role="container", name=titel)
        f.text(XP + PAD, y0 + 0.9, PW - 2 * PAD, TH - 0.9, [P(titel, bold=True)], align="c", anchor="t",
               name=f"Titel {titel}")
        sy = y0 + PAD + TH
        sx = XP + PAD
        for k, v in enumerate(folge):
            zelle(sx + k * CW, sy, CW, v, rolle="box_hi" if v == "A" else "box_plain", name=f"{titel[:6]} {k + 1}")
        n = len(folge) // gruppe
        for g in range(n):
            klammer(sx + g * gruppe * CW, sx + (g + 1) * gruppe * CW, sy + RH + 0.6, f"{name_gr} {g + 1}")
        return y0 + PAD + TH + RH / 2              # Höhe der Pfeilspitze: Mitte des Streifens

    y1 = 0.3
    y2 = y1 + PH + GY
    a1 = speicher(y1, "Zeilenorientierte Speicherung", WERTE * ZEILEN, 3, "Zeile")
    a2 = speicher(y2, "Spaltenorientierte Speicherung", [v for v in WERTE for _ in range(ZEILEN)], ZEILEN, "Spalte")

    # ---------------- Pfeile: Tabelle → beide Speicherformen
    xs, xk = tx + TW, tx + TW + GAPX / 2
    ym = ty + tab_h / 2
    f.line([(xs, ym), (xk, ym)], name="Pfeil Stamm")
    A([(xk, ym), (xk, a1), (XP, a1)], name="→ zeilenorientiert")
    A([(xk, ym), (xk, a2), (XP, a2)], name="→ spaltenorientiert")
    return f
