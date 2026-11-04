"""Abb. 4.6 – Hierarchische Beziehung im Unternehmen."""
# Muster: senkrechte Stufenfolge – Führungsebenen als fette Beschriftung ohne Kasten, Pläne/Berichte als Kästen.
# Jede Führungsebene zeigt mit einem Pfeil nach oben auf den verdichteten Plan/Bericht der übergeordneten Ebene
# und mit einem Pfeil nach unten auf den Plan/Bericht, mit dem sie selbst steuert (Pfeilrichtungen wie im Original).
STEM = "Hierarchische_Beziehung_im_Unternehmen"
from bookfig import Fig, P

W = 110
CX = W / 2
BW, BH = 44.0, 6.4             # Plan-/Berichtskästen (alle gleich groß)
TW, TH = 44.0, 3.8             # Beschriftung der Führungsebenen
AL = 3.6                       # Pfeillänge
STUFEN = [("Management", "Komprimierter Plan/Bericht"),
          ("Niederlassungsleiter", "Komprimierter Plan/Bericht"),
          ("Abteilungsleiter", "Detailplan/-bericht")]


def build(theme):
    t = theme
    H = round(0.3 + len(STUFEN) * (TH + AL + BH) + (len(STUFEN) - 1) * AL + 0.3, 1)
    f = Fig(W, H, theme, STEM)
    y = 0.3
    unten_vorher = None                       # Unterkante des vorigen Kastens
    for ebene, plan in STUFEN:
        if unten_vorher is not None:
            f.arrow([(CX, y), (CX, unten_vorher)], name=f"{ebene} nach oben", size="sm")
        f.text(CX - TW / 2, y, TW, TH, [P(ebene, bold=True)], align="c", anchor="m", name=ebene)
        f.arrow([(CX, y + TH), (CX, y + TH + AL)], name=f"{ebene} nach unten", size="sm")
        yb = y + TH + AL
        f.box(CX - BW / 2, yb, BW, BH, [P(plan)], name=f"{plan} ({ebene})")
        unten_vorher = yb + BH
        y = unten_vorher + AL
    return f
