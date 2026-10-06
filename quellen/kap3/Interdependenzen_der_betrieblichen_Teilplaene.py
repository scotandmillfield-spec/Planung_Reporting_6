"""Teilpläne und ihre Verknüpfung (Absatz-, Umsatz-, Ressourcen-, Personal-, Kosten-, Ergebnis-, Bilanzplan)."""
# Muster: Boxen in zwei Spalten mit orthogonalen Pfeilen; Sammelleitung statt gekreuzter Pfeile.
STEM = "Interdependenzen_der_betrieblichen_Teilplaene"
from bookfig import Fig, P, THEMES

W, H = 110, 65.5
BW, BH = 34, 7          # Boxbreite/-höhe
XL, XR = 7, 74          # linke / rechte Spalte
XBUS = 57.5             # Sammelleitung in der Mitte
XLANE = 2.5             # Leitung links (Absatz -> Ressourcen)


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

    def dot(x, y):
        f.ellipse(x - 0.45, y - 0.45, 0.9, 0.9, fill=t.arrow, line="none", name="Knoten")

    # linke Spalte
    ABS = box(XL, 1.0, "Absatzplan")
    UMS = box(XL, 14.0, "Umsatzplan")
    RES = box(XL, 31.5, "Ressourcenplan")
    PER = box(XL, 44.5, "Personalplan")
    KOS = box(XL, 57.5, "Kostenplan")
    # rechte Spalte, auf Höhe von Umsatz- und Ressourcenplan
    ERG = box(XR, UMS.y, "Ergebnisplan")
    BIL = box(XR, RES.y, "Bilanzplan")

    A = f.arrow
    # wechselseitige Beziehungen
    for a, b_ in ((ABS, UMS), (RES, PER), (PER, KOS)):
        A([(a.cx, a.b), (b_.cx, b_.y)], head=True, tail=True, name=f"{a.cx}")
    A([(ERG.cx, ERG.b), (BIL.cx, BIL.y)], head=True, tail=True, name="Ergebnis-Bilanz")
    # Absatzplan -> Ressourcenplan (linke Leitung)
    A([(ABS.x, ABS.cy), (XLANE, ABS.cy), (XLANE, RES.cy), (RES.x, RES.cy)], name="Absatz-Ressourcen")
    # Umsatz- und Ressourcenplan -> Ergebnis- und Bilanzplan (Sammelleitung)
    A([(UMS.r, UMS.cy), (ERG.x, ERG.cy)], name="Umsatz-Ergebnis")
    A([(RES.r, RES.cy), (BIL.x, BIL.cy)], name="Ressourcen-Bilanz")
    f.line([(XBUS, UMS.cy), (XBUS, RES.cy)], color=t.arrow, lw=t.arrow_lw, name="Sammelleitung")
    dot(XBUS, UMS.cy)
    dot(XBUS, RES.cy)
    # Kostenplan -> Bilanzplan
    A([(KOS.r, KOS.cy), (BIL.cx, KOS.cy), (BIL.cx, BIL.b)], name="Kosten-Bilanz")
    return f
