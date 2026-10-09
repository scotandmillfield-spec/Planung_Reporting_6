"""Teilpläne und ihre Verknüpfung (Absatz-, Umsatz-, Ressourcen-, Personal-, Kosten-, Ergebnis-, Bilanzplan)."""
# Muster: linke Spalte mit fünf Teilplänen, Ergebnisplan in der Mitte, Bilanzplan rechts; orthogonale Pfeile ohne Knotenpunkte.
# Revision DS 08.10.2026: Pfeile in den Ergebnisplan und der Bilanzplan weiter nach links.
STEM = "Interdependenzen_der_betrieblichen_Teilplaene"
from bookfig import Fig, P, THEMES

W, H = 106, 65.5
BW, BH = 28, 7          # Boxbreite/-höhe
XL = 6                  # linke Spalte (Absatz- bis Kostenplan)
XE = 43                 # Ergebnisplan (Mitte, auf Höhe des Umsatzplans)
XB = 72                 # Bilanzplan (rechts, auf Höhe des Ressourcenplans)
XLANE = 2.5             # Leitung links (Absatz -> Ressourcen)
DY = 1.75               # Versatz der zwei Pfeile, die den Ressourcenplan rechts verlassen


class B:
    def __init__(self, x, y, w, h):
        self.x, self.y, self.w, self.h = x, y, w, h
    @property
    def r(self): return self.x + self.w
    @property
    def b(self): return self.y + self.h
    @property
    def cx(self): return self.x + self.w / 2
    @property
    def cy(self): return self.y + self.h / 2


def build(theme):
    f = Fig(W, H, theme, STEM)
    t = theme

    def box(x, y, txt):
        f.box(x, y, BW, BH, [P(txt, bold=True)], role="box", name=txt)
        return B(x, y, BW, BH)

    # linke Spalte
    ABS = box(XL, 1.0, "Absatzplan")
    UMS = box(XL, 14.0, "Umsatzplan")
    RES = box(XL, 31.5, "Ressourcenplan")
    PER = box(XL, 44.5, "Personalplan")
    KOS = box(XL, 57.5, "Kostenplan")
    # Revision DS 07.10.2026: Ergebnisplan in der Mitte, Bilanzplan weiter rechts; keine Knotenpunkte
    ERG = box(XE, UMS.y, "Ergebnisplan")
    BIL = box(XB, RES.y + DY, "Bilanzplan")

    A = f.arrow
    # wechselseitige Beziehungen
    for a, b_ in ((ABS, UMS), (RES, PER), (PER, KOS)):
        A([(a.cx, a.b), (b_.cx, b_.y)], head=True, tail=True, name=f"{a.cx}")
    # Absatzplan -> Ressourcenplan (linke Leitung)
    A([(ABS.x, ABS.cy), (XLANE, ABS.cy), (XLANE, RES.cy), (RES.x, RES.cy)], name="Absatz-Ressourcen")
    # Umsatzplan -> Ergebnisplan (kein Pfeil mehr in den Bilanzplan)
    A([(UMS.r, UMS.cy), (ERG.x, ERG.cy)], name="Umsatz-Ergebnis")
    # Ressourcenplan -> Ergebnisplan und -> Bilanzplan (zwei getrennte Pfeile)
    A([(RES.r, RES.cy - DY), (ERG.x + 5, RES.cy - DY), (ERG.x + 5, ERG.b)], name="Ressourcen-Ergebnis")
    A([(RES.r, RES.cy + DY), (BIL.x, BIL.cy)], name="Ressourcen-Bilanz")
    # Kostenplan -> Ergebnisplan (nur noch in den Ergebnisplan)
    A([(KOS.r, KOS.cy), (ERG.x + 11, KOS.cy), (ERG.x + 11, ERG.b)], name="Kosten-Ergebnis")
    # Ergebnisplan -> Bilanzplan (nur in diese Richtung)
    A([(ERG.r, ERG.cy), (BIL.cx, ERG.cy), (BIL.cx, BIL.y)], name="Ergebnis-Bilanz")
    return f
